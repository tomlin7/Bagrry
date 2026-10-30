use crate::audio;
use crate::db;
use crate::groq;
use crate::ids::new_id;
use crate::pipeline::{self, TranscriptSeg};
use crate::secrets;
use crate::AppState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

#[derive(Serialize)]
pub struct DbStatus {
    pub path: String,
    pub sqlite_version: String,
    pub vec_enabled: bool,
    pub meeting_count: i64,
    pub groq_configured: bool,
    pub api_port: u16,
}

#[derive(Serialize)]
pub struct Folder {
    pub id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub is_shared: bool,
    pub icon: Option<String>,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Meeting {
    pub id: String,
    pub folder_id: Option<String>,
    pub title: String,
    pub date: String,
    pub duration_ms: Option<i64>,
    pub calendar_event_id: Option<String>,
    pub scratchpad_raw: String,
    pub scratchpad_json: Option<String>,
    pub enhanced_notes_json: Option<String>,
    pub transcript_json: Option<String>,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub prompt_template: String,
    pub structure_json: Option<String>,
}

#[derive(Serialize)]
pub struct Recipe {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub prompt_template: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Person {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub domain: Option<String>,
    pub company_id: Option<String>,
    pub company_name: Option<String>,
    pub role: Option<String>,
    pub notes: Option<String>,
    pub excluded: bool,
    pub note_count: i64,
    pub total_duration_ms: i64,
    pub last_note_at: Option<String>,
}


#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SearchHit {
    pub id: String,
    pub title: String,
    pub date: String,
    pub snippet: String,
    pub folder_name: Option<String>,
    pub attendees: Vec<String>,
    pub has_open_loops: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GlobalSearchResult {
    pub hits: Vec<SearchHit>,
    pub matched_people: Vec<Person>,
}

#[derive(Serialize)]
pub struct PersonDossier {
    pub person: Person,
    pub meetings: Vec<Meeting>,
    pub action_items: Vec<ActionItem>,
    pub catch_me_up_brief: Option<String>,
}

#[derive(Serialize)]
pub struct Company {
    pub id: String,
    pub name: String,
    pub domain: Option<String>,
    pub note_count: i64,
    pub last_note_at: Option<String>,
}

#[derive(Serialize)]
pub struct ActionItem {
    pub id: String,
    pub meeting_id: String,
    pub meeting_title: String,
    pub owner: Option<String>,
    pub task: String,
    pub deadline: Option<String>,
    pub done: bool,
}

#[derive(Serialize)]
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub start_at: String,
    pub end_at: Option<String>,
    pub attendees_json: Option<String>,
}

fn meeting_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Meeting> {
    Ok(Meeting {
        id: row.get(0)?,
        folder_id: row.get(1)?,
        title: row.get(2)?,
        date: row.get(3)?,
        duration_ms: row.get(4)?,
        calendar_event_id: row.get(5)?,
        scratchpad_raw: row.get(6)?,
        scratchpad_json: row.get(7)?,
        enhanced_notes_json: row.get(8)?,
        transcript_json: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

const MEETING_COLS: &str = "id, folder_id, title, date, duration_ms, calendar_event_id, scratchpad_raw, scratchpad_json, enhanced_notes_json, transcript_json, updated_at";

#[tauri::command]
pub fn db_status(app: AppHandle, state: State<AppState>) -> Result<DbStatus, String> {
    let conn = state.conn()?;
    let sqlite_version: String = conn
        .query_row("SELECT sqlite_version()", [], |row| row.get(0))
        .unwrap_or_else(|_| "unknown".into());
    let meeting_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM meetings", [], |row| row.get(0))
        .unwrap_or(0);
    let vec_enabled = db::schema::vec_available(&conn);
    let groq_configured = secrets::has_secret(&conn, "groq_api_key");
    let api_port: u16 = secrets::get_setting(&conn, "api_port", "47821")
        .parse()
        .unwrap_or(47821);
    let path = db::db_path(&app)?.to_string_lossy().to_string();
    Ok(DbStatus {
        path,
        sqlite_version,
        vec_enabled,
        meeting_count,
        groq_configured,
        api_port,
    })
}

#[tauri::command]
pub fn list_folders(state: State<AppState>) -> Result<Vec<Folder>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare("SELECT id, parent_id, name, is_shared, icon, description FROM folders ORDER BY name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Folder {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                name: row.get(2)?,
                is_shared: row.get::<_, i64>(3)? != 0,
                icon: row.get(4)?,
                description: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_meetings(state: State<AppState>, folder_id: Option<String>) -> Result<Vec<Meeting>, String> {
    let conn = state.conn()?;
    let sql = if folder_id.is_some() {
        format!("SELECT {MEETING_COLS} FROM meetings WHERE folder_id = ?1 ORDER BY date DESC")
    } else {
        format!("SELECT {MEETING_COLS} FROM meetings ORDER BY date DESC")
    };
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let map = |row: &rusqlite::Row| meeting_from_row(row);
    if let Some(fid) = folder_id {
        let rows = stmt.query_map(params![fid], map).map_err(|e| e.to_string())?;
        return rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string());
    }
    let rows = stmt.query_map([], map).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_meeting(state: State<AppState>, id: String) -> Result<Meeting, String> {
    let conn = state.conn()?;
    conn.query_row(
        &format!("SELECT {MEETING_COLS} FROM meetings WHERE id = ?1"),
        params![id],
        meeting_from_row,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_templates(state: State<AppState>) -> Result<Vec<Template>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name, icon, prompt_template, structure_json FROM templates ORDER BY name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Template {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                prompt_template: row.get(3)?,
                structure_json: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_recipes(state: State<AppState>) -> Result<Vec<Recipe>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name, icon, prompt_template FROM recipes ORDER BY name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Recipe {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                prompt_template: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_meeting(
    state: State<AppState>,
    title: String,
    folder_id: Option<String>,
) -> Result<Meeting, String> {
    let conn = state.conn()?;
    let id = new_id("mtg");
    let folder = folder_id.unwrap_or_else(|| "folder_inbox".into());
    conn.execute(
        "INSERT INTO meetings (id, folder_id, title, date, scratchpad_raw)
         VALUES (?1, ?2, ?3, datetime('now'), '')",
        params![&id, &folder, &title],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        &format!("SELECT {MEETING_COLS} FROM meetings WHERE id = ?1"),
        params![id],
        meeting_from_row,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_scratchpad(
    state: State<AppState>,
    id: String,
    scratchpad_raw: String,
    scratchpad_json: Option<String>,
) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE meetings SET scratchpad_raw = ?1, scratchpad_json = ?2, updated_at = datetime('now') WHERE id = ?3",
        params![scratchpad_raw, scratchpad_json, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_enhanced_notes(
    state: State<AppState>,
    id: String,
    enhanced_notes_json: String,
) -> Result<(), String> {
    let conn = state.conn()?;
    let segs = pipeline::load_segments(&conn, &id).unwrap_or_default();
    let mut doc: groq::EnhancedDoc =
        serde_json::from_str(&enhanced_notes_json).map_err(|e| e.to_string())?;
    pipeline::validate_citations(&mut doc, &segs);
    let json = serde_json::to_string(&doc).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE meetings SET enhanced_notes_json = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![json, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_title(state: State<AppState>, id: String, title: String) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE meetings SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![title, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn start_recording(app: AppHandle, meeting_id: Option<String>) -> Result<audio::RecStatus, String> {
    audio::start(&app, meeting_id)
}

#[tauri::command]
pub fn stop_recording(app: AppHandle) -> Result<audio::RecStatus, String> {
    audio::stop(&app)
}

#[tauri::command]
pub fn pause_recording(app: AppHandle) -> Result<audio::RecStatus, String> {
    audio::pause(&app)
}

#[tauri::command]
pub fn toggle_recording(app: AppHandle) -> Result<audio::RecStatus, String> {
    audio::toggle(&app)
}

#[tauri::command]
pub fn recording_status(app: AppHandle) -> Result<audio::RecStatus, String> {
    audio::status(&app)
}

#[tauri::command]
pub fn discard_audio(app: AppHandle) -> Result<audio::RecStatus, String> {
    audio::discard_pending(&app)
}

#[tauri::command]
pub fn transcribe_pending(app: AppHandle, state: State<AppState>, meeting_id: String) -> Result<Vec<TranscriptSeg>, String> {
    let (mic, sys) = audio::peek_pending(&app)?.ok_or_else(|| "no audio captured".to_string())?;
    let conn = state.conn()?;
    let key = secrets::get_secret(&conn, "groq_api_key")?.ok_or_else(|| {
        "Add a Groq API key in Settings to transcribe.".to_string()
    })?;
    let opts = pipeline::stt_options(&conn);
    drop(conn);
    let segs = pipeline::transcribe_pcm_files(&key, &mic, &sys, &opts)?;
    let conn = state.conn()?;
    pipeline::persist_transcript(&conn, &meeting_id, &segs)?;
    if let Some(pending) = audio::take_pending(&app)? {
        pending.cleanup();
    }
    notify(&app, &conn, "Transcript ready", "Your meeting transcript has finished processing.");
    Ok(segs)
}

fn chat_model(conn: &rusqlite::Connection) -> String {
    let m = secrets::get_setting(conn, "chat_model", "llama-3.3-70b-versatile");
    if m.trim().is_empty() {
        "llama-3.3-70b-versatile".into()
    } else {
        m
    }
}

/// Builds personalisation context for enhancement prompts from profile settings.
fn enhance_context(conn: &rusqlite::Connection) -> pipeline::EnhanceContext {
    let summary_lang = secrets::get_setting(conn, "summary_language", "en");
    let summary_language = match summary_lang.as_str() {
        "en" | "" => None, // default; the model already writes English
        "match" => {
            let t = secrets::get_setting(conn, "transcription_language", "en-best");
            (t != "en-best" && t != "en" && t != "auto").then_some(t)
        }
        other => Some(other.to_string()),
    };
    let get_opt = |key: &str| {
        let v = secrets::get_setting(conn, key, "");
        (!v.is_empty()).then_some(v)
    };
    // When "improve models" is off we still send the meeting (that's the
    // product) but we strip profile PII from the prompt.
    let share_profile = secrets::get_setting(conn, "improve_models", "1") == "1";
    pipeline::EnhanceContext {
        summary_language,
        jargon: get_opt("internal_jargon"),
        user_name: share_profile
            .then(|| get_opt("profile_name"))
            .flatten()
            .filter(|n| n != "You"),
        job_title: share_profile.then(|| get_opt("profile_job_title")).flatten(),
        company_description: share_profile
            .then(|| get_opt("profile_company_description"))
            .flatten(),
    }
}

/// Fires an OS notification when the matching `notify_*` preference is on.
fn notify(app: &AppHandle, conn: &rusqlite::Connection, title: &str, body: &str) {
    if secrets::get_setting(conn, "notify_notes_ready", "1") != "1" {
        return;
    }
    use tauri_plugin_notification::NotificationExt;
    let _ = app
        .notification()
        .builder()
        .title(title)
        .body(body)
        .show();
}

#[tauri::command]
pub fn list_segments(state: State<AppState>, meeting_id: String) -> Result<Vec<TranscriptSeg>, String> {
    let conn = state.conn()?;
    pipeline::load_segments(&conn, &meeting_id)
}

#[tauri::command]
pub fn enhance_meeting(
    app: AppHandle,
    state: State<AppState>,
    meeting_id: String,
    template_id: Option<String>,
) -> Result<String, String> {
    let conn = state.conn()?;
    let meeting = conn
        .query_row(
            &format!("SELECT {MEETING_COLS} FROM meetings WHERE id = ?1"),
            params![&meeting_id],
            meeting_from_row,
        )
        .map_err(|e| e.to_string())?;
    let segs = pipeline::load_segments(&conn, &meeting_id)?;
    let (prompt, structure) = if let Some(tid) = template_id {
        conn.query_row(
            "SELECT prompt_template, ifnull(structure_json,'{}') FROM templates WHERE id=?1",
            params![tid],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        )
        .unwrap_or_else(|_| {
            (
                "Structured meeting notes with citations.".into(),
                "{\"sections\":[\"Summary\",\"Decisions\",\"Next Steps\"]}".into(),
            )
        })
    } else {
        (
            "Structured meeting notes with citations.".into(),
            "{\"sections\":[\"Summary\",\"Decisions\",\"Next Steps\"]}".into(),
        )
    };
    let key = secrets::get_secret(&conn, "groq_api_key")?;
    let ctx = enhance_context(&conn);
    let model = chat_model(&conn);
    drop(conn);
    let mut doc = pipeline::enhance(
        key.as_deref(),
        &meeting.scratchpad_raw,
        &segs,
        &prompt,
        &structure,
        &ctx,
        Some(&model),
    )?;
    pipeline::validate_citations(&mut doc, &segs);
    let json = serde_json::to_string(&doc).map_err(|e| e.to_string())?;
    let conn = state.conn()?;
    conn.execute(
        "UPDATE meetings SET enhanced_notes_json = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![&json, &meeting_id],
    )
    .map_err(|e| e.to_string())?;
    let blob = format!(
        "{} {} {}",
        meeting.title,
        meeting.scratchpad_raw,
        json
    );
    let _ = pipeline::store_embedding(&conn, &meeting_id, &blob);
    notify(&app, &conn, "Notes ready", "Enhanced notes are ready to review.");
    Ok(json)
}

#[tauri::command]
pub fn run_recipe(state: State<AppState>, meeting_id: String, recipe_id: String) -> Result<String, String> {
    let conn = state.conn()?;
    let recipe: String = conn
        .query_row(
            "SELECT prompt_template FROM recipes WHERE id=?1",
            params![recipe_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let meeting = conn
        .query_row(
            &format!("SELECT {MEETING_COLS} FROM meetings WHERE id = ?1"),
            params![&meeting_id],
            meeting_from_row,
        )
        .map_err(|e| e.to_string())?;
    let key = secrets::get_secret(&conn, "groq_api_key")?;
    let model = chat_model(&conn);
    drop(conn);
    let user = format!(
        "NOTES:\n{}\n\nENHANCED:\n{}",
        meeting.scratchpad_raw,
        meeting.enhanced_notes_json.unwrap_or_default()
    );
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, &recipe, &user, false, Some(&model))
    } else {
        Ok(format!(
            "{}\n\n---\n{}\n\n{}",
            recipe,
            meeting.scratchpad_raw,
            user
        ))
    }
}

#[tauri::command]
pub fn reprompt_selection(
    state: State<AppState>,
    meeting_id: String,
    selection: String,
    instruction: String,
) -> Result<String, String> {
    let conn = state.conn()?;
    let segs = pipeline::load_segments(&conn, &meeting_id)?;
    let key = secrets::get_secret(&conn, "groq_api_key")?;
    let model = chat_model(&conn);
    drop(conn);
    let transcript = segs
        .iter()
        .map(|s| format!("[{}] {}", s.sentence_id, s.text))
        .collect::<Vec<_>>()
        .join("\n");
    let system = "Rewrite only the provided selection. Keep citations if present.";
    let user = format!("INSTRUCTION: {instruction}\n\nSELECTION:\n{selection}\n\nTRANSCRIPT:\n{transcript}");
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, system, &user, false, Some(&model))
    } else {
        Ok(format!("{instruction}\n\n{selection}"))
    }
}

#[tauri::command]
pub fn ask_bagrry(
    state: State<AppState>,
    query: String,
    folder_id: Option<String>,
    meeting_id: Option<String>,
) -> Result<String, String> {
    let conn = state.conn()?;
    let mut context = String::new();
    if let Some(mid) = &meeting_id {
        if let Ok(m) = conn.query_row(
            &format!("SELECT {MEETING_COLS} FROM meetings WHERE id=?1"),
            params![mid],
            meeting_from_row,
        ) {
            context.push_str(&format!(
                "MEETING {} {}\n{}\n{}\n",
                m.title,
                m.date,
                m.scratchpad_raw,
                m.enhanced_notes_json.unwrap_or_default()
            ));
        }
    } else {
        let hits = pipeline::search_semantic(&conn, &query, folder_id.as_deref()).unwrap_or_default();
        for (id, _score) in hits.iter().take(6) {
            if let Ok(m) = conn.query_row(
                &format!("SELECT {MEETING_COLS} FROM meetings WHERE id=?1"),
                params![id],
                meeting_from_row,
            ) {
                context.push_str(&format!(
                    "\n# {} ({})\n{}\n{}\n",
                    m.title,
                    m.id,
                    m.scratchpad_raw,
                    m.enhanced_notes_json.unwrap_or_default()
                ));
            }
        }
        if context.is_empty() {
            let like = format!("%{query}%");
            let mut stmt = conn
                .prepare("SELECT title, scratchpad_raw, ifnull(enhanced_notes_json,'') FROM meetings WHERE title LIKE ?1 OR scratchpad_raw LIKE ?1 LIMIT 8")
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map(params![like], |row| {
                    Ok(format!(
                        "# {}\n{}\n{}\n",
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?
                    ))
                })
                .map_err(|e| e.to_string())?;
            for r in rows.flatten() {
                context.push_str(&r);
            }
        }
    }
    let key = secrets::get_secret(&conn, "groq_api_key")?;
    let model = chat_model(&conn);
    drop(conn);
    let system = "Answer from the meeting notes. Cite meeting titles. If unknown, say so.";
    let user = format!("QUESTION: {query}\n\nNOTES:\n{context}");
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, system, &user, false, Some(&model))
    } else {
        Ok(if context.is_empty() {
            "No matching notes. Try another query or add a Groq key for synthesis.".into()
        } else {
            context.chars().take(4000).collect()
        })
    }
}

#[tauri::command]
pub fn live_ask(state: State<AppState>, query: String, live_transcript: String) -> Result<String, String> {
    let conn = state.conn()?;
    let key = secrets::get_secret(&conn, "groq_api_key")?;
    let model = chat_model(&conn);
    drop(conn);
    let system = "You are an in-meeting copilot. Be brief. Use only the live transcript.";
    let user = format!("LIVE TRANSCRIPT:\n{live_transcript}\n\nQUESTION: {query}");
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, system, &user, false, Some(&model))
    } else {
        Ok("Live copilot needs a Groq API key in Settings.".into())
    }
}

/// Turns free text into an FTS5 prefix query. Every token is quoted so that
/// punctuation the user typed can't be parsed as FTS operators.
fn fts_query(query: &str) -> String {
    query
        .split_whitespace()
        .map(|token| token.replace('"', ""))
        .filter(|token| !token.is_empty())
        .map(|token| format!("\"{token}\"*"))
        .collect::<Vec<_>>()
        .join(" AND ")
}

pub struct ParsedQuery {
    pub text: String,
    pub from: Option<String>,
    pub has_loop: bool,
    pub after: Option<String>,
    pub before: Option<String>,
    pub folder: Option<String>,
}

pub fn parse_search_query(raw: &str) -> ParsedQuery {
    let mut text_tokens = Vec::new();
    let mut from = None;
    let mut has_loop = false;
    let mut after = None;
    let mut before = None;
    let mut folder = None;

    for part in raw.split_whitespace() {
        if let Some(val) = part.strip_prefix("from:") {
            from = Some(val.trim_start_matches('@').to_lowercase());
        } else if part == "has:loop" || part == "has:action" {
            has_loop = true;
        } else if let Some(val) = part.strip_prefix("after:") {
            after = Some(val.to_string());
        } else if let Some(val) = part.strip_prefix("before:") {
            before = Some(val.to_string());
        } else if let Some(val) = part.strip_prefix("folder:") {
            folder = Some(val.trim_matches('"').to_lowercase());
        } else {
            text_tokens.push(part);
        }
    }

    ParsedQuery {
        text: text_tokens.join(" "),
        from,
        has_loop,
        after,
        before,
        folder,
    }
}

#[tauri::command]
pub fn search_global(state: State<AppState>, query: String) -> Result<GlobalSearchResult, String> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(GlobalSearchResult {
            hits: Vec::new(),
            matched_people: Vec::new(),
        });
    }

    let conn = state.conn()?;
    let parsed = parse_search_query(trimmed);

    // 1. FTS5 or LIKE query
    let has_text = !parsed.text.is_empty();
    let match_expr = if has_text { fts_query(&parsed.text) } else { String::new() };

    let mut sql = String::new();
    if has_text && !match_expr.is_empty() {
        sql.push_str(
            "SELECT m.id, m.title, m.date,
                    snippet(meetings_fts, -1, '<mark>', '</mark>', ' … ', 20) AS snippet,
                    (SELECT name FROM folders WHERE id = m.folder_id) AS folder_name,
                    (SELECT EXISTS(SELECT 1 FROM action_items WHERE meeting_id = m.id AND done = 0)) AS has_open_loops,
                    (SELECT group_concat(a.name, '; ') FROM attendees a JOIN meeting_attendees ma ON ma.attendee_id = a.id WHERE ma.meeting_id = m.id) AS attendees_str
             FROM meetings m
             JOIN meetings_fts f ON f.rowid = m.rowid
             WHERE meetings_fts MATCH ?1"
        );
    } else {
        sql.push_str(
            "SELECT m.id, m.title, m.date,
                    substr(m.scratchpad_raw, 1, 120) AS snippet,
                    (SELECT name FROM folders WHERE id = m.folder_id) AS folder_name,
                    (SELECT EXISTS(SELECT 1 FROM action_items WHERE meeting_id = m.id AND done = 0)) AS has_open_loops,
                    (SELECT group_concat(a.name, '; ') FROM attendees a JOIN meeting_attendees ma ON ma.attendee_id = a.id WHERE ma.meeting_id = m.id) AS attendees_str
             FROM meetings m
             WHERE 1=1"
        );
    }

    if let Some(ref f) = parsed.from {
        sql.push_str(&format!(
            " AND m.id IN (SELECT ma.meeting_id FROM meeting_attendees ma JOIN attendees a ON a.id = ma.attendee_id WHERE LOWER(a.name) LIKE '%{f}%' OR LOWER(COALESCE(a.email, '')) LIKE '%{f}%')"
        ));
    }
    if parsed.has_loop {
        sql.push_str(" AND m.id IN (SELECT meeting_id FROM action_items WHERE done = 0)");
    }
    if let Some(ref aft) = parsed.after {
        sql.push_str(&format!(" AND m.date >= '{aft}'"));
    }
    if let Some(ref bef) = parsed.before {
        sql.push_str(&format!(" AND m.date <= '{bef}'"));
    }
    if let Some(ref fold) = parsed.folder {
        sql.push_str(&format!(
            " AND m.folder_id IN (SELECT id FROM folders WHERE LOWER(name) LIKE '%{fold}%')"
        ));
    }

    if has_text && !match_expr.is_empty() {
        sql.push_str(" ORDER BY rank LIMIT 40");
    } else {
        sql.push_str(" ORDER BY m.date DESC LIMIT 40");
    }

    let mut hits: Vec<SearchHit> = if has_text && !match_expr.is_empty() {
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let mapped = stmt.query_map(params![match_expr], |row| {
            let att_str: Option<String> = row.get(6)?;
            let attendees = att_str
                .map(|s| s.split("; ").map(|p| p.to_string()).collect())
                .unwrap_or_default();
            Ok(SearchHit {
                id: row.get(0)?,
                title: row.get(1)?,
                date: row.get(2)?,
                snippet: row.get(3)?,
                folder_name: row.get(4)?,
                has_open_loops: row.get::<_, i64>(5)? != 0,
                attendees,
            })
        }).map_err(|e| e.to_string())?;
        let res: Vec<SearchHit> = mapped.flatten().collect();
        res
    } else {
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let mapped = stmt.query_map([], |row| {
            let att_str: Option<String> = row.get(6)?;
            let attendees = att_str
                .map(|s| s.split("; ").map(|p| p.to_string()).collect())
                .unwrap_or_default();
            Ok(SearchHit {
                id: row.get(0)?,
                title: row.get(1)?,
                date: row.get(2)?,
                snippet: row.get(3)?,
                folder_name: row.get(4)?,
                has_open_loops: row.get::<_, i64>(5)? != 0,
                attendees,
            })
        }).map_err(|e| e.to_string())?;
        let res: Vec<SearchHit> = mapped.flatten().collect();
        res
    };

    // Fallback to LIKE if FTS returned nothing but text was provided
    if hits.is_empty() && has_text {
        let like = format!("%{}%", parsed.text.to_lowercase());
        let mut fallback_sql = String::from(
            "SELECT m.id, m.title, m.date,
                    substr(m.scratchpad_raw, 1, 120) AS snippet,
                    (SELECT name FROM folders WHERE id = m.folder_id) AS folder_name,
                    (SELECT EXISTS(SELECT 1 FROM action_items WHERE meeting_id = m.id AND done = 0)) AS has_open_loops,
                    (SELECT group_concat(a.name, '; ') FROM attendees a JOIN meeting_attendees ma ON ma.attendee_id = a.id WHERE ma.meeting_id = m.id) AS attendees_str
             FROM meetings m
             WHERE (LOWER(m.title) LIKE ?1 OR LOWER(m.scratchpad_raw) LIKE ?1 OR LOWER(COALESCE(m.enhanced_notes_json, '')) LIKE ?1 OR LOWER(COALESCE(m.transcript_json, '')) LIKE ?1)"
        );
        if let Some(ref f) = parsed.from {
            fallback_sql.push_str(&format!(
                " AND m.id IN (SELECT ma.meeting_id FROM meeting_attendees ma JOIN attendees a ON a.id = ma.attendee_id WHERE LOWER(a.name) LIKE '%{f}%' OR LOWER(COALESCE(a.email, '')) LIKE '%{f}%')"
            ));
        }
        if parsed.has_loop {
            fallback_sql.push_str(" AND m.id IN (SELECT meeting_id FROM action_items WHERE done = 0)");
        }
        if let Some(ref aft) = parsed.after {
            fallback_sql.push_str(&format!(" AND m.date >= '{aft}'"));
        }
        if let Some(ref bef) = parsed.before {
            fallback_sql.push_str(&format!(" AND m.date <= '{bef}'"));
        }
        if let Some(ref fold) = parsed.folder {
            fallback_sql.push_str(&format!(
                " AND m.folder_id IN (SELECT id FROM folders WHERE LOWER(name) LIKE '%{fold}%')"
            ));
        }
        fallback_sql.push_str(" ORDER BY m.date DESC LIMIT 30");

        if let Ok(mut stmt) = conn.prepare(&fallback_sql) {
            if let Ok(mapped) = stmt.query_map(params![like], |row| {
                let att_str: Option<String> = row.get(6)?;
                let attendees = att_str
                    .map(|s| s.split("; ").map(|p| p.to_string()).collect())
                    .unwrap_or_default();
                Ok(SearchHit {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    date: row.get(2)?,
                    snippet: row.get(3)?,
                    folder_name: row.get(4)?,
                    has_open_loops: row.get::<_, i64>(5)? != 0,
                    attendees,
                })
            }) {
                hits = mapped.flatten().collect();
            }
        }
    }

    // 2. People matching
    let mut matched_people = Vec::new();
    if has_text {
        let p_like = format!("%{}%", parsed.text.to_lowercase());
        let mut p_stmt = conn.prepare(
            "SELECT a.id, a.name, a.email, a.domain, a.company_id, c.name,
                    a.role, a.notes, COALESCE(a.excluded, 0),
                    COUNT(DISTINCT m.id), COALESCE(SUM(m.duration_ms), 0), MAX(m.date)
             FROM attendees a
             LEFT JOIN companies c ON c.id = a.company_id
             LEFT JOIN meeting_attendees ma ON ma.attendee_id = a.id
             LEFT JOIN meetings m ON m.id = ma.meeting_id
             WHERE a.excluded = 0 AND (LOWER(a.name) LIKE ?1 OR LOWER(COALESCE(a.email, '')) LIKE ?1 OR LOWER(COALESCE(c.name, '')) LIKE ?1 OR LOWER(COALESCE(a.role, '')) LIKE ?1)
             GROUP BY a.id
             ORDER BY COUNT(DISTINCT m.id) DESC, a.name
             LIMIT 5"
        ).map_err(|e| e.to_string())?;

        let p_rows = p_stmt.query_map(params![p_like], |row| {
            Ok(Person {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                domain: row.get(3)?,
                company_id: row.get(4)?,
                company_name: row.get(5)?,
                role: row.get(6)?,
                notes: row.get(7)?,
                excluded: row.get::<_, i64>(8)? != 0,
                note_count: row.get(9)?,
                total_duration_ms: row.get(10)?,
                last_note_at: row.get(11)?,
            })
        }).map_err(|e| e.to_string())?;

        matched_people = p_rows.flatten().collect();
    }

    Ok(GlobalSearchResult {
        hits,
        matched_people,
    })
}

#[tauri::command]
pub fn search_meetings(state: State<AppState>, query: String) -> Result<Vec<Meeting>, String> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }
    let conn = state.conn()?;

    let match_expr = fts_query(trimmed);
    if !match_expr.is_empty() {
        let mut stmt = conn
            .prepare(&format!(
                "SELECT {} FROM meetings m
                 JOIN meetings_fts f ON f.rowid = m.rowid
                 WHERE meetings_fts MATCH ?1
                 ORDER BY rank LIMIT 50",
                MEETING_COLS
                    .split(", ")
                    .map(|c| format!("m.{c}"))
                    .collect::<Vec<_>>()
                    .join(", ")
            ))
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map(params![match_expr], meeting_from_row);
        if let Ok(rows) = rows {
            if let Ok(hits) = rows.collect::<Result<Vec<_>, _>>() {
                if !hits.is_empty() {
                    return Ok(hits);
                }
            }
        }
    }

    // FTS misses substrings inside words, so fall back to LIKE for short or
    // partial queries rather than showing nothing.
    let like = format!("%{trimmed}%");
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {MEETING_COLS} FROM meetings
             WHERE title LIKE ?1 OR scratchpad_raw LIKE ?1 OR ifnull(enhanced_notes_json,'') LIKE ?1
             ORDER BY date DESC LIMIT 50"
        ))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![like], meeting_from_row)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_people(state: State<AppState>) -> Result<Vec<Person>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT a.id, a.name, a.email, a.domain, a.company_id, c.name,
                    a.role, a.notes, COALESCE(a.excluded, 0),
                    COUNT(DISTINCT m.id), COALESCE(SUM(m.duration_ms), 0), MAX(m.date)
             FROM attendees a
             LEFT JOIN companies c ON c.id = a.company_id
             LEFT JOIN meeting_attendees ma ON ma.attendee_id = a.id
             LEFT JOIN meetings m ON m.id = ma.meeting_id
             GROUP BY a.id
             ORDER BY (MAX(m.date) IS NULL), MAX(m.date) DESC, a.name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Person {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                domain: row.get(3)?,
                company_id: row.get(4)?,
                company_name: row.get(5)?,
                role: row.get(6)?,
                notes: row.get(7)?,
                excluded: row.get::<_, i64>(8)? != 0,
                note_count: row.get(9)?,
                total_duration_ms: row.get(10)?,
                last_note_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_companies(state: State<AppState>) -> Result<Vec<Company>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT c.id, c.name, c.domain,
                    COUNT(DISTINCT m.id), MAX(m.date)
             FROM companies c
             LEFT JOIN attendees a
               ON a.company_id = c.id OR (c.domain IS NOT NULL AND a.domain = c.domain)
             LEFT JOIN meeting_attendees ma ON ma.attendee_id = a.id
             LEFT JOIN meetings m ON m.id = ma.meeting_id
             GROUP BY c.id
             ORDER BY (MAX(m.date) IS NULL), MAX(m.date) DESC, c.name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Company {
                id: row.get(0)?,
                name: row.get(1)?,
                domain: row.get(2)?,
                note_count: row.get(3)?,
                last_note_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_action_items(state: State<AppState>) -> Result<Vec<ActionItem>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT a.id, a.meeting_id, m.title, a.owner, a.task, a.deadline, a.done
             FROM action_items a
             JOIN meetings m ON m.id = a.meeting_id
             ORDER BY a.done ASC, ifnull(a.deadline, '9999') ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                meeting_id: row.get(1)?,
                meeting_title: row.get(2)?,
                owner: row.get(3)?,
                task: row.get(4)?,
                deadline: row.get(5)?,
                done: row.get::<_, i64>(6)? != 0,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_action_item_done(state: State<AppState>, id: String, done: bool) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE action_items SET done=?1 WHERE id=?2",
        params![if done { 1 } else { 0 }, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_action_item(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute("DELETE FROM action_items WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn upsert_person(
    state: State<AppState>,
    name: String,
    email: Option<String>,
) -> Result<Person, String> {
    let conn = state.conn()?;
    let domain = email
        .as_ref()
        .and_then(|e| e.split('@').nth(1))
        .map(|s| s.to_string());
    let id = new_id("p");
    conn.execute(
        "INSERT INTO attendees (id, name, email, domain, first_seen, last_seen)
         VALUES (?1,?2,?3,?4, datetime('now'), datetime('now'))",
        params![id, name, email, domain],
    )
    .map_err(|e| e.to_string())?;
    Ok(Person {
        id,
        name,
        email,
        domain,
        company_id: None,
        company_name: None,
        role: None,
        notes: None,
        excluded: false,
        note_count: 0,
        total_duration_ms: 0,
        last_note_at: None,
    })
}

#[tauri::command]
pub fn meetings_for_person(state: State<AppState>, person_id: String) -> Result<Vec<Meeting>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {MEETING_COLS} FROM meetings m
             JOIN meeting_attendees ma ON ma.meeting_id = m.id
             WHERE ma.attendee_id = ?1 ORDER BY m.date DESC"
        ))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![person_id], meeting_from_row)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_calendar(state: State<AppState>) -> Result<Vec<CalendarEvent>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare("SELECT id, title, start_at, end_at, attendees_json FROM calendar_events ORDER BY start_at")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(CalendarEvent {
                id: row.get(0)?,
                title: row.get(1)?,
                start_at: row.get(2)?,
                end_at: row.get(3)?,
                attendees_json: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn upsert_calendar_event(
    state: State<AppState>,
    title: String,
    start_at: String,
    attendees_json: Option<String>,
) -> Result<CalendarEvent, String> {
    let conn = state.conn()?;
    let id = new_id("cal");
    conn.execute(
        "INSERT INTO calendar_events (id, title, start_at, attendees_json, source)
         VALUES (?1,?2,?3,?4,'local')",
        params![id, title, start_at, attendees_json],
    )
    .map_err(|e| e.to_string())?;
    Ok(CalendarEvent {
        id,
        title,
        start_at,
        end_at: None,
        attendees_json,
    })
}

#[tauri::command]
pub fn pre_meeting_brief(state: State<AppState>, attendees_json: String) -> Result<String, String> {
    let conn = state.conn()?;
    let mut ctx = String::new();
    {
        let mut stmt = conn
            .prepare("SELECT title, scratchpad_raw, ifnull(enhanced_notes_json,'') FROM meetings ORDER BY date DESC LIMIT 12")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok(format!(
                    "# {}\n{}\n{}\n",
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?
                ))
            })
            .map_err(|e| e.to_string())?;
        for r in rows.flatten() {
            ctx.push_str(&r);
        }
    }
    let key = secrets::get_secret(&conn, "groq_api_key")?;
    let model = chat_model(&conn);
    drop(conn);
    let system = "Write a short pre-meeting brief: past decisions, open action items, notes on attendees.";
    let user = format!("ATTENDEES: {attendees_json}\n\nHISTORY:\n{ctx}");
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, system, &user, false, Some(&model))
    } else {
        Ok(ctx.chars().take(2500).collect())
    }
}

#[tauri::command]
pub fn set_secret(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    let conn = state.conn()?;
    secrets::set_secret(&conn, &key, &value)
}

#[tauri::command]
pub fn set_setting(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    let conn = state.conn()?;
    secrets::set_setting(&conn, &key, &value)
}

#[tauri::command]
pub fn get_setting(state: State<AppState>, key: String) -> Result<String, String> {
    let conn = state.conn()?;
    Ok(secrets::get_setting(&conn, &key, ""))
}

#[tauri::command]
pub fn copy_consent(state: State<AppState>) -> Result<String, String> {
    let conn = state.conn()?;
    Ok(secrets::get_setting(
        &conn,
        "consent_message",
        "Note: Taking notes using Bagrry",
    ))
}

#[tauri::command]
pub fn create_share(
    state: State<AppState>,
    meeting_id: String,
    visibility: Option<String>,
) -> Result<String, String> {
    let conn = state.conn()?;
    let token = new_id("sh");
    let visibility =
        visibility.unwrap_or_else(|| secrets::get_setting(&conn, "default_link_sharing", "link"));
    conn.execute(
        "INSERT INTO shares (token, meeting_id, visibility) VALUES (?1, ?2, ?3)",
        params![token, meeting_id, visibility],
    )
    .map_err(|e| e.to_string())?;
    let port = secrets::get_setting(&conn, "api_port", "47821");
    Ok(format!("http://127.0.0.1:{port}/share/{token}"))
}

#[tauri::command]
pub fn dispatch_webhook(state: State<AppState>, meeting_id: String) -> Result<String, String> {
    let conn = state.conn()?;
    let mut urls: Vec<(String, String)> = Vec::new();
    let primary = secrets::get_setting(&conn, "webhook_url", "");
    if !primary.is_empty() {
        urls.push(("webhook".into(), primary));
    }
    for name in [
        "gmail", "slack", "notion", "zapier", "affinity", "hubspot", "salesforce", "attio",
        "pipedrive",
    ] {
        let enabled = secrets::get_setting(&conn, &format!("connector_{name}"), "0");
        let url = secrets::get_setting(&conn, &format!("connector_{name}_url"), "");
        if enabled == "1" && !url.is_empty() {
            urls.push((name.into(), url));
        }
    }
    if urls.is_empty() {
        return Err("Set a webhook URL or connect an integration in Settings".into());
    }
    let meeting = conn
        .query_row(
            &format!("SELECT {MEETING_COLS} FROM meetings WHERE id=?1"),
            params![meeting_id],
            meeting_from_row,
        )
        .map_err(|e| e.to_string())?;
    drop(conn);
    let body = serde_json::json!({
        "event": "meeting.completed",
        "meeting": meeting,
    });
    let mut results = Vec::new();
    for (name, url) in urls {
        match ureq::post(&url)
            .set("Content-Type", "application/json")
            .send_json(&body)
        {
            Ok(resp) => results.push(format!("{name} {}", resp.status())),
            Err(e) => results.push(format!("{name} failed: {e}")),
        }
    }
    Ok(results.join(" · "))
}

#[tauri::command]
pub fn export_markdown(state: State<AppState>, meeting_id: String) -> Result<String, String> {
    let conn = state.conn()?;
    let m = conn
        .query_row(
            &format!("SELECT {MEETING_COLS} FROM meetings WHERE id=?1"),
            params![meeting_id],
            meeting_from_row,
        )
        .map_err(|e| e.to_string())?;
    Ok(format!(
        "# {}\n\n## My notes\n\n{}\n\n## Enhanced\n\n{}\n",
        m.title,
        m.scratchpad_raw,
        m.enhanced_notes_json.unwrap_or_default()
    ))
}

#[tauri::command]
pub fn save_attachment_text(
    state: State<AppState>,
    meeting_id: String,
    filename: String,
    extracted_text: String,
) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO attachments (id, meeting_id, filename, extracted_text) VALUES (?1,?2,?3,?4)",
        params![new_id("att"), meeting_id, filename, extracted_text],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_folder(
    state: State<AppState>,
    name: String,
    is_shared: Option<bool>,
    icon: Option<String>,
    description: Option<String>,
) -> Result<Folder, String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Folder name can't be empty".into());
    }
    let icon = icon.and_then(|s| {
        let trimmed = s.trim().to_string();
        if trimmed.is_empty() || trimmed == "folder" {
            None
        } else {
            Some(trimmed)
        }
    });
    let description = description.and_then(|s| {
        let trimmed = s.trim().to_string();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        }
    });
    let conn = state.conn()?;
    let id = new_id("folder");
    let shared = is_shared.unwrap_or(false);
    conn.execute(
        "INSERT INTO folders (id, name, is_shared, icon, description) VALUES (?1,?2,?3,?4,?5)",
        params![id, name, if shared { 1 } else { 0 }, icon, description],
    )
    .map_err(|e| e.to_string())?;
    Ok(Folder {
        id,
        parent_id: None,
        name,
        is_shared: shared,
        icon,
        description,
    })
}

