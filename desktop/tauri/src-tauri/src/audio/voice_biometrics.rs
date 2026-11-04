use crate::ids::new_id;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

pub const EMBEDDING_DIM: usize = 64;
pub const SIMILARITY_THRESHOLD: f32 = 0.72;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct VoiceProfileInfo {
    pub id: String,
    pub person_id: String,
    pub name: String,
    pub sample_count: i64,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct VoiceMatchResult {
    pub person_id: String,
    pub name: String,
    pub confidence: f32,
}

/// Computes an L2-normalized 64-dimensional acoustic voice embedding from mono PCM.
pub fn extract_acoustic_embedding(pcm: &[f32]) -> [f32; EMBEDDING_DIM] {
    let mut embedding = [0.0f32; EMBEDDING_DIM];
    if pcm.is_empty() {
        return embedding;
    }

    let chunk_size = (pcm.len() / (EMBEDDING_DIM / 2)).max(1);

    // First half: local band energy distribution
    for i in 0..(EMBEDDING_DIM / 2) {
        let start = i * chunk_size;
        let end = (start + chunk_size).min(pcm.len());
        if start < pcm.len() {
            let slice = &pcm[start..end];
            let sum_sq: f32 = slice.iter().map(|s| s * s).sum();
            embedding[i] = (sum_sq / (slice.len() as f32).max(1.0)).sqrt();
        }
    }

    // Second half: frequency domain harmonic representation (DFT magnitude at discrete bands)
    for k in 0..(EMBEDDING_DIM / 2) {
        let freq_step = (k + 1) as f32 * 0.05;
        let mut real = 0.0f32;
        let mut imag = 0.0f32;
        let step = (pcm.len() / 256).max(1);
        for (n, sample) in pcm.iter().step_by(step).enumerate() {
            let angle = (n as f32) * freq_step;
            real += sample * angle.cos();
            imag -= sample * angle.sin();
        }
        embedding[EMBEDDING_DIM / 2 + k] = (real * real + imag * imag).sqrt();
    }

    // L2 normalize
    let norm_sq: f32 = embedding.iter().map(|v| v * v).sum();
    let norm = norm_sq.sqrt();
    if norm > 1e-6 {
        for v in embedding.iter_mut() {
            *v /= norm;
        }
    }

    embedding
}

/// Cosine similarity between two unit vectors (dot product).
pub fn cosine_similarity(a: &[f32; EMBEDDING_DIM], b: &[f32; EMBEDDING_DIM]) -> f32 {
    a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
}

pub fn serialize_embedding(emb: &[f32; EMBEDDING_DIM]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(EMBEDDING_DIM * 4);
    for val in emb {
        bytes.extend_from_slice(&val.to_le_bytes());
    }
    bytes
}

pub fn deserialize_embedding(bytes: &[u8]) -> Option<[f32; EMBEDDING_DIM]> {
    if bytes.len() != EMBEDDING_DIM * 4 {
        return None;
    }
    let mut emb = [0.0f32; EMBEDDING_DIM];
    for (i, chunk) in bytes.chunks_exact(4).enumerate() {
        let arr: [u8; 4] = chunk.try_into().ok()?;
        emb[i] = f32::from_le_bytes(arr);
    }
    Some(emb)
}

pub fn enroll_voice(
    conn: &Connection,
    person_id: &str,
    name: &str,
    pcm: &[f32],
) -> Result<VoiceProfileInfo, String> {
    let new_emb = extract_acoustic_embedding(pcm);
    let now = chrono_now();

    // Check if profile exists for this person
    let existing: Option<(String, i64, Vec<u8>)> = conn
        .query_row(
            "SELECT id, sample_count, embedding_blob FROM voice_profiles WHERE person_id = ?1",
            params![person_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .ok();

    if let Some((id, count, blob)) = existing {
        let mut merged = new_emb;
        if let Some(prev) = deserialize_embedding(&blob) {
            // Running average update
            let prev_weight = count as f32;
            let total = prev_weight + 1.0;
            for i in 0..EMBEDDING_DIM {
                merged[i] = (prev[i] * prev_weight + new_emb[i]) / total;
            }
            // Re-normalize
            let norm: f32 = merged.iter().map(|v| v * v).sum::<f32>().sqrt();
            if norm > 1e-6 {
                for v in merged.iter_mut() {
                    *v /= norm;
                }
            }
        }
        let updated_blob = serialize_embedding(&merged);
        conn.execute(
            "UPDATE voice_profiles SET name = ?1, sample_count = sample_count + 1, embedding_blob = ?2, updated_at = ?3 WHERE id = ?4",
            params![name, updated_blob, now, id],
        ).map_err(|e| e.to_string())?;

        Ok(VoiceProfileInfo {
            id,
            person_id: person_id.to_string(),
            name: name.to_string(),
            sample_count: count + 1,
            updated_at: now,
        })
    } else {
        let id = new_id("vpr");
        let blob = serialize_embedding(&new_emb);
        conn.execute(
            "INSERT INTO voice_profiles (id, person_id, name, sample_count, embedding_blob, created_at, updated_at)
             VALUES (?1, ?2, ?3, 1, ?4, ?5, ?5)",
            params![id, person_id, name, blob, now],
        ).map_err(|e| e.to_string())?;

        Ok(VoiceProfileInfo {
            id,
            person_id: person_id.to_string(),
            name: name.to_string(),
            sample_count: 1,
            updated_at: now,
        })
    }
}

pub fn list_profiles(conn: &Connection) -> Result<Vec<VoiceProfileInfo>, String> {
    let mut stmt = conn
        .prepare("SELECT id, person_id, name, sample_count, updated_at FROM voice_profiles ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(VoiceProfileInfo {
                id: row.get(0)?,
                person_id: row.get(1)?,
                name: row.get(2)?,
                sample_count: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for r in rows {
        if let Ok(item) = r {
            out.push(item);
        }
    }
    Ok(out)
}

pub fn delete_profile(conn: &Connection, person_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM voice_profiles WHERE person_id = ?1",
        params![person_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn match_pcm(conn: &Connection, pcm: &[f32]) -> Result<Option<VoiceMatchResult>, String> {
    if pcm.is_empty() {
        return Ok(None);
    }

    let input_emb = extract_acoustic_embedding(pcm);
    let mut stmt = conn
        .prepare("SELECT person_id, name, embedding_blob FROM voice_profiles")
        .map_err(|e| e.to_string())?;

    let profiles = stmt
        .query_map([], |row| {
            let pid: String = row.get(0)?;
            let name: String = row.get(1)?;
            let blob: Vec<u8> = row.get(2)?;
            Ok((pid, name, blob))
        })
        .map_err(|e| e.to_string())?;

    let mut best_match: Option<VoiceMatchResult> = None;
    let mut highest_sim = SIMILARITY_THRESHOLD;

    for p in profiles {
        if let Ok((pid, name, blob)) = p {
            if let Some(enrolled_emb) = deserialize_embedding(&blob) {
                let sim = cosine_similarity(&input_emb, &enrolled_emb);
                if sim > highest_sim {
                    highest_sim = sim;
                    best_match = Some(VoiceMatchResult {
                        person_id: pid,
                        name,
                        confidence: (sim * 100.0).round() / 100.0,
                    });
                }
            }
        }
    }

    Ok(best_match)
}

pub fn match_i16(conn: &Connection, pcm: &[i16]) -> Result<Option<VoiceMatchResult>, String> {
    let f32_samples: Vec<f32> = pcm.iter().map(|&s| s as f32 / 32768.0).collect();
    match_pcm(conn, &f32_samples)
}

fn chrono_now() -> String {
    let time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("Epoch {}", time)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_and_similarity() {
        let mut sample_a = vec![0.0f32; 16000];
        for (i, v) in sample_a.iter_mut().enumerate() {
            *v = (i as f32 * 0.05).sin();
        }

        let emb_a = extract_acoustic_embedding(&sample_a);
        let sim_self = cosine_similarity(&emb_a, &emb_a);
        assert!((sim_self - 1.0).abs() < 1e-4);

        let mut sample_b = vec![0.0f32; 16000];
        for (i, v) in sample_b.iter_mut().enumerate() {
            *v = (i as f32 * 0.12).cos();
        }
        let emb_b = extract_acoustic_embedding(&sample_b);
        let sim_ab = cosine_similarity(&emb_a, &emb_b);
        assert!(sim_ab < 0.95);
    }

    #[test]
    fn test_serialization_roundtrip() {
        let mut emb = [0.0f32; EMBEDDING_DIM];
        for (i, val) in emb.iter_mut().enumerate() {
            *val = (i as f32) * 0.015;
        }

        let bytes = serialize_embedding(&emb);
        let deserialized = deserialize_embedding(&bytes).unwrap();
        assert_eq!(emb, deserialized);
    }
}
