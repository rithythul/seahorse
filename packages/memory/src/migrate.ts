import { Database } from 'bun:sqlite'

export function migrateMemory(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      content TEXT NOT NULL,
      importance REAL NOT NULL DEFAULT 0.5,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      last_accessed_at INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_memories_business
    ON memories (business_id)
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_memories_importance
    ON memories (business_id, importance DESC)
  `)

  db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
      content,
      content='memories',
      content_rowid='rowid',
      tokenize='unicode61 remove_diacritics 2'
    )
  `)
}
