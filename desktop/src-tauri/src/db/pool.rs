use rusqlite::Connection;
use std::ops::{Deref, DerefMut};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Condvar, Mutex};
use std::time::{Duration, Instant};

/// WAL lets readers run while a write is in flight; the busy timeout covers the
/// narrow windows where they still collide.
const CONNECTION_PRAGMAS: &str = "PRAGMA foreign_keys = ON;
     PRAGMA journal_mode = WAL;
     PRAGMA synchronous = NORMAL;
     PRAGMA busy_timeout = 5000;
     PRAGMA temp_store = MEMORY;";

const DEFAULT_MAX_CONNECTIONS: usize = 8;
const CHECKOUT_TIMEOUT: Duration = Duration::from_secs(10);

struct Inner {
    /// Connections currently available for checkout.
    idle: Vec<Connection>,
    /// Connections that exist at all, idle or checked out.
    created: usize,
}

/// A small fixed-size SQLite connection pool.
///
/// The previous design shared one `Mutex<Connection>` across every Tauri
/// command, so a slow query serialised the entire UI. This hands out
/// independent connections instead and only blocks once all of them are busy.
pub struct DbPool {
    path: PathBuf,
    max: usize,
    state: Mutex<Inner>,
    available: Condvar,
}

impl DbPool {
    pub fn open(path: &Path) -> Result<Arc<Self>, String> {
        let pool = Arc::new(Self {
            path: path.to_path_buf(),
            max: DEFAULT_MAX_CONNECTIONS,
            state: Mutex::new(Inner {
                idle: Vec::new(),
                created: 0,
            }),
            available: Condvar::new(),
        });
        // Fail fast at startup rather than on the first command.
        let probe = pool.get()?;
        drop(probe);
        Ok(pool)
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Checks out a connection, opening a new one if the pool hasn't reached
    /// its ceiling. Blocks up to `CHECKOUT_TIMEOUT` when everything is in use.
    pub fn get(self: &Arc<Self>) -> Result<PooledConn, String> {
        let deadline = Instant::now() + CHECKOUT_TIMEOUT;
        let mut state = self.state.lock().map_err(|_| poisoned())?;

        loop {
            if let Some(conn) = state.idle.pop() {
                return Ok(PooledConn {
                    conn: Some(conn),
                    pool: Arc::clone(self),
                });
            }

            if state.created < self.max {
                state.created += 1;
                // Opening is slow enough to be worth doing outside the lock, and
                // the reserved slot above stops us overshooting `max`.
                drop(state);
                return match open_connection(&self.path) {
                    Ok(conn) => Ok(PooledConn {
                        conn: Some(conn),
                        pool: Arc::clone(self),
                    }),
                    Err(e) => {
                        if let Ok(mut state) = self.state.lock() {
                            state.created -= 1;
                        }
                        self.available.notify_one();
                        Err(e)
                    }
                };
            }

            let remaining = deadline.saturating_duration_since(Instant::now());
            if remaining.is_zero() {
                return Err("database is busy; try again".into());
            }
            let (next, timeout) = self
                .available
                .wait_timeout(state, remaining)
                .map_err(|_| poisoned())?;
            state = next;
            if timeout.timed_out() && state.idle.is_empty() {
                return Err("database is busy; try again".into());
            }
        }
    }

    fn put_back(&self, conn: Connection) {
        if let Ok(mut state) = self.state.lock() {
            state.idle.push(conn);
        }
        self.available.notify_one();
    }

    /// Called when a connection is dropped without being returned, so the slot
    /// can be reused.
    fn release_slot(&self) {
        if let Ok(mut state) = self.state.lock() {
            state.created = state.created.saturating_sub(1);
        }
        self.available.notify_one();
    }
}

fn poisoned() -> String {
    "database pool is unavailable".to_string()
}

pub fn open_connection(path: &Path) -> Result<Connection, String> {
    let conn = Connection::open(path).map_err(|e| format!("open sqlite: {e}"))?;
    conn.execute_batch(CONNECTION_PRAGMAS)
        .map_err(|e| format!("pragma: {e}"))?;
    Ok(conn)
}

/// A checked-out connection. Derefs to `Connection`, and returns itself to the
/// pool on drop.
pub struct PooledConn {
    conn: Option<Connection>,
    pool: Arc<DbPool>,
}

impl Deref for PooledConn {
    type Target = Connection;
    fn deref(&self) -> &Connection {
        self.conn.as_ref().expect("connection checked out")
    }
}

impl DerefMut for PooledConn {
    fn deref_mut(&mut self) -> &mut Connection {
        self.conn.as_mut().expect("connection checked out")
    }
}

impl Drop for PooledConn {
    fn drop(&mut self) {
        match self.conn.take() {
            Some(conn) => self.pool.put_back(conn),
            None => self.pool.release_slot(),
        }
    }
}
