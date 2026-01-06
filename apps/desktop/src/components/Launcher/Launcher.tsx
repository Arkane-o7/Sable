import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageSquare, Sparkles, CornerDownLeft } from 'lucide-react'
import { useSableStore } from '@/store/sableStore'
import { LauncherItem } from './LauncherItem'

export interface SearchResult {
  id: string
  type: 'action' | 'chat' | 'command' | 'app'
  name: string
  description: string
  icon?: React.ReactNode
  action: () => void
}

export function Launcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { createChatWindow, setDocked, triggerChatInputFocus } = useSableStore()

  // Default actions when no search query
  const defaultActions: SearchResult[] = [
    {
      id: 'new-chat',
      type: 'chat',
      name: 'New Chat',
      description: 'Start a new conversation with Navi AI',
      icon: <MessageSquare className="w-5 h-5" />,
      action: () => {
        createChatWindow()
        setDocked(false)
        setTimeout(() => triggerChatInputFocus(), 100)
        setIsOpen(false)
      }
    },
    {
      id: 'ask-ai',
      type: 'action',
      name: 'Ask AI',
      description: 'Quick question to Navi',
      icon: <Sparkles className="w-5 h-5" />,
      action: () => {
        if (query.trim()) {
          // Create a new chat with the query pre-filled
          createChatWindow()
          setDocked(false)
          // The chat will be created, user types in the input
          setTimeout(() => triggerChatInputFocus(), 100)
        }
        setIsOpen(false)
      }
    },
  ]

  // Handle search
  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults(defaultActions)
      return
    }

    // Filter default actions based on query
    const filteredActions = defaultActions.filter(
      action => 
        action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Add AI query as first result if there's a search query
    const aiQueryResult: SearchResult = {
      id: 'ai-query',
      type: 'command',
      name: `Ask: "${searchQuery}"`,
      description: 'Send this question to Navi AI',
      icon: <Sparkles className="w-5 h-5" />,
      action: () => {
        const chatId = createChatWindow()
        setDocked(false)
        // Add the message to the chat
        setTimeout(() => {
          useSableStore.getState().addMessage(chatId, {
            role: 'user',
            content: searchQuery
          })
          triggerChatInputFocus()
        }, 100)
        setIsOpen(false)
      }
    }

    setSearchResults([aiQueryResult, ...filteredActions])
  }, [createChatWindow, setDocked, triggerChatInputFocus])

  // Initialize with default actions
  useEffect(() => {
    setSearchResults(defaultActions)
  }, [])

  // Update search results when query changes
  useEffect(() => {
    handleSearch(query)
    setSelectedIndex(0)
  }, [query, handleSearch])

  // Listen for launcher toggle (Alt+Space)
  useEffect(() => {
    const handleToggleLauncher = () => {
      setIsOpen(prev => !prev)
    }

    const cleanup = window.electronAPI?.onToggleLauncher?.(handleToggleLauncher)
    
    // Also listen for keyboard shortcut locally
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'Space') {
        e.preventDefault()
        handleToggleLauncher()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      cleanup?.()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      // Disable click-through when launcher is open
      window.electronAPI?.setIgnoreMouseEvents(false)
    } else {
      setQuery('')
      setSelectedIndex(0)
      // Re-enable click-through when closed
      window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
      case 'Enter':
        e.preventDefault()
        if (searchResults[selectedIndex]) {
          searchResults[selectedIndex].action()
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          onClick={handleBackdropClick}
          onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
        >
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ 
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="w-full max-w-2xl bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-800 shadow-2xl shadow-black/50 overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input */}
            <div className="flex items-center px-5 py-4 border-b border-neutral-800/50">
              <Search className="w-5 h-5 text-neutral-400 mr-3 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or ask anything..."
                className="flex-1 bg-transparent text-white text-lg font-medium placeholder:text-neutral-500 outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <span className="text-sm">Clear</span>
                </button>
              )}
            </div>

            {/* Search Results */}
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {searchResults.length > 0 ? (
                <ul className="space-y-0.5">
                  {searchResults.map((result, index) => (
                    <LauncherItem
                      key={result.id}
                      result={result}
                      isSelected={index === selectedIndex}
                      onSelect={() => result.action()}
                      onHover={() => setSelectedIndex(index)}
                    />
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-neutral-500">No results found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800/50 text-neutral-500 text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-xs">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  Select
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-xs">Esc</kbd>
                  Close
                </span>
              </div>
              <div className="flex items-center gap-1 text-neutral-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Powered by Navi</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
