import type { Database } from 'bun:sqlite'

export function migrateFnb(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      name_km TEXT,
      description TEXT,
      description_km TEXT,
      price REAL NOT NULL,
      category TEXT DEFAULT 'main',
      available INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_orders_business_date
    ON orders (business_id, created_at DESC)
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_menu_business
    ON menu_items (business_id, available)
  `)
}
