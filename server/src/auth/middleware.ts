import type { Database } from 'bun:sqlite'
import { hashToken } from '../db/client'

export interface AuthContext {
  userId?: string
  workspaceId: string
  keyId?: string
  keyKind?: 'personal' | 'workspace'
}

export function verifyRequestAuth(req: Request, db: Database): { authorized: boolean; ctx?: AuthContext; error?: string } {
  const url = new URL(req.url)
  const path = url.pathname

  // 1. Unconditionally Public Endpoints
  if (
    req.method === 'OPTIONS' ||
    path === '/' ||
    path === '/health' ||
    path === '/v1/status' ||
    path.startsWith('/s/') ||
    path.startsWith('/v1/shares/')
  ) {
    return { authorized: true, ctx: { workspaceId: 'ws_default' } }
  }

  // 2. Extract Authorization Header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    // Check if any keys exist in DB. If no keys exist at all, allow loopback for initial setup
    const keyCount = db.query('SELECT COUNT(*) as count FROM api_keys').get() as { count: number }
    if (keyCount.count === 0) {
      return { authorized: true, ctx: { workspaceId: 'ws_default' } }
    }
    return { authorized: false, error: 'Missing Authorization header with Bearer token' }
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return { authorized: false, error: 'Invalid Authorization header format. Expected "Bearer <token>"' }
  }

  const token = match[1].trim()
  const hashed = hashToken(token)

  // 3. Constant-time lookup & validation
  const keyRecord = db.query(`
    SELECT id, user_id, workspace_id, kind, token_hash
    FROM api_keys
    WHERE token_hash = ?
  `).get(hashed) as { id: string; user_id: string | null; workspace_id: string; kind: 'personal' | 'workspace'; token_hash: string } | null

  if (!keyRecord) {
    return { authorized: false, error: 'Invalid or revoked API key' }
  }

  // Constant-time comparison
  const a = Buffer.from(keyRecord.token_hash, 'hex')
  const b = Buffer.from(hashed, 'hex')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { authorized: false, error: 'Invalid API key credentials' }
  }

  // Update last_used_at timestamp
  db.run('UPDATE api_keys SET last_used_at = ? WHERE id = ?', [new Date().toISOString(), keyRecord.id])

  return {
    authorized: true,
    ctx: {
      userId: keyRecord.user_id || undefined,
      workspaceId: keyRecord.workspace_id,
      keyId: keyRecord.id,
      keyKind: keyRecord.kind,
    },
  }
}
