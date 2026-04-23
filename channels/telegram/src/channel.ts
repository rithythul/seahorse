import { Bot } from 'grammy'
import type { IChannel, InboundMessage, OutboundMessage, MessageHandler } from '@seahorse/core'

export class TelegramChannel implements IChannel {
  readonly id = 'telegram'
  readonly name = 'Telegram'

  private bot: Bot
  private handler: MessageHandler | null = null

  constructor(token: string) {
    this.bot = new Bot(token)
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler
  }

  async start(): Promise<void> {
    this.bot.on('message:text', async (ctx) => {
      if (!this.handler) return

      const from = ctx.from
      const senderName = from.last_name
        ? `${from.first_name} ${from.last_name}`
        : from.username ?? from.first_name

      const msg: InboundMessage = {
        id: String(ctx.message.message_id),
        channelId: 'telegram',
        senderId: String(from.id),
        senderName,
        content: ctx.message.text,
        timestamp: new Date(ctx.message.date * 1000),
      }

      await this.handler(msg)
    })

    this.bot.start({ drop_pending_updates: true })
  }

  async stop(): Promise<void> {
    await this.bot.stop()
  }

  async send(msg: OutboundMessage): Promise<void> {
    await this.bot.api.sendMessage(msg.recipientId, msg.content, {
      reply_parameters: msg.replyToId
        ? { message_id: parseInt(msg.replyToId) }
        : undefined,
    })
  }
}
