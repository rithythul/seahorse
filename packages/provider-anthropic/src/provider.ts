import Anthropic from '@anthropic-ai/sdk'
import type { CoreMessage, IProvider, LLMResponse, Tool, ToolCall } from '@seahorse/core'

export class AnthropicProvider implements IProvider {
  readonly id = 'anthropic'
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model = 'claude-sonnet-4-6') {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async chat(messages: CoreMessage[], tools?: Tool[]): Promise<LLMResponse> {
    const systemMessage = messages.find((m) => m.role === 'system')
    const system = systemMessage?.content

    const anthropicMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => this.toAnthropicMessage(m))

    const anthropicTools =
      tools && tools.length > 0
        ? tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: {
              type: 'object' as const,
              properties: t.parameters,
              required: [],
            },
          }))
        : undefined

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: anthropicMessages,
      ...(anthropicTools ? { tools: anthropicTools } : {}),
    })

    if (response.stop_reason === 'tool_use') {
      const textBlock = response.content.find((b) => b.type === 'text')
      const content = textBlock && textBlock.type === 'text' ? textBlock.text : undefined

      const toolCalls: ToolCall[] = response.content
        .filter((b) => b.type === 'tool_use')
        .map((b) => {
          if (b.type !== 'tool_use') throw new Error('unreachable')
          return {
            id: b.id,
            name: b.name,
            arguments: b.input as Record<string, unknown>,
          }
        })

      return { type: 'tool_calls', content, toolCalls }
    }

    const textBlock = response.content.find((b) => b.type === 'text')
    const content = textBlock && textBlock.type === 'text' ? textBlock.text : ''
    return { type: 'text', content }
  }

  private toAnthropicMessage(
    msg: CoreMessage,
  ): Anthropic.Messages.MessageParam {
    if (msg.role === 'tool') {
      return {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.toolCallId ?? msg.id,
            content: msg.content,
          },
        ],
      }
    }

    if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
      const contentBlocks: Anthropic.Messages.ContentBlockParam[] = []

      if (msg.content) {
        contentBlocks.push({ type: 'text', text: msg.content })
      }

      for (const tc of msg.toolCalls) {
        contentBlocks.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.name,
          input: tc.arguments,
        })
      }

      return { role: 'assistant', content: contentBlocks }
    }

    return {
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }
  }
}
