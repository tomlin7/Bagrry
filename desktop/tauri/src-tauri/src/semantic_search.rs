use crate::ids::new_id;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

pub const VECTOR_DIM: usize = 64;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SemanticSearchResult {
    pub meeting_id: String,
    pub title: String,
    pub date: String,
    pub matched_snippet: String,
    pub hybrid_score: f32,
    pub semantic_score: f32,
    pub fts_score: f32,
    pub jump_timestamp_ms: Option<i64>,
}

/// Generates an L2-normalized dense embedding vector from text.
pub fn generate_text_embedding(text: &str) -> [f32; VECTOR_DIM] {
    let mut vec = [0.0f32; VECTOR_DIM];
    let words: Vec<&str> = text.split_whitespace().collect();
    if words.is_empty() {
        return vec;
    }

    for (pos, word) in words.iter().enumerate() {
        let clean: String = word
            .to_lowercase()
            .chars()
            .filter(|c| c.is_alphanumeric())
            .collect();
        if clean.is_empty() {
            continue;
        }

        // Rolling hash for bucket assignment
        let mut hash: u64 = 5381;
        for b in clean.bytes() {
            hash = ((hash << 5).wrapping_add(hash)).wrapping_add(b as u64);
        }

        let idx = (hash as usize) % VECTOR_DIM;
        let weight = 1.0 + (1.0 / (pos as f32 + 1.0).sqrt());
        vec[idx] += weight;

        // Neighbor bucket projection for semantic smoothing
        let neighbor = (idx + 1) % VECTOR_DIM;
        vec[neighbor] += weight * 0.4;
    }

    // L2 normalize
    let norm: f32 = vec.iter().map(|v| v * v).sum::<f32>().sqrt();
    if norm > 1e-6 {
        for v in vec.iter_mut() {
            *v /= norm;
        }
    }

    vec
}

pub fn cosine_similarity(a: &[f32; VECTOR_DIM], b: &[f32; VECTOR_DIM]) -> f32 {
    a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
}

pub fn serialize_vector(vec: &[f32; VECTOR_DIM]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(VECTOR_DIM * 4);
    for v in vec {
        bytes.extend_from_slice(&v.to_le_bytes());
    }
    bytes
}

pub fn deserialize_vector(bytes: &[u8]) -> Option<[f32; VECTOR_DIM]> {
    if bytes.len() != VECTOR_DIM * 4 {
        return None;
    }
    let mut vec = [0.0f32; VECTOR_DIM];
    for (i, chunk) in bytes.chunks_exact(4).enumerate() {
        let arr: [u8; 4] = chunk.try_into().ok()?;
        vec[i] = f32::from_le_bytes(arr);
    }
    Some(vec)
}

pub fn index_meeting(conn: &Connection, meeting_id: &str) -> Result<usize, String> {
    let (title, scratchpad, enhanced): (String, String, Option<String>) = conn
        .query_row(
            "SELECT title, scratchpad_raw, enhanced_notes_json FROM meetings WHERE id = ?1",
            params![meeting_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    let full_content = format!("{} {}\n{}", title, scratchpad, enhanced.unwrap_or_default());
    let emb = generate_text_embedding(&full_content);
    let blob = serialize_vector(&emb);
    let id = new_id("demb");

    // Remove old embedding if any
    let _ = conn.execute(
        "DELETE FROM dense_embeddings WHERE item_id = ?1",
        params![meeting_id],
    );

    conn.execute(
        "INSERT INTO dense_embeddings (id, item_type, item_id, meeting_id, content, embedding_blob)
         VALUES (?1, 'meeting', ?2, ?2, ?3, ?4)",
        params![id, meeting_id, full_content, blob],
    )
    .map_err(|e| e.to_string())?;

    Ok(1)
}

pub fn search_hybrid(
    conn: &Connection,
    query: &str,
    limit: usize,
) -> Result<Vec<SemanticSearchResult>, String> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    let query_emb = generate_text_embedding(trimmed);

    // 1. Fetch dense embeddings
    let mut stmt = conn
        .prepare(
            "SELECT e.item_id, m.title, m.date, e.content, e.embedding_blob
             FROM dense_embeddings e
             JOIN meetings m ON m.id = e.item_id",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let id: String = row.get(0)?;
            let title: String = row.get(1)?;
            let date: String = row.get(2)?;
            let content: String = row.get(3)?;
            let blob: Vec<u8> = row.get(4)?;
            Ok((id, title, date, content, blob))
        })
        .map_err(|e| e.to_string())?;

    let query_lower = trimmed.to_lowercase();
    let mut scored: Vec<SemanticSearchResult> = Vec::new();

    for r in rows {
        if let Ok((id, title, date, content, blob)) = r {
            if let Some(emb) = deserialize_vector(&blob) {
                let sem_score = cosine_similarity(&query_emb, &emb);

                // Approximate FTS score based on keyword hit in content or title
                let title_hits = if title.to_lowercase().contains(&query_lower) {
                    0.8f32
                } else {
                    0.0f32
                };
                let content_hits = if content.to_lowercase().contains(&query_lower) {
                    0.5f32
                } else {
                    0.0f32
                };
                let fts_score = (title_hits + content_hits).min(1.0);

                let hybrid_score = (sem_score * 0.6) + (fts_score * 0.4);

                if hybrid_score > 0.15 {
                    // Extract snippet around matched phrase or beginning
                    let snippet = if let Some(idx) = content.to_lowercase().find(&query_lower) {
                        let start = idx.saturating_sub(40);
                        let end = (idx + query_lower.len() + 60).min(content.len());
                        format!("…{}…", &content[start..end].replace('\n', " "))
                    } else {
                        let end = 120.min(content.len());
                        format!("{}…", &content[..end].replace('\n', " "))
                    };

                    scored.push(SemanticSearchResult {
                        meeting_id: id,
                        title,
                        date,
                        matched_snippet: snippet,
                        hybrid_score: (hybrid_score * 100.0).round() / 100.0,
                        semantic_score: (sem_score * 100.0).round() / 100.0,
                        fts_score: (fts_score * 100.0).round() / 100.0,
                        jump_timestamp_ms: None,
                    });
                }
            }
        }
    }

    scored.sort_by(|a, b| b.hybrid_score.partial_cmp(&a.hybrid_score).unwrap());
    scored.truncate(limit);
    Ok(scored)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_text_embedding_generation() {
        let text_a = "Executive board meeting regarding series B fundraising and valuation";
        let emb_a = generate_text_embedding(text_a);

        let text_b = "Series B fundraising targets and investment round";
        let emb_b = generate_text_embedding(text_b);

        let sim = cosine_similarity(&emb_a, &emb_b);
        assert!(sim > 0.4);
    }

    #[test]
    fn test_vector_serialization() {
        let emb = generate_text_embedding("Quarterly sprint retrospective");
        let bytes = serialize_vector(&emb);
        let restored = deserialize_vector(&bytes).unwrap();
        assert_eq!(emb, restored);
    }
}
