use crate::audio::wav;
use crate::groq::{self, Bullet, EnhancedDoc, Section};
use crate::ids::new_id;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TranscriptSeg {
    pub id: String,
    pub speaker: String,
    pub start_ms: i64,
    pub end_ms: i64,
    pub text: String,
    pub sentence_index: i64,
    pub sentence_id: String,
}

pub fn transcribe_dual_wav(api_key: &str, wav_bytes: &[u8]) -> Result<Vec<TranscriptSeg>, String> {
    let (mic, sys) = wav::split_dual_mono(wav_bytes)?;
    let mut segs = Vec::new();
    if wav_has_signal(&mic) {
        let mic_res = groq::transcribe_wav(api_key, &mic, "mic.wav")?;
        push_channel(&mut segs, &mic_res, "me");
    }
    if wav_has_signal(&sys) {
        let sys_res = groq::transcribe_wav(api_key, &sys, "system.wav")?;
        push_channel(&mut segs, &sys_res, "attendees");
    }
    segs.sort_by_key(|s| s.start_ms);
    for (i, s) in segs.iter_mut().enumerate() {
        s.sentence_index = i as i64;
        s.sentence_id = format!("s_{:03}", i + 1);
        s.id = new_id("seg");
    }
    Ok(segs)
}

fn wav_has_signal(wav: &[u8]) -> bool {
    if wav.len() < 46 {
        return false;
    }
    wav[44..]
        .chunks_exact(2)
        .any(|c| i16::from_le_bytes([c[0], c[1]]).unsigned_abs() > 8)
}

fn push_channel(out: &mut Vec<TranscriptSeg>, result: &groq::WhisperVerbose, speaker: &str) {
    if let Some(segments) = &result.segments {
        for seg in segments {
            let text = seg.text.clone().unwrap_or_default().trim().to_string();
            if text.is_empty() {
                continue;
            }
            let start_ms = (seg.start.unwrap_or(0.0) * 1000.0) as i64;
            let end_ms = (seg.end.unwrap_or(0.0) * 1000.0) as i64;
            for sentence in split_sentences(&text) {
                out.push(TranscriptSeg {
                    id: String::new(),
                    speaker: speaker.into(),
                    start_ms,
                    end_ms,
                    text: sentence,
                    sentence_index: 0,
                    sentence_id: String::new(),
                });
            }
        }
        return;
    }
    if let Some(text) = &result.text {
        for sentence in split_sentences(text) {
            if sentence.is_empty() {
                continue;
            }
            out.push(TranscriptSeg {
                id: String::new(),
                speaker: speaker.into(),
                start_ms: 0,
                end_ms: 0,
                text: sentence,
                sentence_index: 0,
                sentence_id: String::new(),
            });
        }
    }
}

