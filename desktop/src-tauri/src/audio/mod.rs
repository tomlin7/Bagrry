pub mod capture;
pub mod resample;
pub mod wav;

use crate::AppState;
use serde::Serialize;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use tauri::{AppHandle, Emitter, Manager};

const TARGET_HZ: u32 = 16_000;
const MAX_SECONDS: usize = 90 * 60;

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
}

#[derive(Serialize, Clone)]
pub struct VuLevels {
    pub mic: f32,
    pub system: f32,
}

pub struct Recorder {
    pub state: Mutex<RecState>,
    pub pending_wav: Mutex<Option<Vec<u8>>>,
    pub loopback_ok: Mutex<bool>,
    pub meeting_id: Mutex<Option<String>>,
    session: Mutex<Option<LiveSession>>,
}

struct LiveSession {
    stop: Arc<AtomicBool>,
    paused: Arc<AtomicBool>,
    mic: Option<JoinHandle<()>>,
    loopback: Option<JoinHandle<()>>,
    vu: Option<JoinHandle<()>>,
    mic_pcm: Arc<Mutex<Vec<i16>>>,
    sys_pcm: Arc<Mutex<Vec<i16>>>,
}

impl Recorder {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(RecState::Idle),
            pending_wav: Mutex::new(None),
            loopback_ok: Mutex::new(false),
            meeting_id: Mutex::new(None),
            session: Mutex::new(None),
        }
    }
}

fn recorder_of(app: &AppHandle) -> tauri::State<'_, AppState> {
    app.state::<AppState>()
}

pub fn start(app: &AppHandle, meeting_id: Option<String>) -> Result<RecStatus, String> {
    let state = recorder_of(app);
    let recorder = &state.recorder;
    {
        let state = recorder.state.lock().map_err(|e| e.to_string())?;
        if *state != RecState::Idle {
            return Err("already capturing".into());
        }
    }

    *recorder.pending_wav.lock().map_err(|e| e.to_string())? = None;
    *recorder.meeting_id.lock().map_err(|e| e.to_string())? = meeting_id;

    let stop = Arc::new(AtomicBool::new(false));
    let paused = Arc::new(AtomicBool::new(false));
    let mic_pcm = Arc::new(Mutex::new(Vec::new()));
    let sys_pcm = Arc::new(Mutex::new(Vec::new()));
    let mic_level = Arc::new(AtomicU32::new(0));
    let sys_level = Arc::new(AtomicU32::new(0));

    let mic = capture::start_mic(
        stop.clone(),
        paused.clone(),
        mic_pcm.clone(),
        mic_level.clone(),
        TARGET_HZ,
        MAX_SECONDS,
    )?;

    let (loopback, loopback_ok) = capture::start_loopback(
        stop.clone(),
        paused.clone(),
        sys_pcm.clone(),
        sys_level.clone(),
        TARGET_HZ,
        MAX_SECONDS,
    );
    *recorder.loopback_ok.lock().map_err(|e| e.to_string())? = loopback_ok;

    let vu_stop = stop.clone();
    let vu_app = app.clone();
    let vu_mic = mic_level.clone();
    let vu_sys = sys_level.clone();
    let vu = std::thread::spawn(move || {
        while !vu_stop.load(Ordering::Relaxed) {
            let mic = f32::from_bits(vu_mic.load(Ordering::Relaxed));
            let system = f32::from_bits(vu_sys.load(Ordering::Relaxed));
            let _ = vu_app.emit("audio-vu", VuLevels { mic, system });
            std::thread::sleep(std::time::Duration::from_millis(80));
        }
    });

    *recorder.session.lock().map_err(|e| e.to_string())? = Some(LiveSession {
        stop,
        paused,
        mic: Some(mic),
        loopback,
        vu: Some(vu),
        mic_pcm,
        sys_pcm,
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
    let mut state = recorder.state.lock().map_err(|e| e.to_string())?;
    match *state {
        RecState::Recording => {
            if let Some(session) = recorder.session.lock().map_err(|e| e.to_string())?.as_ref() {
                session.paused.store(true, Ordering::Relaxed);
            }
            *state = RecState::Paused;
            set_tray_tooltip(app, "Bagrry — Paused");
        }
        RecState::Paused => {
            if let Some(session) = recorder.session.lock().map_err(|e| e.to_string())?.as_ref() {
                session.paused.store(false, Ordering::Relaxed);
            }
            *state = RecState::Recording;
            set_tray_tooltip(app, "Bagrry — Recording");
        }
        RecState::Idle => return Err("not capturing".into()),
    }
    drop(state);
    let status = status_of(recorder)?;
    let _ = app.emit("recording-state", status.clone());
    Ok(status)
}

pub fn stop(app: &AppHandle) -> Result<RecStatus, String> {
    let state = recorder_of(app);
    let recorder = &state.recorder;
    let mut session_guard = recorder.session.lock().map_err(|e| e.to_string())?;
    let Some(session) = session_guard.take() else {
        return Err("not capturing".into());
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

    let mic = session.mic_pcm.lock().map_err(|e| e.to_string())?.clone();
    let sys = session.sys_pcm.lock().map_err(|e| e.to_string())?.clone();
    session.mic_pcm.lock().map_err(|e| e.to_string())?.clear();
    session.sys_pcm.lock().map_err(|e| e.to_string())?.clear();
    drop(session_guard);

    let wav = wav::encode_dual_mono_16k(&mic, &sys);
    *recorder.pending_wav.lock().map_err(|e| e.to_string())? = Some(wav);
    *recorder.state.lock().map_err(|e| e.to_string())? = RecState::Idle;
    set_tray_tooltip(app, "Bagrry — Idle");
    let status = status_of(recorder)?;
    let _ = app.emit("recording-state", status.clone());
    let _ = app.emit("audio-vu", VuLevels { mic: 0.0, system: 0.0 });
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
    *recorder.pending_wav.lock().map_err(|e| e.to_string())? = None;
    status_of(recorder)
}

pub fn take_pending_wav(app: &AppHandle) -> Result<Option<Vec<u8>>, String> {
    let state = recorder_of(app);
    let wav = state
        .recorder
        .pending_wav
        .lock()
        .map_err(|e| e.to_string())?
        .take();
    Ok(wav)
}

pub fn peek_pending_wav(app: &AppHandle) -> Result<Option<Vec<u8>>, String> {
    let state = recorder_of(app);
    let wav = state
        .recorder
        .pending_wav
        .lock()
        .map_err(|e| e.to_string())?
        .clone();
    Ok(wav)
}

pub fn status(app: &AppHandle) -> Result<RecStatus, String> {
    let state = recorder_of(app);
    status_of(&state.recorder)
}

fn status_of(recorder: &Recorder) -> Result<RecStatus, String> {
    Ok(RecStatus {
        state: *recorder.state.lock().map_err(|e| e.to_string())?,
        pending_bytes: recorder
            .pending_wav
            .lock()
            .map_err(|e| e.to_string())?
            .as_ref()
            .map(|b| b.len())
            .unwrap_or(0),
        loopback_ok: *recorder.loopback_ok.lock().map_err(|e| e.to_string())?,
        meeting_id: recorder.meeting_id.lock().map_err(|e| e.to_string())?.clone(),
    })
}

pub fn set_tray_tooltip(app: &AppHandle, text: &str) {
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(text));
    }
}
