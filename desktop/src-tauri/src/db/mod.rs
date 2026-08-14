mod migrations;
pub mod schema;

use rusqlite::Connection;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn open(app: &AppHandle) -> Result<Connection, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("create app data dir: {e}"))?;
    let path = dir.join("bagrry.sqlite");
    open_at(&path)
}

pub fn open_at(path: &PathBuf) -> Result<Connection, String> {
    let vec_registered = schema::register_sqlite_vec();
    let conn = Connection::open(path).map_err(|e| format!("open sqlite: {e}"))?;
    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;",
    )
    .map_err(|e| format!("pragma: {e}"))?;

    let vec_ok = vec_registered && schema::vec_available(&conn);
    migrations::apply(&conn, vec_ok)?;
    Ok(conn)
}

pub fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir: {e}"))?;
    Ok(dir.join("bagrry.sqlite"))
}
