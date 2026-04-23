import type { IChannel } from '@seahorse/core'
import { TelegramChannel } from './channel.js'

export { TelegramChannel }

export function createTelegramChannel(token: string): IChannel {
  return new TelegramChannel(token)
}
