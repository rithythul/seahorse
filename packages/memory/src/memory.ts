import { Database } from 'bun:sqlite'
import type { IMemory, MemoryEntry } from '@seahorse/core'

interface MemoryRow {
  id: string
  business_id: string
  content: string
  importance: number
  tags: string
  created_at: number
  last_accessed_at: number
}

function rowToEntry(row: MemoryRow): MemoryEntry {
  return {
    id: row.id,
    businessId: row.business_id,
    content: row.content,
    importance: row.importance,
    tags: JSON.parse(row.tags) as string[],
    createdAt: new Date(row.created_at),
    lastAccessedAt: new Date(row.last_accessed_at),
  }
}

export class SqliteMemory implements IMemory {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  async recall(businessId: string, query: string, limit = 5): Promise<MemoryEntry[]> {
    const rows = this.db.query<MemoryRow, [string, string, number]>(`
      SELECT m.id, m.business_id, m.content, m.importance, m.tags, m.created_at, m.last_accessed_at
      FROM memory_fts
      JOIN memories m ON memory_fts.rowid = m.rowid
      WHERE memory_fts MATCH ?
        AND m.business_id = ?
      ORDER BY m.importance DESC
      LIMIT ?
    `).all(query, businessId, limit)

    if (rows.length === 0) return []

    const now = Date.now()
    const ids = rows.map(r => `'${r.id.replace(/'/g, "''")}'`).join(',')
    this.db.run(`
      UPDATE memories SET last_accessed_at = ${now}
      WHERE id IN (${ids})
    `)

    return rows.map(rowToEntry)
  }

  async store(businessId: string, entry: Omit<MemoryEntry, 'id' | 'createdAt'>): Promise<void> {
    const id = crypto.randomUUID()
    const now = Date.now()
    const lastAccessedAt = entry.lastAccessedAt instanceof Date
      ? entry.lastAccessedAt.getTime()
      : now

    this.db.run(`
      INSERT INTO memories (id, business_id, content, importance, tags, created_at, last_accessed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, businessId, entry.content, entry.importance, JSON.stringify(entry.tags), now, lastAccessedAt])

    this.db.run(`
      INSERT INTO memory_fts (rowid, content)
      SELECT rowid, content FROM memories WHERE id = ?
    `, [id])
  }

  async decay(businessId: string): Promise<void> {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000

    this.db.run(`
      UPDATE memories
      SET importance = importance * 0.95
      WHERE business_id = ?
        AND last_accessed_at < ?
    `, [businessId, cutoff])

    this.db.run(`
      DELETE FROM memories
      WHERE business_id = ?
        AND importance < 0.05
    `, [businessId])
  }
}
