import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../db/schema'
import { env } from './env'

// Create Neon client
const sql = neon(env.DATABASE_URL)

// Create Drizzle ORM instance
export const db = drizzle(sql, { 
  schema,
  logger: env.NODE_ENV === 'development',
})

// Export type for use in other files
export type Database = typeof db
