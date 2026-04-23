import type { IProvider } from '@seahorse/core'
import { OllamaProvider } from './provider.js'

export { OllamaProvider } from './provider.js'

export function createOllamaProvider(model?: string, host?: string): IProvider {
  return new OllamaProvider(model, host)
}
