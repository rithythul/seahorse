import type { IProvider } from '@seahorse/core'
import { GeminiProvider } from './provider.js'

export { GeminiProvider } from './provider.js'

export function createGeminiProvider(apiKey: string, model?: string): IProvider {
  return new GeminiProvider(apiKey, model)
}
