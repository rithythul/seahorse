import { Ollama } from 'ollama'
import type { CoreMessage, IProvider, LLMResponse, Tool, ToolCall } from '@seahorse/core'

export class OllamaProvider implements IProvider {
  readonly id = 'ollama'
  private ollama: Ollama
  private model: string

  constructor(model = 'llama3.2', host = 'http://localhost:11434') {
    this.ollama = new Ollama({ host })
    this.model = model
  }

  async chat(messages: CoreMessage[], tools?: Tool[]): Promise<LLMResponse> {
    const ollamaMessages = messages.map((msg) => this.toOllamaMessage(msg))

    const ollamaTools =
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

    const response = await this.ollama.chat({
      model: this.model,
      messages: ollamaMessages,
      ...(ollamaTools ? { tools: ollamaTools } : {}),
    })

    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      const toolCalls: ToolCall[] = response.message.tool_calls.map((tc) => ({
        id: crypto.randomUUID(),
        name: tc.function.name,
        arguments: tc.function.arguments as Record<string, unknown>,
      }))

      return {
        type: 'tool_calls',
        content: response.message.content || undefined,
        toolCalls,
      }
    }

    return { type: 'text', content: response.message.content }
  }

  private toOllamaMessage(msg: CoreMessage): { role: string; content: string; tool_calls?: unknown[] } {
    if (msg.role === 'tool') {
      return { role: 'tool', content: msg.content }
    }

    if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
      return {
        role: 'assistant',
        content: msg.content,
        tool_calls: msg.toolCalls.map((tc) => ({
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        })),
      }
    }

    return { role: msg.role, content: msg.content }
  }
}
