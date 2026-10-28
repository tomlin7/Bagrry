import type { Database } from 'bun:sqlite'
import type { AuthContext } from '../auth/middleware'

export async function handleSearchRoutes(req: Request, db: Database, ctx: AuthContext): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  if (method === 'GET' && (path === '/v1/search' || path === '/v1/notes/search')) {
    const q = (url.searchParams.get('q') || '').trim()
    if (!q) {
      return Response.json({ results: [], query: '' })
    }

    const likeTerm = `%${q}%`

    // Search notes
    const matchedNotes = db.query(`
      SELECT n.id, n.title, n.date, n.folder_id, f.name as folder_name, n.scratchpad_raw, n.enhanced_notes_json
      FROM notes n
      LEFT JOIN folders f ON f.id = n.folder_id
      WHERE n.workspace_id = ?
        AND (n.title LIKE ? OR n.scratchpad_raw LIKE ? OR n.enhanced_notes_json LIKE ?)
      ORDER BY n.date DESC
      LIMIT 20
    `).all(ctx.workspaceId, likeTerm, likeTerm, likeTerm) as any[]

    // Search transcripts
    const matchedSegments = db.query(`
      SELECT ts.id, ts.note_id, ts.speaker, ts.text, ts.sentence_id, n.title as note_title, n.date as note_date
      FROM transcript_segments ts
      JOIN notes n ON n.id = ts.note_id
      WHERE n.workspace_id = ? AND ts.text LIKE ?
      ORDER BY ts.start_ms ASC
      LIMIT 30
    `).all(ctx.workspaceId, likeTerm) as any[]

    return Response.json({
      query: q,
      notes: matchedNotes.map((n) => ({
        id: n.id,
        title: n.title,
        date: n.date,
        folder_name: n.folder_name,
        snippet: n.scratchpad_raw?.slice(0, 160) || '',
      })),
      transcript_matches: matchedSegments.map((s) => ({
        note_id: s.note_id,
        note_title: s.note_title,
        speaker: s.speaker,
        sentence_id: s.sentence_id,
        text: s.text,
      })),
    })
  }

  return null
}