#[tauri::command]
pub fn rename_folder(state: State<AppState>, id: String, name: String) -> Result<(), String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Folder name can't be empty".into());
    }
    let conn = state.conn()?;
    conn.execute("UPDATE folders SET name = ?1 WHERE id = ?2", params![name, id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Deleting a folder keeps its notes — they fall back to the inbox — because
/// losing meeting history to a mis-click is unrecoverable.
#[tauri::command]
pub fn delete_folder(state: State<AppState>, id: String) -> Result<(), String> {
    if id == "folder_inbox" {
        return Err("The default folder can't be deleted".into());
    }
    let mut conn = state.conn()?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "UPDATE meetings SET folder_id = 'folder_inbox' WHERE folder_id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM folders WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn duplicate_meeting(state: State<AppState>, id: String) -> Result<Meeting, String> {
    let conn = state.conn()?;
    let source = conn
        .query_row(
            &format!("SELECT {MEETING_COLS} FROM meetings WHERE id = ?1"),
            params![&id],
            meeting_from_row,
        )
        .map_err(|e| e.to_string())?;
    let new = new_id("mtg");
    conn.execute(
        "INSERT INTO meetings (id, folder_id, title, date, scratchpad_raw, scratchpad_json, enhanced_notes_json)
         VALUES (?1, ?2, ?3, datetime('now'), ?4, ?5, ?6)",
        params![
            &new,
            source.folder_id,
            format!("{} (copy)", source.title),
            source.scratchpad_raw,
            source.scratchpad_json,
            source.enhanced_notes_json,
        ],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        &format!("SELECT {MEETING_COLS} FROM meetings WHERE id = ?1"),
        params![new],
        meeting_from_row,
    )
    .map_err(|e| e.to_string())
}

/* ------------------------------------------------------------------ */
/* Chat sessions                                                       */
/* ------------------------------------------------------------------ */

#[derive(Serialize)]
pub struct ChatSession {
    pub id: String,
    pub title: String,
    pub space_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct ChatMessage {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub created_at: String,
}

#[tauri::command]
pub fn list_chat_sessions(state: State<AppState>) -> Result<Vec<ChatSession>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, space_id, created_at, updated_at
             FROM chat_sessions ORDER BY updated_at DESC LIMIT 100",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(ChatSession {
                id: row.get(0)?,
                title: row.get(1)?,
                space_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_chat_session(
    state: State<AppState>,
    title: String,
    space_id: Option<String>,
) -> Result<ChatSession, String> {
    let conn = state.conn()?;
    let id = new_id("chat");
    let title = if title.trim().is_empty() {
        "New chat".to_string()
    } else {
        title
    };
    conn.execute(
        "INSERT INTO chat_sessions (id, title, space_id) VALUES (?1, ?2, ?3)",
        params![&id, &title, &space_id],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, title, space_id, created_at, updated_at FROM chat_sessions WHERE id = ?1",
        params![id],
        |row| {
            Ok(ChatSession {
                id: row.get(0)?,
                title: row.get(1)?,
                space_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_chat_session(state: State<AppState>, id: String, title: String) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE chat_sessions SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![title, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_chat_session(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute("DELETE FROM chat_sessions WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_chat_messages(
    state: State<AppState>,
    session_id: String,
) -> Result<Vec<ChatMessage>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, session_id, role, content, created_at
             FROM chat_messages WHERE session_id = ?1 ORDER BY created_at, rowid",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![session_id], |row| {
            Ok(ChatMessage {
                id: row.get(0)?,
                session_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn append_chat_message(
    state: State<AppState>,
    session_id: String,
    role: String,
    content: String,
) -> Result<ChatMessage, String> {
    if role != "user" && role != "assistant" {
        return Err(format!("unsupported chat role: {role}"));
    }
    let mut conn = state.conn()?;
    let id = new_id("msg");
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO chat_messages (id, session_id, role, content) VALUES (?1,?2,?3,?4)",
        params![&id, &session_id, &role, &content],
    )
    .map_err(|e| e.to_string())?;
    tx.execute(
        "UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?1",
        params![&session_id],
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, session_id, role, content, created_at FROM chat_messages WHERE id = ?1",
        params![id],
        |row| {
            Ok(ChatMessage {
                id: row.get(0)?,
                session_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

/* ------------------------------------------------------------------ */
/* Profile & bulk settings                                             */
/* ------------------------------------------------------------------ */

#[derive(Serialize)]
pub struct Profile {
    pub name: String,
    pub email: String,
    pub workspace: String,
}

#[tauri::command]
pub fn get_profile(state: State<AppState>) -> Result<Profile, String> {
    let conn = state.conn()?;
    Ok(Profile {
        name: secrets::get_setting(&conn, "profile_name", "You"),
        email: secrets::get_setting(&conn, "profile_email", ""),
        workspace: secrets::get_setting(&conn, "workspace_name", "My workspace"),
    })
}

#[tauri::command]
pub fn set_profile(
    state: State<AppState>,
    name: String,
    email: String,
    workspace: String,
) -> Result<(), String> {
    let conn = state.conn()?;
    secrets::set_setting(&conn, "profile_name", name.trim())?;
    secrets::set_setting(&conn, "profile_email", email.trim())?;
    if !workspace.trim().is_empty() {
        secrets::set_setting(&conn, "workspace_name", workspace.trim())?;
    }
    Ok(())
}

/// One round-trip for a screen that reads several settings at once.
#[tauri::command]
pub fn get_settings(
    state: State<AppState>,
    keys: Vec<String>,
) -> Result<std::collections::HashMap<String, String>, String> {
    let conn = state.conn()?;
    let mut out = std::collections::HashMap::with_capacity(keys.len());
    for key in keys {
        let value = secrets::get_setting(&conn, &key, "");
        out.insert(key, value);
    }
    Ok(out)
}

#[tauri::command]
pub fn save_custom_template(
    state: State<AppState>,
    name: String,
    prompt_template: String,
    structure_json: String,
    icon: Option<String>,
) -> Result<Template, String> {
    let conn = state.conn()?;
    let id = new_id("tpl");
    let icon_val = icon.unwrap_or_else(|| "sparkles".into());
    conn.execute(
        "INSERT INTO templates (id, name, prompt_template, structure_json, icon)
         VALUES (?1,?2,?3,?4,?5)",
        params![&id, &name, &prompt_template, &structure_json, &icon_val],
    )
    .map_err(|e| e.to_string())?;
    Ok(Template {
        id,
        name,
        icon: Some(icon_val),
        prompt_template,
        structure_json: Some(structure_json),
    })
}

#[tauri::command]
pub fn update_custom_template(
    state: State<AppState>,
    id: String,
    name: String,
    prompt_template: String,
    structure_json: String,
    icon: Option<String>,
) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE templates SET name=?1, prompt_template=?2, structure_json=?3, icon=coalesce(?4, icon) WHERE id=?5",
        params![name, prompt_template, structure_json, icon, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_custom_template(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute("DELETE FROM templates WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize)]
pub struct Attachment {
    pub id: String,
    pub meeting_id: String,
    pub filename: String,
    pub extracted_text: Option<String>,
}

#[tauri::command]
pub fn delete_meeting(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute("DELETE FROM meetings WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn move_meeting(
    state: State<AppState>,
    id: String,
    folder_id: Option<String>,
) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE meetings SET folder_id=?1, updated_at=datetime('now') WHERE id=?2",
        params![folder_id, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_folder_shared(
    state: State<AppState>,
    id: String,
    is_shared: bool,
) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE folders SET is_shared=?1 WHERE id=?2",
        params![if is_shared { 1 } else { 0 }, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_meeting_attendees(
    state: State<AppState>,
    meeting_id: String,
) -> Result<Vec<Person>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT a.id, a.name, a.email, a.domain, a.company_id
             FROM attendees a
             JOIN meeting_attendees ma ON ma.attendee_id = a.id
             WHERE ma.meeting_id=?1
             ORDER BY a.name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![meeting_id], |row| {
            Ok(Person {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                domain: row.get(3)?,
                company_id: row.get(4)?,
                company_name: None,
                role: None,
                notes: None,
                excluded: false,
                note_count: 0,
                total_duration_ms: 0,
                last_note_at: None,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_meeting_attendee(
    state: State<AppState>,
    meeting_id: String,
    person_id: String,
) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "INSERT OR IGNORE INTO meeting_attendees (meeting_id, attendee_id) VALUES (?1,?2)",
        params![meeting_id, person_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_attachments(
    state: State<AppState>,
    meeting_id: String,
) -> Result<Vec<Attachment>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, meeting_id, filename, extracted_text FROM attachments WHERE meeting_id=?1 ORDER BY filename",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![meeting_id], |row| {
            Ok(Attachment {
                id: row.get(0)?,
                meeting_id: row.get(1)?,
                filename: row.get(2)?,
                extracted_text: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_custom_recipe(
    state: State<AppState>,
    name: String,
    prompt_template: String,
) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO recipes (id, name, prompt_template, icon) VALUES (?1,?2,?3,'sparkles')",
        params![new_id("rcp"), name, prompt_template],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn add_action_item(
    state: State<AppState>,
    meeting_id: String,
    task: String,
    owner: Option<String>,
    deadline: Option<String>,
) -> Result<ActionItem, String> {
    let conn = state.conn()?;
    let id = new_id("act");
    conn.execute(
        "INSERT INTO action_items (id, meeting_id, owner, task, deadline) VALUES (?1,?2,?3,?4,?5)",
        params![id, meeting_id, owner, task, deadline],
    )
    .map_err(|e| e.to_string())?;
    let meeting_title: String = conn
        .query_row(
            "SELECT title FROM meetings WHERE id=?1",
            params![meeting_id],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "Meeting".into());
    Ok(ActionItem {
        id,
        meeting_id,
        meeting_title,
        owner,
        task,
        deadline,
        done: false,
    })
}


#[tauri::command]
pub fn get_person_dossier(state: State<AppState>, person_id: String) -> Result<PersonDossier, String> {
    let conn = state.conn()?;
    
    // 1. Get person
    let person = conn.query_row(
        "SELECT a.id, a.name, a.email, a.domain, a.company_id, c.name,
                a.role, a.notes, COALESCE(a.excluded, 0),
                COUNT(DISTINCT m.id), COALESCE(SUM(m.duration_ms), 0), MAX(m.date)
         FROM attendees a
         LEFT JOIN companies c ON c.id = a.company_id
         LEFT JOIN meeting_attendees ma ON ma.attendee_id = a.id
         LEFT JOIN meetings m ON m.id = ma.meeting_id
         WHERE a.id = ?1
         GROUP BY a.id",
        params![&person_id],
        |row| {
            Ok(Person {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                domain: row.get(3)?,
                company_id: row.get(4)?,
                company_name: row.get(5)?,
                role: row.get(6)?,
                notes: row.get(7)?,
                excluded: row.get::<_, i64>(8)? != 0,
                note_count: row.get(9)?,
                total_duration_ms: row.get(10)?,
                last_note_at: row.get(11)?,
            })
        },
    ).map_err(|e| format!("Person not found: {e}"))?;

    // 2. Get attended meetings
    let mut stmt = conn.prepare(
        &format!(
            "SELECT {MEETING_COLS} FROM meetings m
             JOIN meeting_attendees ma ON ma.meeting_id = m.id
             WHERE ma.attendee_id = ?1
             ORDER BY m.date DESC"
        )
    ).map_err(|e| e.to_string())?;
    let meetings = stmt.query_map(params![&person_id], meeting_from_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // 3. Get action items
    let mut act_stmt = conn.prepare(
        "SELECT a.id, a.meeting_id, m.title, a.owner, a.task, a.deadline, a.done
         FROM action_items a
         JOIN meetings m ON m.id = a.meeting_id
         WHERE a.owner = ?1 OR (?2 IS NOT NULL AND a.owner = ?2) OR a.meeting_id IN (
             SELECT meeting_id FROM meeting_attendees WHERE attendee_id = ?3
         )
         ORDER BY a.done ASC, a.deadline ASC"
    ).map_err(|e| e.to_string())?;
    let action_items = act_stmt.query_map(
        params![&person.name, &person.email, &person_id],
        |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                meeting_id: row.get(1)?,
                meeting_title: row.get(2)?,
                owner: row.get(3)?,
                task: row.get(4)?,
                deadline: row.get(5)?,
                done: row.get::<_, i64>(6)? != 0,
            })
        }
    ).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    // 4. Generate pre-meeting 'Catch Me Up' briefing
    let mut brief = String::new();
    if let Some(latest) = meetings.first() {
        brief.push_str(&format!("### Recent Discussion: {}\n", latest.title));
        let date_str = latest.date.get(..10).unwrap_or(&latest.date);
        brief.push_str(&format!("*Met on {}*\n\n", date_str));
        if !latest.scratchpad_raw.trim().is_empty() {
            let lines: Vec<&str> = latest.scratchpad_raw.lines().take(5).collect();
            for line in lines {
                let trimmed = line.trim();
                if !trimmed.is_empty() {
                    brief.push_str(&format!("• {}\n", trimmed.trim_start_matches("- ")));
                }
            }
            brief.push('\n');
        }
    }
    
    let pending_items: Vec<&ActionItem> = action_items.iter().filter(|i| !i.done).collect();
    if !pending_items.is_empty() {
        brief.push_str("### Unresolved Commitments\n");
        for item in pending_items.iter().take(5) {
            let owner_badge = item.owner.as_deref().unwrap_or("Unassigned");
            brief.push_str(&format!("- [ ] **{}**: {}\n", owner_badge, item.task));
        }
    }

    let catch_me_up_brief = if brief.is_empty() {
        None
    } else {
        Some(brief)
    };

    Ok(PersonDossier {
        person,
        meetings,
        action_items,
        catch_me_up_brief,
    })
}

#[tauri::command]
pub fn update_person(
    state: State<AppState>,
    id: String,
    name: String,
    email: Option<String>,
    role: Option<String>,
    company_name: Option<String>,
    notes: Option<String>,
    excluded: Option<bool>,
) -> Result<Person, String> {
    let conn = state.conn()?;
    let domain = email.as_ref().and_then(|e| e.split('@').nth(1)).map(|s| s.to_string());
    
    // Resolve or upsert company if company_name provided
    let mut company_id: Option<String> = None;
    if let Some(ref cname) = company_name.filter(|s| !s.trim().is_empty()) {
        let existing: Result<String, _> = conn.query_row(
            "SELECT id FROM companies WHERE LOWER(name) = LOWER(?1) LIMIT 1",
            params![cname.trim()],
            |r| r.get(0),
        );
        match existing {
            Ok(cid) => company_id = Some(cid),
            Err(_) => {
                let new_cid = new_id("co");
                let _ = conn.execute(
                    "INSERT INTO companies (id, name, domain, first_seen, last_seen) VALUES (?1, ?2, ?3, datetime('now'), datetime('now'))",
                    params![&new_cid, cname.trim(), domain],
                );
                company_id = Some(new_cid);
            }
        }
    }

    let excluded_int = if excluded.unwrap_or(false) { 1 } else { 0 };

    conn.execute(
        "UPDATE attendees SET
            name = ?1,
            email = ?2,
            domain = ?3,
            role = ?4,
            company_id = COALESCE(?5, company_id),
            notes = ?6,
            excluded = ?7,
            last_seen = datetime('now')
         WHERE id = ?8",
        params![name, email, domain, role, company_id, notes, excluded_int, id],
    ).map_err(|e| e.to_string())?;

    // Return updated Person
    let mut stmt = conn.prepare(
        "SELECT a.id, a.name, a.email, a.domain, a.company_id, c.name,
                a.role, a.notes, COALESCE(a.excluded, 0),
                COUNT(DISTINCT m.id), COALESCE(SUM(m.duration_ms), 0), MAX(m.date)
         FROM attendees a
         LEFT JOIN companies c ON c.id = a.company_id
         LEFT JOIN meeting_attendees ma ON ma.attendee_id = a.id
         LEFT JOIN meetings m ON m.id = ma.meeting_id
         WHERE a.id = ?1
         GROUP BY a.id"
    ).map_err(|e| e.to_string())?;

    stmt.query_row(params![id], |row| {
        Ok(Person {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
            domain: row.get(3)?,
            company_id: row.get(4)?,
            company_name: row.get(5)?,
            role: row.get(6)?,
            notes: row.get(7)?,
            excluded: row.get::<_, i64>(8)? != 0,
            note_count: row.get(9)?,
            total_duration_ms: row.get(10)?,
            last_note_at: row.get(11)?,
        })
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_people(
    state: State<AppState>,
    primary_id: String,
    duplicate_id: String,
) -> Result<(), String> {
    if primary_id == duplicate_id {
        return Err("Cannot merge contact into itself".into());
    }
    let conn = state.conn()?;
    
    // Get duplicate name and email
    let dup_info: Result<(String, Option<String>), _> = conn.query_row(
        "SELECT name, email FROM attendees WHERE id = ?1",
        params![&duplicate_id],
        |r| Ok((r.get(0)?, r.get(1)?)),
    );
    let (dup_name, dup_email) = match dup_info {
        Ok(info) => info,
        Err(_) => return Err("Duplicate contact not found".into()),
    };

    let prim_name: String = conn.query_row(
        "SELECT name FROM attendees WHERE id = ?1",
        params![&primary_id],
        |r| r.get(0),
    ).map_err(|e| format!("Primary contact not found: {e}"))?;

    // Transfer meeting connections
    conn.execute(
        "INSERT OR IGNORE INTO meeting_attendees (meeting_id, attendee_id)
         SELECT meeting_id, ?1 FROM meeting_attendees WHERE attendee_id = ?2",
        params![&primary_id, &duplicate_id],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM meeting_attendees WHERE attendee_id = ?1",
        params![&duplicate_id],
    ).map_err(|e| e.to_string())?;

    // Update action item owner
    let _ = conn.execute(
        "UPDATE action_items SET owner = ?1 WHERE owner = ?2 OR (?3 IS NOT NULL AND owner = ?3)",
        params![&prim_name, &dup_name, &dup_email],
    );

    // Remove duplicate attendee record
    conn.execute("DELETE FROM attendees WHERE id = ?1", params![&duplicate_id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_person(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute("DELETE FROM meeting_attendees WHERE attendee_id = ?1", params![&id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM attendees WHERE id = ?1", params![&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn index_all_attendees(state: State<AppState>) -> Result<usize, String> {
    let conn = state.conn()?;
    let mut total_indexed = 0;

    // 1. Scan calendar_events for attendees
    let mut cal_stmt = conn.prepare(
        "SELECT id, title, start_at, attendees_json FROM calendar_events WHERE attendees_json IS NOT NULL"
    ).map_err(|e| e.to_string())?;

    let events: Vec<(String, String, String, String)> = cal_stmt.query_map([], |row| {
        Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
    }).map_err(|e| e.to_string())?
    .flatten()
    .collect();

    for (_event_id, title, start_at, att_json) in events {
        let attendees_parsed: Result<Vec<serde_json::Value>, _> = serde_json::from_str(&att_json);
        if let Ok(list) = attendees_parsed {
            for item in list {
                let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
                let email = item.get("email").and_then(|v| v.as_str()).map(|s| s.trim().to_lowercase());
                
                if name.is_empty() && email.as_deref().unwrap_or("").is_empty() {
                    continue;
                }
                let display_name = if name.is_empty() {
                    email.as_deref().unwrap_or("Unknown").split('@').next().unwrap_or("Unknown").to_string()
                } else {
                    name
                };

                let domain = email.as_ref().and_then(|e| e.split('@').nth(1)).map(|s| s.to_string());

                // Find existing person
                let existing_id: Option<String> = if let Some(ref em) = email {
                    conn.query_row(
                        "SELECT id FROM attendees WHERE email = ?1 LIMIT 1",
                        params![em],
                        |r| r.get(0),
                    ).ok()
                } else {
                    conn.query_row(
                        "SELECT id FROM attendees WHERE LOWER(name) = LOWER(?1) LIMIT 1",
                        params![&display_name],
                        |r| r.get(0),
                    ).ok()
                };

                let person_id = match existing_id {
                    Some(id) => {
                        let _ = conn.execute("UPDATE attendees SET last_seen = datetime('now') WHERE id = ?1", params![&id]);
                        id
                    }
                    None => {
                        let pid = new_id("p");
                        // Link company if business domain
                        let mut comp_id: Option<String> = None;
                        if let Some(ref d) = domain {
                            let common = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "proton.me"];
                            if !common.contains(&d.as_str()) {
                                let c_existing: Option<String> = conn.query_row(
                                    "SELECT id FROM companies WHERE domain = ?1 LIMIT 1",
                                    params![d],
                                    |r| r.get(0),
                                ).ok();
                                comp_id = match c_existing {
                                    Some(cid) => Some(cid),
                                    None => {
                                        let cid = new_id("co");
                                        let cname = d.split('.').next().unwrap_or("Company");
                                        let cname_cap = format!("{}{}", &cname[..1].to_uppercase(), &cname[1..]);
                                        let _ = conn.execute(
                                            "INSERT INTO companies (id, name, domain, first_seen, last_seen) VALUES (?1, ?2, ?3, datetime('now'), datetime('now'))",
                                            params![&cid, cname_cap, d],
                                        );
                                        Some(cid)
                                    }
                                };
                            }
                        }

                        let _ = conn.execute(
                            "INSERT INTO attendees (id, name, email, domain, company_id, first_seen, last_seen)
                             VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))",
                            params![&pid, &display_name, &email, &domain, &comp_id],
                        );
                        total_indexed += 1;
                        pid
                    }
                };

                // Link to matching meetings (by date prefix or exact title)
                let date_prefix = start_at.get(..10).unwrap_or("");
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO meeting_attendees (meeting_id, attendee_id)
                     SELECT id, ?1 FROM meetings
                     WHERE (date LIKE ?2 || '%' OR title = ?3)",
                    params![&person_id, date_prefix, &title],
                );
            }
        }
    }

    Ok(total_indexed)
}
