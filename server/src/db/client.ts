import { Database } from 'bun:sqlite'
import { CONFIG } from '../config'
import { initializeDatabase } from './schema'

export function getDatabase(customPath?: string): Database {
  const path = customPath || CONFIG.dbPath
  const db = new Database(path, { create: true })
  initializeDatabase(db)
  seedInitialData(db)
  return db
}

export function hashToken(token: string): string {
  const hasher = new Bun.CryptoHasher('sha256')
  hasher.update(token)
  return hasher.digest('hex')
}

export function generateToken(prefix = 'bgy_live_'): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(24))
  const randStr = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}${randStr}`
}

function seedInitialData(db: Database) {
  const wsCount = db.query('SELECT COUNT(*) as count FROM workspaces').get() as { count: number }
  if (wsCount.count > 0) return

  // 1. Default Workspace
  const wsId = 'ws_default'
  db.run(`
    INSERT INTO workspaces (id, name, slug)
    VALUES (?, ?, ?)
  `, [wsId, 'Bagrry Labs', 'bagrry-labs'])

  // 2. Default User
  const userId = 'usr_alex'
  db.run(`
    INSERT INTO users (id, workspace_id, name, email, role)
    VALUES (?, ?, ?, ?, ?)
  `, [userId, wsId, 'Alex Rivera', 'alex@bagrry.dev', 'owner'])

  // 3. Default API Key (Personal)
  const defaultToken = 'bgy_live_dev_test_token_47821'
  db.run(`
    INSERT INTO api_keys (id, user_id, workspace_id, label, token_hash, token_tail, kind)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'key_default',
    userId,
    wsId,
    'Default Local Key',
    hashToken(defaultToken),
    '47821',
    'personal',
  ])

  // 4. Default Folders
  const fldRoadmap = 'fld_roadmap'
  const fldSync = 'fld_sync'
  db.run(`
    INSERT INTO folders (id, workspace_id, name, is_shared, icon)
    VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
  `, [
    fldRoadmap, wsId, 'Product Roadmap', 0, 'map',
    fldSync, wsId, 'Team Syncs', 1, 'users',
  ])

  // 5. Default Note
  const noteId = 'note_roadmap_sync'
  const enhancedDoc = {
    sections: [
      {
        section_title: 'Executive Summary',
        bullet_points: [
          {
            text: 'Agreed to transition from Webview architecture to native GPUIX rendering to eliminate memory overhead and achieve zero-latency window dragging.',
            citations: ['s_001'],
          },
          {
            text: 'Confirmed Q4 release timeline with public beta slated for late November.',
            citations: ['s_002'],
          },
        ],
      },
      {
        section_title: 'Decisions & Next Steps',
        bullet_points: [
          {
            text: 'Native server architecture will support public web share links and MCP developer endpoints.',
            citations: ['s_003'],
          },
        ],
      },
    ],
  }

  db.run(`
    INSERT INTO notes (
      id, workspace_id, folder_id, title, date, duration_ms, scratchpad_raw, enhanced_notes_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    noteId,
    wsId,
    fldRoadmap,
    'Q4 Product Roadmap & Native Architecture Sync',
    new Date().toISOString(),
    1845000,
    'Discussion on porting Bagrry to native high-performance architecture.\n- Zero-latency GPU rendering\n- Local-first SQLite store\n- Public interactive web share links\n- Model Context Protocol (MCP) server integration',
    JSON.stringify(enhancedDoc),
  ])

  // 6. Transcript segments
  db.run(`
    INSERT INTO transcript_segments (id, note_id, speaker, start_ms, end_ms, text, sentence_id)
    VALUES
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)
  `, [
    'seg_1', noteId, 'me', 0, 15000, 'Welcome everyone. Today we are aligning on our roadmap and native GPU rendering architecture.', 's_001',
    'seg_2', noteId, 'attendees', 16000, 32000, 'The performance latency improvements are night and day. Target beta by late November.', 's_002',
    'seg_3', noteId, 'me', 33000, 48000, 'We are also building out the server for web sharing and the Model Context Protocol.', 's_003',
  ])

  // 7. Action Items
  db.run(`
    INSERT INTO action_items (id, note_id, task, owner, deadline, done)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'act_1',
    noteId,
    'Deploy public web share endpoints and verify MCP JSON-RPC compatibility',
    'Alex Rivera',
    '2026-10-31',
    0,
  ])

  // 8. People & Companies
  db.run(`
    INSERT INTO people (id, workspace_id, name, email, domain)
    VALUES (?, ?, ?, ?, ?)
  `, ['usr_sarah', wsId, 'Sarah Chen', 'sarah@vertex.io', 'vertex.io'])

  db.run(`
    INSERT INTO companies (id, workspace_id, name, domain)
    VALUES (?, ?, ?, ?)
  `, ['cmp_vertex', wsId, 'Vertex Systems', 'vertex.io'])
}
