export type Vertical = 'fnb' | 'retail' | 'education' | 'professional'
export type Language = 'km' | 'en' | 'both'
export type UserRole = 'owner' | 'staff' | 'customer'
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

// ── Messages ────────────────────────────────────────────────────────────────

export interface CoreMessage {
  id: string
  role: MessageRole
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
}

export interface InboundMessage {
  id: string
  channelId: string
  senderId: string
  senderName?: string
  content: string
  attachments?: Attachment[]
  timestamp: Date
}

export interface OutboundMessage {
  channelId: string
  recipientId: string
  content: string
  replyToId?: string
}

export interface Attachment {
  type: 'image' | 'audio' | 'document'
  url?: string
  data?: Buffer
  mimeType: string
}

// ── LLM ─────────────────────────────────────────────────────────────────────

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export type LLMResponse =
  | { type: 'text'; content: string }
  | { type: 'tool_calls'; content?: string; toolCalls: ToolCall[] }

export interface Tool {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>) => Promise<string>
}

// ── Business ─────────────────────────────────────────────────────────────────

export interface Business {
  id: string
  name: string
  vertical: Vertical
  language: Language
  ownerId: string
  timezone: string
}

export interface Identity {
  userId: string
  businessId: string
  role: UserRole
  name?: string
  language: Language
}

export interface Session {
  id: string
  businessId: string
  channelId: string
  userId: string
  identity: Identity
  messages: CoreMessage[]
  createdAt: Date
  updatedAt: Date
}

// ── Interfaces (implemented by other packages) ───────────────────────────────

export type MessageHandler = (msg: InboundMessage) => Promise<void>

export interface IChannel {
  id: string
  name: string
  send: (message: OutboundMessage) => Promise<void>
  onMessage: (handler: MessageHandler) => void
  start: () => Promise<void>
  stop: () => Promise<void>
}

export interface IProvider {
  id: string
  chat: (messages: CoreMessage[], tools?: Tool[]) => Promise<LLMResponse>
}

export interface MemoryEntry {
  id: string
  businessId: string
  content: string
  importance: number
  tags: string[]
  createdAt: Date
  lastAccessedAt: Date
}

export interface IMemory {
  recall: (businessId: string, query: string, limit?: number) => Promise<MemoryEntry[]>
  store: (businessId: string, entry: Omit<MemoryEntry, 'id' | 'createdAt'>) => Promise<void>
  decay: (businessId: string) => Promise<void>
}

export interface ISkill {
  id: string
  vertical: Vertical
  systemPrompt: (business: Business) => string
  tools: Tool[]
}

export interface IIdentityResolver {
  resolve: (msg: InboundMessage, businessId: string) => Promise<Identity>
}

// ── Agent ────────────────────────────────────────────────────────────────────

export interface SeahorseAgent {
  business: Business
  channels: IChannel[]
  provider: IProvider
  skill: ISkill
  memory?: IMemory
  identityResolver?: IIdentityResolver
}
