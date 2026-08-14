use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager};

use crate::audio;

pub fn setup(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let toggle = MenuItemBuilder::with_id("toggle-record", "Start/Stop recording").build(app)?;
    let pause = MenuItemBuilder::with_id("pause-record", "Pause/Resume").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
    let menu = MenuBuilder::new(app)
        .item(&toggle)
        .item(&pause)
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
