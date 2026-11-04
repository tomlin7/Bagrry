use crate::ids::new_id;
use crate::pipeline::TranscriptSeg;
use crate::AppState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct VoiceCommandEvent {
    pub meeting_id: Option<String>,
    pub raw_text: String,
    pub command_type: String, // "action_item" | "bookmark" | "summary"
    pub extracted_content: String,
    pub assignee: Option<String>,
    pub timestamp_ms: i64,
}

/// Detects voice hotword commands ("Hey Bagrry...") in live transcribed speech.
pub fn process_voice_commands(
    app: &AppHandle,
    meeting_id: Option<&str>,
    segments: &[TranscriptSeg],
) {
    for seg in segments {
        let text_lower = seg.text.to_lowercase();
        if !text_lower.contains("hey bagrry")
            && !text_lower.contains("bagrry,")
            && !text_lower.contains("hey bagry")
        {
            continue;
        }

        // Strip the hotword trigger prefix
        let remainder = text_lower
            .replace("hey bagrry", "")
            .replace("hey bagry", "")
            .replace("bagrry,", "")
            .replace("bagrry", "")
            .trim()
            .trim_start_matches(',')
            .trim_start_matches(':')
            .trim()
            .to_string();

        if remainder.is_empty() {
            continue;
        }

        let (cmd_type, extracted, assignee) = parse_command_intent(&remainder);

        // If action item and meeting_id is known, persist into SQLite database
        if cmd_type == "action_item" {
            if let Some(mid) = meeting_id {
                let state = app.state::<AppState>();
                if let Ok(conn) = state.conn() {
                    let item_id = new_id("act");
                    let now = chrono_now();
                    let _ = conn.execute(
                        "INSERT INTO action_items (id, meeting_id, task, owner, deadline, done, created_at)
                         VALUES (?1, ?2, ?3, ?4, NULL, 0, ?5)",
                        params![item_id, mid, extracted, assignee, now],
                    );
                }
            }
        }

        let event = VoiceCommandEvent {
            meeting_id: meeting_id.map(|s| s.to_string()),
            raw_text: seg.text.clone(),
            command_type: cmd_type.clone(),
            extracted_content: extracted.clone(),
            assignee: assignee.clone(),
            timestamp_ms: seg.start_ms,
        };

        // Notify frontend listeners (HUD, pill, toast)
        let _ = app.emit("voice-command-detected", event);

        // Native toast notification
        let notif_title = match cmd_type.as_str() {
            "action_item" => "🎙️ Voice Action Item Created",
            "bookmark" => "🎙️ Moment Bookmarked",
            _ => "🎙️ Voice Command Detected",
        };
        crate::tray::notify(
            app,
            notif_title,
            &format!("{}: {}", cmd_type.to_uppercase(), extracted),
        );
    }
}

fn parse_command_intent(input: &str) -> (String, String, Option<String>) {
    let lower = input.to_lowercase();

    // Check for Action Item / Task commands
    if lower.contains("action item")
        || lower.contains("todo")
        || lower.contains("task")
        || lower.contains("assign")
    {
        let mut clean = lower
            .replace("add an action item", "")
            .replace("add action item", "")
            .replace("create an action item", "")
            .replace("action item", "")
            .replace("todo", "")
            .replace("task", "")
            .trim()
            .to_string();

        let mut assignee = None;
        if let Some(rest) = clean.strip_prefix("for ") {
            let candidate = rest.split_whitespace().next().unwrap_or("").trim();
            if !candidate.is_empty() {
                assignee = Some(capitalize_word(candidate));
            }
        } else if clean.contains(" for ") {
            let parts: Vec<&str> = clean.splitn(2, " for ").collect();
            if parts.len() == 2 {
                let candidate = parts[1].split_whitespace().next().unwrap_or("").trim();
                if !candidate.is_empty() {
                    assignee = Some(capitalize_word(candidate));
                }
            }
        } else if let Some(rest) = clean.strip_prefix("to ") {
            let candidate = rest.split_whitespace().next().unwrap_or("").trim();
            if !candidate.is_empty() {
                assignee = Some(capitalize_word(candidate));
            }
        } else if clean.contains(" to ") {
            let parts: Vec<&str> = clean.splitn(2, " to ").collect();
            if parts.len() == 2 {
                let candidate = parts[1].split_whitespace().next().unwrap_or("").trim();
                if !candidate.is_empty() {
                    assignee = Some(capitalize_word(candidate));
                }
            }
        }

        if clean.starts_with("for ") {
            if let Some(idx) = clean.find(':') {
                clean = clean[idx + 1..].trim().to_string();
            } else if let Some(idx) = clean.find(" to ") {
                clean = clean[idx + 4..].trim().to_string();
            }
        }

        let final_task = if clean.is_empty() {
            input.to_string()
        } else {
            capitalize_word(&clean)
        };

        return ("action_item".to_string(), final_task, assignee);
    }

    // Check for Bookmark / Flag commands
    if lower.contains("bookmark")
        || lower.contains("flag")
        || lower.contains("note this")
        || lower.contains("mark this")
    {
        return (
            "bookmark".to_string(),
            input
                .replace("bookmark", "")
                .replace("flag", "")
                .trim()
                .to_string(),
            None,
        );
    }

    // Check for Summarize commands
    if lower.contains("summarize") || lower.contains("recap") || lower.contains("catch me up") {
        return (
            "summary".to_string(),
            "Synthesize immediate discussion summary and consensus points.".to_string(),
            None,
        );
    }

    ("general".to_string(), input.to_string(), None)
}

fn capitalize_word(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + chars.as_str(),
    }
}

fn chrono_now() -> String {
    // Current ISO timestamp string
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_action_item_with_assignee() {
        let (cmd, task, assignee) =
            parse_command_intent("create an action item for Alex to test release build");
        assert_eq!(cmd, "action_item");
        assert_eq!(assignee, Some("Alex".to_string()));
        assert!(!task.is_empty());
    }

    #[test]
    fn test_parse_bookmark_intent() {
        let (cmd, task, _) = parse_command_intent("bookmark this important budget decision");
        assert_eq!(cmd, "bookmark");
        assert!(task.contains("important budget decision"));
    }

    #[test]
    fn test_parse_summary_intent() {
        let (cmd, _, _) = parse_command_intent("recap what we just covered");
        assert_eq!(cmd, "summary");
    }
}
