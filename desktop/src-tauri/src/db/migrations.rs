use rusqlite::Connection;

const V1: &str = r#"
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_shared INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  domain TEXT,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  duration_ms INTEGER,
  calendar_event_id TEXT,
  scratchpad_raw TEXT NOT NULL DEFAULT '',
  enhanced_notes_json TEXT,
  transcript_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meeting_attendees (
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  attendee_id TEXT NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, attendee_id)
);

CREATE TABLE IF NOT EXISTS transcript_segments (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('me', 'attendees')),
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  text TEXT NOT NULL,
  sentence_index INTEGER NOT NULL,
  sentence_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  structure_json TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  structure_json TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS vectors (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  embedding BLOB,
  dim INTEGER NOT NULL DEFAULT 384
);

CREATE VIRTUAL TABLE IF NOT EXISTS meetings_fts USING fts5(
  title,
  scratchpad_raw,
  content='meetings',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS meetings_ai AFTER INSERT ON meetings BEGIN
  INSERT INTO meetings_fts(rowid, title, scratchpad_raw)
  VALUES (new.rowid, new.title, new.scratchpad_raw);
END;

CREATE TRIGGER IF NOT EXISTS meetings_ad AFTER DELETE ON meetings BEGIN
  INSERT INTO meetings_fts(meetings_fts, rowid, title, scratchpad_raw)
  VALUES('delete', old.rowid, old.title, old.scratchpad_raw);
END;

CREATE TRIGGER IF NOT EXISTS meetings_au AFTER UPDATE ON meetings BEGIN
  INSERT INTO meetings_fts(meetings_fts, rowid, title, scratchpad_raw)
  VALUES('delete', old.rowid, old.title, old.scratchpad_raw);
  INSERT INTO meetings_fts(rowid, title, scratchpad_raw)
  VALUES (new.rowid, new.title, new.scratchpad_raw);
END;
"#;

const SEED: &str = r#"
INSERT OR IGNORE INTO folders (id, parent_id, name, is_shared)
VALUES ('folder_inbox', NULL, 'All meetings', 0);

INSERT OR IGNORE INTO templates (id, name, prompt_template, structure_json, icon) VALUES
('tpl_1on1', '1-on-1',
 'Anchor on the user scratchpad. Expand wins, challenges, career growth, and next steps using transcript quotes.',
 '{"sections":["Wins","Challenges","Career Growth","Next Steps"]}', 'users'),
('tpl_sales', 'Sales Discovery',
 'Anchor on the user scratchpad. Capture pain points, budget, decision criteria, and objections with citations.',
 '{"sections":["Pain Points","Budget","Decision Criteria","Objections"]}', 'briefcase'),
('tpl_research', 'User Research',
 'Anchor on the user scratchpad. Extract persona notes, feature feedback, friction, and verbatim quotes.',
 '{"sections":["User Persona","Feature Feedback","Friction Points","Quotes"]}', 'search'),
('tpl_sprint', 'Sprint Planning & Retro',
 'Use the 4Ps: Purpose, Product, People, Process. Cite transcript sentences.',
 '{"sections":["Purpose","Product","People","Process"]}', 'kanban');

INSERT OR IGNORE INTO recipes (id, name, prompt_template, structure_json, icon) VALUES
('rcp_email', 'Draft follow-up email',
 'Write a client-ready recap email with action items from the enhanced notes.',
 NULL, 'mail'),
('rcp_actions', 'Extract action items',
 'Return a table of owner, task, and deadline from the enhanced notes.',
 NULL, 'list-checks'),
('rcp_tickets', 'Generate tickets',
 'Create copy-pasteable Markdown user stories from the enhanced notes.',
 NULL, 'ticket'),
('rcp_blockers', 'Extract objections & blockers',
 'List objections and blockers with citations.',
 NULL, 'shield-alert');
"#;

pub fn apply(conn: &Connection, vec_enabled: bool) -> Result<(), String> {
    let current: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if current < 1 {
        conn.execute_batch("CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );")
        .map_err(|e| format!("migrations table: {e}"))?;
        conn.execute_batch(V1)
            .map_err(|e| format!("migration v1: {e}"))?;
        conn.execute_batch(SEED)
            .map_err(|e| format!("seed: {e}"))?;
        conn.execute(
            "INSERT INTO schema_migrations (version) VALUES (1)",
            [],
        )
        .map_err(|e| format!("record v1: {e}"))?;
    }

    if vec_enabled {
        let _ = conn.execute_batch(
            "CREATE VIRTUAL TABLE IF NOT EXISTS vec_meetings USING vec0(
               meeting_id TEXT PRIMARY KEY,
               embedding float[384]
             );",
        );
    }

    Ok(())
}
