mod audio;
mod commands;
mod db;
mod groq;
mod http;
mod ids;
mod pipeline;
mod secrets;
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
            let port: u16 = secrets::get_setting(&conn, "api_port", "47821")
                .parse()
                .unwrap_or(47821);
            let db_path = db::db_path(app.handle()).unwrap_or_default();
            http::spawn(db_path, port);
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
            commands::get_meeting,
            commands::list_templates,
            commands::list_recipes,
            commands::create_meeting,
            commands::save_scratchpad,
            commands::save_title,
            commands::start_recording,
            commands::stop_recording,
            commands::pause_recording,
            commands::toggle_recording,
            commands::recording_status,
            commands::discard_audio,
            commands::transcribe_pending,
            commands::list_segments,
            commands::enhance_meeting,
            commands::run_recipe,
            commands::reprompt_selection,
            commands::ask_bagrry,
            commands::live_ask,
            commands::search_meetings,
            commands::list_people,
            commands::list_companies,
            commands::upsert_person,
            commands::meetings_for_person,
            commands::list_calendar,
            commands::upsert_calendar_event,
            commands::pre_meeting_brief,
            commands::set_secret,
            commands::set_setting,
            commands::get_setting,
            commands::copy_consent,
            commands::create_share,
            commands::dispatch_webhook,
            commands::export_markdown,
            commands::save_attachment_text,
            commands::create_folder,
            commands::save_custom_template,
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
