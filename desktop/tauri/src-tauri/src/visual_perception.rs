use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualFrame {
    pub id: String,
    pub meeting_id: String,
    pub timestamp_ms: i64,
    pub ocr_text: String,
    pub slide_title: Option<String>,
    pub thumbnail_path: Option<String>,
    pub created_at: String,
}

pub fn list_visual_frames(conn: &Connection, meeting_id: &str) -> Result<Vec<VisualFrame>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, meeting_id, timestamp_ms, ocr_text, slide_title, thumbnail_path, created_at
             FROM meeting_visual_frames
             WHERE meeting_id = ?1
             ORDER BY timestamp_ms ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([meeting_id], |row| {
            Ok(VisualFrame {
                id: row.get(0)?,
                meeting_id: row.get(1)?,
                timestamp_ms: row.get(2)?,
                ocr_text: row.get(3)?,
                slide_title: row.get(4)?,
                thumbnail_path: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut frames = Vec::new();
    for r in rows {
        if let Ok(f) = r {
            frames.push(f);
        }
    }
    Ok(frames)
}

pub fn save_visual_frame(
    conn: &Connection,
    meeting_id: &str,
    timestamp_ms: i64,
    ocr_text: &str,
    slide_title: Option<&str>,
    thumbnail_path: Option<&str>,
) -> Result<VisualFrame, String> {
    let id = crate::ids::new_id("vf");
    conn.execute(
        "INSERT INTO meeting_visual_frames (id, meeting_id, timestamp_ms, ocr_text, slide_title, thumbnail_path)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, meeting_id, timestamp_ms, ocr_text, slide_title, thumbnail_path],
    )
    .map_err(|e| format!("insert visual frame: {e}"))?;

    let frame = conn
        .query_row(
            "SELECT id, meeting_id, timestamp_ms, ocr_text, slide_title, thumbnail_path, created_at
             FROM meeting_visual_frames WHERE id = ?1",
            [&id],
            |row| {
                Ok(VisualFrame {
                    id: row.get(0)?,
                    meeting_id: row.get(1)?,
                    timestamp_ms: row.get(2)?,
                    ocr_text: row.get(3)?,
                    slide_title: row.get(4)?,
                    thumbnail_path: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(frame)
}

pub fn delete_visual_frame(conn: &Connection, frame_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM meeting_visual_frames WHERE id = ?1",
        [frame_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
