pub mod capture;
pub mod resample;
pub mod sink;
pub mod wav;

use crate::groq;
use crate::pipeline::{self, TranscriptSeg};
use crate::secrets;
use crate::AppState;
use serde::Serialize;
use sink::PcmSink;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

const TARGET_HZ: u32 = 16_000;
const MAX_SECONDS: u64 = 90 * 60;
const LIVE_TICK: Duration = Duration::from_secs(10);
const LIVE_MIN_SAMPLES: u64 = TARGET_HZ as u64 * 4;

#[derive(Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RecState {
    Idle,
    Recording,
    Paused,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecStatus {
    pub state: RecState,
    pub pending_bytes: usize,
    pub loopback_ok: bool,
    pub meeting_id: Option<String>,
    pub last_error: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct VuLevels {
    pub mic: f32,
    pub system: f32,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LiveTranscriptBatch {
    pub meeting_id: Option<String>,
    pub segments: Vec<TranscriptSeg>,
}

pub struct PendingAudio {
    pub dir: PathBuf,
    pub mic: PathBuf,
    pub sys: PathBuf,
}

impl PendingAudio {
    pub fn cleanup(&self) {
        let _ = std::fs::remove_dir_all(&self.dir);
    }
}

pub struct Recorder {
    pub state: Mutex<RecState>,
    pub pending: Mutex<Option<PendingAudio>>,
    pub loopback_ok: Mutex<bool>,
    pub meeting_id: Mutex<Option<String>>,
    pub last_error: Mutex<Option<String>>,
    session: Mutex<Option<LiveSession>>,
}

struct LiveSession {
    stop: Arc<AtomicBool>,
    paused: Arc<AtomicBool>,
    mic: Option<JoinHandle<()>>,
    loopback: Option<JoinHandle<()>>,
    vu: Option<JoinHandle<()>>,
    live: Option<JoinHandle<()>>,
    mic_sink: Arc<PcmSink>,
    sys_sink: Arc<PcmSink>,
    dir: PathBuf,
    last_error: Arc<Mutex<Option<String>>>,
}

impl Recorder {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(RecState::Idle),
            pending: Mutex::new(None),
            loopback_ok: Mutex::new(false),
            meeting_id: Mutex::new(None),
            last_error: Mutex::new(None),
            session: Mutex::new(None),
        }
    }
}

fn recorder_of(app: &AppHandle) -> tauri::State<'_, AppState> {
    app.state::<AppState>()
}

fn session_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir: {e}"))?;
    Ok(dir.join("recordings").join(crate::ids::new_id("rec")))
}

pub fn start(app: &AppHandle, meeting_id: Option<String>) -> Result<RecStatus, String> {
    let state = recorder_of(app);
    let recorder = &state.recorder;
    {
        let rec_state = recorder.state.lock().map_err(|e| e.to_string())?;
        if *rec_state != RecState::Idle {
            return Err("already capturing".into());
        }
    }

    if let Some(old) = recorder.pending.lock().map_err(|e| e.to_string())?.take() {
        old.cleanup();
    }
    *recorder.last_error.lock().map_err(|e| e.to_string())? = None;
    *recorder.meeting_id.lock().map_err(|e| e.to_string())? = meeting_id.clone();

    let dir = session_dir(app)?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("recording dir: {e}"))?;
    let max_samples = TARGET_HZ as u64 * MAX_SECONDS;
    let mic_sink = Arc::new(PcmSink::create(dir.join("mic.pcm"), max_samples)?);
    let sys_sink = Arc::new(PcmSink::create(dir.join("sys.pcm"), max_samples)?);

    let stop = Arc::new(AtomicBool::new(false));
    let paused = Arc::new(AtomicBool::new(false));
    let mic_level = Arc::new(AtomicU32::new(0));
    let sys_level = Arc::new(AtomicU32::new(0));
    let last_error = Arc::new(Mutex::new(None));

    let mic = capture::start_mic(
        stop.clone(),
        paused.clone(),
        mic_sink.clone(),
        mic_level.clone(),
        last_error.clone(),
        TARGET_HZ,
    )?;

    let (loopback, loopback_ok) = capture::start_loopback(
        stop.clone(),
        paused.clone(),
        sys_sink.clone(),
        sys_level.clone(),
        last_error.clone(),
        TARGET_HZ,
    );
    *recorder.loopback_ok.lock().map_err(|e| e.to_string())? = loopback_ok;

    let vu_stop = stop.clone();
    let vu_app = app.clone();
    let vu_mic = mic_level.clone();
    let vu_sys = sys_level.clone();
    let vu_err = last_error.clone();
    let vu = std::thread::spawn(move || {
        let mut last_emitted_err: Option<String> = None;
        while !vu_stop.load(Ordering::Relaxed) {
            let mic = f32::from_bits(vu_mic.load(Ordering::Relaxed));
            let system = f32::from_bits(vu_sys.load(Ordering::Relaxed));
            let _ = vu_app.emit("audio-vu", VuLevels { mic, system });
            if let Ok(slot) = vu_err.lock() {
                if let Some(err) = slot.as_ref() {
                    if last_emitted_err.as_ref() != Some(err) {
                        last_emitted_err = Some(err.clone());
                        let _ = vu_app.emit("recording-error", err.clone());
                    }
                }
            }
            std::thread::sleep(Duration::from_millis(80));
        }
    });

    let live = spawn_live_stt(
        app.clone(),
        stop.clone(),
        paused.clone(),
        mic_sink.clone(),
        sys_sink.clone(),
        meeting_id,
    );

    *recorder.session.lock().map_err(|e| e.to_string())? = Some(LiveSession {
        stop,
        paused,
        mic: Some(mic),
        loopback,
        vu: Some(vu),
        live: Some(live),
        mic_sink,
        sys_sink,
        dir,
        last_error,
    });
    *recorder.state.lock().map_err(|e| e.to_string())? = RecState::Recording;
    set_tray_tooltip(app, "Bagrry — Recording");
    let status = status_of(recorder)?;
    let _ = app.emit("recording-state", status.clone());
    Ok(status)
}

