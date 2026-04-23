import OpenAI from 'openai'
import type { CoreMessage, IProvider, LLMResponse, Tool, ToolCall } from '@seahorse/core'

export class OpenAIProvider implements IProvider {
  readonly id = 'openai'
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model = 'gpt-4o', baseUrl?: string) {
    this.client = new OpenAI({
      apiKey,
      ...(baseUrl ? { baseURL: baseUrl } : {}),
    })
    this.model = model
  }

  async chat(messages: CoreMessage[], tools?: Tool[]): Promise<LLMResponse> {
    const openaiMessages = messages.map((m) => this.toOpenAIMessage(m))

    const openaiTools =
      tools && tools.length > 0
        ? tools.map((t) => ({
            type: 'function' as const,
            function: {
              name: t.name,
              description: t.description,
              parameters: {
                type: 'object',
                properties: t.parameters,
              },
            },
          }))
        : undefined

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      ...(openaiTools ? { tools: openaiTools } : {}),
    })

    const choice = response.choices[0]

    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      const content = choice.message.content ?? undefined

      const toolCalls: ToolCall[] = choice.message.tool_calls.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      }))

      return { type: 'tool_calls', content, toolCalls }
    }

    return { type: 'text', content: choice.message.content ?? '' }
  }

  private toOpenAIMessage(msg: CoreMessage): OpenAI.Chat.ChatCompletionMessageParam {
    if (msg.role === 'system') {
      return { role: 'system', content: msg.content }
    }

    if (msg.role === 'user') {
      return { role: 'user', content: msg.content }
    }

    if (msg.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: msg.toolCallId ?? msg.id,
        content: msg.content,
      }
    }

    // assistant
    if (msg.toolCalls && msg.toolCalls.length > 0) {
      return {
        role: 'assistant',
        content: msg.content || null,
        tool_calls: msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      }
    }

    return { role: 'assistant', content: msg.content }
  }
}
