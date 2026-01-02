// ============================================
// User Types
// ============================================

export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt?: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  defaultModel: string
  shortcuts: Record<string, string>
}

// ============================================
// Message Types
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}

export interface ChatMessage {
  role: MessageRole
  content: string
}

// ============================================
// Conversation Types
// ============================================

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Widget Types (Focus Mode)
// ============================================

export type WidgetType = 
  | 'chat' 
  | 'sticky-note' 
  | 'todo' 
  | 'weather' 
  | 'clipboard' 
  | 'calendar' 
  | 'notifications'

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Widget {
  id: string
  type: WidgetType
  position: Position
  size: Size
  data?: Record<string, unknown>
}

export interface Workspace {
  id: string
  name: string
  widgets: Widget[]
}

// ============================================
// Chat Window Types (Flow Mode - Desktop)
// ============================================

export interface ChatWindow {
  id: string
  messages: Message[]
  isMinimized: boolean
  position: Position
  size: Size
}

// ============================================
// Search Types
// ============================================

export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  answer?: string
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

export interface ChatRequest {
  conversationId?: string
  messages: ChatMessage[]
  stream?: boolean
}

export interface ChatResponse {
  conversationId: string
  content: string
}

// ============================================
// Notification Types (Desktop)
// ============================================

export interface SableNotification {
  id: string
  appId?: string
  appName: string
  title: string
  message: string
  timestamp: Date
  icon?: string
}

// ============================================
// Clipboard Types
// ============================================

export interface ClipboardItem {
  id: string
  type: 'text' | 'image'
  content: string
  timestamp: Date
  preview?: string
}

// ============================================
// Integration Types
// ============================================

export type IntegrationProvider = 'slack' | 'google' | 'spotify' | 'github'

export interface Integration {
  id: string
  userId: string
  provider: IntegrationProvider
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
}
