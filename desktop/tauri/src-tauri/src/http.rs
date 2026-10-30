use crate::db;
use crate::secrets;
use rusqlite::Connection;
use serde_json::json;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::thread;
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};

/// Local-only REST + MCP surface. It runs on its own thread with its own
/// connection so it never contends with the UI's pool.
pub fn spawn(db_path: PathBuf, port: u16) {
    thread::Builder::new()
        .name("bagrry-local-api".into())
        .spawn(move || {
            let addr = format!("127.0.0.1:{port}");
            let server = match Server::http(&addr) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("local api bind {addr}: {e}");
                    return;
                }
            };
            eprintln!("Bagrry local API on http://{addr}");
            for req in server.incoming_requests() {
                handle(&db_path, req);
            }
        })
        .ok();
}

fn handle(db_path: &Path, mut req: Request) {
    let url = req.url().to_string();
    let method = req.method().clone();
    let accept = header_value(&req, "Accept").unwrap_or_default();

    let conn = match db::open_single(db_path) {
        Ok(c) => c,
        Err(e) => {
            respond(req, json_res(500, json!({ "error": e })));
            return;
        }
    };

    // Everything under /v1 is machine-facing and honours the optional API key.
    if url.starts_with("/v1/") && !authorized(&conn, &req) {
        respond(req, json_res(401, json!({ "error": "unauthorized" })));
        return;
    }

    if method == Method::Get && (url == "/v1/notes" || url.starts_with("/v1/notes?")) {
        respond(req, json_res(200, json!({ "notes": list_notes(&conn) })));
        return;
    }

    if method == Method::Get && url.starts_with("/v1/notes/") {
        let id = url
            .trim_start_matches("/v1/notes/")
            .split('?')
            .next()
            .unwrap_or_default();
        match get_note(&conn, id) {
            Some(note) => respond(req, json_res(200, note)),
            None => respond(req, json_res(404, json!({ "error": "not found" }))),
        }
        return;
    }

    if method == Method::Get && url.starts_with("/v1/folders") {
        respond(req, json_res(200, json!({ "folders": list_folders(&conn) })));
        return;
    }

    if method == Method::Post && url.starts_with("/v1/notes/search") {
        let body = read_body(&mut req);
        let query = body.get("query").and_then(|v| v.as_str()).unwrap_or_default();
        let results = search_notes(&conn, query);
        respond(req, json_res(200, json!({ "results": results })));
        return;
    }

    if method == Method::Post && url == "/mcp" {
        let body = read_body(&mut req);
        let result = mcp(&conn, &body);
        respond(req, json_res(200, result));
        return;
    }

    if method == Method::Get && (url.starts_with("/share/") || url.starts_with("/s/")) {
        let token = if url.starts_with("/s/") {
            url.trim_start_matches("/s/")
        } else {
            url.trim_start_matches("/share/")
        };
        let token = token.split('?').next().unwrap_or(token);
        match share_payload(&conn, token) {
            Some(payload) => respond(req, html_or_json(&accept, payload)),
            None => respond(req, json_res(404, json!({ "error": "Share link not found or expired" }))),
        }
        return;
    }

    respond(
        req,
        json_res(
            200,
            json!({
                "ok": true,
                "service": "bagrry",
                "docs": ["/v1/notes", "/v1/folders", "/v1/notes/search", "/mcp"]
            }),
        ),
    );
}

fn respond(req: Request, response: Response<Cursor<Vec<u8>>>) {
    if let Err(e) = req.respond(response) {
        eprintln!("local api respond: {e}");
    }
}

fn header_value(req: &Request, field: &str) -> Option<String> {
    req.headers()
        .iter()
        .find(|h| h.field.as_str().as_str().eq_ignore_ascii_case(field))
        .map(|h| h.value.as_str().to_string())
}

/// When no API key exists the server is open — it only listens on loopback.
/// Once a legacy `api_key` setting or any managed key exists we require a
/// matching `Bearer <key>`.
fn authorized(conn: &Connection, req: &Request) -> bool {
    let legacy = secrets::get_setting(conn, "api_key", "");
    let managed: i64 = conn
        .query_row("SELECT COUNT(*) FROM api_keys", [], |row| row.get(0))
        .unwrap_or(0);
    if legacy.is_empty() && managed == 0 {
        return true;
    }
    let presented = match header_value(req, "Authorization") {
        Some(value) => match value.strip_prefix("Bearer ").map(str::trim) {
            Some(t) if !t.is_empty() => t.to_string(),
            _ => return false,
        },
        None => return false,
    };
    if !legacy.is_empty() && presented == legacy {
        return true;
    }
    conn.query_row(
        "SELECT COUNT(*) FROM api_keys WHERE token = ?1",
        [&presented],
        |row| row.get::<_, i64>(0),
    )
    .map(|n| n > 0)
    .unwrap_or(false)
}

