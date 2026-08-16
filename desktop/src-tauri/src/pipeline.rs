use crate::audio::sink;
use crate::audio::wav;
use crate::groq::{self, Bullet, EnhancedDoc, Section};
use crate::ids::new_id;
use crate::secrets;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::time::Duration;

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

#[allow(dead_code)]
pub fn transcribe_dual_wav(
    api_key: &str,
    wav_bytes: &[u8],
    opts: &groq::SttOptions,
) -> Result<Vec<TranscriptSeg>, String> {
    let (mic, sys) = wav::split_dual_mono(wav_bytes)?;
    let mut segs = Vec::new();
    if wav_has_signal(&mic) {
        let mic_res = transcribe_with_retry(api_key, &mic, "mic.wav", opts)?;
        push_channel(&mut segs, &mic_res, "me", 0, 0);
    }
    if wav_has_signal(&sys) {
        let sys_res = transcribe_with_retry(api_key, &sys, "system.wav", opts)?;
        push_channel(&mut segs, &sys_res, "attendees", 0, 0);
    }
    segs.sort_by_key(|s| s.start_ms);
    number_segments(&mut segs);
    Ok(segs)
}

/// Maps `transcription_language` + jargon + Whisper model from settings.
pub fn stt_options(conn: &Connection) -> groq::SttOptions {
    let lang_setting = secrets::get_setting(conn, "transcription_language", "en-best");
    let language = match lang_setting.as_str() {
        "auto" => None,
        "en-best" => Some("en".to_string()),
        other => Some(other.split('-').next().unwrap_or("en").to_string()),
    };
    let jargon = secrets::get_setting(conn, "internal_jargon", "");
    let model = secrets::get_setting(conn, "stt_model", "whisper-large-v3-turbo");
    groq::SttOptions {
        language,
        prompt: (!jargon.is_empty()).then_some(jargon),
        model: (!model.trim().is_empty()).then_some(model),
    }
}

const STT_HZ: u64 = 16_000;
/// ~8 minutes of 16 kHz 16-bit mono stays under Groq's 25 MB upload cap.
const CHUNK_SAMPLES: u64 = STT_HZ * 8 * 60;
const OVERLAP_SAMPLES: u64 = STT_HZ * 2;
const MAX_STT_ATTEMPTS: u32 = 3;

/// Final transcription of a dual-mono recording spilled to disk as raw PCM.
pub fn transcribe_pcm_files(
    api_key: &str,
    mic_path: &Path,
    sys_path: &Path,
    opts: &groq::SttOptions,
) -> Result<Vec<TranscriptSeg>, String> {
    let mut segs = Vec::new();
    segs.extend(transcribe_pcm_channel(api_key, mic_path, "me", opts)?);
    segs.extend(transcribe_pcm_channel(api_key, sys_path, "attendees", opts)?);
    segs.sort_by_key(|s| s.start_ms);
    number_segments(&mut segs);
    Ok(segs)
}

/// Live window: a few seconds of PCM already at 16 kHz, with a sample offset.
pub fn transcribe_pcm_chunk(
    api_key: &str,
    mic: &[i16],
    sys: &[i16],
    opts: &groq::SttOptions,
    start_sample: u64,
) -> Result<Vec<TranscriptSeg>, String> {
    let offset_ms = ((start_sample * 1000) / STT_HZ) as i64;
    let mut segs = Vec::new();
    if pcm_has_signal(mic) {
        let wav = wav::encode_mono_16k(mic);
        let result = transcribe_with_retry(api_key, &wav, "live-mic.wav", opts)?;
        push_channel(&mut segs, &result, "me", offset_ms, 0);
    }
    if pcm_has_signal(sys) {
        let wav = wav::encode_mono_16k(sys);
        let result = transcribe_with_retry(api_key, &wav, "live-sys.wav", opts)?;
        push_channel(&mut segs, &result, "attendees", offset_ms, 0);
    }
    segs.sort_by_key(|s| s.start_ms);
    number_segments(&mut segs);
    Ok(segs)
}

fn transcribe_pcm_channel(
    api_key: &str,
    path: &Path,
    speaker: &str,
    opts: &groq::SttOptions,
) -> Result<Vec<TranscriptSeg>, String> {
    if !path.exists() {
        return Ok(Vec::new());
    }
    let total = std::fs::metadata(path)
        .map_err(|e| format!("pcm metadata: {e}"))?
        .len()
        / 2;
    if total < STT_HZ / 2 {
        return Ok(Vec::new());
    }
    let mut segs = Vec::new();
    let mut start = 0u64;
    let mut chunk_idx = 0u32;
    while start < total {
        let len = CHUNK_SAMPLES.min(total - start);
        let pcm = sink::read_i16_range(path, start, len)?;
        if pcm_has_signal(&pcm) {
            let wav = wav::encode_mono_16k(&pcm);
            let filename = format!("{speaker}-{chunk_idx}.wav");
            let result = transcribe_with_retry(api_key, &wav, &filename, opts)?;
            let offset_ms = ((start * 1000) / STT_HZ) as i64;
            let skip_ms = if chunk_idx == 0 {
                0
            } else {
                ((OVERLAP_SAMPLES * 1000) / STT_HZ) as i64
            };
            push_channel(&mut segs, &result, speaker, offset_ms, skip_ms);
        }
        if start + len >= total {
            break;
        }
        start += len.saturating_sub(OVERLAP_SAMPLES);
        chunk_idx += 1;
    }
    Ok(segs)
}

