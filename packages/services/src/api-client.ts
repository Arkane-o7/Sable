import type { 
  ChatMessage, 
  ChatRequest, 
  ChatResponse, 
  SearchResponse,
  Conversation,
  User,
  ApiResponse 
} from '@sable/types'

// ============================================
// API Client Configuration
// ============================================

let apiBaseUrl = ''
let authToken: string | null = null

export function configureApi(config: { baseUrl: string; token?: string }) {
  apiBaseUrl = config.baseUrl
  if (config.token) {
    authToken = config.token
  }
}

export function setAuthToken(token: string | null) {
  authToken = token
}

// ============================================
// Fetch Wrapper
// ============================================

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${apiBaseUrl}${endpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data.error || 'Request failed',
        status: response.status,
      }
    }

    return {
      data,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}

// ============================================
// Chat API
// ============================================

export async function sendChatMessage(
  messages: ChatMessage[],
  conversationId?: string
): Promise<ApiResponse<ChatResponse>> {
  const request: ChatRequest = {
    messages,
    conversationId,
  }

  return apiFetch<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * Stream chat messages using Server-Sent Events
 */
export async function streamChatMessage(
  messages: ChatMessage[],
  onChunk: (content: string) => void,
  onComplete?: (fullContent: string) => void,
  onError?: (error: string) => void,
  conversationId?: string
): Promise<void> {
  const url = `${apiBaseUrl}/api/chat/stream`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, conversationId }),
    })

    if (!response.ok) {
      const error = await response.json()
      onError?.(error.error || 'Stream failed')
      return
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (!reader) {
      onError?.('No response body')
      return
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          
          if (data === '[DONE]') {
            onComplete?.(fullContent)
            return
          }

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              fullContent += parsed.content
              onChunk(parsed.content)
            }
            if (parsed.error) {
              onError?.(parsed.error)
              return
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    onComplete?.(fullContent)
  } catch (error) {
    onError?.(error instanceof Error ? error.message : 'Stream failed')
  }
}

// ============================================
// Conversation API
// ============================================

export async function getConversations(): Promise<ApiResponse<Conversation[]>> {
  return apiFetch<Conversation[]>('/api/conversations')
}

export async function getConversation(id: string): Promise<ApiResponse<Conversation & { messages: ChatMessage[] }>> {
  return apiFetch<Conversation & { messages: ChatMessage[] }>(`/api/conversations/${id}`)
}

export async function deleteConversation(id: string): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/api/conversations/${id}`, {
    method: 'DELETE',
  })
}

// ============================================
// Search API
// ============================================

export async function searchWeb(query: string): Promise<ApiResponse<SearchResponse>> {
  return apiFetch<SearchResponse>('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

// ============================================
// User API
// ============================================

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiFetch<User>('/api/user')
}

export async function updateUserPreferences(
  preferences: Record<string, unknown>
): Promise<ApiResponse<void>> {
  return apiFetch<void>('/api/user/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  })
}
