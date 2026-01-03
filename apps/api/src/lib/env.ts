import { z } from 'zod'

// Environment validation
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  UPSTASH_REDIS_URL: z.string().url(),
  UPSTASH_REDIS_TOKEN: z.string().min(1),
  
  // Auth
  WORKOS_API_KEY: z.string().startsWith('sk_'),
  WORKOS_CLIENT_ID: z.string().startsWith('client_'),
  
  // LLM
  GROQ_API_KEY: z.string().startsWith('gsk_'),
  
  // Search (optional)
  TAVILY_API_KEY: z.string().optional(),
  
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

// Parse and validate environment
function getEnv(): Env {
  // In Vercel Edge runtime, process.env is populated from Vercel's environment
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors))
    
    // In development or when env vars are missing, use defaults
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev) {
      console.warn('⚠️ Running with missing env vars - using defaults')
      return {
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost/sable',
        UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL || 'http://localhost:6379',
        UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN || 'dev_token',
        WORKOS_API_KEY: process.env.WORKOS_API_KEY || 'sk_dev',
        WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID || 'client_dev',
        GROQ_API_KEY: process.env.GROQ_API_KEY || 'gsk_dev',
        TAVILY_API_KEY: process.env.TAVILY_API_KEY,
        PORT: process.env.PORT || '3001',
        NODE_ENV: 'development',
      }
    }
    
    throw new Error('Invalid environment variables')
  }
  
  return parsed.data
}

export const env = getEnv()
