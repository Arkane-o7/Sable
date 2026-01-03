// Super minimal - no imports, no TypeScript
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    path: req.url
  })
}
