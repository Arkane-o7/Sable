import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { db } from '../lib/db'
import { conversations, messages } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'

const conversationsRouter = new Hono()

// ============================================
// GET /api/conversations - List user's conversations
// ============================================
conversationsRouter.get('/',
  authMiddleware,
  async (c) => {
    const user = c.get('user')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    
    const userConversations = await db.query.conversations.findMany({
      where: eq(conversations.userId, user.id),
      orderBy: desc(conversations.updatedAt),
      limit,
      offset,
    })
    
    return c.json({
      conversations: userConversations,
      limit,
      offset,
    })
  }
)

// ============================================
// GET /api/conversations/:id - Get single conversation with messages
// ============================================
conversationsRouter.get('/:id',
  authMiddleware,
  async (c) => {
    const user = c.get('user')
    const conversationId = c.req.param('id')
    
    // Get conversation
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, user.id)
      ),
    })
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404)
    }
    
    // Get messages
    const conversationMessages = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: messages.createdAt,
    })
    
    return c.json({
      ...conversation,
      messages: conversationMessages,
    })
  }
)

// ============================================
// POST /api/conversations - Create new conversation
// ============================================
const createConversationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
})

conversationsRouter.post('/',
  authMiddleware,
  zValidator('json', createConversationSchema),
  async (c) => {
    const user = c.get('user')
    const { title } = c.req.valid('json')
    
    const [newConversation] = await db.insert(conversations).values({
      userId: user.id,
      title: title || 'New Chat',
    }).returning()
    
    return c.json(newConversation, 201)
  }
)

// ============================================
// PATCH /api/conversations/:id - Update conversation
// ============================================
const updateConversationSchema = z.object({
  title: z.string().min(1).max(100),
})

conversationsRouter.patch('/:id',
  authMiddleware,
  zValidator('json', updateConversationSchema),
  async (c) => {
    const user = c.get('user')
    const conversationId = c.req.param('id')
    const { title } = c.req.valid('json')
    
    // Verify ownership
    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, user.id)
      ),
    })
    
    if (!existing) {
      return c.json({ error: 'Conversation not found' }, 404)
    }
    
    // Update
    const [updated] = await db.update(conversations)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning()
    
    return c.json(updated)
  }
)

// ============================================
// DELETE /api/conversations/:id - Delete conversation
// ============================================
conversationsRouter.delete('/:id',
  authMiddleware,
  async (c) => {
    const user = c.get('user')
    const conversationId = c.req.param('id')
    
    // Verify ownership
    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, user.id)
      ),
    })
    
    if (!existing) {
      return c.json({ error: 'Conversation not found' }, 404)
    }
    
    // Delete (messages cascade automatically)
    await db.delete(conversations)
      .where(eq(conversations.id, conversationId))
    
    return c.json({ success: true })
  }
)

// ============================================
// DELETE /api/conversations - Delete all conversations
// ============================================
conversationsRouter.delete('/',
  authMiddleware,
  async (c) => {
    const user = c.get('user')
    const confirm = c.req.query('confirm')
    
    if (confirm !== 'true') {
      return c.json({ 
        error: 'Confirmation required',
        message: 'Add ?confirm=true to delete all conversations'
      }, 400)
    }
    
    await db.delete(conversations)
      .where(eq(conversations.userId, user.id))
    
    return c.json({ success: true })
  }
)

export { conversationsRouter }
