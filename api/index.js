// Sable API - Vercel Serverless Functions
// All API routes in one file for simplicity

import Groq from 'groq-sdk'

// ============================================
// Initialize Services
// ============================================
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const SYSTEM_PROMPT = `You are Sable, a friendly and helpful AI assistant. You are:
- Concise and clear in your responses
- Helpful for quick tasks, questions, and productivity
- Friendly but professional
- Able to help with writing, coding, research, and general questions

Formatting guidelines:
- Use markdown formatting: **bold**, *italic*, \`inline code\`, and code blocks
- Use bullet points and numbered lists for clarity
- Keep responses relatively brief unless asked for details`

// ============================================
// CORS Headers
// ============================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// ============================================
// Route Handler
// ============================================
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname

  try {
    // ==================== Health Check ====================
    if (path === '/api/health' || path === '/health') {
      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      })
    }

    // ==================== Chat Endpoint ====================
    if (path === '/api/chat' && req.method === 'POST') {
      const { messages } = req.body

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array required' })
      }

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 4096,
      })

      const content = completion.choices[0]?.message?.content || ''
      
      return res.status(200).json({
        content,
        model: 'llama-3.3-70b-versatile',
      })
    }

    // ==================== Streaming Chat ====================
    if (path === '/api/chat/stream' && req.method === 'POST') {
      const { messages } = req.body

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array required' })
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`)
        }
      }

      res.write('data: [DONE]\n\n')
      return res.end()
    }

    // ==================== Web Search (Tavily) ====================
    if (path === '/api/search' && req.method === 'POST') {
      const { query } = req.body

      if (!query) {
        return res.status(400).json({ error: 'Query required' })
      }

      if (!process.env.TAVILY_API_KEY) {
        return res.status(500).json({ error: 'Search not configured' })
      }

      const searchResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          search_depth: 'basic',
          include_answer: true,
          max_results: 5,
        }),
      })

      if (!searchResponse.ok) {
        throw new Error('Search failed')
      }

      const data = await searchResponse.json()
      
      return res.status(200).json({
        query: data.query,
        answer: data.answer,
        results: data.results.map(r => ({
          title: r.title,
          url: r.url,
          content: r.content,
        })),
      })
    }

    // ==================== 404 ====================
    return res.status(404).json({ 
      error: 'Not found', 
      path,
      availableEndpoints: [
        'GET /api/health',
        'POST /api/chat',
        'POST /api/chat/stream',
        'POST /api/search',
      ]
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
