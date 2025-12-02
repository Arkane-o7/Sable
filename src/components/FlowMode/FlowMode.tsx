import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSableStore } from '@/store/sableStore'
import { ChatPanel } from './ChatPanel'
import { EdgeHandle } from './EdgeHandle'

export function FlowMode() {
  const { chatWindows, createChatWindow, setDocked, setScreenSize, isDocked } = useSableStore()

  // Ensure click-through is enabled when docked (no active windows)
  useEffect(() => {
    const hasActiveWindows = chatWindows.some(w => !w.isMinimized)
    if (!hasActiveWindows || isDocked) {
      // Enable click-through for the entire window
      window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
    }
  }, [chatWindows, isDocked])

  // Initialize screen size and set up event listeners
  useEffect(() => {
    const initializeScreen = async () => {
      if (window.electronAPI) {
        const size = await window.electronAPI.getScreenSize()
        setScreenSize(size)
      }
    }
    initializeScreen()

    // Listen for toggle chat shortcut (Alt+Space)
    const unsubscribeToggle = window.electronAPI?.onToggleChat(() => {
      if (chatWindows.length === 0) {
        createChatWindow()
        setDocked(false)
      } else {
        // Toggle visibility of all chats
        const allMinimized = chatWindows.every(w => w.isMinimized)
        if (allMinimized) {
          // Restore the last chat
          const lastChat = chatWindows[chatWindows.length - 1]
          useSableStore.getState().restoreChatWindow(lastChat.id)
          setDocked(false)
        } else {
          // Create a new chat window
          createChatWindow()
        }
      }
    })

    // Listen for minimize to dock shortcut (Escape)
    const unsubscribeMinimize = window.electronAPI?.onMinimizeToDock(() => {
      const activeChats = chatWindows.filter(w => !w.isMinimized)
      activeChats.forEach(chat => {
        useSableStore.getState().minimizeChatWindow(chat.id)
      })
      if (activeChats.length > 0) {
        setDocked(true)
        // Immediately enable click-through to prevent hover issues
        window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
      }
    })

    return () => {
      unsubscribeToggle?.()
      unsubscribeMinimize?.()
    }
  }, [chatWindows.length])

  // Active (non-minimized) chat windows
  const activeChats = chatWindows.filter(w => !w.isMinimized)

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Edge Handle (Samsung Edge style dock) */}
      <div className="pointer-events-auto">
        <EdgeHandle />
      </div>

      {/* Chat Panels */}
      <AnimatePresence>
        {activeChats.map((chat) => (
          <div key={chat.id} className="pointer-events-auto">
            <ChatPanel chat={chat} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
