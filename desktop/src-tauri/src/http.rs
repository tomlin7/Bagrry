use crate::secrets;
use rusqlite::Connection;
use serde_json::json;
use std::io::Cursor;
use std::thread;
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};

pub fn spawn(db_path: std::path::PathBuf, port: u16) {
    thread::spawn(move || {
        let addr = format!("127.0.0.1:{port}");
        let server = match Server::http(&addr) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("local api bind {addr}: {e}");
                return;
            }
        };
        eprintln!("Bagrry local API on http://{addr}");
        for mut req in server.incoming_requests() {
            let _ = handle(&db_path, &mut req);
        }
    });
}

fn handle(db_path: &std::path::PathBuf, req: &mut Request) -> Result<(), ()> {
    let url = req.url().to_string();
    let method = req.method().clone();
    let auth_ok = authorized(db_path, req);
    if url.starts_with("/v1/") && !auth_ok {
        let _ = req.respond(json_res(401, json!({"error":"unauthorized"})));
        return Ok(());
    }
    let conn = match Connection::open(db_path) {
        Ok(c) => c,
        Err(e) => {
            let _ = req.respond(json_res(500, json!({"error": e.to_string()})));
            return Ok(());
        }
    };
    let _ = conn.execute_batch("PRAGMA foreign_keys = ON;");

    if method == Method::Get && (url == "/v1/notes" || url.starts_with("/v1/notes?")) {
        let notes = list_notes(&conn);
        let _ = req.respond(json_res(200, json!({"notes": notes})));
        return Ok(());
    }
    if method == Method::Get && url.starts_with("/v1/notes/") {
        let id = url.trim_start_matches("/v1/notes/").split('?').next().unwrap_or("");
        match get_note(&conn, id) {
            Some(v) => {
                let _ = req.respond(json_res(200, v));
            }
            None => {
                let _ = req.respond(json_res(404, json!({"error":"not found"})));
            }
        }
        return Ok(());
    }
    if method == Method::Get && url.starts_with("/v1/folders") {
        let folders = list_folders(&conn);
        let _ = req.respond(json_res(200, json!({"folders": folders})));
        return Ok(());
    }
    if method == Method::Post && url.starts_with("/v1/notes/search") {
        let body = read_body(req);
        let q = body
            .get("query")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let notes = search_notes(&conn, &q);
        let _ = req.respond(json_res(200, json!({"results": notes})));
        return Ok(());
    }
    if method == Method::Post && url == "/mcp" {
        let body = read_body(req);
        let result = mcp(&conn, &body);
        let _ = req.respond(json_res(200, result));
        return Ok(());
    }
    if method == Method::Get && url.starts_with("/share/") {
        let token = url.trim_start_matches("/share/");
        match share_payload(&conn, token) {
            Some(v) => {
                let _ = req.respond(html_or_json(req, v));
            }
            None => {
                let _ = req.respond(json_res(404, json!({"error":"not found"})));
            }
        }
        return Ok(());
    }
    let _ = req.respond(json_res(
        200,
        json!({"ok": true, "service": "bagrry", "docs": ["/v1/notes", "/v1/folders", "/v1/notes/search", "/mcp"]}),
    ));
    Ok(())
}

fn authorized(db_path: &std::path::PathBuf, req: &Request) -> bool {
    let Ok(conn) = Connection::open(db_path) else {
        return false;
    };
    let expected = secrets::get_setting(&conn, "api_key", "");
    if expected.is_empty() {
        return true;
    }
    req.headers()
        .iter()
        .any(|h| h.value.as_str().contains(&expected))
}

fn read_body(req: &mut Request) -> serde_json::Value {
    let mut buf = String::new();
    let _ = req.as_reader().read_to_string(&mut buf);
    serde_json::from_str(&buf).unwrap_or(json!({}))
}

fn json_res(code: u16, v: serde_json::Value) -> Response<Cursor<Vec<u8>>> {
    let body = v.to_string().into_bytes();
    Response::new(
        StatusCode(code),
        vec![
            Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap(),
            Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
        ],
        Cursor::new(body.clone()),
        Some(body.len()),
        None,
    )
}

