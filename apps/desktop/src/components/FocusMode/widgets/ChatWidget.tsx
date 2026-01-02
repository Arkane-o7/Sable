import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Search, MessageSquare } from 'lucide-react'
import { useSableStore, Message } from '../../../store/sableStore'
import { sendMessage, parseSearchRequest } from '../../../services/groqService'
import { webSearch, formatSearchResultsForLLM } from '../../../services/tavilyService'
import { MarkdownRenderer } from '../../FlowMode/MarkdownRenderer'
import { WidgetComponentProps, WidgetConfig } from './types'
import { registerWidget } from './registry'

// ============= Widget Configuration =============
export const chatWidgetConfig: WidgetConfig = {
  type: 'chat',
  label: 'Chat',
  defaultSize: { width: 280, height: 420 },
  minSize: { width: 220, height: 300 },
  component: ChatWidget,
}

// ============= Widget Component =============
function ChatWidget(_props: WidgetComponentProps) {
  const { 
    focusChatMessages, 
    addFocusChatMessage, 
    isLoading, 
    setLoading,
    isSearching,
    setSearching,
  } = useSableStore()
  
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [focusChatMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    addFocusChatMessage({ role: 'user', content: userMessage })
    
    setLoading(true)
    
    try {
      // Get conversation history
      const conversationHistory = focusChatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
      
      // Add the new message
      conversationHistory.push({ role: 'user', content: userMessage })
      
      // First, get LLM response (which may include a search request)
      let response = await sendMessage(conversationHistory)
      
      // Check if the response contains a search request
      const searchRequest = parseSearchRequest(response)
      
      if (searchRequest.isSearch && searchRequest.query) {
        // Perform web search
        setSearching(true)
        const searchResults = await webSearch(searchRequest.query)
        const formattedResults = formatSearchResultsForLLM(searchResults)
        setSearching(false)
        
        // Send search results back to LLM for final response
        const searchContext = `Web search results for "${searchRequest.query}":\n\n${formattedResults}\n\nPlease provide a helpful response based on these search results.`
        
        conversationHistory.push({ role: 'assistant', content: `Searching for: ${searchRequest.query}` })
        conversationHistory.push({ role: 'user', content: searchContext })
        
        response = await sendMessage(conversationHistory)
      }
      
      addFocusChatMessage({ role: 'assistant', content: response })
    } catch (error) {
      console.error('Error getting response:', error)
      addFocusChatMessage({ 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      })
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-neutral-100 rounded-xl">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-neutral-500" />
          <span className="text-xs font-medium text-neutral-600">Chat</span>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
        {focusChatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-center p-4">
            <MessageSquare size={28} className="mb-2 opacity-40" />
            <p className="text-xs">Start a conversation</p>
          </div>
        ) : (
          focusChatMessages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-white text-neutral-800 shadow-sm border border-neutral-200'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm prose-neutral max-w-none">
                    <MarkdownRenderer content={message.content} variant="light" />
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-3 py-2 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-2 text-neutral-500 text-sm">
                {isSearching ? (
                  <>
                    <Search size={14} className="animate-pulse" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Thinking...</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-neutral-200 bg-white rounded-b-xl">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="flex-1 bg-neutral-100 border-0 rounded-full px-4 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  )
}

// Register this widget
registerWidget(chatWidgetConfig)

export default ChatWidget
