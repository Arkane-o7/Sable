import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Message } from '@/store/sableStore'
import { MarkdownRenderer } from './MarkdownRenderer'

interface ChatMessagesProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto glass-scrollbar p-4 space-y-4">
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full text-center px-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 flex items-center justify-center mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="text-white/90 font-medium mb-2">Hey there! I am Sable</h3>
          <p className="text-white/50 text-sm">...here for all your need :)</p>
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] px-4 py-2.5 rounded-2xl',
                message.role === 'user'
                  ? 'bg-white/20 text-white rounded-br-md'
                  : 'bg-white/10 text-white/90 rounded-bl-md'
              )}
            >
              {message.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              ) : (
                <div className="text-sm">
                  <MarkdownRenderer content={message.content} />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="typing-dot w-2 h-2 rounded-full bg-white/50" />
                <div className="typing-dot w-2 h-2 rounded-full bg-white/50" />
                <div className="typing-dot w-2 h-2 rounded-full bg-white/50" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </div>
  )
}