fn transcribe_with_retry(
    api_key: &str,
    wav: &[u8],
    filename: &str,
    opts: &groq::SttOptions,
) -> Result<groq::WhisperVerbose, String> {
    let mut last = String::new();
    for attempt in 0..MAX_STT_ATTEMPTS {
        match groq::transcribe_wav(api_key, wav, filename, opts) {
            Ok(v) => return Ok(v),
            Err(e) => {
                last = e;
                let retry = attempt + 1 < MAX_STT_ATTEMPTS && is_retryable_stt(&last);
                if !retry {
                    break;
                }
                std::thread::sleep(Duration::from_millis(400 * 2u64.pow(attempt)));
            }
        }
    }
    Err(last)
}

fn is_retryable_stt(err: &str) -> bool {
    let lower = err.to_ascii_lowercase();
    lower.contains("429")
        || lower.contains("502")
        || lower.contains("503")
        || lower.contains("504")
        || lower.contains("stt request")
        || lower.contains("timed out")
}

fn pcm_has_signal(pcm: &[i16]) -> bool {
    pcm.iter().any(|s| s.unsigned_abs() > 8)
}

fn number_segments(segs: &mut [TranscriptSeg]) {
    for (i, s) in segs.iter_mut().enumerate() {
        s.sentence_index = i as i64;
        s.sentence_id = format!("s_{:03}", i + 1);
        if s.id.is_empty() {
            s.id = new_id("seg");
        }
    }
}

#[allow(dead_code)]
fn wav_has_signal(wav: &[u8]) -> bool {
    if wav.len() < 46 {
        return false;
    }
    wav[44..]
        .chunks_exact(2)
        .any(|c| i16::from_le_bytes([c[0], c[1]]).unsigned_abs() > 8)
}

fn push_channel(
    out: &mut Vec<TranscriptSeg>,
    result: &groq::WhisperVerbose,
    speaker: &str,
    offset_ms: i64,
    skip_before_ms: i64,
) {
    if let Some(segments) = &result.segments {
        for seg in segments {
            let text = seg.text.clone().unwrap_or_default().trim().to_string();
            if text.is_empty() {
                continue;
            }
            let start_ms = (seg.start.unwrap_or(0.0) * 1000.0) as i64;
            if start_ms < skip_before_ms {
                continue;
            }
            let end_ms = (seg.end.unwrap_or(0.0) * 1000.0) as i64;
            for sentence in split_sentences(&text) {
                out.push(TranscriptSeg {
                    id: String::new(),
                    speaker: speaker.into(),
                    start_ms: start_ms + offset_ms,
                    end_ms: end_ms + offset_ms,
                    text: sentence,
                    sentence_index: 0,
                    sentence_id: String::new(),
                });
            }
        }
        return;
    }
    if skip_before_ms > 0 {
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
                start_ms: offset_ms,
                end_ms: offset_ms,
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
    let duration_ms = segs.iter().map(|s| s.end_ms).max().unwrap_or(0);
    conn.execute(
        "UPDATE meetings SET transcript_json = ?1, duration_ms = ?2, updated_at = datetime('now') WHERE id = ?3",
        params![json, duration_ms, meeting_id],
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

/// User-specific context threaded into every AI prompt, mirroring how Granola
/// personalises summaries with profile settings.
#[derive(Debug, Default, Clone)]
pub struct EnhanceContext {
    pub summary_language: Option<String>,
    pub jargon: Option<String>,
    pub user_name: Option<String>,
    pub job_title: Option<String>,
    pub company_description: Option<String>,
}

impl EnhanceContext {
    pub fn as_prompt(&self) -> String {
        let mut parts = Vec::new();
        if let Some(lang) = self.summary_language.as_deref().filter(|s| !s.is_empty()) {
            parts.push(format!("Write the notes in this language: {lang}."));
        }
        if let Some(jargon) = self.jargon.as_deref().filter(|s| !s.is_empty()) {
            parts.push(format!("Company jargon you should recognise: {jargon}."));
        }
        if let Some(name) = self.user_name.as_deref().filter(|s| !s.is_empty()) {
            let role = self
                .job_title
                .as_deref()
                .filter(|s| !s.is_empty())
                .map(|t| format!(" ({t})"))
                .unwrap_or_default();
            parts.push(format!("The note-taker is {name}{role}."));
        }
        if let Some(desc) = self.company_description.as_deref().filter(|s| !s.is_empty()) {
            parts.push(format!("Their company: {desc}."));
        }
        parts.join("\n")
    }
}

pub fn enhance(
    api_key: Option<&str>,
    scratchpad: &str,
    segs: &[TranscriptSeg],
    template_prompt: &str,
    structure: &str,
    ctx: &EnhanceContext,
    model: Option<&str>,
) -> Result<EnhancedDoc, String> {
    if let Some(key) = api_key.filter(|k| !k.is_empty()) {
        let transcript = segs
            .iter()
            .map(|s| format!("[{}] {} ({}) ", s.sentence_id, s.speaker, s.text))
            .collect::<Vec<_>>()
            .join("\n");
        let context = ctx.as_prompt();
        let system = format!(
            "You write meeting notes. Rules:\n\
             1. Anchor on the user's scratchpad. Expand those points with exact quotes, numbers, and decisions from the transcript.\n\
             2. If the scratchpad is blank, produce a structured executive summary using the template sections.\n\
             3. Output JSON: {{\"sections\":[{{\"section_title\":\"\",\"bullet_points\":[{{\"text\":\"\",\"citations\":[\"s_001\"]}}]}}]}}\n\
             Template: {template_prompt}\nStructure: {structure}\n{context}"
        );
        let user = format!("SCRATCHPAD:\n{scratchpad}\n\nTRANSCRIPT:\n{transcript}");
        let raw = groq::chat(key, &system, &user, true, model)?;
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
