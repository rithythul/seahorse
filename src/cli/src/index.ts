import { bootstrap, getDatabase, loadConfigFromEnv } from '@seahorse/core'
import { createMemory, migrateMemory } from '@seahorse/memory'
import { createAnthropicProvider } from '@seahorse/provider-anthropic'
import { createGeminiProvider } from '@seahorse/provider-gemini'
import { createOllamaProvider } from '@seahorse/provider-ollama'
import { createOpenAIProvider } from '@seahorse/provider-openai'
import { createTelegramChannel } from '@seahorse/channel-telegram'
import { createFnbSkill, migrateFnb } from '@seahorse/skill-fnb'
import type { IChannel, IProvider, ISkill, SeahorseConfig } from '@seahorse/core'

const config = loadConfigFromEnv()
const db = getDatabase(config.database.path)

runMigrations(config)

const provider = createProvider(config)
const channels = createChannels()
const skill = createSkill(config)
const memory = createMemory(db)

if (channels.length === 0) {
  console.error('[seahorse] no channels configured — set TELEGRAM_BOT_TOKEN to get started')
  process.exit(1)
}

if (config.debug) {
  console.log(`[seahorse] provider: ${config.provider.type} (${config.provider.model})`)
  console.log(`[seahorse] channels: ${channels.map((c) => c.name).join(', ')}`)
  console.log(`[seahorse] vertical: ${config.business.vertical}`)
}

const shutdown = await bootstrap({
  business: config.business,
  channels,
  provider,
  skill,
  memory,
})

process.on('SIGINT', async () => {
  console.log('\n[seahorse] shutting down...')
  await shutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await shutdown()
  process.exit(0)
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function runMigrations(config: SeahorseConfig): void {
  migrateMemory(db)

  switch (config.business.vertical) {
    case 'fnb':
      migrateFnb(db)
      break
    // retail, education, professional migrations added as skills are built
  }
}

function createProvider(config: SeahorseConfig): IProvider {
  const { type, apiKey, model, baseUrl } = config.provider

  switch (type) {
    case 'anthropic':
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required')
      return createAnthropicProvider(apiKey, model)

    case 'openai':
      if (!apiKey) throw new Error('OPENAI_API_KEY is required')
      return createOpenAIProvider(apiKey, model, baseUrl)

    case 'ollama':
      return createOllamaProvider(model, baseUrl ?? 'http://localhost:11434')

    case 'gemini':
      if (!apiKey) throw new Error('GEMINI_API_KEY is required')
      return createGeminiProvider(apiKey, model)
  }
}

function createChannels(): IChannel[] {
  const channels: IChannel[] = []

  if (process.env.TELEGRAM_BOT_TOKEN) {
    channels.push(createTelegramChannel(process.env.TELEGRAM_BOT_TOKEN))
  }

  return channels
}

function createSkill(config: SeahorseConfig): ISkill {
  switch (config.business.vertical) {
    case 'fnb':
      return createFnbSkill(db, config.business.id)

    case 'retail':
    case 'education':
    case 'professional':
      throw new Error(`Skill '${config.business.vertical}' is not yet implemented`)
  }
}
