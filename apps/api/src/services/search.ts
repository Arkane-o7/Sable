import { env } from '../lib/env'
import type { SearchResponse, SearchResult } from '@sable/types'

const TAVILY_API_URL = 'https://api.tavily.com/search'

interface TavilyResponse {
  query: string
  answer?: string
  results: Array<{
    title: string
    url: string
    content: string
    score: number
  }>
}

/**
 * Search the web using Tavily API
 */
export async function searchWeb(query: string): Promise<SearchResponse> {
  if (!env.TAVILY_API_KEY) {
    throw new Error('Tavily API key not configured')
  }

  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: env.TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      include_answer: true,
      include_raw_content: false,
      max_results: 5,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Tavily API error: ${error}`)
  }

  const data: TavilyResponse = await response.json()

  return {
    query: data.query,
    answer: data.answer,
    results: data.results.map((r): SearchResult => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  }
}

/**
 * Search and format results for LLM context
 */
export async function searchForContext(query: string): Promise<string> {
  const results = await searchWeb(query)
  
  if (results.results.length === 0) {
    return 'No search results found.'
  }

  let context = `Web search results for "${query}":\n\n`
  
  if (results.answer) {
    context += `Summary: ${results.answer}\n\n`
  }

  results.results.forEach((result, i) => {
    context += `[${i + 1}] ${result.title}\n`
    context += `URL: ${result.url}\n`
    context += `${result.content}\n\n`
  })

  return context
}