fn split_sentences(text: &str) -> Vec<String> {
    text.split(|c| c == '.' || c == '?' || c == '!')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

pub fn persist_transcript(
    conn: &Connection,
    meeting_id: &str,
    segs: &[TranscriptSeg],
) -> Result<(), String> {
    conn.execute(
        "DELETE FROM transcript_segments WHERE meeting_id = ?1",
        params![meeting_id],
    )
    .map_err(|e| e.to_string())?;
    for s in segs {
        conn.execute(
            "INSERT INTO transcript_segments
             (id, meeting_id, speaker, start_ms, end_ms, text, sentence_index, sentence_id)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
            params![
                s.id,
                meeting_id,
                s.speaker,
                s.start_ms,
                s.end_ms,
                s.text,
                s.sentence_index,
                s.sentence_id
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string(segs).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE meetings SET transcript_json = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![json, meeting_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_segments(conn: &Connection, meeting_id: &str) -> Result<Vec<TranscriptSeg>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, speaker, start_ms, end_ms, text, sentence_index, sentence_id
             FROM transcript_segments WHERE meeting_id = ?1 ORDER BY sentence_index",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![meeting_id], |row| {
            Ok(TranscriptSeg {
                id: row.get(0)?,
                speaker: row.get(1)?,
                start_ms: row.get(2)?,
                end_ms: row.get(3)?,
                text: row.get(4)?,
                sentence_index: row.get(5)?,
                sentence_id: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

pub fn enhance(
    api_key: Option<&str>,
    scratchpad: &str,
    segs: &[TranscriptSeg],
    template_prompt: &str,
    structure: &str,
) -> Result<EnhancedDoc, String> {
    if let Some(key) = api_key.filter(|k| !k.is_empty()) {
        let transcript = segs
            .iter()
            .map(|s| format!("[{}] {} ({}) ", s.sentence_id, s.speaker, s.text))
            .collect::<Vec<_>>()
            .join("\n");
        let system = format!(
            "You write meeting notes. Rules:\n\
             1. Anchor on the user's scratchpad. Expand those points with exact quotes, numbers, and decisions from the transcript.\n\
             2. If the scratchpad is blank, produce a structured executive summary using the template sections.\n\
             3. Output JSON: {{\"sections\":[{{\"section_title\":\"\",\"bullet_points\":[{{\"text\":\"\",\"citations\":[\"s_001\"]}}]}}]}}\n\
             Template: {template_prompt}\nStructure: {structure}"
        );
        let user = format!("SCRATCHPAD:\n{scratchpad}\n\nTRANSCRIPT:\n{transcript}");
        let raw = groq::chat(key, &system, &user, true)?;
        if let Ok(doc) = serde_json::from_str::<EnhancedDoc>(&raw) {
            return Ok(doc);
        }
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) {
            if let Ok(doc) = serde_json::from_value::<EnhancedDoc>(v) {
                return Ok(doc);
            }
        }
    }
    Ok(local_enhance(scratchpad, segs, structure))
}

fn local_enhance(scratchpad: &str, segs: &[TranscriptSeg], structure: &str) -> EnhancedDoc {
    let sections: Vec<String> = serde_json::from_str::<serde_json::Value>(structure)
        .ok()
        .and_then(|v| {
            v.get("sections")
                .and_then(|s| s.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|x| x.as_str().map(|s| s.to_string()))
                        .collect()
                })
        })
        .unwrap_or_else(|| vec!["Summary".into(), "Decisions".into(), "Next Steps".into()]);

    let bullets: Vec<String> = scratchpad
        .lines()
        .map(|l| l.trim().trim_start_matches(['-', '*', '•']).trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();

    if bullets.is_empty() {
        let mut grouped: Vec<Section> = sections
            .iter()
            .map(|title| Section {
                section_title: title.clone(),
                bullet_points: Vec::new(),
            })
            .collect();
        if grouped.is_empty() {
            grouped.push(Section {
                section_title: "Summary".into(),
                bullet_points: Vec::new(),
            });
        }
        for (i, seg) in segs.iter().enumerate() {
            let idx = i % grouped.len();
            grouped[idx].bullet_points.push(Bullet {
                text: seg.text.clone(),
                citations: vec![seg.sentence_id.clone()],
            });
        }
        if segs.is_empty() {
            grouped[0].bullet_points.push(Bullet {
                text: "No transcript yet. Add scratchpad notes or transcribe a recording.".into(),
                citations: vec![],
            });
        }
        return EnhancedDoc { sections: grouped };
    }

    let mut out_sections = Vec::new();
    let chunk = (bullets.len() / sections.len()).max(1);
    for (si, title) in sections.iter().enumerate() {
        let start = si * chunk;
        let end = if si + 1 == sections.len() {
            bullets.len()
        } else {
            ((si + 1) * chunk).min(bullets.len())
        };
        let mut bps = Vec::new();
        for b in &bullets[start.min(bullets.len())..end] {
            let cites = best_citations(b, segs, 2);
            bps.push(Bullet {
                text: b.clone(),
                citations: cites,
            });
        }
        out_sections.push(Section {
            section_title: title.clone(),
            bullet_points: bps,
        });
    }
    EnhancedDoc {
        sections: out_sections,
    }
}

fn best_citations(text: &str, segs: &[TranscriptSeg], n: usize) -> Vec<String> {
    let words: Vec<String> = text
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| w.len() > 3)
        .map(|s| s.to_string())
        .collect();
    let mut scored: Vec<(i64, String)> = segs
        .iter()
        .map(|s| {
            let hay = s.text.to_lowercase();
            let score = words.iter().filter(|w| hay.contains(w.as_str())).count() as i64;
            (score, s.sentence_id.clone())
        })
        .collect();
    scored.sort_by(|a, b| b.0.cmp(&a.0));
    scored
        .into_iter()
        .filter(|(s, _)| *s > 0)
        .take(n)
        .map(|(_, id)| id)
        .collect()
}

pub fn embed_text(text: &str) -> Vec<f32> {
    let mut v = vec![0.0f32; 64];
    for w in text.split_whitespace() {
        let mut h: u32 = 2166136261;
        for b in w.to_lowercase().bytes() {
            h ^= b as u32;
            h = h.wrapping_mul(16777619);
        }
        v[(h as usize) % 64] += 1.0;
    }
    let norm = v.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm > 0.0 {
        for x in &mut v {
            *x /= norm;
        }
    }
    v
}

pub fn store_embedding(conn: &Connection, meeting_id: &str, text: &str) -> Result<(), String> {
    let v = embed_text(text);
    let bytes: Vec<u8> = v.iter().flat_map(|f| f.to_le_bytes()).collect();
    conn.execute("DELETE FROM vectors WHERE meeting_id = ?1", params![meeting_id])
        .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO vectors (id, meeting_id, embedding, dim) VALUES (?1, ?2, ?3, 64)",
        params![new_id("vec"), meeting_id, bytes],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn search_semantic(conn: &Connection, query: &str, folder_id: Option<&str>) -> Result<Vec<(String, f32)>, String> {
    let q = embed_text(query);
    let mut stmt = conn
        .prepare(
            "SELECT v.meeting_id, v.embedding, m.folder_id FROM vectors v
             JOIN meetings m ON m.id = v.meeting_id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Vec<u8>>(1)?,
                row.get::<_, Option<String>>(2)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut scored = Vec::new();
    for row in rows {
        let (id, bytes, folder) = row.map_err(|e| e.to_string())?;
        if let Some(fid) = folder_id {
            if folder.as_deref() != Some(fid) {
                continue;
            }
        }
        let mut vec = Vec::new();
        for chunk in bytes.chunks(4) {
            if chunk.len() == 4 {
                vec.push(f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]));
            }
        }
        let mut dot = 0.0;
        for (a, b) in q.iter().zip(vec.iter()) {
            dot += a * b;
        }
        scored.push((id, dot));
    }
    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    Ok(scored.into_iter().take(20).collect())
}
