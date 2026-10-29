import type { Database } from 'bun:sqlite'
import type { AuthContext } from '../auth/middleware'
import { transcribeAudio } from '../ai/transcriber'
import { enhanceNote, type Segment } from '../ai/enhancer'
import { dispatchWebhook } from './webhooks'

export async function handleAudioRoutes(req: Request, db: Database, ctx: AuthContext): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // 1. POST /v1/audio/transcribe (Standalone audio transcription)
  if (method === 'POST' && path === '/v1/audio/transcribe') {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return Response.json({ error: 'Expected multipart/form-data with "file" field' }, { status: 400 })
    }

    const file = formData.get('file') as Blob | null
    if (!file) {
      return Response.json({ error: 'No audio file provided in "file" field' }, { status: 400 })
    }

    const speaker = (formData.get('speaker') as 'me' | 'attendees') || 'me'
    const language = (formData.get('language') as string) || undefined
    const fileName = (formData.get('fileName') as string) || 'audio.wav'

    const result = await transcribeAudio({
      file,
      fileName,
      speaker,
      language,
    })

    return Response.json(result)
  }

  // 2. POST /v1/notes/:id/audio (Direct meeting audio upload & auto-enhancement)
  const noteAudioMatch = path.match(/^\/v1\/notes\/([a-zA-Z0-9_\-]+)\/audio$/)
  if (method === 'POST' && noteAudioMatch) {
    const noteId = noteAudioMatch[1]
    const note = db.query('SELECT * FROM notes WHERE id = ? AND workspace_id = ?').get(noteId, ctx.workspaceId) as any
    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return Response.json({ error: 'Expected multipart/form-data with "file" field' }, { status: 400 })
    }

    const mainFile = formData.get('file') as Blob | null
    const attendeesFile = formData.get('attendees_file') as Blob | null

    if (!mainFile && !attendeesFile) {
      return Response.json({ error: 'At least one audio file ("file" or "attendees_file") is required' }, { status: 400 })
    }

    const speaker = (formData.get('speaker') as 'me' | 'attendees') || 'me'
    const autoEnhance = formData.get('auto_enhance') !== 'false'

    // Get current sentence count for index continuity
    const currentCount = db.query('SELECT COUNT(*) as count FROM transcript_segments WHERE note_id = ?').get(noteId) as { count: number }
    let nextIndex = currentCount.count + 1

    const allNewSegments: Segment[] = []

    // 1. Transcribe main channel (e.g. microphone)
    if (mainFile) {
      const res1 = await transcribeAudio({
        file: mainFile,
        fileName: 'mic.wav',
        speaker,
        startIndex: nextIndex,
      })
      allNewSegments.push(...res1.segments)
      nextIndex += res1.segments.length
    }

    // 2. Transcribe second channel (system audio loopback for attendees)
    if (attendeesFile) {
      const res2 = await transcribeAudio({
        file: attendeesFile,
        fileName: 'attendees.wav',
        speaker: 'attendees',
        startIndex: nextIndex,
      })
      allNewSegments.push(...res2.segments)
      nextIndex += res2.segments.length
    }

    // Sort segments by start_ms
    allNewSegments.sort((a, b) => a.start_ms - b.start_ms)

    // Insert into transcript_segments
    const insertStmt = db.prepare(`
      INSERT INTO transcript_segments (id, note_id, speaker, start_ms, end_ms, text, sentence_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    db.transaction(() => {
      for (const seg of allNewSegments) {
        insertStmt.run(seg.id, noteId, seg.speaker, seg.start_ms, seg.end_ms, seg.text, seg.sentence_id)
      }
    })()

    // Calculate updated meeting duration
    const maxEndMs = allNewSegments.reduce((max, s) => Math.max(max, s.end_ms), note.duration_ms || 0)
    db.run('UPDATE notes SET duration_ms = ?, updated_at = ? WHERE id = ?', [maxEndMs, new Date().toISOString(), noteId])

    // Auto-enhance note if requested
    let enhancedDoc = null
    if (autoEnhance) {
      const allSegments = db.query(`
        SELECT id, speaker, start_ms, end_ms, text, sentence_id
        FROM transcript_segments
        WHERE note_id = ?
        ORDER BY start_ms ASC
      `).all(noteId) as Segment[]

      enhancedDoc = await enhanceNote(note.scratchpad_raw, allSegments)
      const enhancedJson = JSON.stringify(enhancedDoc)

      db.run('UPDATE notes SET enhanced_notes_json = ?, updated_at = ? WHERE id = ?', [
        enhancedJson,
        new Date().toISOString(),
        noteId,
      ])

      dispatchWebhook(db, ctx.workspaceId, 'note.enhanced', {
        note_id: noteId,
        title: note.title,
        enhanced_doc: enhancedDoc,
      })
    }

    const updatedNote = db.query('SELECT * FROM notes WHERE id = ?').get(noteId) as any

    return Response.json({
      success: true,
      note_id: noteId,
      segments_count: allNewSegments.length,
      duration_ms: maxEndMs,
      transcript_segments: allNewSegments,
      enhanced_notes: enhancedDoc,
      note: {
        ...updatedNote,
        enhanced_notes: enhancedDoc,
      },
    }, { status: 201 })
  }

  return null
}
