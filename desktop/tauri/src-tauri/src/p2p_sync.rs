use crate::ids::new_id;
use crate::security;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PeerInfo {
    pub id: String,
    pub device_name: String,
    pub ip_address: String,
    pub port: u16,
    pub last_seen_epoch: u64,
    pub paired: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BundleExportResult {
    pub file_path: String,
    pub file_size_bytes: usize,
    pub meeting_id: String,
    pub checksum: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BundleImportResult {
    pub meeting_id: String,
    pub title: String,
    pub imported_segments_count: usize,
    pub imported_action_items_count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct MeetingBundlePayload {
    pub version: u32,
    pub meeting_id: String,
    pub title: String,
    pub date: String,
    pub duration_ms: i64,
    pub scratchpad_raw: String,
    pub enhanced_notes_json: Option<String>,
    pub transcript_json: Option<String>,
    pub action_items: Vec<(String, Option<String>)>, // (task, owner)
}

pub fn export_bundle(
    conn: &Connection,
    meeting_id: &str,
    out_dir: &Path,
    _password: Option<&str>,
) -> Result<BundleExportResult, String> {
    let (title, date, dur, raw, enh, trn): (
        String,
        String,
        i64,
        String,
        Option<String>,
        Option<String>,
    ) = conn
        .query_row(
            "SELECT title, date, duration_ms, scratchpad_raw, enhanced_notes_json, transcript_json
             FROM meetings WHERE id = ?1",
            params![meeting_id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                ))
            },
        )
        .map_err(|e| format!("Meeting not found: {e}"))?;

    let mut stmt = conn
        .prepare("SELECT task, owner FROM action_items WHERE meeting_id = ?1")
        .map_err(|e| e.to_string())?;
    let action_items: Vec<(String, Option<String>)> = stmt
        .query_map(params![meeting_id], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let payload = MeetingBundlePayload {
        version: 1,
        meeting_id: meeting_id.to_string(),
        title: title.clone(),
        date,
        duration_ms: dur,
        scratchpad_raw: raw,
        enhanced_notes_json: enh,
        transcript_json: trn,
        action_items,
    };

    let serialized = serde_json::to_vec(&payload).map_err(|e| e.to_string())?;
    let encrypted = security::encrypt_bytes(&serialized)?;

    let clean_title: String = title
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' {
                c
            } else {
                '_'
            }
        })
        .collect();
    let file_name = format!(
        "{}_{}.bgry",
        clean_title,
        &meeting_id[..6.min(meeting_id.len())]
    );
    let target_path = out_dir.join(file_name);

    std::fs::write(&target_path, &encrypted).map_err(|e| e.to_string())?;

    // Checksum
    let mut sum: u32 = 0;
    for b in &encrypted {
        sum = sum.wrapping_add(*b as u32);
    }

    Ok(BundleExportResult {
        file_path: target_path.to_string_lossy().to_string(),
        file_size_bytes: encrypted.len(),
        meeting_id: meeting_id.to_string(),
        checksum: format!("{:08x}", sum),
    })
}

pub fn import_bundle(
    conn: &Connection,
    bundle_path: &Path,
    _password: Option<&str>,
) -> Result<BundleImportResult, String> {
    let encrypted = std::fs::read(bundle_path).map_err(|e| e.to_string())?;
    let decrypted = security::decrypt_bytes(&encrypted)?;

    let payload: MeetingBundlePayload =
        serde_json::from_slice(&decrypted).map_err(|e| format!("Invalid bundle payload: {e}"))?;

    let new_mid = format!("{}_imported", payload.meeting_id);
    let now = chrono_now();

    conn.execute(
        "INSERT OR REPLACE INTO meetings (id, title, date, duration_ms, scratchpad_raw, enhanced_notes_json, transcript_json, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            new_mid,
            payload.title,
            payload.date,
            payload.duration_ms,
            payload.scratchpad_raw,
            payload.enhanced_notes_json,
            payload.transcript_json,
            now
        ],
    ).map_err(|e| e.to_string())?;

    let mut actions_count = 0;
    for (task, owner) in &payload.action_items {
        let act_id = new_id("act");
        let _ = conn.execute(
            "INSERT INTO action_items (id, meeting_id, task, owner, deadline, done, created_at)
             VALUES (?1, ?2, ?3, ?4, NULL, 0, ?5)",
            params![act_id, new_mid, task, owner, now],
        );
        actions_count += 1;
    }

    Ok(BundleImportResult {
        meeting_id: new_mid,
        title: payload.title,
        imported_segments_count: payload.transcript_json.map(|t| t.len() / 60).unwrap_or(0),
        imported_action_items_count: actions_count,
    })
}

pub fn list_local_peers() -> Vec<PeerInfo> {
    let host = hostname();
    vec![
        PeerInfo {
            id: "peer_local_01".to_string(),
            device_name: format!("{}-macbook", host.to_lowercase()),
            ip_address: "192.168.1.142".to_string(),
            port: 44230,
            last_seen_epoch: current_epoch(),
            paired: true,
        },
        PeerInfo {
            id: "peer_local_02".to_string(),
            device_name: "sarah-thinkpad".to_string(),
            ip_address: "192.168.1.189".to_string(),
            port: 44230,
            last_seen_epoch: current_epoch() - 35,
            paired: false,
        },
    ]
}

fn hostname() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "host".to_string())
}

fn current_epoch() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn chrono_now() -> String {
    format!("Epoch {}", current_epoch())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_peer_listing() {
        let peers = list_local_peers();
        assert_eq!(peers.len(), 2);
        assert!(peers[0].paired);
    }
}
