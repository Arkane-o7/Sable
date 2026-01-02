import Groq from 'groq-sdk'
import { env } from '../lib/env'
import type { ChatMessage } from '@sable/types'

// Initialize Groq client
const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
})

// Default model
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

// System prompt
const SYSTEM_PROMPT = `You are Sable, an intelligent AI assistant. You are helpful, harmless, and honest.
You provide clear, accurate, and well-structured responses.
When appropriate, use markdown formatting for better readability.
For code, always specify the language for syntax highlighting.`

/**
 * Send a chat message and get a response
 */
export async function chat(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 4096,
  })

  return completion.choices[0]?.message?.content || ''
}

/**
 * Stream a chat response
 * Returns an async generator that yields content chunks
 */
export async function* chatStream(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): AsyncGenerator<string> {
  const stream = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

/**
 * Generate a title for a conversation based on the first message
 */
export async function generateTitle(firstMessage: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant', // Use smaller model for titles
    messages: [
      {
        role: 'system',
        content: 'Generate a short title (3-6 words) for a conversation that starts with the following message. Only respond with the title, nothing else.',
      },
      { role: 'user', content: firstMessage },
    ],
    temperature: 0.5,
    max_tokens: 20,
  })

  return completion.choices[0]?.message?.content?.trim() || 'New Chat'
}
