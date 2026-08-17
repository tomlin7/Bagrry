//! Commands that make the Settings screens functional: autostart, data
//! export/import, retention, API keys, feedback, calendar import, and the
//! full local data wipe.

use crate::ids::new_id;
use crate::secrets;
use crate::AppState;
use rusqlite::params;
use serde::Serialize;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_autostart::ManagerExt;

// ---------------------------------------------------------------------------
// Launch on login

#[tauri::command]
pub fn set_launch_on_login(app: AppHandle, state: State<AppState>, enable: bool) -> Result<bool, String> {
    let manager = app.autolaunch();
    let result = if enable {
        manager.enable()
    } else {
        manager.disable()
    };
    result.map_err(|e| format!("autostart: {e}"))?;
    let conn = state.conn()?;
    secrets::set_setting(&conn, "launch_on_login", if enable { "1" } else { "0" })?;
    Ok(enable)
}

#[tauri::command]
pub fn get_launch_on_login(app: AppHandle) -> Result<bool, String> {
    app.autolaunch()
        .is_enabled()
        .map_err(|e| format!("autostart: {e}"))
}

// ---------------------------------------------------------------------------
// Transcript retention

/// Deletes transcripts older than the configured retention window. Runs at
/// startup and whenever the user changes the preference.
pub fn apply_retention_inner(conn: &rusqlite::Connection) -> Result<u64, String> {
    let days = secrets::get_setting(conn, "transcript_retention", "off");
    let days: i64 = match days.as_str() {
        "off" | "" => return Ok(0),
        n => n.parse().map_err(|_| format!("bad retention value: {n}"))?,
    };
    let cutoff_sql = format!("-{days} days");
    let deleted = conn
        .execute(
            "DELETE FROM transcript_segments WHERE meeting_id IN (
               SELECT id FROM meetings WHERE date < datetime('now', ?1)
             )",
            params![cutoff_sql],
        )
        .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE meetings SET transcript_json = NULL
         WHERE date < datetime('now', ?1) AND transcript_json IS NOT NULL",
        params![cutoff_sql],
    )
    .map_err(|e| e.to_string())?;
    Ok(deleted as u64)
}

#[tauri::command]
pub fn apply_retention(state: State<AppState>) -> Result<u64, String> {
    let conn = state.conn()?;
    apply_retention_inner(&conn)
}

// ---------------------------------------------------------------------------
// CSV export

#[tauri::command]
pub fn export_csv(app: AppHandle, state: State<AppState>) -> Result<String, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT m.title, m.date, ifnull(m.duration_ms, 0), ifnull(f.name, ''),
                    (SELECT group_concat(a.name, '; ') FROM attendees a
                      JOIN meeting_attendees ma ON ma.attendee_id = a.id
                      WHERE ma.meeting_id = m.id)
             FROM meetings m LEFT JOIN folders f ON f.id = m.folder_id
             ORDER BY m.date DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, Option<String>>(4)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    fn csv_cell(s: &str) -> String {
        if s.contains(['"', ',', '\n']) {
            format!("\"{}\"", s.replace('"', "\"\""))
        } else {
            s.to_string()
        }
    }

    let mut csv = String::from("title,date,duration_minutes,folder,attendees\n");
    for row in rows {
        let (title, date, dur_ms, folder, attendees) = row.map_err(|e| e.to_string())?;
        csv.push_str(&format!(
            "{},{},{},{},{}\n",
            csv_cell(&title),
            csv_cell(&date),
            dur_ms / 60_000,
            csv_cell(&folder),
            csv_cell(&attendees.unwrap_or_default()),
        ));
    }

    let dir = app
        .path()
        .download_dir()
        .or_else(|_| app.path().document_dir())
        .or_else(|_| app.path().app_data_dir())
        .map_err(|e| format!("no writable directory: {e}"))?;
    let stamp = chrono_free_timestamp();
    let path = dir.join(format!("bagrry-notes-{stamp}.csv"));
    std::fs::write(&path, csv).map_err(|e| format!("write csv: {e}"))?;
    Ok(path.to_string_lossy().into_owned())
}

/// yyyymmdd-hhmmss without pulling in chrono.
fn chrono_free_timestamp() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    // Days since epoch → civil date (Howard Hinnant's algorithm).
    let days = (secs / 86_400) as i64;
    let rem = secs % 86_400;
    let (h, m, s) = (rem / 3600, (rem % 3600) / 60, rem % 60);
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let mo = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if mo <= 2 { y + 1 } else { y };
    format!("{y:04}{mo:02}{d:02}-{h:02}{m:02}{s:02}")
}

