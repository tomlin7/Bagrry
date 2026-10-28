use rusqlite::Connection;

pub fn register_sqlite_vec() -> bool {
    #[cfg(feature = "sqlite-vec")]
    {
        unsafe {
            rusqlite::ffi::sqlite3_auto_extension(Some(std::mem::transmute(
                sqlite_vec::sqlite3_vec_init as *const (),
            )));
        }
        true
    }
    #[cfg(not(feature = "sqlite-vec"))]
    {
        false
    }
}

pub fn vec_available(conn: &Connection) -> bool {
    conn.query_row("SELECT vec_version()", [], |row| row.get::<_, String>(0))
        .is_ok()
}
