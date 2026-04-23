import { Database } from 'bun:sqlite'

let db: Database | null = null

export function getDatabase(path = './seahorse.db'): Database {
  if (!db) {
    db = new Database(path, { create: true })
    db.run('PRAGMA journal_mode = WAL')
    db.run('PRAGMA foreign_keys = ON')
    migrate(db)
  }
  return db
}

export function closeDatabase(): void {
  db?.close()
  db = null
}

function migrate(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vertical TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'both',
      owner_id TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'Asia/Phnom_Penh',
      created_at INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id),
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      identity TEXT NOT NULL,
      messages TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_sessions_business
    ON sessions (business_id)
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_sessions_lookup
    ON sessions (business_id, user_id, channel_id)
  `)
}
