import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatWindow {
  id: string
  messages: Message[]
  isMinimized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
}

interface SableState {
  // Mode state
  mode: 'flow' | 'focus'
  setMode: (mode: 'flow' | 'focus') => void
  
  // Chat windows (Flow Mode can have multiple)
  chatWindows: ChatWindow[]
  activeChatId: string | null
  
  // Edge dock state
  isDocked: boolean
  setDocked: (docked: boolean) => void
  
  // Chat window actions
  createChatWindow: () => string
  closeChatWindow: (id: string) => void
  minimizeChatWindow: (id: string) => void
  restoreChatWindow: (id: string) => void
  updateChatPosition: (id: string, position: { x: number; y: number }) => void
  updateChatSize: (id: string, size: { width: number; height: number }) => void
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  setActiveChatId: (id: string | null) => void
  
  // UI state
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Screen dimensions
  screenSize: { width: number; height: number }
  setScreenSize: (size: { width: number; height: number }) => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const DEFAULT_CHAT_SIZE = { width: 380, height: 500 }

export const useSableStore = create<SableState>((set, get) => ({
  // Mode
  mode: 'flow',
  setMode: (mode) => set({ mode }),
  
  // Chat windows
  chatWindows: [],
  activeChatId: null,
  
  // Edge dock
  isDocked: true,
  setDocked: (docked) => set({ isDocked: docked }),
  
  // Chat window actions
  createChatWindow: () => {
    const id = generateId()
    const { screenSize, chatWindows } = get()
    
    // Calculate position (center with offset for multiple windows)
    const offset = chatWindows.length * 30
    const position = {
      x: Math.max(50, (screenSize.width - DEFAULT_CHAT_SIZE.width) / 2 + offset),
      y: Math.max(50, (screenSize.height - DEFAULT_CHAT_SIZE.height) / 2 + offset)
    }
    
    const newWindow: ChatWindow = {
      id,
      messages: [],
      isMinimized: false,
      position,
      size: DEFAULT_CHAT_SIZE
    }
    
    set((state) => ({
      chatWindows: [...state.chatWindows, newWindow],
      activeChatId: id,
      isDocked: false
    }))
    
    return id
  },
  
  closeChatWindow: (id) => {
    set((state) => {
      const newWindows = state.chatWindows.filter((w) => w.id !== id)
      return {
        chatWindows: newWindows,
        activeChatId: newWindows.length > 0 ? newWindows[newWindows.length - 1].id : null,
        isDocked: newWindows.length === 0
      }
    })
  },
  
  minimizeChatWindow: (id) => {
    set((state) => ({
      chatWindows: state.chatWindows.map((w) =>
        w.id === id ? { ...w, isMinimized: true } : w
      )
    }))
  },
  
  restoreChatWindow: (id) => {
    set((state) => ({
      chatWindows: state.chatWindows.map((w) =>
        w.id === id ? { ...w, isMinimized: false } : w
      ),
      activeChatId: id
    }))
  },
  
  updateChatPosition: (id, position) => {
    set((state) => ({
      chatWindows: state.chatWindows.map((w) =>
        w.id === id ? { ...w, position } : w
      )
    }))
  },
  
  updateChatSize: (id, size) => {
    set((state) => ({
      chatWindows: state.chatWindows.map((w) =>
        w.id === id ? { ...w, size } : w
      )
    }))
  },
  
  addMessage: (chatId, message) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date()
    }
    
    set((state) => ({
      chatWindows: state.chatWindows.map((w) =>
        w.id === chatId ? { ...w, messages: [...w.messages, newMessage] } : w
      )
    }))
  },
  
  setActiveChatId: (id) => set({ activeChatId: id }),
  
  // UI state
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Screen dimensions
  screenSize: { width: 1920, height: 1080 },
  setScreenSize: (size) => set({ screenSize: size })
}))