fn read_body(req: &mut Request) -> serde_json::Value {
    let mut buf = String::new();
    if std::io::Read::read_to_string(req.as_reader(), &mut buf).is_err() {
        return json!({});
    }
    serde_json::from_str(&buf).unwrap_or_else(|_| json!({}))
}

fn header(field: &str, value: &str) -> Option<Header> {
    Header::from_bytes(field.as_bytes(), value.as_bytes()).ok()
}

fn build(code: u16, content_type: &str, body: Vec<u8>) -> Response<Cursor<Vec<u8>>> {
    let headers = [
        header("Content-Type", content_type),
        header("Cache-Control", "no-store"),
        header("X-Content-Type-Options", "nosniff"),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>();

    let len = body.len();
    Response::new(StatusCode(code), headers, Cursor::new(body), Some(len), None)
}

fn json_res(code: u16, value: serde_json::Value) -> Response<Cursor<Vec<u8>>> {
    build(code, "application/json", value.to_string().into_bytes())
}

fn escape_html(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn html_or_json(accept: &str, value: serde_json::Value) -> Response<Cursor<Vec<u8>>> {
    if !accept.contains("text/html") {
        return json_res(200, value);
    }

    let title = escape_html(value["title"].as_str().unwrap_or("Shared Meeting"));
    let date = escape_html(value["date"].as_str().unwrap_or(""));
    let scratchpad = value["scratchpad"].as_str().unwrap_or("").trim();
    let enhanced = value["enhanced"].as_str().unwrap_or("");
    let transcript = value["transcript"].as_str().unwrap_or("");
    let include_audio = value["include_audio"].as_bool().unwrap_or(false);

    let mut enhanced_html = String::new();
    if !enhanced.is_empty() {
        if let Ok(doc) = serde_json::from_str::<serde_json::Value>(enhanced) {
            if let Some(sections) = doc.get("sections").and_then(|s| s.as_array()) {
                for sec in sections {
                    let stitle = escape_html(sec.get("section_title").and_then(|t| t.as_str()).unwrap_or("Section"));
                    enhanced_html.push_str(&format!("<div class=\"section\"><h3>{}</h3><ul>", stitle));
                    if let Some(bullets) = sec.get("bullet_points").and_then(|b| b.as_array()) {
                        for b in bullets {
                            let text = escape_html(b.get("text").and_then(|t| t.as_str()).unwrap_or(""));
                            enhanced_html.push_str(&format!("<li>{}</li>", text));
                        }
                    }
                    enhanced_html.push_str("</ul></div>");
                }
            }
        }
    }

    let mut transcript_html = String::new();
    if !transcript.is_empty() {
        if let Ok(segs) = serde_json::from_str::<serde_json::Value>(transcript) {
            if let Some(arr) = segs.as_array() {
                transcript_html.push_str("<details class=\"transcript-box\"><summary>Verbatim Transcript (" );
                transcript_html.push_str(&format!("{} utterances)</summary><div class=\"transcript-lines\">", arr.len()));
                for seg in arr {
                    let speaker = escape_html(seg.get("speaker").and_then(|s| s.as_str()).unwrap_or("speaker"));
                    let text = escape_html(seg.get("text").and_then(|t| t.as_str()).unwrap_or(""));
                    let is_me = speaker == "me";
                    let spk_label = if is_me { "You" } else { "Attendee" };
                    transcript_html.push_str(&format!(
                        "<div class=\"t-line\"><span class=\"spk\">{}</span>: {}</div>",
                        spk_label, text
                    ));
                }
                transcript_html.push_str("</div></details>");
            }
        }
    }

    let mut scratch_html = String::new();
    if !scratchpad.is_empty() {
        scratch_html.push_str("<details class=\"transcript-box\"><summary>User Scratchpad Notes</summary><pre class=\"scratchpad-pre\">");
        scratch_html.push_str(&escape_html(scratchpad));
        scratch_html.push_str("</pre></details>");
    }

    let audio_player_html = if include_audio {
        "<div class=\"audio-box\"><div class=\"audio-title\">Audio Scrubber Available</div><div class=\"audio-sub\">48-bar speech formant waveform enabled for this meeting.</div></div>"
    } else {
        ""
    };

    let html = format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title} · Bagrry</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    :root {{
      --bg: #1c1b18;
      --surface: #262421;
      --border: #383530;
      --text: #edece8;
      --text-muted: #9e9b94;
      --accent: #e2f072;
      --accent-fg: #1a2203;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }}
    header {{
      width: 100%;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .brand {{ font-weight: 700; font-size: 14px; color: var(--text); display: flex; align-items: center; gap: 8px; }}
    .badge {{ background: var(--accent); color: var(--accent-fg); font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }}
    main {{ max-width: 720px; width: 100%; padding: 32px 24px; }}
    h1 {{ font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }}
    .meta {{ font-size: 12.5px; color: var(--text-muted); margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; }}
    .section {{ margin-bottom: 24px; }}
    h3 {{ font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 8px; }}
    ul {{ padding-left: 20px; margin-bottom: 12px; }}
    li {{ margin-bottom: 6px; font-size: 13.5px; color: #ddd; }}
    .transcript-box {{ border: 1px solid var(--border); border-radius: 8px; background: var(--surface); padding: 12px; margin-top: 20px; }}
    summary {{ font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text); outline: none; }}
    .transcript-lines {{ margin-top: 12px; display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; font-size: 12.5px; }}
    .t-line {{ color: #ccc; }}
    .spk {{ font-weight: 600; color: var(--accent); }}
    .scratchpad-pre {{ white-space: pre-wrap; font-family: inherit; font-size: 13px; margin-top: 12px; color: #ccc; }}
    .audio-box {{ border: 1px solid var(--border); border-radius: 8px; background: var(--surface); padding: 12px; margin-bottom: 20px; }}
    .audio-title {{ font-size: 13px; font-weight: 600; color: var(--accent); }}
    .audio-sub {{ font-size: 11.5px; color: var(--text-muted); }}
  </style>
</head>
<body>
  <header>
    <div class="brand">Bagrry <span class="badge">Read-only share</span></div>
    <div style="font-size: 11px; color: var(--text-muted);">Verified Link</div>
  </header>
  <main>
    {audio_player_html}
    <h1>{title}</h1>
    <div class="meta">Recorded on {date}</div>
    {enhanced_html}
    {scratch_html}
    {transcript_html}
  </main>
</body>
</html>"#);

    build(200, "text/html; charset=utf-8", html.into_bytes())
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

fn query_json<P: rusqlite::Params>(
    conn: &Connection,
    sql: &str,
    params: P,
    map: fn(&rusqlite::Row<'_>) -> rusqlite::Result<serde_json::Value>,
) -> serde_json::Value {
    let Ok(mut stmt) = conn.prepare(sql) else {
        return json!([]);
    };
    let Ok(rows) = stmt.query_map(params, map) else {
        return json!([]);
    };
    let values: Vec<serde_json::Value> = rows.filter_map(Result::ok).collect();
    serde_json::Value::Array(values)
}

fn list_notes(conn: &Connection) -> serde_json::Value {
    query_json(
        conn,
        "SELECT id, title, date, folder_id FROM meetings ORDER BY date DESC LIMIT 500",
        [],
        |row| {
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "title": row.get::<_, String>(1)?,
                "date": row.get::<_, String>(2)?,
                "folder_id": row.get::<_, Option<String>>(3)?,
            }))
        },
    )
}

fn get_note(conn: &Connection, id: &str) -> Option<serde_json::Value> {
    conn.query_row(
        "SELECT id, title, date, scratchpad_raw, enhanced_notes_json, transcript_json
         FROM meetings WHERE id = ?1",
        [id],
        |row| {
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "title": row.get::<_, String>(1)?,
                "date": row.get::<_, String>(2)?,
                "scratchpad": row.get::<_, String>(3)?,
                "enhanced": row.get::<_, Option<String>>(4)?,
                "transcript": row.get::<_, Option<String>>(5)?,
            }))
        },
    )
    .ok()
}

fn list_folders(conn: &Connection) -> serde_json::Value {
    query_json(
        conn,
        "SELECT id, name, parent_id, is_shared, icon, description FROM folders ORDER BY name",
        [],
        |row| {
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                "parent_id": row.get::<_, Option<String>>(2)?,
                "is_shared": row.get::<_, i64>(3)? != 0,
                "icon": row.get::<_, Option<String>>(4)?,
                "description": row.get::<_, Option<String>>(5)?,
            }))
        },
    )
}

fn search_notes(conn: &Connection, query: &str) -> serde_json::Value {
    if query.trim().is_empty() {
        return json!([]);
    }
    let like = format!("%{query}%");
    query_json(
        conn,
        "SELECT id, title FROM meetings
         WHERE title LIKE ?1 OR scratchpad_raw LIKE ?1 OR ifnull(enhanced_notes_json,'') LIKE ?1
         ORDER BY date DESC LIMIT 50",
        [&like],
        |row| Ok(json!({ "id": row.get::<_, String>(0)?, "title": row.get::<_, String>(1)? })),
    )
}

fn share_payload(conn: &Connection, token: &str) -> Option<serde_json::Value> {
    let row = conn
        .query_row(
            "SELECT meeting_id, ifnull(visibility, 'link'),
                    ifnull(include_transcript, 1), ifnull(include_audio, 0), ifnull(include_scratchpad, 1),
                    expires_at, ifnull(revoked, 0)
             FROM shares WHERE token = ?1",
            [token],
            |row| Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)? != 0,
                row.get::<_, i64>(3)? != 0,
                row.get::<_, i64>(4)? != 0,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, i64>(6)? != 0,
            )),
        )
        .ok()?;

    let (meeting_id, visibility, inc_transcript, inc_audio, inc_scratchpad, expires_at, revoked) = row;

    if visibility == "private" || revoked {
        return None;
    }

    if let Some(ref exp) = expires_at {
        let is_expired: bool = conn
            .query_row(
                "SELECT datetime('now') > datetime(?1)",
                [exp],
                |r| r.get(0),
            )
            .unwrap_or(false);
        if is_expired {
            return None;
        }
    }

    // Increment views count
    let _ = conn.execute("UPDATE shares SET views_count = ifnull(views_count, 0) + 1 WHERE token = ?1", [token]);

    let mut note = get_note(conn, &meeting_id)?;
    if !inc_scratchpad {
        note["scratchpad"] = serde_json::json!("");
    }
    if !inc_transcript {
        note["transcript"] = serde_json::json!(null);
    }
    note["include_audio"] = serde_json::json!(inc_audio);
    Some(note)
}

