// Vercel Serverless Function Entry Point
// This imports the full API from apps/api and exposes it as a Vercel function
import { handle } from 'hono/vercel'
import app from '../apps/api/src/index'

export default handle(app)
