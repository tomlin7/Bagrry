use crate::db;
use crate::AppState;
use rusqlite::params;
use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, State};

fn new_id(prefix: &str) -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("{prefix}_{nanos}")
}

#[derive(Serialize)]
pub struct DbStatus {
    pub path: String,
    pub sqlite_version: String,
    pub vec_enabled: bool,
    pub meeting_count: i64,
}

#[derive(Serialize)]
pub struct Folder {
    pub id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub is_shared: bool,
}

#[derive(Serialize)]
pub struct Meeting {
    pub id: String,
    pub folder_id: Option<String>,
    pub title: String,
    pub date: String,
    pub duration_ms: Option<i64>,
    pub calendar_event_id: Option<String>,
    pub scratchpad_raw: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
}

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
    let path = db::db_path(&app)?
        .to_string_lossy()
        .to_string();
    Ok(DbStatus {
        path,
        sqlite_version,
        vec_enabled,
        meeting_count,
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
pub fn list_meetings(state: State<AppState>) -> Result<Vec<Meeting>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, folder_id, title, date, duration_ms, calendar_event_id, scratchpad_raw, updated_at
             FROM meetings ORDER BY date DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Meeting {
                id: row.get(0)?,
                folder_id: row.get(1)?,
                title: row.get(2)?,
                date: row.get(3)?,
                duration_ms: row.get(4)?,
                calendar_event_id: row.get(5)?,
                scratchpad_raw: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_templates(state: State<AppState>) -> Result<Vec<Template>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, icon FROM templates ORDER BY name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Template {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
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
        "SELECT id, folder_id, title, date, duration_ms, calendar_event_id, scratchpad_raw, updated_at
         FROM meetings WHERE id = ?1",
        params![&id],
        |row| {
            Ok(Meeting {
                id: row.get(0)?,
                folder_id: row.get(1)?,
                title: row.get(2)?,
                date: row.get(3)?,
                duration_ms: row.get(4)?,
                calendar_event_id: row.get(5)?,
                scratchpad_raw: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_recording(app: AppHandle) -> Result<crate::audio::RecStatus, String> {
    crate::audio::start(&app)
}

#[tauri::command]
pub fn stop_recording(app: AppHandle) -> Result<crate::audio::RecStatus, String> {
    crate::audio::stop(&app)
}

#[tauri::command]
pub fn pause_recording(app: AppHandle) -> Result<crate::audio::RecStatus, String> {
    crate::audio::pause(&app)
}

#[tauri::command]
pub fn toggle_recording(app: AppHandle) -> Result<crate::audio::RecStatus, String> {
    crate::audio::toggle(&app)
}

#[tauri::command]
pub fn recording_status(app: AppHandle) -> Result<crate::audio::RecStatus, String> {
    crate::audio::status(&app)
}

#[tauri::command]
pub fn discard_audio(app: AppHandle) -> Result<crate::audio::RecStatus, String> {
    crate::audio::discard_pending(&app)
}
