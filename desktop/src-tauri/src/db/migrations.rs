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

const V2: &str = r#"
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT,
  attendees_json TEXT,
  source TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  owner TEXT,
  task TEXT NOT NULL,
  deadline TEXT
);
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime TEXT,
  extracted_text TEXT
);
CREATE TABLE IF NOT EXISTS shares (
  token TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS chat_logs (
  id TEXT PRIMARY KEY,
  meeting_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO folders (id, parent_id, name, is_shared) VALUES
 ('folder_sales', NULL, 'Sales', 0),
 ('folder_research', NULL, 'User Research', 0);
INSERT OR IGNORE INTO settings(key, value) VALUES
 ('consent_message', 'Note: Taking notes using Bagrry'),
 ('consent_enabled', '0'),
 ('overlay_enabled', '1'),
 ('api_port', '47821');
"#;

const SAMPLE: &str = r#"
INSERT OR IGNORE INTO companies (id, name, domain, first_seen, last_seen)
VALUES ('co_northwind', 'Northwind Labs', 'northwind.example', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO attendees (id, name, email, company_id, domain, first_seen, last_seen)
VALUES ('p_alex', 'Alex Chen', 'alex@northwind.example', 'co_northwind', 'northwind.example', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO meetings (id, folder_id, title, date, duration_ms, scratchpad_raw, enhanced_notes_json, transcript_json)
VALUES (
 'mtg_sample',
 'folder_sales',
 'Northwind pricing review',
 datetime('now', '-2 days'),
 1840000,
 '- $14/user annual
- quarterly true-ups
- legal wants DPA by Friday',
 '{"sections":[{"section_title":"Pricing Discussion","bullet_points":[{"text":"Agreed on $14/user/mo for annual billing with quarterly true-ups.","citations":["s_001","s_002"]}]},{"section_title":"Next Steps","bullet_points":[{"text":"Legal to send DPA by Friday; Alex owns follow-up.","citations":["s_003"]}]}]}',
 '[{"sentence_id":"s_001","speaker":"attendees","text":"We can do fourteen dollars per user per month if you commit annually."},{"sentence_id":"s_002","speaker":"me","text":"And we will true up seats quarterly."},{"sentence_id":"s_003","speaker":"attendees","text":"Please have legal send the DPA by Friday."}]'
);
INSERT OR IGNORE INTO meeting_attendees (meeting_id, attendee_id) VALUES ('mtg_sample', 'p_alex');
INSERT OR IGNORE INTO transcript_segments (id, meeting_id, speaker, start_ms, end_ms, text, sentence_index, sentence_id) VALUES
 ('seg_s1', 'mtg_sample', 'attendees', 12000, 18000, 'We can do fourteen dollars per user per month if you commit annually.', 0, 's_001'),
 ('seg_s2', 'mtg_sample', 'me', 19000, 24000, 'And we will true up seats quarterly.', 1, 's_002'),
 ('seg_s3', 'mtg_sample', 'attendees', 40000, 46000, 'Please have legal send the DPA by Friday.', 2, 's_003');
INSERT OR IGNORE INTO action_items (id, meeting_id, owner, task, deadline)
VALUES ('act_1', 'mtg_sample', 'Alex Chen', 'Send DPA', datetime('now', '+3 days'));
INSERT OR IGNORE INTO calendar_events (id, title, start_at, end_at, attendees_json, source)
VALUES ('cal_1', 'Northwind follow-up', datetime('now', '+1 day'), datetime('now', '+1 day', '+30 minutes'), '[{"name":"Alex Chen","email":"alex@northwind.example"}]', 'local');
"#;

/// v3 adds persisted chat threads (the sidebar's Chat section), a user profile,
/// and indexes for the lookups the UI does on every navigation.
const V3: &str = r#"
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'New chat',
  space_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_folder_date ON meetings(folder_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date DESC);
CREATE INDEX IF NOT EXISTS idx_segments_meeting ON transcript_segments(meeting_id, sentence_index);
CREATE INDEX IF NOT EXISTS idx_action_items_meeting ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attachments_meeting ON attachments(meeting_id);

INSERT OR IGNORE INTO settings(key, value) VALUES
 ('profile_name', 'You'),
 ('profile_email', ''),
 ('workspace_name', 'My workspace'),
 ('theme', 'system'),
 ('live_indicator', '1'),
 ('default_link_sharing', 'workspace');
"#;

/// The v1 FTS table only indexed `title` and `scratchpad_raw`, and search never
/// used it. Rebuild it over the columns users actually search, then backfill.
const V4: &str = r#"
DROP TRIGGER IF EXISTS meetings_ai;
DROP TRIGGER IF EXISTS meetings_ad;
DROP TRIGGER IF EXISTS meetings_au;
DROP TABLE IF EXISTS meetings_fts;

CREATE VIRTUAL TABLE meetings_fts USING fts5(
  title,
  scratchpad_raw,
  enhanced_notes_json,
  content='meetings',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

CREATE TRIGGER meetings_ai AFTER INSERT ON meetings BEGIN
  INSERT INTO meetings_fts(rowid, title, scratchpad_raw, enhanced_notes_json)
  VALUES (new.rowid, new.title, new.scratchpad_raw, ifnull(new.enhanced_notes_json, ''));
END;

CREATE TRIGGER meetings_ad AFTER DELETE ON meetings BEGIN
  INSERT INTO meetings_fts(meetings_fts, rowid, title, scratchpad_raw, enhanced_notes_json)
  VALUES('delete', old.rowid, old.title, old.scratchpad_raw, ifnull(old.enhanced_notes_json, ''));
END;

CREATE TRIGGER meetings_au AFTER UPDATE ON meetings BEGIN
  INSERT INTO meetings_fts(meetings_fts, rowid, title, scratchpad_raw, enhanced_notes_json)
  VALUES('delete', old.rowid, old.title, old.scratchpad_raw, ifnull(old.enhanced_notes_json, ''));
  INSERT INTO meetings_fts(rowid, title, scratchpad_raw, enhanced_notes_json)
  VALUES (new.rowid, new.title, new.scratchpad_raw, ifnull(new.enhanced_notes_json, ''));
END;

INSERT INTO meetings_fts(rowid, title, scratchpad_raw, enhanced_notes_json)
SELECT rowid, title, scratchpad_raw, ifnull(enhanced_notes_json, '') FROM meetings;
"#;

/// Folder create panel: optional icon (template id) and purpose description.
const V5: &str = r#"
ALTER TABLE folders ADD COLUMN icon TEXT;
ALTER TABLE folders ADD COLUMN description TEXT;
"#;

/// v6 makes settings functional: share visibility respects the default-link-sharing
/// preference, action items get a done flag, feedback is stored locally, and
/// API keys become a managed list.
const V6: &str = r#"
ALTER TABLE shares ADD COLUMN visibility TEXT NOT NULL DEFAULT 'link';
ALTER TABLE action_items ADD COLUMN done INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'problem',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'personal',
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
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

    if current < 2 {
        conn.execute_batch(V2)
            .map_err(|e| format!("migration v2: {e}"))?;
        conn.execute_batch(SAMPLE)
            .map_err(|e| format!("sample: {e}"))?;
        conn.execute(
            "INSERT OR IGNORE INTO schema_migrations (version) VALUES (2)",
            [],
        )
        .map_err(|e| format!("record v2: {e}"))?;
    }

    if current < 3 {
        conn.execute_batch(V3)
            .map_err(|e| format!("migration v3: {e}"))?;
        conn.execute(
            "INSERT OR IGNORE INTO schema_migrations (version) VALUES (3)",
            [],
        )
        .map_err(|e| format!("record v3: {e}"))?;
    }

    if current < 4 {
        conn.execute_batch(V4)
            .map_err(|e| format!("migration v4: {e}"))?;
        conn.execute(
            "INSERT OR IGNORE INTO schema_migrations (version) VALUES (4)",
            [],
        )
        .map_err(|e| format!("record v4: {e}"))?;
    }

    if current < 5 {
        conn.execute_batch(V5)
            .map_err(|e| format!("migration v5: {e}"))?;
        conn.execute(
            "INSERT OR IGNORE INTO schema_migrations (version) VALUES (5)",
            [],
        )
        .map_err(|e| format!("record v5: {e}"))?;
    }

    if current < 6 {
        conn.execute_batch(V6)
            .map_err(|e| format!("migration v6: {e}"))?;
        conn.execute(
            "INSERT OR IGNORE INTO schema_migrations (version) VALUES (6)",
            [],
        )
        .map_err(|e| format!("record v6: {e}"))?;
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