pub fn pause(app: &AppHandle) -> Result<RecStatus, String> {
    let state = recorder_of(app);
    let recorder = &state.recorder;
    let current = {
        let guard = recorder.state.lock().map_err(|e| e.to_string())?;
        *guard
    };
    match current {
        RecState::Recording => {
            if let Some(session) = recorder.session.lock().map_err(|e| e.to_string())?.as_ref() {
                session.paused.store(true, Ordering::Relaxed);
            }
            *recorder.state.lock().map_err(|e| e.to_string())? = RecState::Paused;
            set_tray_tooltip(app, "Bagrry — Paused");
        }
        RecState::Paused => {
            if let Some(session) = recorder.session.lock().map_err(|e| e.to_string())?.as_ref() {
                session.paused.store(false, Ordering::Relaxed);
            }
            *recorder.state.lock().map_err(|e| e.to_string())? = RecState::Recording;
            set_tray_tooltip(app, "Bagrry — Recording");
        }
        RecState::Idle => return Err("not capturing".into()),
    }
    let status = status_of(recorder)?;
    let _ = app.emit("recording-state", status.clone());
    Ok(status)
}

pub fn stop(app: &AppHandle) -> Result<RecStatus, String> {
    let state = recorder_of(app);
    let recorder = &state.recorder;
    let session = {
        let mut session_guard = recorder.session.lock().map_err(|e| e.to_string())?;
        session_guard.take().ok_or_else(|| "not capturing".to_string())?
    };
    session.stop.store(true, Ordering::Relaxed);
    if let Some(handle) = session.mic {
        let _ = handle.join();
    }
    if let Some(handle) = session.loopback {
        let _ = handle.join();
    }
    if let Some(handle) = session.vu {
        let _ = handle.join();
    }
    if let Some(handle) = session.live {
        let _ = handle.join();
    }

    session.mic_sink.finish();
    session.sys_sink.finish();

    if let Ok(slot) = session.last_error.lock() {
        *recorder.last_error.lock().map_err(|e| e.to_string())? = slot.clone();
    }

    let pending = PendingAudio {
        dir: session.dir.clone(),
        mic: session.mic_sink.path.clone(),
        sys: session.sys_sink.path.clone(),
    };
    *recorder.pending.lock().map_err(|e| e.to_string())? = Some(pending);
    *recorder.state.lock().map_err(|e| e.to_string())? = RecState::Idle;
    set_tray_tooltip(app, "Bagrry — Idle");
    let status = status_of(recorder)?;
    let _ = app.emit("recording-state", status.clone());
    let _ = app.emit(
        "audio-vu",
        VuLevels {
            mic: 0.0,
            system: 0.0,
        },
    );
    Ok(status)
}

pub fn toggle(app: &AppHandle) -> Result<RecStatus, String> {
    let state_flag = {
        let state = recorder_of(app);
        let guard = state.recorder.state.lock().map_err(|e| e.to_string())?;
        let flag = *guard;
        drop(guard);
        flag
    };
    match state_flag {
        RecState::Idle => start(app, None),
        RecState::Recording | RecState::Paused => stop(app),
    }
}

pub fn discard_pending(app: &AppHandle) -> Result<RecStatus, String> {
    let state = recorder_of(app);
    let recorder = &state.recorder;
    if let Some(pending) = recorder.pending.lock().map_err(|e| e.to_string())?.take() {
        pending.cleanup();
    }
    status_of(recorder)
}

