import { logger } from '@seahorse/logger'
import { closeDatabase, getDatabase } from './database.js'
import { handleMessage } from './loop.js'
import type { SeahorseAgent } from './types.js'

export async function bootstrap(agent: SeahorseAgent): Promise<() => Promise<void>> {
  const db = getDatabase()

  // Upsert the business record
  db.run(
    `INSERT INTO businesses (id, name, vertical, language, owner_id, timezone, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       vertical = excluded.vertical,
       language = excluded.language`,
    [
      agent.business.id,
      agent.business.name,
      agent.business.vertical,
      agent.business.language,
      agent.business.ownerId,
      agent.business.timezone,
      Date.now(),
    ],
  )

  for (const channel of agent.channels) {
    channel.onMessage(async (msg) => {
      try {
        await handleMessage(channel, msg, {
          db,
          business: agent.business,
          provider: agent.provider,
          skill: agent.skill,
          memory: agent.memory,
          identityResolver: agent.identityResolver,
        })
      } catch (err) {
        logger.error(`error handling message on ${channel.id}:`, err)
      }
    })

    await channel.start()
    logger.info(`channel ready: ${channel.name}`)
  }

  logger.info(
    `${agent.business.name} (${agent.business.vertical}) — ${agent.channels.length} channel(s) active`,
  )

  return async () => {
    await Promise.all(agent.channels.map((c) => c.stop()))
    closeDatabase()
    logger.info('shutdown complete')
  }
}
