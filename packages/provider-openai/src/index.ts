import type { IProvider } from '@seahorse/core'
import { OpenAIProvider } from './provider.js'

export { OpenAIProvider } from './provider.js'

export function createOpenAIProvider(apiKey: string, model?: string, baseUrl?: string): IProvider {
  return new OpenAIProvider(apiKey, model, baseUrl)
}
