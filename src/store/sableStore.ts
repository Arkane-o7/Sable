import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============= SHARED TYPES =============
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ============= FLOW MODE TYPES =============
export interface ChatWindow {
  id: string
  messages: Message[]
  isMinimized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
}

// ============= FOCUS MODE TYPES =============
export type WidgetType = 'chat' | 'sticky-note' | 'todo' | 'weather' | 'clipboard' | 'calendar' | 'notifications'

export interface Widget {
  id: string
  type: WidgetType
  position: { x: number; y: number }
  size: { width: number; height: number }
  data: Record<string, unknown>
}

export interface Workspace {
  id: string
  name: string
  widgets: Widget[]
}

// ============= STORE STATE =============
interface SableState {
  // Mode state
  mode: 'flow' | 'focus'
  setMode: (mode: 'flow' | 'focus') => void
  toggleFocusMode: () => void
  
  // ============= FLOW MODE =============
  chatWindows: ChatWindow[]
  activeChatId: string | null
  isDocked: boolean
  setDocked: (docked: boolean) => void
  
  // Flow Mode chat actions
  createChatWindow: () => string
  closeChatWindow: (id: string) => void
  minimizeChatWindow: (id: string) => void
  restoreChatWindow: (id: string) => void
  updateChatPosition: (id: string, position: { x: number; y: number }) => void
  updateChatSize: (id: string, size: { width: number; height: number }) => void
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  updateMessage: (chatId: string, messageId: string, content: string) => void
  setActiveChatId: (id: string | null) => void
  
  // ============= FOCUS MODE =============
  workspaces: Workspace[]
  activeWorkspaceId: string
  isEditMode: boolean
  
  // Focus Mode actions
  setActiveWorkspace: (id: string) => void
  createWorkspace: () => string
  deleteWorkspace: (id: string) => void
  renameWorkspace: (id: string, name: string) => void
  toggleEditMode: () => void
  setEditMode: (editing: boolean) => void
  
  // Widget actions
  addWidget: (workspaceId: string, type: WidgetType, initialData?: Record<string, unknown>, size?: { width: number; height: number }) => string
  removeWidget: (workspaceId: string, widgetId: string) => void
  updateWidgetPosition: (workspaceId: string, widgetId: string, position: { x: number; y: number }) => void
  updateWidgetSize: (workspaceId: string, widgetId: string, size: { width: number; height: number }) => void
  updateWidgetData: (workspaceId: string, widgetId: string, data: Record<string, unknown>) => void
  
  // Chat widget specific (for Focus Mode)
  focusChatMessages: Message[]
  addFocusChatMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  clearFocusChatMessages: () => void
  currentChatId: string | null
  setCurrentChatId: (id: string | null) => void
  
  // ============= UI STATE =============
  isLoading: boolean
  setLoading: (loading: boolean) => void
  isSearching: boolean
  setSearching: (searching: boolean) => void
  
  // Chat input focus trigger (for keyboard shortcuts)
  chatInputFocusTrigger: number
  triggerChatInputFocus: () => void
  
  // Screen dimensions
  screenSize: { width: number; height: number }
  setScreenSize: (size: { width: number; height: number }) => void
  
