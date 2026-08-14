use serde::{Deserialize, Serialize};
use serde_json::json;

const CHAT_URL: &str = "https://api.groq.com/openai/v1/chat/completions";
const STT_URL: &str = "https://api.groq.com/openai/v1/audio/transcriptions";
const CHAT_MODEL: &str = "llama-3.3-70b-versatile";
const STT_MODEL: &str = "whisper-large-v3-turbo";

#[derive(Debug, Deserialize)]
pub struct WhisperWord {
    pub word: Option<String>,
    pub start: Option<f64>,
    pub end: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct WhisperSeg {
    pub text: Option<String>,
    pub start: Option<f64>,
    pub end: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct WhisperVerbose {
    pub text: Option<String>,
    pub segments: Option<Vec<WhisperSeg>>,
    pub words: Option<Vec<WhisperWord>>,
}

pub fn transcribe_wav(api_key: &str, wav: &[u8], filename: &str) -> Result<WhisperVerbose, String> {
    if wav.len() < 64 {
        return Ok(WhisperVerbose {
            text: Some(String::new()),
            segments: Some(Vec::new()),
            words: Some(Vec::new()),
        });
    }
    let boundary = "----BagrryBoundary7MA4YWxkTrZu0gW";
    let mut body = Vec::new();
    fn field(body: &mut Vec<u8>, boundary: &str, name: &str, value: &str) {
        body.extend_from_slice(format!("--{boundary}\r\n").as_bytes());
        body.extend_from_slice(
            format!("Content-Disposition: form-data; name=\"{name}\"\r\n\r\n").as_bytes(),
        );
        body.extend_from_slice(value.as_bytes());
        body.extend_from_slice(b"\r\n");
    }
    field(&mut body, boundary, "model", STT_MODEL);
    field(&mut body, boundary, "response_format", "verbose_json");
    body.extend_from_slice(format!("--{boundary}\r\n").as_bytes());
    body.extend_from_slice(
        format!(
            "Content-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: audio/wav\r\n\r\n"
        )
        .as_bytes(),
    );
    body.extend_from_slice(wav);
    body.extend_from_slice(b"\r\n");
    body.extend_from_slice(format!("--{boundary}--\r\n").as_bytes());

    let resp = ureq::post(STT_URL)
        .set("Authorization", &format!("Bearer {api_key}"))
        .set(
            "Content-Type",
            &format!("multipart/form-data; boundary={boundary}"),
        )
        .send_bytes(&body)
        .map_err(|e| format!("stt request: {e}"))?;
    resp.into_json().map_err(|e| format!("stt json: {e}"))
}

pub fn chat(api_key: &str, system: &str, user: &str, json_mode: bool) -> Result<String, String> {
    let mut body = json!({
        "model": CHAT_MODEL,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ]
    });
    if json_mode {
        body["response_format"] = json!({"type": "json_object"});
    }
    let resp = ureq::post(CHAT_URL)
        .set("Authorization", &format!("Bearer {api_key}"))
        .set("Content-Type", "application/json")
        .send_json(body)
        .map_err(|e| format!("chat request: {e}"))?;
    let v: serde_json::Value = resp.into_json().map_err(|e| format!("chat json: {e}"))?;
    v["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "empty chat content".into())
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Bullet {
    pub text: String,
    pub citations: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Section {
    pub section_title: String,
    pub bullet_points: Vec<Bullet>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EnhancedDoc {
    pub sections: Vec<Section>,
}
