import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { chatRouter } from './routes/chat'
import { conversationsRouter } from './routes/conversations'
import { searchRouter } from './routes/search'
import { userRouter } from './routes/user'

// Create app
const app = new Hono().basePath('/api')

// Global middleware
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*'
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://localhost:3000',
    ]
    if (allowedOrigins.includes(origin)) return origin
    if (origin.endsWith('.vercel.app')) return origin
    return '*'
  },
  credentials: true,
}))

// Health check (at /api/health)
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Mount routers (now at /api/chat, /api/conversations, etc.)
app.route('/chat', chatRouter)
app.route('/conversations', conversationsRouter)
app.route('/search', searchRouter)
app.route('/user', userRouter)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// Export for Vercel
export default app

// For local development with Node.js (only runs when executed directly, not imported)
// Use: pnpm dev in apps/api to start local server