pub fn take_pending(app: &AppHandle) -> Result<Option<PendingAudio>, String> {
    let state = recorder_of(app);
    let mut guard = state.recorder.pending.lock().map_err(|e| e.to_string())?;
    Ok(guard.take())
}

pub fn peek_pending(app: &AppHandle) -> Result<Option<(PathBuf, PathBuf)>, String> {
    let state = recorder_of(app);
    let guard = state.recorder.pending.lock().map_err(|e| e.to_string())?;
    Ok(guard.as_ref().map(|p| (p.mic.clone(), p.sys.clone())))
}

pub fn status(app: &AppHandle) -> Result<RecStatus, String> {
    let state = recorder_of(app);
    status_of(&state.recorder)
}

fn status_of(recorder: &Recorder) -> Result<RecStatus, String> {
    let pending_bytes = pending_byte_count(recorder)?;
    let last_error = {
        let session = recorder.session.lock().map_err(|e| e.to_string())?;
        session
            .as_ref()
            .and_then(|s| s.last_error.lock().ok().and_then(|e| e.clone()))
    }
    .or_else(|| recorder.last_error.lock().ok().and_then(|e| e.clone()));
    Ok(RecStatus {
        state: *recorder.state.lock().map_err(|e| e.to_string())?,
        pending_bytes,
        loopback_ok: *recorder.loopback_ok.lock().map_err(|e| e.to_string())?,
        meeting_id: recorder.meeting_id.lock().map_err(|e| e.to_string())?.clone(),
        last_error,
    })
}

fn pending_byte_count(recorder: &Recorder) -> Result<usize, String> {
    {
        let pending = recorder.pending.lock().map_err(|e| e.to_string())?;
        if let Some(pending) = pending.as_ref() {
            return Ok(file_len(&pending.mic) + file_len(&pending.sys));
        }
    }
    let session = recorder.session.lock().map_err(|e| e.to_string())?;
    Ok(session
        .as_ref()
        .map(|s| (s.mic_sink.byte_len() + s.sys_sink.byte_len()) as usize)
        .unwrap_or(0))
}

fn file_len(path: &Path) -> usize {
    std::fs::metadata(path).map(|m| m.len() as usize).unwrap_or(0)
}

fn spawn_live_stt(
    app: AppHandle,
    stop: Arc<AtomicBool>,
    paused: Arc<AtomicBool>,
    mic_sink: Arc<PcmSink>,
    sys_sink: Arc<PcmSink>,
    meeting_id: Option<String>,
) -> JoinHandle<()> {
    std::thread::Builder::new()
        .name("live-stt".into())
        .spawn(move || {
            let mut cursor = 0u64;
            while !stop.load(Ordering::Relaxed) {
                let mut waited = Duration::ZERO;
                while waited < LIVE_TICK && !stop.load(Ordering::Relaxed) {
                    std::thread::sleep(Duration::from_millis(200));
                    waited += Duration::from_millis(200);
                }
                if stop.load(Ordering::Relaxed) || paused.load(Ordering::Relaxed) {
                    continue;
                }
                let n = mic_sink.sample_count().max(sys_sink.sample_count());
                if n <= cursor + LIVE_MIN_SAMPLES {
                    continue;
                }
                let start = cursor;
                let len = n.saturating_sub(cursor);
                cursor = n;
                let mic = mic_sink.read_range(start, len).unwrap_or_default();
                let sys = sys_sink.read_range(start, len).unwrap_or_default();
                if resample::rms(&mic) < 0.008 && resample::rms(&sys) < 0.008 {
                    continue;
                }
                let Some((key, opts)) = live_stt_creds(&app) else {
                    continue;
                };
                match pipeline::transcribe_pcm_chunk(&key, &mic, &sys, &opts, start) {
                    Ok(segments) if !segments.is_empty() => {
                        let _ = app.emit(
                            "live-transcript",
                            LiveTranscriptBatch {
                                meeting_id: meeting_id.clone(),
                                segments,
                            },
                        );
                    }
                    Ok(_) => {}
                    Err(e) => eprintln!("live stt: {e}"),
                }
            }
        })
        .expect("spawn live-stt")
}

fn live_stt_creds(app: &AppHandle) -> Option<(String, groq::SttOptions)> {
    let state = app.state::<AppState>();
    let conn = state.conn().ok()?;
    let key = secrets::get_secret(&conn, "groq_api_key").ok().flatten()?;
    if key.is_empty() {
        return None;
    }
    Some((key, pipeline::stt_options(&conn)))
}

pub fn set_tray_tooltip(app: &AppHandle, text: &str) {
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(text));
    }
}
