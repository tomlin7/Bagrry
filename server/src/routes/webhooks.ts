import type { Database } from 'bun:sqlite'
import type { AuthContext } from '../auth/middleware'

export async function handleWebhookRoutes(req: Request, db: Database, ctx: AuthContext): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // 1. GET /v1/webhooks
  if (method === 'GET' && path === '/v1/webhooks') {
    const webhooks = db.query(`
      SELECT id, workspace_id, url, events, active, created_at
      FROM webhooks
      WHERE workspace_id = ?
      ORDER BY created_at DESC
    `).all(ctx.workspaceId)

    return Response.json({ webhooks })
  }

  // 2. POST /v1/webhooks
  if (method === 'POST' && path === '/v1/webhooks') {
    const body = await req.json().catch(() => ({})) as any
    const targetUrl = (body.url || '').trim()
    if (!targetUrl) {
      return Response.json({ error: 'url is required' }, { status: 400 })
    }

    try {
      new URL(targetUrl)
    } catch {
      return Response.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const id = body.id || `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const events = body.events || 'note.enhanced'
    const secret = body.secret || null

    db.run(`
      INSERT INTO webhooks (id, workspace_id, url, events, secret, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [id, ctx.workspaceId, targetUrl, events, secret])

    const created = db.query('SELECT id, workspace_id, url, events, active, created_at FROM webhooks WHERE id = ?').get(id)
    return Response.json({ webhook: created }, { status: 201 })
  }

  const whMatch = path.match(/^\/v1\/webhooks\/([a-zA-Z0-9_\-]+)(\/.*)?$/)
  if (!whMatch) return null

  const webhookId = whMatch[1]
  const subRoute = whMatch[2] || ''

  // 3. DELETE /v1/webhooks/:id
  if (method === 'DELETE' && subRoute === '') {
    const existing = db.query('SELECT id FROM webhooks WHERE id = ? AND workspace_id = ?').get(webhookId, ctx.workspaceId)
    if (!existing) {
      return Response.json({ error: 'Webhook not found' }, { status: 404 })
    }

    db.run('DELETE FROM webhooks WHERE id = ?', [webhookId])
    return Response.json({ success: true, id: webhookId })
  }

  // 4. POST /v1/webhooks/:id/test
  if (method === 'POST' && subRoute === '/test') {
    const wh = db.query('SELECT * FROM webhooks WHERE id = ? AND workspace_id = ?').get(webhookId, ctx.workspaceId) as any
    if (!wh) {
      return Response.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const testPayload = {
      event: 'ping',
      timestamp: new Date().toISOString(),
      workspace_id: ctx.workspaceId,
      message: 'Bagrry Webhook Test Ping',
    }

    let status = 0
    let ok = false
    let responseText = ''

    try {
      const res = await fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bagrry-Event': 'ping',
          'User-Agent': 'Bagrry-Server/1.0.0',
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(5000),
      })
      status = res.status
      ok = res.ok
      responseText = await res.text().catch(() => '')
    } catch (err: any) {
      responseText = err?.message || 'Network error'
    }

    return Response.json({
      success: ok,
      status,
      response: responseText.slice(0, 500),
    })
  }

  return null
}

export function dispatchWebhook(db: Database, workspaceId: string, event: string, payload: any) {
  try {
    const webhooks = db.query(`
      SELECT url, secret, events
      FROM webhooks
      WHERE workspace_id = ? AND active = 1
    `).all(workspaceId) as Array<{ url: string; secret: string | null; events: string }>

    for (const wh of webhooks) {
      const subscribedEvents = wh.events.split(',').map((e) => e.trim())
      if (!subscribedEvents.includes('*') && !subscribedEvents.includes(event)) {
        continue
      }

      // Fire and forget
      fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bagrry-Event': event,
          'User-Agent': 'Bagrry-Server/1.0.0',
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      }).catch((err) => {
        console.warn(`[webhook] Failed to dispatch ${event} to ${wh.url}:`, err.message)
      })
    }
  } catch (err) {
    console.warn('[webhook] Dispatch error:', err)
  }
}
