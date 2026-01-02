// Vercel Serverless Function Entry Point
import 'dotenv/config'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'

// Create a minimal app for Vercel
const app = new Hono().basePath('/api')

// CORS
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*'
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']
    if (allowedOrigins.includes(origin)) return origin
    if (origin.endsWith('.vercel.app')) return origin
    return null
  },
  credentials: true,
}))

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Root endpoint
app.get('/', (c) => {
  return c.json({ 
    name: 'Sable API',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/chat', '/api/search']
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found', path: c.req.path }, 404)
})

export const config = {
  runtime: 'nodejs',
}

export default handle(app)