/* ------------------------------------------------------------------ */
/* MCP                                                                 */
/* ------------------------------------------------------------------ */

fn mcp(conn: &Connection, body: &serde_json::Value) -> serde_json::Value {
    let method = body["method"].as_str().unwrap_or_default();
    let id = body.get("id").cloned().unwrap_or(json!(1));
    let params = body.get("params").cloned().unwrap_or(json!({}));

    let result = match method {
        "tools/list" => json!({
            "tools": [
                {"name": "query_bagrry_meetings", "description": "Search across meeting knowledge"},
                {"name": "list_meetings", "description": "List meetings"},
                {"name": "list_meeting_folders", "description": "List folders"},
                {"name": "get_meetings", "description": "Get structured notes"},
                {"name": "get_meeting_transcript", "description": "Fetch transcript with citations"}
            ]
        }),
        "tools/call" => {
            let name = params["name"].as_str().unwrap_or_default();
            let text = match name {
                "list_meetings" => list_notes(conn).to_string(),
                "list_meeting_folders" => list_folders(conn).to_string(),
                "get_meetings" | "get_meeting_transcript" => {
                    let mid = params["arguments"]["id"].as_str().unwrap_or_default();
                    get_note(conn, mid).unwrap_or_else(|| json!({})).to_string()
                }
                "query_bagrry_meetings" => {
                    let q = params["arguments"]["query"].as_str().unwrap_or_default();
                    search_notes(conn, q).to_string()
                }
                _ => return json!({"jsonrpc":"2.0","id": id, "error": {"code": -32601, "message": "unknown tool"}}),
            };
            json!({ "content": [{ "type": "text", "text": text }] })
        }
        _ => json!({ "ok": true, "methods": ["tools/list", "tools/call"] }),
    };

    json!({ "jsonrpc": "2.0", "id": id, "result": result })
}
