import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { Database } from 'bun:sqlite'
import { createServer } from '../src/index'
import { initializeDatabase } from '../src/db/schema'
import { hashToken } from '../src/db/client'

describe('Bagrry Server Test Suite', () => {
  let db: Database
  let server: ReturnType<typeof Bun.serve>
  let baseUrl: string
  const testToken = 'bgy_live_integration_test_token_999'
  const authHeaders = {
    Authorization: `Bearer ${testToken}`,
    'Content-Type': 'application/json',
  }

  beforeAll(async () => {
    // In-memory isolated database for tests
    db = new Database(':memory:')
    initializeDatabase(db)

    // Seed test workspace and key
    db.run(`INSERT INTO workspaces (id, name, slug) VALUES (?, ?, ?)`, ['ws_test', 'Test Workspace', 'test-workspace'])
    db.run(`INSERT INTO users (id, workspace_id, name, email, role) VALUES (?, ?, ?, ?, ?)`, ['usr_test', 'ws_test', 'Test User', 'test@bagrry.dev', 'owner'])
    db.run(`
      INSERT INTO api_keys (id, user_id, workspace_id, label, token_hash, token_tail, kind)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['key_test', 'usr_test', 'ws_test', 'Test Key', hashToken(testToken), 'test99', 'workspace'])

    // Spin up server with custom DB on an ephemeral test port
    const testPort = 48991
    server = createServer(db, testPort)
    baseUrl = `http://127.0.0.1:${testPort}`
  })

  afterAll(() => {
    server.stop(true)
    db.close()
  })

  // 1. Health
  it('GET /health returns status ok with version', async () => {
    const res = await fetch(`${baseUrl}/health`)
    expect(res.status).toBe(200)
    const data = await res.json() as any
    expect(data.status).toBe('ok')
    expect(data.app).toBe('Bagrry Server')
    expect(data.version).toBe('1.0.0')
  })

  // 2. Authentication Enforcement
  it('rejects unauthenticated requests to protected endpoints', async () => {
    const res = await fetch(`${baseUrl}/v1/notes`)
    expect(res.status).toBe(401)
    const data = await res.json() as any
    expect(data.error).toContain('Authorization')
  })

  it('rejects invalid bearer tokens', async () => {
    const res = await fetch(`${baseUrl}/v1/notes`, {
      headers: { Authorization: 'Bearer bad_token_123' },
    })
    expect(res.status).toBe(401)
  })

  // 3. Folders
  it('handles folder creation, listing, and deletion', async () => {
    // Create folder
    const createRes = await fetch(`${baseUrl}/v1/folders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Architecture Reviews', icon: 'server' }),
    })
    expect(createRes.status).toBe(201)
    const created = await createRes.json() as any
    expect(created.folder.name).toBe('Architecture Reviews')
    const folderId = created.folder.id

    // List folders
    const listRes = await fetch(`${baseUrl}/v1/folders`, { headers: authHeaders })
    expect(listRes.status).toBe(200)
    const listData = await listRes.json() as any
    expect(listData.folders.length).toBeGreaterThanOrEqual(1)

    // Delete folder
    const delRes = await fetch(`${baseUrl}/v1/folders/${folderId}`, {
      method: 'DELETE',
      headers: authHeaders,
    })
    expect(delRes.status).toBe(200)
  })

  // 4. Notes, Transcripts, Enhancement & Recipes
  it('handles note lifecycle, transcript segments, AI enhancement, and recipe generation', async () => {
    // Create Note
    const createRes = await fetch(`${baseUrl}/v1/notes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Weekly Standup',
        scratchpad_raw: '- Finalize Q4 milestones\n- Transition desktop client to native GPUIX',
      }),
    })
    expect(createRes.status).toBe(201)
    const created = await createRes.json() as any
    const noteId = created.note.id
    expect(noteId).toBeDefined()

    // Append transcript segments
    const transRes = await fetch(`${baseUrl}/v1/notes/${noteId}/transcript`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        segments: [
          { speaker: 'me', text: 'Good morning team. We have completely transitioned to GPUIX.', start_ms: 0, end_ms: 10000 },
          { speaker: 'attendees', text: 'Window dragging feels immediate and native on Windows.', start_ms: 11000, end_ms: 20000 },
        ],
      }),
    })
    expect(transRes.status).toBe(201)
    const transData = await transRes.json() as any
    expect(transData.count).toBe(2)
    expect(transData.segments[0].sentence_id).toBe('s_001')
    expect(transData.segments[1].sentence_id).toBe('s_002')

    // Enhance note
    const enhanceRes = await fetch(`${baseUrl}/v1/notes/${noteId}/enhance`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    })
    expect(enhanceRes.status).toBe(200)
    const enhanceData = await enhanceRes.json() as any
    expect(enhanceData.success).toBe(true)
    expect(enhanceData.enhanced_notes.sections.length).toBeGreaterThan(0)
    const firstBullet = enhanceData.enhanced_notes.sections[0].bullet_points[0]
    expect(firstBullet.citations).toContain('s_001')

    // Generate recipe
    const recipeRes = await fetch(`${baseUrl}/v1/notes/${noteId}/recipes/follow-up-email`, {
      method: 'POST',
      headers: authHeaders,
    })
    expect(recipeRes.status).toBe(200)
    const recipeData = await recipeRes.json() as any
    expect(recipeData.title).toBe('Follow-up Email')
    expect(recipeData.content).toContain('Good morning team')

    // Fetch note by ID
    const getRes = await fetch(`${baseUrl}/v1/notes/${noteId}`, { headers: authHeaders })
    expect(getRes.status).toBe(200)
    const getData = await getRes.json() as any
    expect(getData.note.transcript_segments.length).toBe(2)
  })

  // 5. Public Web Share Links and Q&A
  it('generates public web share links and allows unauthenticated Q&A', async () => {
    // Create note first
    const nRes = await fetch(`${baseUrl}/v1/notes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Investor Update Call',
        scratchpad_raw: 'Discussion on product traction and revenue targets.',
      }),
    })
    const note = (await nRes.json() as any).note

    // Append transcript
    await fetch(`${baseUrl}/v1/notes/${note.id}/transcript`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        segments: [
          { speaker: 'me', text: 'We reached profitability ahead of schedule.', start_ms: 0, end_ms: 12000 },
        ],
      }),
    })

    // Create public share link
    const shareRes = await fetch(`${baseUrl}/v1/shares`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ note_id: note.id }),
    })
    expect(shareRes.status).toBe(201)
    const shareData = await shareRes.json() as any
    const token = shareData.token
    expect(token).toMatch(/^bgy_sh_/)

    // Public HTML view (unauthenticated)
    const htmlRes = await fetch(`${baseUrl}/s/${token}`)
    expect(htmlRes.status).toBe(200)
    expect(htmlRes.headers.get('content-type')).toContain('text/html')
    const html = await htmlRes.text()
    expect(html).toContain('Investor Update Call')
    expect(html).toContain('profitability ahead of schedule')

    // Public Q&A (unauthenticated)
    const qaRes = await fetch(`${baseUrl}/v1/shares/${token}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What did we reach?' }),
    })
    expect(qaRes.status).toBe(200)
    const qaData = await qaRes.json() as any
    expect(qaData.answer).toContain('profitability')
  })

  // 6. Action Items
  it('manages action items and allows completion toggle', async () => {
    // Create action
    const createRes = await fetch(`${baseUrl}/v1/action-items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ task: 'Finalize server automated tests', owner: 'Alex' }),
    })
    expect(createRes.status).toBe(201)
    const act = (await createRes.json() as any).action_item

    // Toggle done
    const patchRes = await fetch(`${baseUrl}/v1/action-items/${act.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ done: 1 }),
    })
    expect(patchRes.status).toBe(200)
    const updated = (await patchRes.json() as any).action_item
    expect(updated.done).toBe(1)
  })

  // 7. Search
  it('searches notes and transcripts', async () => {
    const searchRes = await fetch(`${baseUrl}/v1/search?q=profitability`, { headers: authHeaders })
    expect(searchRes.status).toBe(200)
    const searchData = await searchRes.json() as any
    expect(searchData.transcript_matches.length).toBeGreaterThan(0)
    expect(searchData.transcript_matches[0].text).toContain('profitability')
  })

  // 8. API Key Management
  it('creates, verifies, and revokes API keys', async () => {
    // Create new key
    const createRes = await fetch(`${baseUrl}/v1/keys`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ label: 'CI Runner Key' }),
    })
    expect(createRes.status).toBe(201)
    const keyData = (await createRes.json() as any).key
    const newRawToken = keyData.token
    const newKeyId = keyData.id

    // Verify authentication using the new key
    const authTestRes = await fetch(`${baseUrl}/v1/notes`, {
      headers: { Authorization: `Bearer ${newRawToken}` },
    })
    expect(authTestRes.status).toBe(200)

    // Revoke key
    const delRes = await fetch(`${baseUrl}/v1/keys/${newKeyId}`, {
      method: 'DELETE',
      headers: authHeaders,
    })
    expect(delRes.status).toBe(200)

    // Key should now be rejected
    const revokedRes = await fetch(`${baseUrl}/v1/notes`, {
      headers: { Authorization: `Bearer ${newRawToken}` },
    })
    expect(revokedRes.status).toBe(401)
  })

  // 9. MCP Protocol
  it('handles MCP initialize, tools/list, and tools/call', async () => {
    // 1. initialize
    const initRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 10, method: 'initialize', params: {} }),
    })
    expect(initRes.status).toBe(200)
    const initData = await initRes.json() as any
    expect(initData.result.serverInfo.name).toBe('bagrry-mcp-server')

    // 2. tools/list
    const toolsRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 11, method: 'tools/list', params: {} }),
    })
    expect(toolsRes.status).toBe(200)
    const toolsData = await toolsRes.json() as any
    const toolNames = toolsData.result.tools.map((t: any) => t.name)
    expect(toolNames).toContain('query_meetings')
    expect(toolNames).toContain('get_meeting')
    expect(toolNames).toContain('get_meeting_transcript')
    expect(toolNames).toContain('list_folders')
    expect(toolNames).toContain('search_action_items')

    // 3. tools/call query_meetings
    const callRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: { name: 'query_meetings', arguments: { query: 'GPUIX' } },
      }),
    })
    expect(callRes.status).toBe(200)
    const callData = await callRes.json() as any
    expect(callData.result.content[0].text).toContain('GPUIX')
  })

  // 10. Audio Ingestion & Whisper Transcription
  it('transcribes standalone audio and handles note dual-channel audio upload with auto-enhancement', async () => {
    // 1. Standalone transcribe
    const formData = new FormData()
    const dummyAudio = new Blob(['RIFF....WAVEfmt '], { type: 'audio/wav' })
    formData.append('file', dummyAudio, 'test_recording.wav')
    formData.append('speaker', 'me')

    const transRes = await fetch(`${baseUrl}/v1/audio/transcribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: formData,
    })
    expect(transRes.status).toBe(200)
    const transData = await transRes.json() as any
    expect(transData.segments.length).toBeGreaterThan(0)
    expect(transData.segments[0].sentence_id).toBe('s_001')

    // 2. Upload meeting audio directly to a note with dual-channel (mic + attendees)
    const nRes = await fetch(`${baseUrl}/v1/notes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Executive Sync on Native Engine',
        scratchpad_raw: 'Transitioning to GPUIX to maximize client speed and responsive window dragging.',
      }),
    })
    const note = (await nRes.json() as any).note

    const dualForm = new FormData()
    dualForm.append('file', dummyAudio, 'mic.wav')
    dualForm.append('attendees_file', dummyAudio, 'speaker.wav')
    dualForm.append('auto_enhance', 'true')

    const noteAudioRes = await fetch(`${baseUrl}/v1/notes/${note.id}/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: dualForm,
    })
    expect(noteAudioRes.status).toBe(201)
    const noteAudioData = await noteAudioRes.json() as any
    expect(noteAudioData.success).toBe(true)
    expect(noteAudioData.segments_count).toBeGreaterThanOrEqual(2)
    expect(noteAudioData.enhanced_notes.sections.length).toBeGreaterThan(0)

    // Verify segments stored in DB
    const getNote = await fetch(`${baseUrl}/v1/notes/${note.id}`, { headers: authHeaders })
    const noteDetails = (await getNote.json() as any).note
    expect(noteDetails.transcript_segments.length).toBe(noteAudioData.segments_count)
  })
})
