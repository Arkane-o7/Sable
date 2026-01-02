import type { StateCreator } from 'zustand'
import type { Message } from '@sable/types'
import { generateId } from '@sable/utils'

export interface ChatSlice {
  // State
  messages: Message[]
  isLoading: boolean
  error: string | null
  currentConversationId: string | null
  
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setMessages: (messages: Message[]) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCurrentConversationId: (id: string | null) => void
}

export const createChatSlice: StateCreator<ChatSlice> = (set) => ({
  // Initial state
  messages: [],
  isLoading: false,
  error: null,
  currentConversationId: null,

  // Actions
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        },
      ],
    })),

  setMessages: (messages) => set({ messages }),

  clearMessages: () => set({ messages: [], currentConversationId: null }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setCurrentConversationId: (id) => set({ currentConversationId: id }),
})
