import type { Database } from 'bun:sqlite'
import type { AuthContext } from '../auth/middleware'
import { generateToken, hashToken } from '../db/client'

export async function handleKeyRoutes(req: Request, db: Database, ctx: AuthContext): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // 1. GET /v1/keys
  if (method === 'GET' && path === '/v1/keys') {
    const keys = db.query(`
      SELECT id, label, token_tail, kind, created_at, last_used_at
      FROM api_keys
      WHERE workspace_id = ?
      ORDER BY created_at DESC
    `).all(ctx.workspaceId)

    return Response.json({ keys })
  }

  // 2. POST /v1/keys
  if (method === 'POST' && path === '/v1/keys') {
    const body = await req.json().catch(() => ({})) as any
    const label = (body.label || 'API Key').trim()
    const kind = body.kind === 'workspace' ? 'workspace' : 'personal'

    const rawToken = generateToken('bgy_live_')
    const tokenHash = hashToken(rawToken)
    const tokenTail = rawToken.slice(-6)
    const id = `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

    db.run(`
      INSERT INTO api_keys (id, user_id, workspace_id, label, token_hash, token_tail, kind)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, ctx.userId || null, ctx.workspaceId, label, tokenHash, tokenTail, kind])

    return Response.json({
      key: {
        id,
        label,
        token: rawToken, // ONLY displayed once on creation
        token_tail: tokenTail,
        kind,
        created_at: new Date().toISOString(),
      },
    }, { status: 201 })
  }

  const keyMatch = path.match(/^\/v1\/keys\/([a-zA-Z0-9_\-]+)$/)
  if (!keyMatch) return null
  const keyId = keyMatch[1]

  // 3. DELETE /v1/keys/:id
  if (method === 'DELETE') {
    const existing = db.query('SELECT id FROM api_keys WHERE id = ? AND workspace_id = ?').get(keyId, ctx.workspaceId)
    if (!existing) {
      return Response.json({ error: 'Key not found' }, { status: 404 })
    }

    db.run('DELETE FROM api_keys WHERE id = ?', [keyId])
    return Response.json({ success: true, id: keyId })
  }

  return null
}
