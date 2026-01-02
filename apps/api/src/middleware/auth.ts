import { createMiddleware } from 'hono/factory'
import { WorkOS } from '@workos-inc/node'
import { env } from '../lib/env'
import { db } from '../lib/db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

// Initialize WorkOS
const workos = new WorkOS(env.WORKOS_API_KEY)

// User type in context
export interface AuthUser {
  id: string
  workosId: string
  email: string
  name: string | null
}

// Extend Hono context
declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser
  }
}

interface JWTPayload {
  sub: string
  email?: string
  first_name?: string
  last_name?: string
  profile_picture_url?: string
  [key: string]: unknown
}

/**
 * Decode JWT token payload (without verification for dev)
 * In production, use proper JWT verification with WorkOS
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload as JWTPayload
  } catch {
    return null
  }
}

/**
 * Authentication middleware
 * Verifies JWT token from WorkOS and attaches user to context
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  // Extract token from Authorization header
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }
  
  const token = authHeader.slice(7)
  
  if (!token) {
    return c.json({ error: 'Invalid token format' }, 401)
  }

  try {
    // Decode JWT payload
    // In production, verify the JWT signature with WorkOS JWKS
    const payload = decodeJWT(token)
    
    if (!payload || !payload.sub) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    // Get or create user in our database
    let dbUser = await db.query.users.findFirst({
      where: eq(users.workosId, payload.sub),
    })

    if (!dbUser) {
      // Create new user
      const [newUser] = await db.insert(users).values({
        workosId: payload.sub,
        email: payload.email || 'unknown@sable.app',
        name: payload.first_name 
          ? `${payload.first_name} ${payload.last_name || ''}`.trim()
          : null,
        avatarUrl: payload.profile_picture_url || null,
      }).returning()
      
      dbUser = newUser
    }

    // Attach user to context
    c.set('user', {
      id: dbUser.id,
      workosId: dbUser.workosId,
      email: dbUser.email,
      name: dbUser.name,
    })

    await next()
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
})

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for public endpoints that behave differently for authenticated users
 */
export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    await next()
    return
  }
  
  // Try to authenticate, but don't fail if it doesn't work
  try {
    const token = authHeader.slice(7)
    const payload = JSON.parse(atob(token.split('.')[1]))
    
    const dbUser = await db.query.users.findFirst({
      where: eq(users.workosId, payload.sub || token),
    })
    
    if (dbUser) {
      c.set('user', {
        id: dbUser.id,
        workosId: dbUser.workosId,
        email: dbUser.email,
        name: dbUser.name,
      })
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  
  await next()
})
