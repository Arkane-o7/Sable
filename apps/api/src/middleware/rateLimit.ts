import { createMiddleware } from 'hono/factory'
import { chatRatelimit, searchRatelimit } from '../lib/redis'

/**
 * Rate limiting middleware for chat endpoints
 * 30 requests per minute per user
 */
export const chatRateLimitMiddleware = createMiddleware(async (c, next) => {
  const user = c.get('user')
  const identifier = user?.id || c.req.header('x-forwarded-for') || 'anonymous'
  
  const { success, limit, remaining, reset } = await chatRatelimit.limit(identifier)
  
  // Add rate limit headers
  c.header('X-RateLimit-Limit', limit.toString())
  c.header('X-RateLimit-Remaining', remaining.toString())
  c.header('X-RateLimit-Reset', reset.toString())
  
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    c.header('Retry-After', retryAfter.toString())
    
    return c.json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }, 429)
  }
  
  await next()
})

/**
 * Rate limiting middleware for search endpoints
 * 100 requests per minute per user
 */
export const searchRateLimitMiddleware = createMiddleware(async (c, next) => {
  const user = c.get('user')
  const identifier = user?.id || c.req.header('x-forwarded-for') || 'anonymous'
  
  const { success, limit, remaining, reset } = await searchRatelimit.limit(identifier)
  
  c.header('X-RateLimit-Limit', limit.toString())
  c.header('X-RateLimit-Remaining', remaining.toString())
  c.header('X-RateLimit-Reset', reset.toString())
  
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    c.header('Retry-After', retryAfter.toString())
    
    return c.json({
      error: 'Too many requests',
      message: 'Search rate limit exceeded. Please try again later.',
      retryAfter,
    }, 429)
  }
  
  await next()
})
