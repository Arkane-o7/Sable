import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSableStore, Message } from '@/store/sableStore'
import { sendMessage, ChatMessage } from '@/services/groqService'

interface ChatInputProps {
  chatId: string
}

export function ChatInput({ chatId }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addMessage, chatWindows, chatInputFocusTrigger } = useSableStore()

  const currentChat = chatWindows.find(w => w.id === chatId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    // Immediately refocus the input
    inputRef.current?.focus()
    
    // Add user message
    addMessage(chatId, { role: 'user', content: userMessage })
    
    setIsLoading(true)

    try {
      // Prepare messages for API
      const messages: ChatMessage[] = (currentChat?.messages || []).map((m: Message) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
      messages.push({ role: 'user', content: userMessage })

      // Send to Groq
      const response = await sendMessage(messages)
      
      // Add assistant response
      addMessage(chatId, { role: 'assistant', content: response })
    } catch (error) {
      console.error('Error sending message:', error)
      addMessage(chatId, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please check your API key or try again.' 
      })
    } finally {
      setIsLoading(false)
      setIsSearching(false)
      // Keep focus on input after response
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }

  // Keep input focused when loading state changes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  // Focus input when triggered by keyboard shortcut
  useEffect(() => {
    if (chatInputFocusTrigger > 0) {
      inputRef.current?.focus()
    }
  }, [chatInputFocusTrigger])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Searching indicator badge */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-7 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/30"
          >
            <Globe className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-400 font-medium">Searching the web...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 p-3 border-t border-white/10">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isSearching ? "Searching the web..." : "Ask Sable anything..."}
            disabled={isLoading}
            autoFocus
            className={cn(
              'w-full px-4 py-2.5 rounded-xl',
              'bg-white/5 border border-cyan-500/50',
              'text-white placeholder-white/40',
              'text-sm',
              'ring-1 ring-cyan-500/30',
              'focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30',
              'transition-all duration-200',
              'disabled:opacity-50',
              isSearching && 'border-cyan-400/70 ring-cyan-400/40'
            )}
          />
          
          {/* Search indicator inside input */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.button
          type="submit"
          disabled={!input.trim() || isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'p-2.5 rounded-xl',
            'bg-cyan-500 hover:bg-cyan-400',
            'text-black',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </form>
  )
}
