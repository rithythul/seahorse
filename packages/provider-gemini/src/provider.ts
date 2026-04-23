import { GoogleGenAI } from '@google/genai'
import type { CoreMessage, IProvider, LLMResponse, Tool, ToolCall } from '@seahorse/core'

export class GeminiProvider implements IProvider {
  readonly id = 'gemini'
  private genai: GoogleGenAI
  private model: string

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.genai = new GoogleGenAI({ apiKey })
    this.model = model
  }

  async chat(messages: CoreMessage[], tools?: Tool[]): Promise<LLMResponse> {
    const systemMessages = messages.filter((m) => m.role === 'system')
    const systemInstruction =
      systemMessages.length > 0 ? systemMessages.map((m) => m.content).join('\n') : undefined

    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => this.toGeminiContent(m))

    const functionDeclarations =
      tools && tools.length > 0
        ? tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: {
              type: 'OBJECT',
              properties: t.parameters,
            },
          }))
        : undefined

    const response = await this.genai.models.generateContent({
      model: this.model,
      contents,
      ...(systemInstruction ? { systemInstruction } : {}),
      ...(functionDeclarations ? { tools: [{ functionDeclarations }] } : {}),
    })

    const functionCalls = response.functionCalls()
    if (functionCalls && functionCalls.length > 0) {
      const toolCalls: ToolCall[] = functionCalls.map((fc) => ({
        id: crypto.randomUUID(),
        name: fc.name ?? '',
        arguments: (fc.args ?? {}) as Record<string, unknown>,
      }))

      return { type: 'tool_calls', toolCalls }
    }

    return { type: 'text', content: response.text() ?? '' }
  }

  private toGeminiContent(msg: CoreMessage) {
    if (msg.role === 'tool') {
      return {
        role: 'user' as const,
        parts: [
          {
            functionResponse: {
              name: 'tool',
              response: { result: msg.content },
            },
          },
        ],
      }
    }

    if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
      return {
        role: 'model' as const,
        parts: msg.toolCalls.map((tc) => ({
          functionCall: {
            name: tc.name,
            args: tc.arguments,
          },
        })),
      }
    }

    if (msg.role === 'assistant') {
      return {
        role: 'model' as const,
        parts: [{ text: msg.content }],
      }
    }

    return {
      role: 'user' as const,
      parts: [{ text: msg.content }],
    }
  }
}
