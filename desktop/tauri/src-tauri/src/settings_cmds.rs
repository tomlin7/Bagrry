//! Commands that make the Settings screens functional: autostart, data
//! export/import, retention, API keys, feedback, calendar import, and the
//! full local data wipe.

use crate::ids::new_id;
use crate::secrets;
use crate::AppState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_autostart::ManagerExt;

// ---------------------------------------------------------------------------
// Launch on login

#[tauri::command]
pub fn set_launch_on_login(
    app: AppHandle,
    state: State<AppState>,
    enable: bool,
) -> Result<bool, String> {
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
// Markdown Vault Export (Obsidian / Logseq Compatible)

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultExportResult {
    pub vault_path: String,
    pub total_files: usize,
    pub total_folders: usize,
}

#[tauri::command]
pub fn export_workspace_markdown_vault(
    app: AppHandle,
    state: State<AppState>,
    destination_path: Option<String>,
) -> Result<VaultExportResult, String> {
    let conn = state.conn()?;

    // 1. Determine destination root
    let root_dir = if let Some(dest) = destination_path.filter(|p| !p.trim().is_empty()) {
        std::path::PathBuf::from(dest)
    } else {
        let base = app
            .path()
            .download_dir()
            .or_else(|_| app.path().document_dir())
            .or_else(|_| app.path().app_data_dir())
            .map_err(|e| format!("no writable destination directory: {e}"))?;
        let stamp = chrono_free_timestamp();
        base.join(format!("Bagrry-Obsidian-Vault-{stamp}"))
    };

    std::fs::create_dir_all(&root_dir).map_err(|e| format!("Failed to create vault root: {e}"))?;

    // 2. Query all folders
    let mut folder_map = std::collections::HashMap::new();
    let mut total_folders = 0;
    {
        let mut stmt = conn
            .prepare("SELECT id, name FROM folders")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
            .map_err(|e| e.to_string())?;
        for row in rows.flatten() {
            let safe_folder: String = row
                .1
                .chars()
                .map(|c| {
                    if c.is_alphanumeric() || c == ' ' || c == '-' || c == '_' {
                        c
                    } else {
                        '_'
                    }
                })
                .collect();
            let folder_dir = root_dir.join(&safe_folder);
            let _ = std::fs::create_dir_all(&folder_dir);
            folder_map.insert(row.0, (row.1, folder_dir));
            total_folders += 1;
        }
    }

    // General folder for unassigned meetings
    let general_dir = root_dir.join("General");
    let _ = std::fs::create_dir_all(&general_dir);

    // 3. Query all meetings
    let mut stmt = conn
        .prepare(
            "SELECT m.id, m.title, m.date, ifnull(m.duration_ms, 0), ifnull(m.scratchpad_raw, ''),
                    m.enhanced_notes_json, m.folder_id,
                    (SELECT group_concat(a.name, '; ') FROM attendees a
                     JOIN meeting_attendees ma ON ma.attendee_id = a.id
                     WHERE ma.meeting_id = m.id) as attendees
             FROM meetings m
             ORDER BY m.date DESC",
        )
        .map_err(|e| e.to_string())?;

    let meetings_rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<String>>(6)?,
                row.get::<_, Option<String>>(7)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut total_files = 0;

    for row in meetings_rows.flatten() {
        let (id, title, date, duration_ms, scratchpad, enh_json, folder_id, attendees_str) = row;

        let (folder_name, target_dir) =
            if let Some(fid) = folder_id.and_then(|id| folder_map.get(&id)) {
                (fid.0.clone(), fid.1.clone())
            } else {
                ("General".to_string(), general_dir.clone())
            };

        let mut action_items = Vec::new();
        if let Ok(mut act_stmt) =
            conn.prepare("SELECT task, owner, deadline, done FROM action_items WHERE meeting_id=?1")
        {
            if let Ok(act_rows) = act_stmt.query_map(params![&id], |r| {
                Ok((
                    r.get::<_, String>(0)?,
                    r.get::<_, Option<String>>(1)?,
                    r.get::<_, Option<String>>(2)?,
                    r.get::<_, i64>(3)? != 0,
                ))
            }) {
                for act in act_rows.flatten() {
                    action_items.push(act);
                }
            }
        }

        let attendees: Vec<String> = attendees_str
            .map(|s| {
                s.split("; ")
                    .map(|p| p.trim().to_string())
                    .filter(|p| !p.is_empty())
                    .collect()
            })
            .unwrap_or_default();

        let safe_title: String = title
            .chars()
            .map(|c| {
                if c.is_alphanumeric() || c == ' ' || c == '-' || c == '_' {
                    c
                } else {
                    '_'
                }
            })
            .collect();
        let safe_name = safe_title.trim();
        let file_name = if safe_name.is_empty() {
            format!("Meeting-{id}.md")
        } else {
            format!("{safe_name}.md")
        };
        let file_path = target_dir.join(file_name);

        let mut md = String::new();
        md.push_str("---\n");
        md.push_str(&format!("title: \"{}\"\n", title.replace('"', "\\\"")));
        md.push_str(&format!("date: \"{}\"\n", date));
        md.push_str(&format!("folder: \"{}\"\n", folder_name));
        md.push_str(&format!("duration_minutes: {}\n", duration_ms / 60_000));
        if !attendees.is_empty() {
            md.push_str("attendees:\n");
            for a in &attendees {
                md.push_str(&format!("  - \"[[{}]]\"\n", a.replace('"', "\\\"")));
            }
        }
        md.push_str("tags:\n  - meeting\n  - bagrry\n");
        md.push_str("---\n\n");

        md.push_str(&format!("# {}\n\n", title));
        md.push_str(&format!(
            "**Date:** {} · **Folder:** [[{}]] · **Duration:** {}m\n\n",
            date,
            folder_name,
            duration_ms / 60_000
        ));

        if !attendees.is_empty() {
            md.push_str("**Attendees:** ");
            let attendee_links: Vec<String> =
                attendees.iter().map(|a| format!("[[{}]]", a)).collect();
            md.push_str(&attendee_links.join(", "));
            md.push_str("\n\n");
        }

        if !action_items.is_empty() {
            md.push_str("## Action Items & Commitments\n\n");
            for (task, owner, deadline, done) in action_items {
                let checkbox = if done { "[x]" } else { "[ ]" };
                let mut line = format!("- {} {}", checkbox, task);
                if let Some(o) = owner {
                    line.push_str(&format!(" (Owner: [[{o}]])"));
                }
                if let Some(d) = deadline {
                    line.push_str(&format!(" (Due: {d})"));
                }
                md.push_str(&line);
                md.push('\n');
            }
            md.push('\n');
        }

        if let Some(enh) = enh_json {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&enh) {
                if let Some(sections) = val.get("sections").and_then(|s| s.as_array()) {
                    md.push_str("## Executive Summary\n\n");
                    for sec in sections {
                        if let Some(sec_title) = sec.get("section_title").and_then(|t| t.as_str()) {
                            md.push_str(&format!("### {}\n\n", sec_title));
                        }
                        if let Some(bullets) = sec.get("bullet_points").and_then(|b| b.as_array()) {
                            for b in bullets {
                                if let Some(txt) = b.get("text").and_then(|t| t.as_str()) {
                                    let mut bullet_line = format!("- {}", txt);
                                    if let Some(cits) =
                                        b.get("citation_ids").and_then(|c| c.as_array())
                                    {
                                        if !cits.is_empty() {
                                            let nums: Vec<String> = cits
                                                .iter()
                                                .filter_map(|c| {
                                                    c.as_u64().map(|n| format!("[^{}]", n))
                                                })
                                                .collect();
                                            bullet_line.push(' ');
                                            bullet_line.push_str(&nums.join(" "));
                                        }
                                    }
                                    md.push_str(&bullet_line);
                                    md.push('\n');
                                }
                            }
                            md.push('\n');
                        }
                    }
                }
            }
        }

        if !scratchpad.trim().is_empty() {
            md.push_str("## Scratchpad Notes\n\n");
            md.push_str(&scratchpad);
            md.push_str("\n\n");
        }

        md.push_str("\n---\n*Exported by Bagrry · Zero meeting bots · Local SQLite*\n");

        if std::fs::write(&file_path, md).is_ok() {
            total_files += 1;
        }
    }

    let readme = format!(
        "# Bagrry Markdown Vault\n\nThis vault contains {} meeting notes across {} folders exported from Bagrry.\n\nAll notes include YAML frontmatter, [[wiki-links]] for attendees and folders, and Obsidian checkbox action items.\n",
        total_files,
        total_folders + 1
    );
    let _ = std::fs::write(root_dir.join("README.md"), readme);

    Ok(VaultExportResult {
        vault_path: root_dir.to_string_lossy().into_owned(),
        total_files,
        total_folders: total_folders + 1,
    })
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
        let title = if title.is_empty() {
            "Imported note"
        } else {
            title
        };
        conn.execute(
            "INSERT INTO meetings (id, folder_id, title, date, scratchpad_raw)
             VALUES (?1, NULL, ?2, ifnull(?3, datetime('now')), ?4)",
            params![new_id("mtg"), title, note.date, note.body],
        )
        .map_err(|e| e.to_string())?;
        imported += 1;
    }
    let _ = crate::commands::index_all_attendees(state);
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
                token_tail: token
                    .chars()
                    .rev()
                    .take(4)
                    .collect::<String>()
                    .chars()
                    .rev()
                    .collect(),
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
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
pub fn create_api_key(
    state: State<AppState>,
    label: String,
    kind: String,
) -> Result<String, String> {
    let conn = state.conn()?;
    let token = format!("bag_sk_{}", random_token());
    let label = if label.trim().is_empty() {
        "API key".to_string()
    } else {
        label
    };
    let kind = if kind == "workspace" {
        "workspace"
    } else {
        "personal"
    };
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
pub fn submit_feedback(
    state: State<AppState>,
    category: String,
    content: String,
) -> Result<(), String> {
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
                    let title = if summary.is_empty() {
                        "Untitled event"
                    } else {
                        summary.as_str()
                    };
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
    let code = new_id("ref")
        .replace("ref_", "")
        .chars()
        .take(8)
        .collect::<String>();
    secrets::set_setting(&conn, "referral_code", &code)?;
    Ok(code)
}
