mod audio;
mod commands;
mod db;
mod groq;
mod http;
mod ids;
mod pipeline;
mod secrets;
mod settings_cmds;
mod tray;

use db::{PooledConn, SharedPool};
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

pub struct AppState {
    pub db: SharedPool,
    pub recorder: audio::Recorder,
}

impl AppState {
    /// Checks out a pooled connection. Hold it for as short a time as possible —
    /// never across a network call.
    pub fn conn(&self) -> Result<PooledConn, String> {
        self.db.get()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            let pool = db::open(app.handle())
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

            let port: u16 = {
                let conn = pool
                    .get()
                    .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
                // Honour the auto-deletion preference on every launch.
                if let Err(e) = settings_cmds::apply_retention_inner(&conn) {
                    eprintln!("retention sweep: {e}");
                }
                secrets::get_setting(&conn, "api_port", "47821")
                    .parse()
                    .unwrap_or(47821)
            };

            if let Ok(db_path) = db::db_path(app.handle()) {
                http::spawn(db_path, port);
            }

            app.manage(AppState {
                db: pool,
                recorder: audio::Recorder::new(),
            });

            // A missing tray or an already-claimed hotkey must not stop launch.
            if let Err(e) = tray::setup(app.handle()) {
                eprintln!("tray unavailable: {e}");
            }
            register_recording_shortcuts(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::db_status,
            commands::list_folders,
            commands::create_folder,
            commands::rename_folder,
            commands::delete_folder,
            commands::set_folder_shared,
            commands::list_meetings,
            commands::get_meeting,
            commands::create_meeting,
            commands::duplicate_meeting,
            commands::save_scratchpad,
            commands::save_title,
            commands::delete_meeting,
            commands::move_meeting,
            commands::list_templates,
            commands::list_recipes,
            commands::save_custom_template,
            commands::save_custom_recipe,
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
            commands::pre_meeting_brief,
            commands::list_chat_sessions,
            commands::create_chat_session,
            commands::rename_chat_session,
            commands::delete_chat_session,
            commands::list_chat_messages,
            commands::append_chat_message,
            commands::search_meetings,
            commands::list_people,
            commands::list_companies,
            commands::upsert_person,
            commands::meetings_for_person,
            commands::list_meeting_attendees,
            commands::add_meeting_attendee,
            commands::list_action_items,
            commands::add_action_item,
            commands::list_calendar,
            commands::upsert_calendar_event,
            commands::set_secret,
            commands::set_setting,
            commands::get_setting,
            commands::get_settings,
            commands::get_profile,
            commands::set_profile,
            commands::copy_consent,
            commands::create_share,
            commands::dispatch_webhook,
            commands::export_markdown,
            commands::save_attachment_text,
            commands::list_attachments,
            commands::set_action_item_done,
            commands::delete_action_item,
            settings_cmds::set_launch_on_login,
            settings_cmds::get_launch_on_login,
            settings_cmds::apply_retention,
            settings_cmds::export_csv,
            settings_cmds::import_notes,
            settings_cmds::delete_all_data,
            settings_cmds::list_api_keys,
            settings_cmds::create_api_key,
            settings_cmds::revoke_api_key,
            settings_cmds::submit_feedback,
            settings_cmds::import_ics,
            settings_cmds::reset_calendar,
            settings_cmds::get_referral_code,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Registers a global hotkey, trying each combo until one is accepted — another
/// app may already own the preferred binding.
fn register_first_available(app: &tauri::AppHandle, combos: &[&str], action: fn(&tauri::AppHandle)) {
    for combo in combos {
        let handle = app.clone();
        let registered = app
            .global_shortcut()
            .on_shortcut(*combo, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    action(&handle);
                }
            })
            .is_ok();
        if registered {
            return;
        }
    }
    eprintln!("could not register any of {combos:?}");
}

fn register_recording_shortcuts(app: &tauri::AppHandle) {
    register_first_available(app, &["super+shift+r", "ctrl+shift+r"], |handle| {
        if let Err(e) = audio::toggle(handle) {
            eprintln!("toggle recording: {e}");
        }
    });
    register_first_available(app, &["super+shift+p", "ctrl+shift+p"], |handle| {
        if let Err(e) = audio::pause(handle) {
            eprintln!("pause recording: {e}");
        }
    });
}
