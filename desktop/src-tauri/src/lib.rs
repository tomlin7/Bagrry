mod audio;
mod commands;
mod db;
mod tray;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

pub struct AppState {
    pub db: Mutex<Connection>,
    pub recorder: audio::Recorder,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let conn = db::open(app.handle())
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
            app.manage(AppState {
                db: Mutex::new(conn),
                recorder: audio::Recorder::new(),
            });
            tray::setup(app.handle())?;

            register_recording_shortcuts(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::db_status,
            commands::list_folders,
            commands::list_meetings,
            commands::list_templates,
            commands::create_meeting,
            commands::start_recording,
            commands::stop_recording,
            commands::pause_recording,
            commands::toggle_recording,
            commands::recording_status,
            commands::discard_audio,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn register_recording_shortcuts(app: &tauri::AppHandle) {
    for combo in ["super+shift+r", "ctrl+shift+r"] {
        let handle = app.clone();
        if app
            .global_shortcut()
            .on_shortcut(combo, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = audio::toggle(&handle);
                }
            })
            .is_ok()
        {
            break;
        }
    }
    for combo in ["super+shift+p", "ctrl+shift+p"] {
        let handle = app.clone();
        if app
            .global_shortcut()
            .on_shortcut(combo, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = audio::pause(&handle);
                }
            })
            .is_ok()
        {
            break;
        }
    }
}
