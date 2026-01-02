import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { chatRateLimitMiddleware } from '../middleware/rateLimit'
import { chat, chatStream, generateTitle } from '../services/llm'
import { db } from '../lib/db'
import { conversations, messages } from '../db/schema'
import { eq } from 'drizzle-orm'

const chatRouter = new Hono()

// Request validation schema
const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(32000),
  })).min(1),
})

// ============================================
// POST /api/chat - Standard chat completion
// ============================================
chatRouter.post('/',
  authMiddleware,
  chatRateLimitMiddleware,
  zValidator('json', chatSchema),
  async (c) => {
    const user = c.get('user')
    const { conversationId, messages: inputMessages } = c.req.valid('json')
    
    try {
      // Get or create conversation
      let convId = conversationId
      
      if (!convId) {
        // Create new conversation
        const firstUserMessage = inputMessages.find(m => m.role === 'user')?.content || 'New Chat'
        const title = await generateTitle(firstUserMessage)
        
        const [newConv] = await db.insert(conversations).values({
          userId: user.id,
          title,
        }).returning()
        
        convId = newConv.id
      }
      
      // Save user message
      const userMessage = inputMessages[inputMessages.length - 1]
      await db.insert(messages).values({
        conversationId: convId,
        role: userMessage.role,
        content: userMessage.content,
      })
      
      // Call LLM
      const response = await chat(inputMessages)
      
      // Save assistant response
      await db.insert(messages).values({
        conversationId: convId,
        role: 'assistant',
        content: response,
      })
      
      // Update conversation timestamp
      await db.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, convId))
      
      return c.json({
        conversationId: convId,
        content: response,
      })
    } catch (error) {
      console.error('Chat error:', error)
      return c.json({ error: 'Failed to generate response' }, 500)
    }
  }
)

// ============================================
// POST /api/chat/stream - Streaming chat completion
// ============================================
chatRouter.post('/stream',
  authMiddleware,
  chatRateLimitMiddleware,
  zValidator('json', chatSchema),
  async (c) => {
    const user = c.get('user')
    const { conversationId, messages: inputMessages } = c.req.valid('json')
    
    // Get or create conversation
    let convId = conversationId
    
    if (!convId) {
      const firstUserMessage = inputMessages.find(m => m.role === 'user')?.content || 'New Chat'
      const title = await generateTitle(firstUserMessage)
      
      const [newConv] = await db.insert(conversations).values({
        userId: user.id,
        title,
      }).returning()
      
      convId = newConv.id
    }
    
    // Save user message
    const userMessage = inputMessages[inputMessages.length - 1]
    await db.insert(messages).values({
      conversationId: convId,
      role: userMessage.role,
      content: userMessage.content,
    })
    
    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullContent = ''
        
        try {
          // Send conversation ID first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`)
          )
          
          // Stream LLM response
          for await (const chunk of chatStream(inputMessages)) {
            fullContent += chunk
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
            )
          }
          
          // Save complete response
          await db.insert(messages).values({
            conversationId: convId!,
            role: 'assistant',
            content: fullContent,
          })
          
          // Update conversation timestamp
          await db.update(conversations)
            .set({ updatedAt: new Date() })
            .where(eq(conversations.id, convId!))
          
          // Signal completion
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`)
          )
        } finally {
          controller.close()
        }
      },
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }
)

export { chatRouter }