fn html_or_json(req: &Request, v: serde_json::Value) -> Response<Cursor<Vec<u8>>> {
    let accept = req
        .headers()
        .iter()
        .find(|h| h.field.as_str() == "Accept")
        .map(|h| h.value.as_str().to_string())
        .unwrap_or_default();
    if accept.contains("text/html") {
        let title = v["title"].as_str().unwrap_or("Shared note");
        let html = format!(
            "<!doctype html><meta charset=utf-8><title>{}</title><body style='font-family:system-ui;max-width:720px;margin:40px auto'><h1>{}</h1><pre>{}</pre></body>",
            title,
            title,
            serde_json::to_string_pretty(&v).unwrap_or_default()
        );
        let body = html.into_bytes();
        return Response::new(
            StatusCode(200),
            vec![Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap()],
            Cursor::new(body.clone()),
            Some(body.len()),
            None,
        );
    }
    json_res(200, v)
}

fn list_notes(conn: &Connection) -> serde_json::Value {
    let mut stmt = conn
        .prepare("SELECT id, title, date, folder_id FROM meetings ORDER BY date DESC")
        .unwrap();
    let rows = stmt
        .query_map([], |row| {
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "title": row.get::<_, String>(1)?,
                "date": row.get::<_, String>(2)?,
                "folder_id": row.get::<_, Option<String>>(3)?,
            }))
        })
        .unwrap();
    rows.filter_map(|r| r.ok()).collect()
}

fn get_note(conn: &Connection, id: &str) -> Option<serde_json::Value> {
    conn.query_row(
        "SELECT id, title, date, scratchpad_raw, enhanced_notes_json, transcript_json FROM meetings WHERE id=?1",
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
    let mut stmt = conn
        .prepare("SELECT id, name, parent_id FROM folders")
        .unwrap();
    let rows = stmt
        .query_map([], |row| {
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                "parent_id": row.get::<_, Option<String>>(2)?,
            }))
        })
        .unwrap();
    rows.filter_map(|r| r.ok()).collect()
}

fn search_notes(conn: &Connection, q: &str) -> serde_json::Value {
    let like = format!("%{q}%");
    let mut stmt = conn
        .prepare(
            "SELECT id, title FROM meetings
             WHERE title LIKE ?1 OR scratchpad_raw LIKE ?1 OR ifnull(enhanced_notes_json,'') LIKE ?1
             ORDER BY date DESC LIMIT 50",
        )
        .unwrap();
    let rows = stmt
        .query_map([&like], |row| {
            Ok(json!({"id": row.get::<_, String>(0)?, "title": row.get::<_, String>(1)?}))
        })
        .unwrap();
    rows.filter_map(|r| r.ok()).collect()
}

fn share_payload(conn: &Connection, token: &str) -> Option<serde_json::Value> {
    let meeting_id: String = conn
        .query_row(
            "SELECT meeting_id FROM shares WHERE token=?1",
            [token],
            |row| row.get(0),
        )
        .ok()?;
    get_note(conn, &meeting_id)
}

fn mcp(conn: &Connection, body: &serde_json::Value) -> serde_json::Value {
    let method = body["method"].as_str().unwrap_or("");
    let id = body.get("id").cloned().unwrap_or(json!(1));
    let params = body.get("params").cloned().unwrap_or(json!({}));
    let result = match method {
        "tools/list" => json!({
            "tools": [
                {"name": "query_bagrry_meetings", "description": "Chat across meeting knowledge"},
                {"name": "list_meetings", "description": "List meetings"},
                {"name": "list_meeting_folders", "description": "List folders"},
                {"name": "get_meetings", "description": "Get structured notes"},
                {"name": "get_meeting_transcript", "description": "Fetch transcript with citations"}
            ]
        }),
        "tools/call" => {
            let name = params["name"].as_str().unwrap_or("");
            match name {
                "list_meetings" => json!({"content": [{"type":"text","text": list_notes(conn).to_string()}]}),
                "list_meeting_folders" => json!({"content": [{"type":"text","text": list_folders(conn).to_string()}]}),
                "get_meetings" | "get_meeting_transcript" => {
                    let mid = params["arguments"]["id"].as_str().unwrap_or("");
                    json!({"content": [{"type":"text","text": get_note(conn, mid).unwrap_or(json!({})).to_string()}]})
                }
                "query_bagrry_meetings" => {
                    let q = params["arguments"]["query"].as_str().unwrap_or("");
                    json!({"content": [{"type":"text","text": search_notes(conn, q).to_string()}]})
                }
                _ => json!({"error": "unknown tool"}),
            }
        }
        _ => json!({"ok": true, "methods": ["tools/list", "tools/call"]}),
    };
    json!({"jsonrpc":"2.0","id": id, "result": result})
}