  // Flow mode state backup (for transitioning between modes)
  flowModeBackup: {
    chatWindows: ChatWindow[]
    activeChatId: string | null
  } | null
  saveFlowModeState: () => void
  restoreFlowModeState: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const DEFAULT_CHAT_SIZE = { width: 380, height: 500 }

// Default widget size fallback (used when registry doesn't provide one)
const DEFAULT_WIDGET_SIZE = { width: 220, height: 200 }

// Default workspace
const createDefaultWorkspace = (): Workspace => ({
  id: 'workspace-1',
  name: 'Workspace 1',
  widgets: []
})

export const useSableStore = create<SableState>()(
  persist(
    (set, get) => ({
      // ============= MODE =============
      mode: 'flow',
      setMode: (mode) => set({ mode }),
      
      toggleFocusMode: () => {
        const { mode, saveFlowModeState, restoreFlowModeState, chatWindows } = get()
        
        if (mode === 'flow') {
          // Switching to Focus Mode
          saveFlowModeState()
          
          // If there's an active chat, migrate messages to focus chat
          const activeChat = chatWindows.find(w => !w.isMinimized)
          if (activeChat) {
            set({ focusChatMessages: activeChat.messages })
          }
          
          set({ mode: 'focus', chatWindows: [], isDocked: true })
        } else {
          // Switching back to Flow Mode
          restoreFlowModeState()
          set({ mode: 'flow', isEditMode: false })
        }
      },
      
      // ============= FLOW MODE STATE =============
      chatWindows: [],
      activeChatId: null,
      isDocked: true,
      setDocked: (docked) => set({ isDocked: docked }),
      
      createChatWindow: () => {
        const id = generateId()
        const { screenSize, chatWindows } = get()
        
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
      
      updateMessage: (chatId, messageId, content) => {
        set((state) => ({
          chatWindows: state.chatWindows.map((w) =>
            w.id === chatId
              ? {
                  ...w,
                  messages: w.messages.map((m) =>
                    m.id === messageId ? { ...m, content } : m
                  )
                }
              : w
          )
        }))
      },
      
      setActiveChatId: (id) => set({ activeChatId: id }),
      
      // ============= FOCUS MODE STATE =============
      workspaces: [createDefaultWorkspace()],
      activeWorkspaceId: 'workspace-1',
      isEditMode: false,
      
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      
      createWorkspace: () => {
        const id = generateId()
        const { workspaces } = get()
        const newWorkspace: Workspace = {
          id,
          name: `Workspace ${workspaces.length + 1}`,
          widgets: []
        }
        
        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
          activeWorkspaceId: id
        }))
        
        return id
      },
      
      deleteWorkspace: (id) => {
        set((state) => {
          const newWorkspaces = state.workspaces.filter((w) => w.id !== id)
          // Ensure at least one workspace exists
          if (newWorkspaces.length === 0) {
            newWorkspaces.push(createDefaultWorkspace())
          }
          return {
            workspaces: newWorkspaces,
            activeWorkspaceId: newWorkspaces[0].id
          }
        })
      },
      
      renameWorkspace: (id, name) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, name } : w
          )
        }))
      },
      
      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
      setEditMode: (editing) => set({ isEditMode: editing }),
      
      // ============= WIDGET ACTIONS =============
      addWidget: (workspaceId, type, initialData = {}, size) => {
        const id = generateId()
        const { screenSize } = get()
        
        // Use provided size or fallback
        const widgetSize = size ?? DEFAULT_WIDGET_SIZE
        
        // Calculate a random-ish position
        const position = {
          x: Math.random() * (screenSize.width - widgetSize.width - 200) + 100,
          y: Math.random() * (screenSize.height - widgetSize.height - 200) + 100
        }
        
        const newWidget: Widget = {
          id,
          type,
          position,
          size: widgetSize,
          data: initialData
        }
        
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? { ...w, widgets: [...w.widgets, newWidget] }
              : w
          )
        }))
        
        return id
      },
      
      removeWidget: (workspaceId, widgetId) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? { ...w, widgets: w.widgets.filter((widget) => widget.id !== widgetId) }
              : w
          )
        }))
      },
      
      updateWidgetPosition: (workspaceId, widgetId, position) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? {
                  ...w,
                  widgets: w.widgets.map((widget) =>
                    widget.id === widgetId ? { ...widget, position } : widget
                  )
                }
              : w
          )
        }))
      },
      
      updateWidgetSize: (workspaceId, widgetId, size) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? {
                  ...w,
                  widgets: w.widgets.map((widget) =>
                    widget.id === widgetId ? { ...widget, size } : widget
                  )
                }
              : w
          )
        }))
      },
      
      updateWidgetData: (workspaceId, widgetId, data) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? {
                  ...w,
                  widgets: w.widgets.map((widget) =>
                    widget.id === widgetId ? { ...widget, data: { ...widget.data, ...data } } : widget
                  )
                }
              : w
          )
        }))
      },
      
      // Focus chat (single chat for focus mode)
      focusChatMessages: [],
      currentChatId: null,
      setCurrentChatId: (id) => set({ currentChatId: id }),
      
      addFocusChatMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: new Date()
        }
        set((state) => ({
          focusChatMessages: [...state.focusChatMessages, newMessage]
        }))
      },
      
      clearFocusChatMessages: () => {
        set({ focusChatMessages: [], currentChatId: null })
      },
      
      // ============= UI STATE =============
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      isSearching: false,
      setSearching: (searching) => set({ isSearching: searching }),
      
      chatInputFocusTrigger: 0,
      triggerChatInputFocus: () => set((state) => ({ chatInputFocusTrigger: state.chatInputFocusTrigger + 1 })),
      
      screenSize: { width: 1920, height: 1080 },
      setScreenSize: (size) => set({ screenSize: size }),
      
      // Flow mode backup
      flowModeBackup: null,
      
      saveFlowModeState: () => {
        const { chatWindows, activeChatId } = get()
        set({
          flowModeBackup: {
            chatWindows: JSON.parse(JSON.stringify(chatWindows)),
            activeChatId
          }
        })
      },
      
      restoreFlowModeState: () => {
        const { flowModeBackup, focusChatMessages } = get()
        if (flowModeBackup) {
          // Restore chat windows with updated messages from focus mode
          const restoredWindows = flowModeBackup.chatWindows.map((w, index) => {
            // If this was the active chat, update its messages
            if (index === 0 && focusChatMessages.length > 0) {
              return { ...w, messages: focusChatMessages }
            }
            return w
          })
          
          set({
            chatWindows: restoredWindows,
            activeChatId: flowModeBackup.activeChatId,
            isDocked: restoredWindows.length === 0,
            flowModeBackup: null
          })
        }
      }
    }),
    {
      name: 'sable-storage',
      partialize: (state) => ({
        // Persist workspaces and their widgets
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        // Persist focus chat messages and current chat ID
        focusChatMessages: state.focusChatMessages,
        currentChatId: state.currentChatId
      })
    }
  )
)
