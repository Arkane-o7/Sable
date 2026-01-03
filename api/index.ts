// Vercel Serverless Function - Self-contained minimal API
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'

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

// Root
app.get('/', (c) => {
  return c.json({ 
    name: 'Sable API',
    version: '1.0.0'
  })
})

// 404
app.notFound((c) => {
  return c.json({ error: 'Not found', path: c.req.path }, 404)
})

export default handle(app)
