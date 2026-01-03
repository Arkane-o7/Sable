// Local development server entry point
// Run with: pnpm dev
import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './index'

const port = parseInt(process.env.PORT || '3001')

console.log(`🚀 Sable API starting on port ${port}`)

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server running at http://localhost:${info.port}`)
})
