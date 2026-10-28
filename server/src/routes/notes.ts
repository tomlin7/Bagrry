import type { Database } from 'bun:sqlite'
import type { AuthContext } from '../auth/middleware'
import { enhanceNote, generateRecipe, type Segment } from '../ai/enhancer'
import { dispatchWebhook } from './webhooks'

export async function handleNotesRoutes(req: Request, db: Database, ctx: AuthContext): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // 1. GET /v1/notes
  if (method === 'GET' && path === '/v1/notes') {
    const folderId = url.searchParams.get('folder_id')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    let sql = `
      SELECT n.*, f.name as folder_name,
        (SELECT COUNT(*) FROM action_items WHERE note_id = n.id AND done = 0) as pending_actions_count,
        (SELECT COUNT(*) FROM transcript_segments WHERE note_id = n.id) as transcript_segments_count
      FROM notes n
      LEFT JOIN folders f ON f.id = n.folder_id
      WHERE n.workspace_id = ?
    `
    const params: any[] = [ctx.workspaceId]

    if (folderId) {
      sql += ' AND n.folder_id = ?'
      params.push(folderId)
    }

    sql += ' ORDER BY n.date DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const rows = db.query(sql).all(...params) as any[]
    const notes = rows.map((r) => ({
      ...r,
      enhanced_notes: r.enhanced_notes_json ? safeJsonParse(r.enhanced_notes_json) : null,
    }))

    return Response.json({ notes, total: notes.length })
  }

  // 2. POST /v1/notes (Create Note)
  if (method === 'POST' && path === '/v1/notes') {
    const body = await req.json().catch(() => ({})) as any
    const id = body.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const title = (body.title || 'Untitled Meeting').trim()
    const folderId = body.folder_id || null
    const date = body.date || new Date().toISOString()
    const durationMs = body.duration_ms || 0
    const scratchpad = body.scratchpad_raw || ''
    const enhancedJson = body.enhanced_notes ? JSON.stringify(body.enhanced_notes) : null

    db.run(`
      INSERT INTO notes (id, workspace_id, folder_id, title, date, duration_ms, scratchpad_raw, enhanced_notes_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, ctx.workspaceId, folderId, title, date, durationMs, scratchpad, enhancedJson])

    const created = db.query('SELECT * FROM notes WHERE id = ?').get(id) as any
    return Response.json({ note: created }, { status: 201 })
  }

  // Check routes with /v1/notes/:id/...
  const noteMatch = path.match(/^\/v1\/notes\/([a-zA-Z0-9_\-]+)(\/.*)?$/)
  if (!noteMatch) return null

  const noteId = noteMatch[1]
  const subRoute = noteMatch[2] || ''

  // 3. GET /v1/notes/:id
  if (method === 'GET' && subRoute === '') {
    const note = db.query(`
      SELECT n.*, f.name as folder_name
      FROM notes n
      LEFT JOIN folders f ON f.id = n.folder_id
      WHERE n.id = ? AND n.workspace_id = ?
    `).get(noteId, ctx.workspaceId) as any

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    const segments = db.query(`
      SELECT id, speaker, start_ms, end_ms, text, sentence_id
      FROM transcript_segments
      WHERE note_id = ?
      ORDER BY start_ms ASC
    `).all(noteId) as Segment[]

    const actionItems = db.query(`
      SELECT id, task, owner, deadline, done, created_at
      FROM action_items
      WHERE note_id = ?
      ORDER BY created_at ASC
    `).all(noteId)

    const shareLinks = db.query(`
      SELECT id, token, is_public, views_count, created_at, expires_at
      FROM share_links
      WHERE note_id = ?
    `).all(noteId)

    return Response.json({
      note: {
        ...note,
        enhanced_notes: note.enhanced_notes_json ? safeJsonParse(note.enhanced_notes_json) : null,
        transcript_segments: segments,
        action_items: actionItems,
        share_links: shareLinks,
      },
    })
  }

  // 4. PATCH /v1/notes/:id
  if (method === 'PATCH' && subRoute === '') {
    const body = await req.json().catch(() => ({})) as any
    const existing = db.query('SELECT id FROM notes WHERE id = ? AND workspace_id = ?').get(noteId, ctx.workspaceId)
    if (!existing) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    const updates: string[] = ['updated_at = ?']
    const params: any[] = [new Date().toISOString()]

    if (body.title !== undefined) {
      updates.push('title = ?')
      params.push(body.title)
    }
    if (body.folder_id !== undefined) {
      updates.push('folder_id = ?')
      params.push(body.folder_id)
    }
    if (body.scratchpad_raw !== undefined) {
      updates.push('scratchpad_raw = ?')
      params.push(body.scratchpad_raw)
    }
    if (body.enhanced_notes !== undefined) {
      updates.push('enhanced_notes_json = ?')
      params.push(JSON.stringify(body.enhanced_notes))
    }
    if (body.duration_ms !== undefined) {
      updates.push('duration_ms = ?')
      params.push(body.duration_ms)
    }

    params.push(noteId)
    db.run(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`, params)

    const updated = db.query('SELECT * FROM notes WHERE id = ?').get(noteId) as any
    return Response.json({
      note: {
        ...updated,
        enhanced_notes: updated.enhanced_notes_json ? safeJsonParse(updated.enhanced_notes_json) : null,
      },
    })
  }

  // 5. DELETE /v1/notes/:id
  if (method === 'DELETE' && subRoute === '') {
    const existing = db.query('SELECT id FROM notes WHERE id = ? AND workspace_id = ?').get(noteId, ctx.workspaceId)
    if (!existing) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    db.run('DELETE FROM notes WHERE id = ?', [noteId])
    return Response.json({ success: true, id: noteId })
  }

  // 6. GET /v1/notes/:id/transcript
  if (method === 'GET' && subRoute === '/transcript') {
    const segments = db.query(`
      SELECT id, speaker, start_ms, end_ms, text, sentence_id
      FROM transcript_segments
      WHERE note_id = ?
      ORDER BY start_ms ASC
    `).all(noteId) as Segment[]

    return Response.json({ segments })
  }

  // 7. POST /v1/notes/:id/transcript
  if (method === 'POST' && subRoute === '/transcript') {
    const body = await req.json().catch(() => ({})) as any
    const segmentsInput = Array.isArray(body.segments) ? body.segments : (body.segment ? [body.segment] : [])

    if (segmentsInput.length === 0) {
      return Response.json({ error: 'No transcript segments provided' }, { status: 400 })
    }

    // Get current count for sentence_id indexing
    const currentCount = db.query('SELECT COUNT(*) as count FROM transcript_segments WHERE note_id = ?').get(noteId) as { count: number }
    let nextIndex = currentCount.count + 1

    const inserted: Segment[] = []
    const insertStmt = db.prepare(`
      INSERT INTO transcript_segments (id, note_id, speaker, start_ms, end_ms, text, sentence_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    db.transaction(() => {
      for (const seg of segmentsInput) {
        const segId = seg.id || `seg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        const sentenceId = seg.sentence_id || `s_${String(nextIndex).padStart(3, '0')}`
        nextIndex++

        const record: Segment = {
          id: segId,
          speaker: seg.speaker || 'me',
          start_ms: seg.start_ms || 0,
          end_ms: seg.end_ms || (seg.start_ms || 0) + 5000,
          text: seg.text || '',
          sentence_id: sentenceId,
        }

        insertStmt.run(segId, noteId, record.speaker, record.start_ms, record.end_ms, record.text, sentenceId)
        inserted.push(record)
      }
    })()

    return Response.json({ success: true, count: inserted.length, segments: inserted }, { status: 201 })
  }

  // 8. POST /v1/notes/:id/enhance
  if (method === 'POST' && subRoute === '/enhance') {
    const body = await req.json().catch(() => ({})) as any
    const note = db.query('SELECT * FROM notes WHERE id = ? AND workspace_id = ?').get(noteId, ctx.workspaceId) as any
    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    const segments = db.query(`
      SELECT id, speaker, start_ms, end_ms, text, sentence_id
      FROM transcript_segments
      WHERE note_id = ?
      ORDER BY start_ms ASC
    `).all(noteId) as Segment[]

    const enhancedDoc = await enhanceNote(note.scratchpad_raw, segments, body.custom_instructions)
    const enhancedJson = JSON.stringify(enhancedDoc)

    db.run(`
      UPDATE notes
      SET enhanced_notes_json = ?, updated_at = ?
      WHERE id = ?
    `, [enhancedJson, new Date().toISOString(), noteId])

    // Dispatch webhook
    dispatchWebhook(db, ctx.workspaceId, 'note.enhanced', {
      note_id: noteId,
      title: note.title,
      enhanced_doc: enhancedDoc,
    })

    return Response.json({
      success: true,
      note_id: noteId,
      enhanced_notes: enhancedDoc,
    })
  }

  // 9. POST /v1/notes/:id/recipes/:recipeId
  const recipeMatch = subRoute.match(/^\/recipes\/([a-zA-Z0-9_\-]+)$/)
  if (method === 'POST' && recipeMatch) {
    const recipeId = recipeMatch[1]
    const note = db.query('SELECT * FROM notes WHERE id = ? AND workspace_id = ?').get(noteId, ctx.workspaceId) as any
    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    const segments = db.query(`
      SELECT id, speaker, start_ms, end_ms, text, sentence_id
      FROM transcript_segments
      WHERE note_id = ?
      ORDER BY start_ms ASC
    `).all(noteId) as Segment[]

    const result = await generateRecipe(recipeId, note.scratchpad_raw, segments)
    return Response.json(result)
  }

  return null
}

function safeJsonParse(val: string): any {
  try {
    return JSON.parse(val)
  } catch {
    return null
  }
}
