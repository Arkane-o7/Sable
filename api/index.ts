// Super minimal Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url || '/'
  
  if (path.includes('/health')) {
    return res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  }
  
  return res.json({ 
    name: 'Sable API',
    version: '1.0.0',
    path: path
  })
}
