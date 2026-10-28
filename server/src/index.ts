import { Database } from 'bun:sqlite'
import { CONFIG } from './config'
import { getDatabase } from './db/client'
import { verifyRequestAuth, type AuthContext } from './auth/middleware'
import { handleNotesRoutes } from './routes/notes'
import { handleShareRoutes } from './routes/shares'
import { handleFolderRoutes } from './routes/folders'
import { handleActionRoutes } from './routes/actions'
import { handleDirectoryRoutes } from './routes/directory'
import { handleSearchRoutes } from './routes/search'
import { handleWebhookRoutes } from './routes/webhooks'
import { handleKeyRoutes } from './routes/keys'
import { handleMcpRequest } from './mcp/server'

export function createServer(customDb?: Database, customPort?: number) {
  const db = customDb || getDatabase()
  const startTime = Date.now()
  const port = customPort !== undefined ? customPort : CONFIG.port

  const server = Bun.serve({
    port,
    hostname: CONFIG.host,
    async fetch(req: Request) {
      const url = new URL(req.url)
      const path = url.pathname
      const method = req.method

      // 1. CORS Preflight
      if (method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: getCorsHeaders(),
        })
      }

      // 2. Health & Root Check (Public)
      if (path === '/' || path === '/health' || path === '/v1/status') {
        return withCors(Response.json({
          status: 'ok',
          app: CONFIG.appName,
          version: CONFIG.version,
          uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
          database: 'connected',
        }))
      }

      // 3. Public Web Shares (and Share Chat)
      // Note: handleShareRoutes handles both public /s/:token, /v1/shares/:token and authenticated share creation
      if (path.startsWith('/s/') || (path.startsWith('/v1/shares/') && method === 'GET') || (path.startsWith('/v1/shares/') && path.endsWith('/chat'))) {
        const shareRes = await handleShareRoutes(req, db)
        if (shareRes) return withCors(shareRes)
      }

      // 4. MCP Protocol Endpoints (supports Bearer token or local loopback)
      if ((path === '/mcp' || path === '/v1/mcp') && method === 'POST') {
        const auth = verifyRequestAuth(req, db)
        const wsId = auth.ctx?.workspaceId || 'ws_default'
        const mcpRes = await handleMcpRequest(req, db, wsId)
        return withCors(mcpRes)
      }

      // 5. Auth Middleware for all other API endpoints
      const auth = verifyRequestAuth(req, db)
      if (!auth.authorized) {
        return withCors(Response.json({ error: auth.error || 'Unauthorized' }, { status: 401 }))
      }

      const ctx: AuthContext = auth.ctx!

      // 6. Authenticated Share Routes (e.g. POST /v1/shares, DELETE /v1/shares/:token)
      if (path.startsWith('/v1/shares')) {
        const shareRes = await handleShareRoutes(req, db, ctx)
        if (shareRes) return withCors(shareRes)
      }

      // 7. Notes Routes
      const noteRes = await handleNotesRoutes(req, db, ctx)
      if (noteRes) return withCors(noteRes)

      // 8. Folders Routes
      const folderRes = await handleFolderRoutes(req, db, ctx)
      if (folderRes) return withCors(folderRes)

      // 9. Action Items Routes
      const actionRes = await handleActionRoutes(req, db, ctx)
      if (actionRes) return withCors(actionRes)

      // 10. Directory Routes (People & Companies)
      const dirRes = await handleDirectoryRoutes(req, db, ctx)
      if (dirRes) return withCors(dirRes)

      // 11. Search Routes
      const searchRes = await handleSearchRoutes(req, db, ctx)
      if (searchRes) return withCors(searchRes)

      // 12. Webhooks Routes
      const whRes = await handleWebhookRoutes(req, db, ctx)
      if (whRes) return withCors(whRes)

      // 13. API Keys Routes
      const keyRes = await handleKeyRoutes(req, db, ctx)
      if (keyRes) return withCors(keyRes)

      // 14. Workspace Info
      if (method === 'GET' && path === '/v1/workspace') {
        const ws = db.query('SELECT * FROM workspaces WHERE id = ?').get(ctx.workspaceId)
        return withCors(Response.json({ workspace: ws }))
      }

      // 15. Feedbacks
      if (method === 'POST' && path === '/v1/feedback') {
        const body = await req.json().catch(() => ({})) as any
        const kind = body.kind || 'general'
        const text = (body.body || '').trim()
        if (!text) {
          return withCors(Response.json({ error: 'body is required' }, { status: 400 }))
        }
        const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        db.run('INSERT INTO feedbacks (id, kind, body) VALUES (?, ?, ?)', [id, kind, text])
        return withCors(Response.json({ success: true, id }, { status: 201 }))
      }

      // 404 Route
      return withCors(Response.json({ error: `Not found: ${method} ${path}` }, { status: 404 }))
    },
  })

  return server
}

function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bagrry-Event',
  }
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bagrry-Event')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// Start daemon if executed directly
if (import.meta.main) {
  const server = createServer()
  console.log(`\n======================================================`)
  console.log(`🚀 Bagrry Server daemon active`)
  console.log(`📍 Endpoint: http://${server.hostname}:${server.port}`)
  console.log(`📚 Public shares: http://${server.hostname}:${server.port}/s/:token`)
  console.log(`🤖 MCP Protocol: http://${server.hostname}:${server.port}/mcp`)
  console.log(`======================================================\n`)
}
