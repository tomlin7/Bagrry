use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConferenceLink {
    pub platform: String, // "zoom", "google_meet", "teams", "webex", "other"
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpcomingMeetingEvent {
    pub id: String,
    pub title: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub conference_link: Option<ConferenceLink>,
    pub attendees_count: i64,
}

/// Parses plain text, location, or descriptions to find active conference links
pub fn extract_conference_link(text: &str) -> Option<ConferenceLink> {
    for word in text.split_whitespace() {
        let clean = word.trim_matches(|c: char| c == '<' || c == '>' || c == '(' || c == ')' || c == '"' || c == '\'');
        if clean.contains("zoom.us/j/") || clean.contains("zoom.us/my/") {
            return Some(ConferenceLink {
                platform: "zoom".into(),
                url: clean.to_string(),
            });
        }
        if clean.contains("meet.google.com/") {
            return Some(ConferenceLink {
                platform: "google_meet".into(),
                url: clean.to_string(),
            });
        }
        if clean.contains("teams.microsoft.com/l/meetup-join") || clean.contains("teams.live.com/meet") {
            return Some(ConferenceLink {
                platform: "teams".into(),
                url: clean.to_string(),
            });
        }
        if clean.contains("webex.com/meet/") || clean.contains("webex.com/m/") {
            return Some(ConferenceLink {
                platform: "webex".into(),
                url: clean.to_string(),
            });
        }
    }
    None
}

pub fn list_upcoming_calendar_events(conn: &Connection) -> Result<Vec<UpcomingMeetingEvent>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, start_time, end_time, ifnull(description, ''), ifnull(location, '')
             FROM calendar_events
             WHERE datetime(start_time) >= datetime('now', '-15 minutes')
             ORDER BY start_time ASC LIMIT 10",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let id: String = row.get(0)?;
            let title: String = row.get(1)?;
            let start_time: String = row.get(2)?;
            let end_time: Option<String> = row.get(3)?;
            let desc: String = row.get(4)?;
            let loc: String = row.get(5)?;

            let conf = extract_conference_link(&loc)
                .or_else(|| extract_conference_link(&desc))
                .or_else(|| extract_conference_link(&title));

            Ok(UpcomingMeetingEvent {
                id,
                title,
                start_time,
                end_time,
                conference_link: conf,
                attendees_count: 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut events = Vec::new();
    for r in rows {
        if let Ok(ev) = r {
            events.push(ev);
        }
    }
    Ok(events)
}
