import type { Database } from 'bun:sqlite'
import { randomUUID } from 'crypto'
import type { CoreMessage, Identity, Session } from './types.js'

interface SessionRow {
  id: string
  business_id: string
  channel_id: string
  user_id: string
  identity: string
  messages: string
  created_at: number
  updated_at: number
}

export function getOrCreateSession(
  db: Database,
  businessId: string,
  channelId: string,
  userId: string,
  identity: Identity,
): Session {
  const row = db
    .query<SessionRow, [string, string, string]>(
      `SELECT * FROM sessions
       WHERE business_id = ? AND user_id = ? AND channel_id = ?
       ORDER BY updated_at DESC LIMIT 1`,
    )
    .get(businessId, userId, channelId)

  if (row) {
    return deserialize(row)
  }

  const now = Date.now()
  const session: Session = {
    id: randomUUID(),
    businessId,
    channelId,
    userId,
    identity,
    messages: [],
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }

  db.run(
    `INSERT INTO sessions
     (id, business_id, channel_id, user_id, identity, messages, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '[]', ?, ?)`,
    [session.id, businessId, channelId, userId, JSON.stringify(identity), now, now],
  )

  return session
}

export function appendMessage(db: Database, sessionId: string, message: CoreMessage): void {
  const row = db
    .query<{ messages: string }, [string]>('SELECT messages FROM sessions WHERE id = ?')
    .get(sessionId)

  if (!row) return

  const messages = JSON.parse(row.messages) as CoreMessage[]
  messages.push(message)

  db.run('UPDATE sessions SET messages = ?, updated_at = ? WHERE id = ?', [
    JSON.stringify(messages),
    Date.now(),
    sessionId,
  ])
}

export function clearSession(db: Database, sessionId: string): void {
  db.run('UPDATE sessions SET messages = ?, updated_at = ? WHERE id = ?', [
    '[]',
    Date.now(),
    sessionId,
  ])
}

export function getRecentMessages(db: Database, sessionId: string, limit = 20): CoreMessage[] {
  const row = db
    .query<{ messages: string }, [string]>('SELECT messages FROM sessions WHERE id = ?')
    .get(sessionId)

  if (!row) return []

  const messages = JSON.parse(row.messages) as CoreMessage[]
  return messages.slice(-limit)
}

function deserialize(row: SessionRow): Session {
  return {
    id: row.id,
    businessId: row.business_id,
    channelId: row.channel_id,
    userId: row.user_id,
    identity: JSON.parse(row.identity) as Identity,
    messages: JSON.parse(row.messages) as CoreMessage[],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}
