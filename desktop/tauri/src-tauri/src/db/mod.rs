mod migrations;
mod pool;
pub mod schema;

use rusqlite::Connection;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Manager};

pub use pool::{DbPool, PooledConn};

pub type SharedPool = Arc<DbPool>;

pub fn open(app: &AppHandle) -> Result<SharedPool, String> {
    let path = db_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("create app data dir: {e}"))?;
    }
    open_at(&path)
}

pub fn open_at(path: &Path) -> Result<SharedPool, String> {
    // Registering sqlite-vec is process-wide, so it must happen before any
    // connection in the pool is opened.
    let vec_registered = schema::register_sqlite_vec();

    let pool = DbPool::open(path)?;

    let conn = pool.get()?;
    let vec_ok = vec_registered && schema::vec_available(&conn);
    migrations::apply(&conn, vec_ok)?;
    drop(conn);

    Ok(pool)
}

/// A standalone connection for the background HTTP server, which owns its own
/// thread and shouldn't contend for the UI pool.
pub fn open_single(path: &Path) -> Result<Connection, String> {
    pool::open_connection(path)
}

pub fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir: {e}"))?;
    Ok(dir.join("bagrry.sqlite"))
}
