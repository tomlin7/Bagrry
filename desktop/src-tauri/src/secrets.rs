use rusqlite::params;
use rusqlite::Connection;

const SERVICE: &str = "com.bit.bagrry";

pub fn set_secret(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    if let Ok(entry) = keyring::Entry::new(SERVICE, key) {
        if entry.set_password(value).is_ok() {
            return Ok(());
        }
    }
    conn.execute(
        "INSERT INTO settings(key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![format!("secret:{key}"), value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_secret(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    if let Ok(entry) = keyring::Entry::new(SERVICE, key) {
        if let Ok(v) = entry.get_password() {
            if !v.is_empty() {
                return Ok(Some(v));
            }
        }
    }
    let val: Result<String, _> = conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![format!("secret:{key}")],
        |row| row.get(0),
    );
    Ok(val.ok().filter(|s| !s.is_empty()))
}

pub fn has_secret(conn: &Connection, key: &str) -> bool {
    matches!(get_secret(conn, key), Ok(Some(v)) if !v.is_empty())
}

pub fn get_setting(conn: &Connection, key: &str, default: &str) -> String {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |row| row.get(0),
    )
    .unwrap_or_else(|_| default.to_string())
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO settings(key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
