import { z } from 'zod'

const VerticalSchema = z.enum(['fnb', 'retail', 'education', 'professional'])
const LanguageSchema = z.enum(['km', 'en', 'both'])

const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  vertical: VerticalSchema,
  language: LanguageSchema.default('both'),
  ownerId: z.string(),
  timezone: z.string().default('Asia/Phnom_Penh'),
})

const ProviderSchema = z.object({
  type: z.enum(['anthropic', 'openai', 'ollama']),
  apiKey: z.string().optional(),
  model: z.string(),
  baseUrl: z.string().optional(),
})

const SeahorseConfigSchema = z.object({
  business: BusinessSchema,
  provider: ProviderSchema,
  database: z
    .object({
      path: z.string().default('./seahorse.db'),
    })
    .default({}),
  debug: z.boolean().default(false),
})

export type SeahorseConfig = z.infer<typeof SeahorseConfigSchema>
export type BusinessConfig = z.infer<typeof BusinessSchema>
export type ProviderConfig = z.infer<typeof ProviderSchema>

export function loadConfig(raw: unknown): SeahorseConfig {
  return SeahorseConfigSchema.parse(raw)
}

export function loadConfigFromEnv(): SeahorseConfig {
  return loadConfig({
    business: {
      id: process.env.SEAHORSE_BUSINESS_ID ?? 'default',
      name: process.env.SEAHORSE_BUSINESS_NAME ?? 'My Business',
      vertical: process.env.SEAHORSE_VERTICAL ?? 'fnb',
      language: process.env.SEAHORSE_LANGUAGE ?? 'both',
      ownerId: process.env.SEAHORSE_OWNER_ID ?? 'owner',
      timezone: process.env.SEAHORSE_TIMEZONE ?? 'Asia/Phnom_Penh',
    },
    provider: {
      type: process.env.SEAHORSE_PROVIDER_TYPE ?? 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY,
      model:
        process.env.SEAHORSE_MODEL ??
        (process.env.SEAHORSE_PROVIDER_TYPE === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-6'),
      baseUrl: process.env.SEAHORSE_PROVIDER_BASE_URL,
    },
    database: {
      path: process.env.SEAHORSE_DB_PATH ?? './seahorse.db',
    },
    debug: process.env.SEAHORSE_DEBUG === 'true',
  })
}
