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
}

#[derive(Serialize)]
pub struct Company {
    pub id: String,
    pub name: String,
    pub domain: Option<String>,
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, parent_id, name, is_shared FROM folders ORDER BY name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Folder {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                name: row.get(2)?,
                is_shared: row.get::<_, i64>(3)? != 0,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_meetings(state: State<AppState>, folder_id: Option<String>) -> Result<Vec<Meeting>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        &format!("SELECT {MEETING_COLS} FROM meetings WHERE id = ?1"),
        params![id],
        meeting_from_row,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_templates(state: State<AppState>) -> Result<Vec<Template>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE meetings SET scratchpad_raw = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![scratchpad_raw, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_title(state: State<AppState>, id: String, title: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE meetings SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![title, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn start_recording(app: AppHandle) -> Result<audio::RecStatus, String> {
    audio::start(&app)
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
    let wav = audio::take_pending_wav(&app)?.ok_or_else(|| "no audio in memory".to_string())?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let key = secrets::get_secret(&conn, "groq_api_key")?.ok_or_else(|| {
        "Add a Groq API key in Settings to transcribe.".to_string()
    })?;
    drop(conn);
    let segs = pipeline::transcribe_dual_wav(&key, &wav)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    pipeline::persist_transcript(&conn, &meeting_id, &segs)?;
    Ok(segs)
}

#[tauri::command]
pub fn list_segments(state: State<AppState>, meeting_id: String) -> Result<Vec<TranscriptSeg>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    pipeline::load_segments(&conn, &meeting_id)
}

#[tauri::command]
pub fn enhance_meeting(
    state: State<AppState>,
    meeting_id: String,
    template_id: Option<String>,
) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    drop(conn);
    let doc = pipeline::enhance(
        key.as_deref(),
        &meeting.scratchpad_raw,
        &segs,
        &prompt,
        &structure,
    )?;
    let json = serde_json::to_string(&doc).map_err(|e| e.to_string())?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    Ok(json)
}

#[tauri::command]
pub fn run_recipe(state: State<AppState>, meeting_id: String, recipe_id: String) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    drop(conn);
    let user = format!(
        "NOTES:\n{}\n\nENHANCED:\n{}",
        meeting.scratchpad_raw,
        meeting.enhanced_notes_json.unwrap_or_default()
    );
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, &recipe, &user, false)
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let segs = pipeline::load_segments(&conn, &meeting_id)?;
    let key = secrets::get_secret(&conn, "groq_api_key")?;
    drop(conn);
    let transcript = segs
        .iter()
        .map(|s| format!("[{}] {}", s.sentence_id, s.text))
        .collect::<Vec<_>>()
        .join("\n");
    let system = "Rewrite only the provided selection. Keep citations if present.";
    let user = format!("INSTRUCTION: {instruction}\n\nSELECTION:\n{selection}\n\nTRANSCRIPT:\n{transcript}");
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, system, &user, false)
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    drop(conn);
    let system = "Answer from the meeting notes. Cite meeting titles. If unknown, say so.";
    let user = format!("QUESTION: {query}\n\nNOTES:\n{context}");
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, system, &user, false)
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let key = secrets::get_secret(&conn, "groq_api_key")?;
    drop(conn);
    let system = "You are an in-meeting copilot. Be brief. Use only the live transcript.";
    let user = format!("LIVE TRANSCRIPT:\n{live_transcript}\n\nQUESTION: {query}");
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, system, &user, false)
    } else {
        Ok("Live copilot needs a Groq API key in Settings.".into())
    }
}

#[tauri::command]
pub fn search_meetings(state: State<AppState>, query: String) -> Result<Vec<Meeting>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let like = format!("%{query}%");
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, email, domain, company_id FROM attendees ORDER BY name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Person {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                domain: row.get(3)?,
                company_id: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_companies(state: State<AppState>) -> Result<Vec<Company>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, domain FROM companies ORDER BY name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Company {
                id: row.get(0)?,
                name: row.get(1)?,
                domain: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn upsert_person(
    state: State<AppState>,
    name: String,
    email: Option<String>,
) -> Result<Person, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    })
}

#[tauri::command]
pub fn meetings_for_person(state: State<AppState>, person_id: String) -> Result<Vec<Meeting>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let system = "Write a short pre-meeting brief: past decisions, open action items, notes on attendees.";
    let user = format!("ATTENDEES: {attendees_json}\n\nHISTORY:\n{ctx}");
    if let Some(k) = key.filter(|s| !s.is_empty()) {
        groq::chat(&k, system, &user, false)
    } else {
        Ok(ctx.chars().take(2500).collect())
    }
}

#[tauri::command]
pub fn set_secret(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    secrets::set_secret(&conn, &key, &value)
}

#[tauri::command]
pub fn set_setting(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    secrets::set_setting(&conn, &key, &value)
}

#[tauri::command]
pub fn get_setting(state: State<AppState>, key: String) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    Ok(secrets::get_setting(&conn, &key, ""))
}

#[tauri::command]
pub fn copy_consent(state: State<AppState>) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    Ok(secrets::get_setting(
        &conn,
        "consent_message",
        "Note: Taking notes using Bagrry",
    ))
}

#[tauri::command]
pub fn create_share(state: State<AppState>, meeting_id: String) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let token = new_id("sh");
    conn.execute(
        "INSERT INTO shares (token, meeting_id) VALUES (?1, ?2)",
        params![token, meeting_id],
    )
    .map_err(|e| e.to_string())?;
    let port = secrets::get_setting(&conn, "api_port", "47821");
    Ok(format!("http://127.0.0.1:{port}/share/{token}"))
}

#[tauri::command]
pub fn dispatch_webhook(state: State<AppState>, meeting_id: String) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let url = secrets::get_setting(&conn, "webhook_url", "");
    if url.is_empty() {
        return Err("Set webhook_url in Settings".into());
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
    let resp = ureq::post(&url)
        .set("Content-Type", "application/json")
        .send_json(body)
        .map_err(|e| e.to_string())?;
    Ok(format!("webhook {}", resp.status()))
}

#[tauri::command]
pub fn export_markdown(state: State<AppState>, meeting_id: String) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
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
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO attachments (id, meeting_id, filename, extracted_text) VALUES (?1,?2,?3,?4)",
        params![new_id("att"), meeting_id, filename, extracted_text],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_folder(state: State<AppState>, name: String) -> Result<Folder, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let id = new_id("folder");
    conn.execute(
        "INSERT INTO folders (id, name, is_shared) VALUES (?1,?2,0)",
        params![id, name],
    )
    .map_err(|e| e.to_string())?;
    Ok(Folder {
        id,
        parent_id: None,
        name,
        is_shared: false,
    })
}

#[tauri::command]
pub fn save_custom_template(
    state: State<AppState>,
    name: String,
    prompt_template: String,
    structure_json: String,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO templates (id, name, prompt_template, structure_json, icon)
         VALUES (?1,?2,?3,?4,'sparkles')",
        params![new_id("tpl"), name, prompt_template, structure_json],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
