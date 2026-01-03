// Vercel Serverless Function Entry Point
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'

// Create minimal app for Vercel to test connectivity
const app = new Hono().basePath('/api')

// CORS
app.use('*', cors({
  origin: '*',
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
    status: 'minimal mode - testing'
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
