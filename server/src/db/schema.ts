import { Database } from 'bun:sqlite'

export function initializeDatabase(db: Database) {
  // Enable WAL mode and foreign keys
  db.run('PRAGMA journal_mode = WAL;')
  db.run('PRAGMA foreign_keys = ON;')

  // 1. Workspaces
  db.run(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  // 2. Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'member',
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  // 3. API Keys
  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      token_tail TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'personal', -- 'personal' | 'workspace'
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      last_used_at TEXT
    );
  `)

  // 4. Folders
  db.run(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      is_shared INTEGER NOT NULL DEFAULT 0,
      icon TEXT DEFAULT 'folder',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  // 5. Notes (Meetings)
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      duration_ms INTEGER DEFAULT 0,
      calendar_event_id TEXT,
      scratchpad_raw TEXT NOT NULL DEFAULT '',
      enhanced_notes_json TEXT,
      transcript_json TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  // 6. Transcript Segments (with sentence citations)
  db.run(`
    CREATE TABLE IF NOT EXISTS transcript_segments (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      speaker TEXT NOT NULL DEFAULT 'me', -- 'me' | 'attendees'
      start_ms INTEGER NOT NULL DEFAULT 0,
      end_ms INTEGER NOT NULL DEFAULT 0,
      text TEXT NOT NULL,
      sentence_id TEXT NOT NULL
    );
  `)

  // 7. Action Items
  db.run(`
    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      note_id TEXT REFERENCES notes(id) ON DELETE CASCADE,
      task TEXT NOT NULL,
      owner TEXT,
      deadline TEXT,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  // 8. People & Companies
  db.run(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      domain TEXT,
      company_id TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      domain TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  // 9. Share Links (Public Web Viewer)
  db.run(`
    CREATE TABLE IF NOT EXISTS share_links (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      is_public INTEGER NOT NULL DEFAULT 1,
      views_count INTEGER NOT NULL DEFAULT 0,
      snapshot_json TEXT NOT NULL,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  // 10. Webhooks
  db.run(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      events TEXT NOT NULL DEFAULT 'note.enhanced',
      secret TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  // 11. Feedbacks
  db.run(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `)

  // Indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_notes_ws ON notes(workspace_id);`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_transcript_note ON transcript_segments(note_id);`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_actions_note ON action_items(note_id);`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_share_token ON share_links(token);`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_key_hash ON api_keys(token_hash);`)

  // FTS5 Full Text Search Table
  try {
    db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        title,
        scratchpad,
        enhanced,
        content='notes',
        content_rowid='rowid'
      );
    `)
  } catch (err) {
    // If FTS5 not bundled in specific environment, fallback seamlessly
    console.warn('[db] FTS5 table initialization skipped or already active:', err)
  }
}
