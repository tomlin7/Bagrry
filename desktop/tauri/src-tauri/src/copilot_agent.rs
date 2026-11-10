use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CopilotFlashCard {
    pub id: String,
    pub meeting_id: String,
    pub trigger_text: String,
    pub source_type: String, // "linear", "github", "jira", "docs", "meeting_memory"
    pub title: String,
    pub snippet: String,
    pub url: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedTrigger {
    pub trigger_text: String,
    pub source_type: String,
    pub query: String,
}

/// Detects conversational triggers in spoken utterances:
/// e.g. "ticket ENG-402", "PR 124", "did we ship the billing fix", "action item from last week"
pub fn detect_triggers(utterance: &str) -> Vec<DetectedTrigger> {
    let mut triggers = Vec::new();
    let lower = utterance.to_lowercase();

    // 1. Ticket identifier patterns (e.g. ENG-123, BUG-404, PROD-99)
    let words: Vec<&str> = utterance.split_whitespace().collect();
    for word in words {
        let clean = word.trim_matches(|c: char| !c.is_alphanumeric() && c != '-');
        if let Some((prefix, num)) = clean.split_once('-') {
            if prefix.len() >= 2
                && prefix.chars().all(|c| c.is_ascii_alphabetic())
                && num.chars().all(|c| c.is_ascii_digit())
            {
                triggers.push(DetectedTrigger {
                    trigger_text: clean.to_string(),
                    source_type: "linear".into(),
                    query: clean.to_uppercase(),
                });
            }
        }
    }

    // 2. Pull Request / Commit patterns
    if lower.contains("pr #") || lower.contains("pull request") || lower.contains("pr ") {
        triggers.push(DetectedTrigger {
            trigger_text: "Pull Request mention".into(),
            source_type: "github".into(),
            query: utterance.trim().to_string(),
        });
    }

    // 3. Question about prior agreements / decisions / memory
    if (lower.contains("did we agree")
        || lower.contains("what did we decide")
        || lower.contains("last time we discussed")
        || lower.contains("status of")
        || lower.contains("who is working on"))
        && triggers.is_empty()
    {
        triggers.push(DetectedTrigger {
            trigger_text: utterance.chars().take(40).collect::<String>(),
            source_type: "meeting_memory".into(),
            query: utterance.trim().to_string(),
        });
    }

    triggers
}

pub fn list_flash_cards(conn: &Connection, meeting_id: &str) -> Result<Vec<CopilotFlashCard>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, meeting_id, trigger_text, source_type, title, snippet, url, created_at
             FROM copilot_flash_cards
             WHERE meeting_id = ?1
             ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([meeting_id], |row| {
            Ok(CopilotFlashCard {
                id: row.get(0)?,
                meeting_id: row.get(1)?,
                trigger_text: row.get(2)?,
                source_type: row.get(3)?,
                title: row.get(4)?,
                snippet: row.get(5)?,
                url: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut cards = Vec::new();
    for r in rows {
        if let Ok(c) = r {
            cards.push(c);
        }
    }
    Ok(cards)
}

pub fn create_flash_card(
    conn: &Connection,
    meeting_id: &str,
    trigger_text: &str,
    source_type: &str,
    title: &str,
    snippet: &str,
    url: Option<&str>,
) -> Result<CopilotFlashCard, String> {
    let id = crate::ids::new_id("fc");
    conn.execute(
        "INSERT INTO copilot_flash_cards (id, meeting_id, trigger_text, source_type, title, snippet, url)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, meeting_id, trigger_text, source_type, title, snippet, url],
    )
    .map_err(|e| format!("insert flash card: {e}"))?;

    let card = conn
        .query_row(
            "SELECT id, meeting_id, trigger_text, source_type, title, snippet, url, created_at
             FROM copilot_flash_cards WHERE id = ?1",
            [&id],
            |row| {
                Ok(CopilotFlashCard {
                    id: row.get(0)?,
                    meeting_id: row.get(1)?,
                    trigger_text: row.get(2)?,
                    source_type: row.get(3)?,
                    title: row.get(4)?,
                    snippet: row.get(5)?,
                    url: row.get(6)?,
                    created_at: row.get(7)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(card)
}

pub fn dismiss_flash_card(conn: &Connection, card_id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM copilot_flash_cards WHERE id = ?1", [card_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
