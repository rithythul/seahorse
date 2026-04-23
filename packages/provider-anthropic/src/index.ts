import type { IProvider } from '@seahorse/core'
import { AnthropicProvider } from './provider.js'

export { AnthropicProvider } from './provider.js'

export function createAnthropicProvider(apiKey: string, model?: string): IProvider {
  return new AnthropicProvider(apiKey, model)
}