// ---------------------------------------------------------------------------
// Note import

#[derive(serde::Deserialize)]
pub struct ImportNote {
    pub title: String,
    pub body: String,
    pub date: Option<String>,
}

/// Imports notes handed over by the frontend (which reads files the user
/// picked). Each note becomes a regular meeting in the inbox.
#[tauri::command]
pub fn import_notes(state: State<AppState>, notes: Vec<ImportNote>) -> Result<usize, String> {
    let conn = state.conn()?;
    let mut imported = 0;
    for note in notes {
        let title = note.title.trim();
        if title.is_empty() && note.body.trim().is_empty() {
            continue;
        }
        let title = if title.is_empty() { "Imported note" } else { title };
        conn.execute(
            "INSERT INTO meetings (id, folder_id, title, date, scratchpad_raw)
             VALUES (?1, NULL, ?2, ifnull(?3, datetime('now')), ?4)",
            params![new_id("mtg"), title, note.date, note.body],
        )
        .map_err(|e| e.to_string())?;
        imported += 1;
    }
    Ok(imported)
}

// ---------------------------------------------------------------------------
// Account wipe

/// Deletes all user data and restores the app to first-run state. Settings
/// intentionally survive only for `api_port` so the local server keeps working.
#[tauri::command]
pub fn delete_all_data(state: State<AppState>) -> Result<(), String> {
    let conn = state.conn()?;
    let port = secrets::get_setting(&conn, "api_port", "47821");
    conn.execute_batch(
        "DELETE FROM meeting_attendees;
         DELETE FROM transcript_segments;
         DELETE FROM action_items;
         DELETE FROM attachments;
         DELETE FROM shares;
         DELETE FROM vectors;
         DELETE FROM chat_messages;
         DELETE FROM chat_sessions;
         DELETE FROM chat_logs;
         DELETE FROM meetings;
         DELETE FROM attendees;
         DELETE FROM companies;
         DELETE FROM calendar_events;
         DELETE FROM feedback;
         DELETE FROM api_keys;
         DELETE FROM webhooks;
         DELETE FROM settings;",
    )
    .map_err(|e| e.to_string())?;
    secrets::set_setting(&conn, "api_port", &port)?;
    Ok(())
}

// ---------------------------------------------------------------------------
// API keys

#[derive(Serialize)]
pub struct ApiKey {
    pub id: String,
    pub label: String,
    pub kind: String,
    /// Only the last four characters; the full token is returned once at creation.
    pub token_tail: String,
    pub created_at: String,
}

