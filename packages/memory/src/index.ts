import { Database } from 'bun:sqlite'
import type { IMemory } from '@seahorse/core'
import { SqliteMemory } from './memory.js'

export function createMemory(db: Database): IMemory {
  return new SqliteMemory(db)
}

export { migrateMemory } from './migrate.js'
