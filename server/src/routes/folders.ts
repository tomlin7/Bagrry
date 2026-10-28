import type { Database } from 'bun:sqlite'
import type { AuthContext } from '../auth/middleware'

export async function handleFolderRoutes(req: Request, db: Database, ctx: AuthContext): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // 1. GET /v1/folders
  if (method === 'GET' && path === '/v1/folders') {
    const folders = db.query(`
      SELECT f.*,
        (SELECT COUNT(*) FROM notes WHERE folder_id = f.id) as note_count
      FROM folders f
      WHERE f.workspace_id = ?
      ORDER BY f.created_at ASC
    `).all(ctx.workspaceId)

    return Response.json({ folders })
  }

  // 2. POST /v1/folders
  if (method === 'POST' && path === '/v1/folders') {
    const body = await req.json().catch(() => ({})) as any
    const name = (body.name || '').trim()
    if (!name) {
      return Response.json({ error: 'Folder name is required' }, { status: 400 })
    }

    const id = body.id || `fld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const icon = body.icon || 'folder'
    const isShared = body.is_shared ? 1 : 0
    const parentId = body.parent_id || null

    db.run(`
      INSERT INTO folders (id, workspace_id, parent_id, name, is_shared, icon)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, ctx.workspaceId, parentId, name, isShared, icon])

    const created = db.query('SELECT * FROM folders WHERE id = ?').get(id)
    return Response.json({ folder: created }, { status: 201 })
  }

  const folderMatch = path.match(/^\/v1\/folders\/([a-zA-Z0-9_\-]+)$/)
  if (!folderMatch) return null
  const folderId = folderMatch[1]

  // 3. PATCH /v1/folders/:id
  if (method === 'PATCH') {
    const body = await req.json().catch(() => ({})) as any
    const existing = db.query('SELECT id FROM folders WHERE id = ? AND workspace_id = ?').get(folderId, ctx.workspaceId)
    if (!existing) {
      return Response.json({ error: 'Folder not found' }, { status: 404 })
    }

    const updates: string[] = []
    const params: any[] = []

    if (body.name !== undefined) {
      updates.push('name = ?')
      params.push(body.name.trim())
    }
    if (body.icon !== undefined) {
      updates.push('icon = ?')
      params.push(body.icon)
    }
    if (body.is_shared !== undefined) {
      updates.push('is_shared = ?')
      params.push(body.is_shared ? 1 : 0)
    }

    if (updates.length > 0) {
      params.push(folderId)
      db.run(`UPDATE folders SET ${updates.join(', ')} WHERE id = ?`, params)
    }

    const updated = db.query('SELECT * FROM folders WHERE id = ?').get(folderId)
    return Response.json({ folder: updated })
  }

  // 4. DELETE /v1/folders/:id
  if (method === 'DELETE') {
    const existing = db.query('SELECT id FROM folders WHERE id = ? AND workspace_id = ?').get(folderId, ctx.workspaceId)
    if (!existing) {
      return Response.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Set notes under this folder to null folder
    db.run('UPDATE notes SET folder_id = NULL WHERE folder_id = ?', [folderId])
    db.run('DELETE FROM folders WHERE id = ?', [folderId])
    return Response.json({ success: true, id: folderId })
  }

  return null
}
