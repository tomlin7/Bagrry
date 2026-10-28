import type { Database } from 'bun:sqlite'
import type { AuthContext } from '../auth/middleware'
import { generateToken } from '../db/client'
import { renderShareHtml, type ShareViewData } from '../views/share-html'
import { answerQuestion, type Segment } from '../ai/enhancer'

export async function handleShareRoutes(req: Request, db: Database, ctx?: AuthContext): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // 1. GET /s/:token (Public HTML Page)
  const sMatch = path.match(/^\/s\/([a-zA-Z0-9_\-]+)$/)
  if (method === 'GET' && sMatch) {
    const token = sMatch[1]
    const share = db.query('SELECT * FROM share_links WHERE token = ?').get(token) as any
    if (!share) {
      return new Response(renderNotFoundHtml('Share link not found or expired'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
      return new Response(renderNotFoundHtml('This share link has expired'), {
        status: 410,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // Increment view count
    db.run('UPDATE share_links SET views_count = views_count + 1 WHERE id = ?', [share.id])

    const snapshot = JSON.parse(share.snapshot_json) as ShareViewData
    const html = renderShareHtml({
      ...snapshot,
      shareToken: token,
    })

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=30',
      },
    })
  }

  // 2. GET /v1/shares/:token (Public JSON snapshot)
  const shareJsonMatch = path.match(/^\/v1\/shares\/([a-zA-Z0-9_\-]+)$/)
  if (method === 'GET' && shareJsonMatch) {
    const token = shareJsonMatch[1]
    const share = db.query('SELECT * FROM share_links WHERE token = ?').get(token) as any
    if (!share) {
      return Response.json({ error: 'Share link not found' }, { status: 404 })
    }

    if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
      return Response.json({ error: 'Share link expired' }, { status: 410 })
    }

    db.run('UPDATE share_links SET views_count = views_count + 1 WHERE id = ?', [share.id])
    const snapshot = JSON.parse(share.snapshot_json)

    return Response.json({
      token: share.token,
      is_public: Boolean(share.is_public),
      views_count: share.views_count + 1,
      snapshot,
    })
  }

  // 3. POST /v1/shares/:token/chat (Public interactive Q&A against shared meeting)
  const shareChatMatch = path.match(/^\/v1\/shares\/([a-zA-Z0-9_\-]+)\/chat$/)
  if (method === 'POST' && shareChatMatch) {
    const token = shareChatMatch[1]
    const share = db.query('SELECT * FROM share_links WHERE token = ?').get(token) as any
    if (!share) {
      return Response.json({ error: 'Share link not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({})) as any
    const question = (body.question || '').trim()
    if (!question) {
      return Response.json({ error: 'Question is required' }, { status: 400 })
    }

    const snapshot = JSON.parse(share.snapshot_json) as ShareViewData
    const segments: Segment[] = (snapshot.transcriptSegments || []).map((s) => ({
      sentence_id: s.sentence_id,
      speaker: s.speaker,
      text: s.text,
    }))

    const enhancedNotesStr = JSON.stringify(snapshot.enhancedDoc || {})
    const result = await answerQuestion(question, snapshot.title, enhancedNotesStr, segments)

    return Response.json(result)
  }

  // 4. POST /v1/shares (Authenticated: Create a new share link)
  if (method === 'POST' && path === '/v1/shares') {
    if (!ctx) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as any
    const noteId = body.note_id
    if (!noteId) {
      return Response.json({ error: 'note_id is required' }, { status: 400 })
    }

    const note = db.query('SELECT * FROM notes WHERE id = ? AND workspace_id = ?').get(noteId, ctx.workspaceId) as any
    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    const ws = db.query('SELECT name FROM workspaces WHERE id = ?').get(ctx.workspaceId) as any
    const segments = db.query(`
      SELECT id, speaker, start_ms, end_ms, text, sentence_id
      FROM transcript_segments
      WHERE note_id = ?
      ORDER BY start_ms ASC
    `).all(noteId) as any[]

    const enhancedDoc = note.enhanced_notes_json ? JSON.parse(note.enhanced_notes_json) : null

    const token = generateToken('bgy_sh_')
    const shareId = `sh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

    let expiresAt: string | null = null
    if (body.expires_in_days) {
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + parseInt(body.expires_in_days, 10))
      expiresAt = expDate.toISOString()
    }

    const snapshotData: ShareViewData = {
      title: note.title,
      date: note.date,
      durationMinutes: Math.round((note.duration_ms || 0) / 60000),
      workspaceName: ws?.name || 'Bagrry Workspace',
      attendees: ['Alex Rivera', 'Sarah Chen'],
      enhancedDoc,
      scratchpad: note.scratchpad_raw || '',
      transcriptSegments: segments,
      shareToken: token,
    }

    db.run(`
      INSERT INTO share_links (id, note_id, token, is_public, views_count, snapshot_json, expires_at)
      VALUES (?, ?, ?, 1, 0, ?, ?)
    `, [shareId, noteId, token, JSON.stringify(snapshotData), expiresAt])

    const host = req.headers.get('host') || '127.0.0.1:47821'
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const publicUrl = `${proto}://${host}/s/${token}`

    return Response.json({
      success: true,
      share_id: shareId,
      token,
      url: publicUrl,
      expires_at: expiresAt,
    }, { status: 201 })
  }

  // 5. DELETE /v1/shares/:token (Authenticated: Revoke share link)
  if (method === 'DELETE' && shareJsonMatch) {
    if (!ctx) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = shareJsonMatch[1]
    const share = db.query(`
      SELECT sl.id
      FROM share_links sl
      JOIN notes n ON n.id = sl.note_id
      WHERE sl.token = ? AND n.workspace_id = ?
    `).get(token, ctx.workspaceId) as any

    if (!share) {
      return Response.json({ error: 'Share link not found' }, { status: 404 })
    }

    db.run('DELETE FROM share_links WHERE id = ?', [share.id])
    return Response.json({ success: true, token })
  }

  return null
}

function renderNotFoundHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Not Found · Bagrry</title>
  <style>
    body {
      background: #252523;
      color: #e5e5e0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    h1 { font-size: 24px; margin-bottom: 8px; }
    p { color: #a1a19a; }
  </style>
</head>
<body>
  <h1>404 · Link Unavailable</h1>
  <p>${message}</p>
</body>
</html>`
}
