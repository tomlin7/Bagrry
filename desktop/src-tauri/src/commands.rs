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

#[derive(Serialize)]
pub struct Person {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub domain: Option<String>,
    pub company_id: Option<String>,
    pub note_count: i64,
    pub last_note_at: Option<String>,
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
        enhanced_notes_json: row.get(7)?,
        transcript_json: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

const MEETING_COLS: &str = "id, folder_id, title, date, duration_ms, calendar_event_id, scratchpad_raw, enhanced_notes_json, transcript_json, updated_at";

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
pub fn save_scratchpad(state: State<AppState>, id: String, scratchpad_raw: String) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE meetings SET scratchpad_raw = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![scratchpad_raw, id],
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
    let doc = pipeline::enhance(
        key.as_deref(),
        &meeting.scratchpad_raw,
        &segs,
        &prompt,
        &structure,
        &ctx,
        Some(&model),
    )?;
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
            "SELECT a.id, a.name, a.email, a.domain, a.company_id,
                    COUNT(m.id), MAX(m.date)
             FROM attendees a
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
                note_count: row.get(5)?,
                last_note_at: row.get(6)?,
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
        note_count: 0,
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
        "INSERT INTO meetings (id, folder_id, title, date, scratchpad_raw, enhanced_notes_json)
         VALUES (?1, ?2, ?3, datetime('now'), ?4, ?5)",
        params![
            &new,
            source.folder_id,
            format!("{} (copy)", source.title),
            source.scratchpad_raw,
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
) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO templates (id, name, prompt_template, structure_json, icon)
         VALUES (?1,?2,?3,?4,'sparkles')",
        params![new_id("tpl"), name, prompt_template, structure_json],
    )
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
                note_count: 0,
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
