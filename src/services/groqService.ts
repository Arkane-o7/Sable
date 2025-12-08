import Groq from 'groq-sdk'

// Get API key from environment
const apiKey = import.meta.env.VITE_GROQ_API_KEY || ''

console.log('Groq API Key loaded:', apiKey ? `Yes (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 10)}...)` : 'No - MISSING!')

// Initialize Groq client
const groq = new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
})

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are Sable, a friendly and helpful AI assistant integrated into the user's desktop operating system. You are:

- Concise and clear in your responses
- Helpful for quick tasks, questions, and productivity
- Aware that you're part of a desktop overlay, so keep responses appropriate for quick reading
- Friendly but professional
- Able to help with writing, coding, research, and general questions

Formatting guidelines:
- Use markdown formatting liberally: **bold**, *italic*, \`inline code\`, and code blocks with language tags
- Use markdown tables when comparing items, showing data, or listing structured information
- Use bullet points and numbered lists for clarity
- Keep responses relatively brief unless the user asks for detailed explanations`

export async function sendMessage(
  messages: ChatMessage[],
  onStream?: (chunk: string) => void
): Promise<string> {
  try {
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]

    if (onStream) {
      // Streaming response
      const stream = await groq.chat.completions.create({
        messages: chatMessages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
        stream: true
      })

      let fullResponse = ''
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        fullResponse += content
        onStream(content)
      }
      return fullResponse
    } else {
      // Non-streaming response
      const completion = await groq.chat.completions.create({
        messages: chatMessages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024
      })

      return completion.choices[0]?.message?.content || ''
    }
  } catch (error: unknown) {
    const err = error as Error & { status?: number; message?: string }
    console.error('Groq API Error:', err)
    console.error('Error details:', {
      message: err.message,
      status: err.status,
      name: err.name
    })
    throw error
  }
}

// Parse search request from LLM response
// The LLM may include [SEARCH: query] in its response to trigger a web search
export interface SearchRequest {
  isSearch: boolean
  query: string | null
}

export function parseSearchRequest(response: string): SearchRequest {
  const searchMatch = response.match(/\[SEARCH:\s*(.+?)\]/i)
  if (searchMatch) {
    return {
      isSearch: true,
      query: searchMatch[1].trim()
    }
  }
  return {
    isSearch: false,
    query: null
  }
}
