import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageSquare, Sparkles, CornerDownLeft, Settings, Moon, Sun, Loader2 } from 'lucide-react'
import { useSableStore } from '@/store/sableStore'
import { LauncherItem } from './LauncherItem'
import { sendMessage, ChatMessage } from '@/services/groqService'

export interface SearchResult {
  id: string
  type: 'action' | 'chat' | 'command' | 'app' | 'quick-answer'
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
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isOpenRef = useRef(isOpen) // Track isOpen state for async callbacks
  
  // Update ref when isOpen changes
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])
  
  const { createChatWindow, setDocked, triggerChatInputFocus, toggleFocusMode, mode, addMessage } = useSableStore()

  // Default actions when no search query
  const getDefaultActions = useCallback((): SearchResult[] => [
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
      id: 'toggle-focus',
      type: 'action',
      name: mode === 'flow' ? 'Enter Focus Mode' : 'Exit Focus Mode',
      description: mode === 'flow' ? 'Switch to Focus Mode for distraction-free work' : 'Return to Flow Mode',
      icon: mode === 'flow' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
      action: () => {
        toggleFocusMode()
        setIsOpen(false)
      }
    },
    {
      id: 'settings',
      type: 'app',
      name: 'Settings',
      description: 'Configure Sable preferences',
      icon: <Settings className="w-5 h-5" />,
      action: () => {
        // TODO: Open settings panel
        setIsOpen(false)
      }
    },
  ], [createChatWindow, setDocked, triggerChatInputFocus, toggleFocusMode, mode])

  // Get quick AI answer for the query
  const getQuickAnswer = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setQuickAnswer(null)
      return
    }

    setIsLoadingAI(true)
    try {
      const messages: ChatMessage[] = [
        { 
          role: 'user', 
          content: `Answer this very briefly in 1-2 sentences max. If it's a question, give a direct answer. If it's a task request, just acknowledge it: "${searchQuery}"` 
        }
      ]
      
      const response = await sendMessage(messages)
      // Use ref to check if still open (avoids race condition with state)
      if (response && isOpenRef.current) {
        setQuickAnswer(response.slice(0, 200)) // Limit quick answer length
      }
    } catch (error) {
      console.error('Quick answer error:', error)
      setQuickAnswer(null)
    } finally {
      setIsLoadingAI(false)
    }
  }, [])

  // Handle search with debounce for AI
  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults(getDefaultActions())
      setQuickAnswer(null)
      return
    }

    // Filter default actions based on query
    const filteredActions = getDefaultActions().filter(
      action => 
        action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Add AI query as first result if there's a search query
    const aiQueryResult: SearchResult = {
      id: 'ai-query',
      type: 'command',
      name: `Ask Navi: "${searchQuery}"`,
      description: 'Send this to Navi AI for a detailed response',
      icon: <Sparkles className="w-5 h-5" />,
      action: () => {
        const chatId = createChatWindow()
        setDocked(false)
        // Add the message to the chat using the hook-provided function
        setTimeout(() => {
          addMessage(chatId, {
            role: 'user',
            content: searchQuery
          })
          triggerChatInputFocus()
        }, 100)
        setIsOpen(false)
      }
    }

    setSearchResults([aiQueryResult, ...filteredActions])
  }, [createChatWindow, setDocked, triggerChatInputFocus, addMessage, getDefaultActions])

  // Initialize with default actions
  useEffect(() => {
    setSearchResults(getDefaultActions())
  }, [getDefaultActions])

  // Update search results when query changes
  useEffect(() => {
    handleSearch(query)
    setSelectedIndex(0)
  }, [query, handleSearch])

  // Debounced AI quick answer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 3) {
        getQuickAnswer(query)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [query, getQuickAnswer])

  // Listen for launcher toggle (Alt+Space)
  useEffect(() => {
    const handleToggleLauncher = () => {
      setIsOpen(prev => !prev)
    }

    const cleanup = window.electronAPI?.onToggleLauncher?.(handleToggleLauncher)
    
    return () => {
      cleanup?.()
    }
  }, [])

  /**
   * Focus input when opened and manage click-through behavior.
   * 
   * Click-through behavior is essential for transparent Electron overlays:
   * - When launcher is OPEN: Disable click-through so user can interact with the launcher
   * - When launcher is CLOSED: Enable click-through so clicks pass through to apps behind
   * - The `forward: true` option ensures mouse events are still forwarded for hover detection
   */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      // Disable click-through when launcher is open so user can interact
      window.electronAPI?.setIgnoreMouseEvents(false)
    } else {
      setQuery('')
      setSelectedIndex(0)
      setQuickAnswer(null)
      // Re-enable click-through when closed so clicks pass through to apps behind
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
              {isLoadingAI && (
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin mr-2" />
              )}
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <span className="text-sm">Clear</span>
                </button>
              )}
            </div>

            {/* Quick Answer Preview */}
            <AnimatePresence>
              {quickAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-3 border-b border-neutral-800/50 bg-gradient-to-r from-purple-500/10 to-blue-500/10"
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-purple-300 font-medium mb-1">Quick Answer</p>
                      <p className="text-neutral-200 text-sm">{quickAnswer}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