#[tauri::command]
pub fn list_api_keys(state: State<AppState>) -> Result<Vec<ApiKey>, String> {
    let conn = state.conn()?;
    let mut stmt = conn
        .prepare("SELECT id, label, kind, token, created_at FROM api_keys ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let token: String = row.get(3)?;
            Ok(ApiKey {
                id: row.get(0)?,
                label: row.get(1)?,
                kind: row.get(2)?,
                token_tail: token.chars().rev().take(4).collect::<String>().chars().rev().collect(),
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

/// 128 bits of entropy via the std hasher's OS-seeded RandomState — no extra
/// crates needed, and plenty for a localhost API token.
fn random_token() -> String {
    use std::hash::{BuildHasher, Hasher};
    let mut out = String::with_capacity(32);
    for i in 0..2u64 {
        let mut h = std::collections::hash_map::RandomState::new().build_hasher();
        h.write_u64(i);
        h.write_u128(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos())
                .unwrap_or(0),
        );
        out.push_str(&format!("{:016x}", h.finish()));
    }
    out
}

#[tauri::command]
pub fn create_api_key(state: State<AppState>, label: String, kind: String) -> Result<String, String> {
    let conn = state.conn()?;
    let token = format!("bag_sk_{}", random_token());
    let label = if label.trim().is_empty() { "API key".to_string() } else { label };
    let kind = if kind == "workspace" { "workspace" } else { "personal" };
    conn.execute(
        "INSERT INTO api_keys (id, label, kind, token) VALUES (?1, ?2, ?3, ?4)",
        params![new_id("key"), label.trim(), kind, token],
    )
    .map_err(|e| e.to_string())?;
    Ok(token)
}

#[tauri::command]
pub fn revoke_api_key(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute("DELETE FROM api_keys WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Feedback

#[tauri::command]
pub fn submit_feedback(state: State<AppState>, category: String, content: String) -> Result<(), String> {
    if content.trim().is_empty() {
        return Err("Write something first.".into());
    }
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO feedback (id, category, content) VALUES (?1, ?2, ?3)",
        params![new_id("fb"), category, content.trim()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Calendar: ICS import + reset

/// Minimal RFC 5545 parser: unfolds lines, extracts VEVENT SUMMARY/DTSTART/
/// DTEND/ATTENDEE. Good enough for calendar exports from Google/Outlook.
#[tauri::command]
pub fn import_ics(state: State<AppState>, content: String) -> Result<usize, String> {
    // Unfold continuation lines (leading space/tab joins to previous line).
    let mut lines: Vec<String> = Vec::new();
    for raw in content.lines() {
        if (raw.starts_with(' ') || raw.starts_with('\t')) && !lines.is_empty() {
            let last = lines.last_mut().unwrap();
            last.push_str(raw.trim_start());
        } else {
            lines.push(raw.trim_end().to_string());
        }
    }

    fn parse_dt(v: &str) -> Option<String> {
        // Forms: 20260817T140000Z / 20260817T140000 / 20260817
        let v = v.trim();
        let digits: String = v.chars().filter(|c| c.is_ascii_digit()).collect();
        if digits.len() >= 8 {
            let (y, mo, d) = (&digits[0..4], &digits[4..6], &digits[6..8]);
            let (h, mi, s) = if digits.len() >= 14 {
                (&digits[8..10], &digits[10..12], &digits[12..14])
            } else {
                ("00", "00", "00")
            };
            Some(format!("{y}-{mo}-{d} {h}:{mi}:{s}"))
        } else {
            None
        }
    }

    let conn = state.conn()?;
    let mut imported = 0;
    let mut in_event = false;
    let mut summary = String::new();
    let mut dtstart: Option<String> = None;
    let mut dtend: Option<String> = None;
    let mut attendees: Vec<serde_json::Value> = Vec::new();

    for line in &lines {
        if line.eq_ignore_ascii_case("BEGIN:VEVENT") {
            in_event = true;
            summary.clear();
            dtstart = None;
            dtend = None;
            attendees.clear();
            continue;
        }
        if line.eq_ignore_ascii_case("END:VEVENT") {
            if in_event {
                if let Some(start) = dtstart.take() {
                    let title = if summary.is_empty() { "Untitled event" } else { summary.as_str() };
                    let attendees_json = if attendees.is_empty() {
                        None
                    } else {
                        serde_json::to_string(&attendees).ok()
                    };
                    conn.execute(
                        "INSERT INTO calendar_events (id, title, start_at, end_at, attendees_json, source)
                         VALUES (?1, ?2, ?3, ?4, ?5, 'ics')",
                        params![new_id("cal"), title, start, dtend, attendees_json],
                    )
                    .map_err(|e| e.to_string())?;
                    imported += 1;
                }
            }
            in_event = false;
            continue;
        }
        if !in_event {
            continue;
        }
        let (name, value) = match line.split_once(':') {
            Some(pair) => pair,
            None => continue,
        };
        let prop = name.split(';').next().unwrap_or("").to_ascii_uppercase();
        match prop.as_str() {
            "SUMMARY" => summary = value.trim().to_string(),
            "DTSTART" => dtstart = parse_dt(value),
            "DTEND" => dtend = parse_dt(value),
            "ATTENDEE" => {
                let email = value.trim().trim_start_matches("mailto:").to_string();
                // CN=Name may live in the property parameters.
                let cn = name
                    .split(';')
                    .find_map(|p| p.strip_prefix("CN="))
                    .unwrap_or(&email)
                    .trim_matches('"')
                    .to_string();
                attendees.push(serde_json::json!({ "name": cn, "email": email }));
            }
            _ => {}
        }
    }
    Ok(imported)
}

#[tauri::command]
pub fn reset_calendar(state: State<AppState>) -> Result<(), String> {
    let conn = state.conn()?;
    conn.execute("DELETE FROM calendar_events", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Referral code

#[tauri::command]
pub fn get_referral_code(state: State<AppState>) -> Result<String, String> {
    let conn = state.conn()?;
    let existing = secrets::get_setting(&conn, "referral_code", "");
    if !existing.is_empty() {
        return Ok(existing);
    }
    let code = new_id("ref").replace("ref_", "").chars().take(8).collect::<String>();
    secrets::set_setting(&conn, "referral_code", &code)?;
    Ok(code)
}
