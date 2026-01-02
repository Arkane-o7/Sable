// Tavily API Service for Web Search

const apiKey = import.meta.env.VITE_TAVILY_API_KEY || ''

console.log('Tavily API Key loaded:', apiKey ? `Yes (length: ${apiKey.length})` : 'No - MISSING!')

export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
}

export interface TavilyResponse {
  results: SearchResult[]
  query: string
}

export async function webSearch(query: string): Promise<SearchResult[]> {
  if (!apiKey) {
    console.error('Tavily API key not configured')
    return []
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: false,
        include_raw_content: false,
        max_results: 5,
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`)
    }

    const data: TavilyResponse = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Tavily search error:', error)
    return []
  }
}

export function formatSearchResultsForLLM(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.'
  }

  return results
    .map((result, index) => {
      return `[${index + 1}] ${result.title}\nURL: ${result.url}\n${result.content}\n`
    })
    .join('\n---\n')
}
