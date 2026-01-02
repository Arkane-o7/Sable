'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Menu, Plus, Trash2 } from 'lucide-react'
import { cn } from '@sable/utils'
import { streamChatMessage, configureApi, setAuthToken, getConversations } from '@sable/services'
import type { Message, ChatMessage, Conversation } from '@sable/types'

// Configure API on load
if (typeof window !== 'undefined') {
  configureApi({ 
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' 
  })
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await getConversations()
      if (response.data) {
        setConversations(response.data)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const chatMessages: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
      chatMessages.push({ role: 'user', content: userMessage.content })

      await streamChatMessage(
        chatMessages,
        // On each chunk
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev]
            const lastMsg = updated[updated.length - 1]
            if (lastMsg.role === 'assistant') {
              lastMsg.content += chunk
            }
            return updated
          })
        },
        // On complete
        () => {
          setIsLoading(false)
          loadConversations()
        },
        // On error
        (error) => {
          console.error('Stream error:', error)
          setMessages((prev) => {
            const updated = [...prev]
            const lastMsg = updated[updated.length - 1]
            if (lastMsg.role === 'assistant') {
              lastMsg.content = 'Sorry, I encountered an error. Please try again.'
            }
            return updated
          })
          setIsLoading(false)
        },
        currentConversationId || undefined
      )
    } catch (error) {
      console.error('Chat error:', error)
      setIsLoading(false)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentConversationId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-screen bg-neutral-950">
      {/* Sidebar */}
      <aside 
        className={cn(
          "w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-all",
          !sidebarOpen && "w-0 overflow-hidden"
        )}
      >
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setCurrentConversationId(conv.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors",
                currentConversationId === conv.id
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
              )}
            >
              {conv.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-neutral-800 flex items-center px-4 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Sable Chat</h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-3xl font-bold">S</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
                <p className="text-neutral-400">Start a conversation with Sable</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === 'user'
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-800 text-neutral-100"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.role === 'assistant' && isLoading && message.content === '' && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-neutral-800 p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-end bg-neutral-900 rounded-2xl border border-neutral-700 focus-within:border-neutral-500 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Sable..."
                rows={1}
                className="flex-1 bg-transparent px-4 py-3 resize-none focus:outline-none max-h-32"
                style={{ minHeight: '48px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "m-2 p-2 rounded-lg transition-colors",
                  input.trim() && !isLoading
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-500 text-center mt-2">
              Sable can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
