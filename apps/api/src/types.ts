// Local type definitions for API
// (Avoiding workspace dependency issues with @sable/types)

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: MessageRole
  content: string
}

export interface SearchResult {
  title: string
  url: string
  content: string
  score?: number
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  answer?: string
}
