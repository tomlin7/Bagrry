#![allow(unknown_lints)]
#![allow(clippy::chunks_exact_to_as_chunks)]

mod audio;
mod commands;
mod db;
pub mod dispatch;
mod groq;
mod http;
mod ids;
pub mod local_llm;
pub mod p2p_sync;
mod pipeline;
mod secrets;
pub mod security;
pub mod semantic_search;
mod settings_cmds;
pub mod translation;
mod tray;
pub mod whisper_local;
pub mod behavioral_analytics;
pub mod calendar_daemon;
pub mod copilot_agent;
pub mod visual_perception;
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
            let pool = db::open(app.handle()).map_err(std::io::Error::other)?;

            let port: u16 = {
                let conn = pool
                    .get()
                    .map_err(|e| std::io::Error::other(e.to_string()))?;
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

            #[cfg(target_os = "windows")]
            {
                if let Some(win) = app.get_webview_window("main") {
                    // Try Windows Acrylic first with translucent charcoal tint; fallback to Mica.
                    if let Err(e) = window_vibrancy::apply_acrylic(&win, Some((23, 23, 23, 160))) {
                        eprintln!("acrylic unavailable, applying mica: {e}");
                        let _ = window_vibrancy::apply_mica(&win, Some(true));
                    }
                }
            }

            #[cfg(target_os = "macos")]
            {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = window_vibrancy::apply_vibrancy(
                        &win,
                        window_vibrancy::NSVisualEffectMaterial::Sidebar,
                        None,
                        None,
                    );
                }
            }

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
            commands::save_enhanced_notes,
            commands::save_title,
            commands::delete_meeting,
            commands::move_meeting,
            commands::list_templates,
            commands::list_recipes,
            commands::save_custom_template,
            commands::update_custom_template,
            commands::delete_custom_template,
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
            commands::search_global,
            commands::list_people,
            commands::get_person_dossier,
            commands::update_person,
            commands::merge_people,
            commands::delete_person,
            commands::index_all_attendees,
            commands::list_companies,
            commands::get_company_dossier,
            commands::update_company,
            commands::auto_index_companies,
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
            commands::create_share_custom,
            commands::get_meeting_shares,
            commands::revoke_share,
            commands::export_formatted,
            commands::get_local_stt_status,
            commands::set_local_stt_engine,
            commands::set_active_local_model,
            commands::set_stt_cloud_fallback,
            commands::download_local_model,
            commands::delete_local_model,
            commands::dispatch_webhook,
            commands::export_to_notion,
            commands::verify_notion_connection,
            commands::send_to_slack,
            commands::verify_teams_webhook,
            commands::send_to_teams_webhook,
            commands::verify_discord_webhook,
            commands::send_to_discord_webhook,
            commands::verify_linear_connection,
            commands::create_linear_issue,
            commands::export_markdown,
            commands::save_attachment_text,
            commands::list_attachments,
            commands::set_action_item_done,
            commands::delete_action_item,
            commands::list_audio_devices,
            commands::get_audio_diagnostics,
            commands::assign_speaker_name,
            commands::update_segment_speaker,
            commands::get_meeting_analytics,
            commands::get_local_llm_status,
            commands::set_local_llm_engine,
            commands::set_active_local_llm_model,
            commands::set_llm_cloud_fallback,
            commands::download_local_llm_model,
            commands::delete_local_llm_model,
            commands::query_local_llm,
            commands::get_retro_buffer_status,
            commands::start_retroactive_recording,
            commands::get_security_status,
            commands::set_database_encryption,
            commands::rotate_security_key,
            commands::enroll_voice_profile,
            commands::list_voice_profiles,
            commands::delete_voice_profile,
            commands::match_voice_sample,
            commands::get_supported_languages,
            commands::get_active_translation_language,
            commands::set_active_translation_language,
            commands::translate_text,
            commands::dispatch_meeting,
            commands::get_dispatch_history,
            commands::search_hybrid,
            commands::index_meeting_embeddings,
            commands::export_meeting_bundle,
            commands::import_meeting_bundle,
            commands::list_local_peers,
            settings_cmds::set_launch_on_login,
            settings_cmds::get_launch_on_login,
            settings_cmds::apply_retention,
            settings_cmds::export_csv,
            settings_cmds::export_workspace_markdown_vault,
            settings_cmds::import_notes,
            settings_cmds::delete_all_data,
            settings_cmds::list_api_keys,
            settings_cmds::create_api_key,
            settings_cmds::revoke_api_key,
            settings_cmds::submit_feedback,
            settings_cmds::import_ics,
            settings_cmds::reset_calendar,
            settings_cmds::get_referral_code,
            commands::list_visual_frames,
            commands::save_visual_frame,
            commands::delete_visual_frame,
            commands::list_copilot_flash_cards,
            commands::create_copilot_flash_card,
            commands::dismiss_copilot_flash_card,
            commands::detect_copilot_triggers,
            commands::list_upcoming_calendar_events,
            commands::get_behavioral_analytics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Registers a global hotkey, trying each combo until one is accepted — another
/// app may already own the preferred binding.
fn register_first_available(
    app: &tauri::AppHandle,
    combos: &[&str],
    action: fn(&tauri::AppHandle),
) {
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
    register_first_available(app, &["super+alt+r", "ctrl+alt+r"], |handle| {
        if let Err(e) = audio::start_retroactive(handle, None, Some(300)) {
            eprintln!("start retroactive recording: {e}");
        }
    });
    register_first_available(
        app,
        &["super+shift+p", "ctrl+shift+p", "ctrl+alt+p"],
        |handle| {
            if let Err(e) = audio::pause(handle) {
                eprintln!("pause recording: {e}");
            }
        },
    );
}
