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

    if method == Method::Get && url.starts_with("/share/") {
        let token = url.trim_start_matches("/share/");
        match share_payload(&conn, token) {
            Some(payload) => respond(req, html_or_json(&accept, payload)),
            None => respond(req, json_res(404, json!({ "error": "not found" }))),
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

/// When no API key is configured the server is open — it only listens on
/// loopback. Once a key exists we require an exact `Bearer <key>`.
fn authorized(conn: &Connection, req: &Request) -> bool {
    let expected = secrets::get_setting(conn, "api_key", "");
    if expected.is_empty() {
        return true;
    }
    match header_value(req, "Authorization") {
        Some(value) => value.strip_prefix("Bearer ").map(str::trim) == Some(expected.as_str()),
        None => false,
    }
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

    let title = escape_html(value["title"].as_str().unwrap_or("Shared note"));
    let body = escape_html(
        value["scratchpad"]
            .as_str()
            .unwrap_or_default(),
    );
    let html = format!(
        "<!doctype html><html><head><meta charset=\"utf-8\"><title>{title}</title>\
         <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\
         <style>body{{font-family:system-ui,-apple-system,sans-serif;max-width:44rem;margin:3rem auto;\
         padding:0 1.5rem;line-height:1.6;color:#1c1b19}}h1{{font-size:1.6rem}}\
         pre{{white-space:pre-wrap;font:inherit}}</style></head>\
         <body><h1>{title}</h1><pre>{body}</pre></body></html>"
    );
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
    let meeting_id: String = conn
        .query_row(
            "SELECT meeting_id FROM shares WHERE token = ?1",
            [token],
            |row| row.get(0),
        )
        .ok()?;
    get_note(conn, &meeting_id)
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
