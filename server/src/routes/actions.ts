import type { Database } from 'bun:sqlite'
import type { AuthContext } from '../auth/middleware'

export async function handleActionRoutes(req: Request, db: Database, ctx: AuthContext): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // 1. GET /v1/action-items
  if (method === 'GET' && path === '/v1/action-items') {
    const noteId = url.searchParams.get('note_id')
    const completedParam = url.searchParams.get('done') ?? url.searchParams.get('completed')

    let sql = `
      SELECT a.*, n.title as note_title
      FROM action_items a
      LEFT JOIN notes n ON n.id = a.note_id
      WHERE (n.workspace_id = ? OR n.workspace_id IS NULL)
    `
    const params: any[] = [ctx.workspaceId]

    if (noteId) {
      sql += ' AND a.note_id = ?'
      params.push(noteId)
    }

    if (completedParam !== null) {
      const isDone = completedParam === 'true' || completedParam === '1' ? 1 : 0
      sql += ' AND a.done = ?'
      params.push(isDone)
    }

    sql += ' ORDER BY a.created_at DESC'
    const items = db.query(sql).all(...params)

    return Response.json({ action_items: items, count: items.length })
  }

  // 2. POST /v1/action-items
  if (method === 'POST' && path === '/v1/action-items') {
    const body = await req.json().catch(() => ({})) as any
    const task = (body.task || '').trim()
    if (!task) {
      return Response.json({ error: 'Task description is required' }, { status: 400 })
    }

    const id = body.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const noteId = body.note_id || null
    const owner = body.owner || null
    const deadline = body.deadline || null
    const done = body.done ? 1 : 0

    db.run(`
      INSERT INTO action_items (id, note_id, task, owner, deadline, done)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, noteId, task, owner, deadline, done])

    const created = db.query('SELECT * FROM action_items WHERE id = ?').get(id)
    return Response.json({ action_item: created }, { status: 201 })
  }

  const actionMatch = path.match(/^\/v1\/action-items\/([a-zA-Z0-9_\-]+)$/)
  if (!actionMatch) return null
  const actionId = actionMatch[1]

  // 3. PATCH /v1/action-items/:id
  if (method === 'PATCH') {
    const body = await req.json().catch(() => ({})) as any
    const existing = db.query('SELECT * FROM action_items WHERE id = ?').get(actionId)
    if (!existing) {
      return Response.json({ error: 'Action item not found' }, { status: 404 })
    }

    const updates: string[] = []
    const params: any[] = []

    if (body.task !== undefined) {
      updates.push('task = ?')
      params.push(body.task.trim())
    }
    if (body.owner !== undefined) {
      updates.push('owner = ?')
      params.push(body.owner)
    }
    if (body.deadline !== undefined) {
      updates.push('deadline = ?')
      params.push(body.deadline)
    }
    if (body.done !== undefined) {
      updates.push('done = ?')
      params.push(body.done ? 1 : 0)
    }

    if (updates.length > 0) {
      params.push(actionId)
      db.run(`UPDATE action_items SET ${updates.join(', ')} WHERE id = ?`, params)
    }

    const updated = db.query('SELECT * FROM action_items WHERE id = ?').get(actionId)
    return Response.json({ action_item: updated })
  }

  // 4. DELETE /v1/action-items/:id
  if (method === 'DELETE') {
    const existing = db.query('SELECT id FROM action_items WHERE id = ?').get(actionId)
    if (!existing) {
      return Response.json({ error: 'Action item not found' }, { status: 404 })
    }

    db.run('DELETE FROM action_items WHERE id = ?', [actionId])
    return Response.json({ success: true, id: actionId })
  }

  return null
}
