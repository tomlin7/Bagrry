use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::audio;

pub fn notify(app: &AppHandle, title: &str, body: &str) {
    let _ = app.notification().builder().title(title).body(body).show();
}

pub fn update_tray_state(app: &AppHandle, tooltip: &str) {
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(tooltip));
    }
}

pub fn setup(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let toggle = MenuItemBuilder::with_id("toggle-record", "Start / Stop Recording (Ctrl+Alt+R)").build(app)?;
    let pause = MenuItemBuilder::with_id("pause-record", "Pause / Resume Recording (Ctrl+Shift+P)").build(app)?;
    let open = MenuItemBuilder::with_id("open-bagrry", "Open Bagrry").build(app)?;
    let preferences = MenuItemBuilder::with_id("preferences", "Preferences...").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit Bagrry").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&toggle)
        .item(&pause)
        .separator()
        .item(&open)
        .item(&preferences)
        .separator()
        .item(&quit)
        .build()?;

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or("missing window icon")?;

    TrayIconBuilder::with_id("main")
        .icon(icon)
        .menu(&menu)
        .tooltip("Bagrry — Idle")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle-record" => {
                let _ = audio::toggle(app);
            }
            "pause-record" => {
                let _ = audio::pause(app);
            }
            "open-bagrry" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            "preferences" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                    let _ = app.emit("navigate-settings", "preferences");
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                button_state: tauri::tray::MouseButtonState::Up,
                ..
            } = event
            {
                if let Some(win) = tray.app_handle().get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
        })
        .build(app)?;
    Ok(())
}
