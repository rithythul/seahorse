import { logger } from '@seahorse/logger'
import type { Database } from 'bun:sqlite'
import type {
  Business,
  CoreMessage,
  IChannel,
  IIdentityResolver,
  IMemory,
  IProvider,
  ISkill,
  InboundMessage,
  LLMResponse,
  Tool,
  ToolCall,
} from './types.js'
import { appendMessage, getOrCreateSession, getRecentMessages } from './session.js'

const MAX_ITERATIONS = 10
const MAX_HISTORY = 20

export interface LoopConfig {
  db: Database
  business: Business
  provider: IProvider
  skill: ISkill
  memory?: IMemory
  identityResolver?: IIdentityResolver
  debug?: boolean
}

export async function handleMessage(
  channel: IChannel,
  msg: InboundMessage,
  config: LoopConfig,
): Promise<void> {
  const { db, business, provider, skill, memory, identityResolver, debug } = config

  // Resolve who is sending this message
  const identity = identityResolver
    ? await identityResolver.resolve(msg, business.id)
    : {
        userId: msg.senderId,
        businessId: business.id,
        role: 'customer' as const,
        language: business.language,
      }

  const session = getOrCreateSession(db, business.id, channel.id, msg.senderId, identity)

  // Pull relevant memories into system context
  let memoryContext = ''
  if (memory) {
    const entries = await memory.recall(business.id, msg.content, 5)
    if (entries.length > 0) {
      memoryContext =
        '\n\nRelevant context from memory:\n' + entries.map((e) => `- ${e.content}`).join('\n')
    }
  }

  // Build the messages array: system + recent history + new user message
  const history = getRecentMessages(db, session.id, MAX_HISTORY)
  const userMsg: CoreMessage = { id: msg.id, role: 'user', content: msg.content }

  const messages: CoreMessage[] = [
    {
      id: 'system',
      role: 'system',
      content: skill.systemPrompt(business) + memoryContext,
    },
    ...history,
    userMsg,
  ]

  appendMessage(db, session.id, userMsg)

  if (debug) {
    logger.debug(`${business.name} | ${channel.id} | ${identity.role}: ${msg.content}`)
  }

  // Agent loop — runs until text response or max iterations
  let iterations = 0

  while (iterations < MAX_ITERATIONS) {
    iterations++

    const response: LLMResponse = await provider.chat(messages, skill.tools)

    if (response.type === 'text') {
      const assistantMsg: CoreMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
      }
      appendMessage(db, session.id, assistantMsg)
      await channel.send({
        channelId: channel.id,
        recipientId: msg.senderId,
        content: response.content,
        replyToId: msg.id,
      })
      break
    }

    if (response.type === 'tool_calls' && response.toolCalls?.length) {
      const assistantMsg: CoreMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content ?? '',
        toolCalls: response.toolCalls,
      }
      messages.push(assistantMsg)
      appendMessage(db, session.id, assistantMsg)

      // Execute all tool calls and collect results
      for (const toolCall of response.toolCalls) {
        const result = await executeTool(toolCall, skill.tools)
        const toolMsg: CoreMessage = {
          id: crypto.randomUUID(),
          role: 'tool',
          content: result,
          toolCallId: toolCall.id,
        }
        messages.push(toolMsg)
        appendMessage(db, session.id, toolMsg)

        if (debug) {
          logger.debug(`tool: ${toolCall.name} → ${result.slice(0, 100)}`)
        }
      }
    }
  }

  // Store this interaction in memory for future context
  if (memory) {
    await memory.store(business.id, {
      businessId: business.id,
      content: `${identity.role} on ${channel.name}: "${msg.content}"`,
      importance: 0.5,
      tags: [business.vertical, channel.id, identity.role],
      lastAccessedAt: new Date(),
    })
    await memory.decay(business.id)
  }
}

async function executeTool(toolCall: ToolCall, tools: Tool[]): Promise<string> {
  const tool = tools.find((t) => t.name === toolCall.name)
  if (!tool) return `Error: tool "${toolCall.name}" not found`

  try {
    return await tool.execute(toolCall.arguments)
  } catch (err) {
    return `Error executing ${toolCall.name}: ${(err as Error).message}`
  }
}
