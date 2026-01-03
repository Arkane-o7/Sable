// Vercel Serverless Function Entry Point
// This imports the full API from apps/api and exposes it as a Vercel function
import { handle } from 'hono/vercel'
import app from '../apps/api/src/index'

export const config = {
  runtime: 'edge',
}

export default handle(app)
