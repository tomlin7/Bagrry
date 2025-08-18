export interface ConversationMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

export interface ConversationSession {
  id: string
  title: string
  messages: ConversationMessage[]
  createdAt: Date
  lastModified: Date
}

export interface ConversationSummary {
  id: string
  title: string
  preview: string
  createdAt: Date
  lastModified: Date
  messageCount: number
}
