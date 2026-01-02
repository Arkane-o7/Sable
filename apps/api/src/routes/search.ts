import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { searchRateLimitMiddleware } from '../middleware/rateLimit'
import { searchWeb } from '../services/search'
import { env } from '../lib/env'

const searchRouter = new Hono()

// Request validation
const searchSchema = z.object({
  query: z.string().min(1).max(500),
})

// ============================================
// POST /api/search - Web search
// ============================================
searchRouter.post('/',
  authMiddleware,
  searchRateLimitMiddleware,
  zValidator('json', searchSchema),
  async (c) => {
    const { query } = c.req.valid('json')
    
    // Check if Tavily is configured
    if (!env.TAVILY_API_KEY) {
      return c.json({ 
        error: 'Search not configured',
        message: 'Tavily API key is not set'
      }, 503)
    }
    
    try {
      const results = await searchWeb(query)
      return c.json(results)
    } catch (error) {
      console.error('Search error:', error)
      return c.json({ error: 'Search failed' }, 500)
    }
  }
)

export { searchRouter }
