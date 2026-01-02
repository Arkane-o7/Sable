import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { db } from '../lib/db'
import { users, preferences } from '../db/schema'
import { eq } from 'drizzle-orm'

const userRouter = new Hono()

// ============================================
// GET /api/user - Get current user
// ============================================
userRouter.get('/',
  authMiddleware,
  async (c) => {
    const user = c.get('user')
    
    // Get full user with preferences
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    })
    
    const userPrefs = await db.query.preferences.findFirst({
      where: eq(preferences.userId, user.id),
    })
    
    return c.json({
      id: dbUser?.id,
      email: dbUser?.email,
      name: dbUser?.name,
      avatarUrl: dbUser?.avatarUrl,
      preferences: userPrefs || {
        theme: 'dark',
        defaultModel: 'llama-3.3-70b-versatile',
        shortcuts: {},
      },
    })
  }
)

// ============================================
// PUT /api/user/preferences - Update preferences
// ============================================
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  defaultModel: z.string().optional(),
  shortcuts: z.record(z.string()).optional(),
})

userRouter.put('/preferences',
  authMiddleware,
  zValidator('json', preferencesSchema),
  async (c) => {
    const user = c.get('user')
    const updates = c.req.valid('json')
    
    // Upsert preferences
    const existing = await db.query.preferences.findFirst({
      where: eq(preferences.userId, user.id),
    })
    
    if (existing) {
      await db.update(preferences)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(preferences.userId, user.id))
    } else {
      await db.insert(preferences).values({
        userId: user.id,
        ...updates,
      })
    }
    
    return c.json({ success: true })
  }
)

// ============================================
// PATCH /api/user - Update profile
// ============================================
const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

userRouter.patch('/',
  authMiddleware,
  zValidator('json', profileSchema),
  async (c) => {
    const user = c.get('user')
    const { name } = c.req.valid('json')
    
    await db.update(users)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
    
    return c.json({ success: true })
  }
)

export { userRouter }
