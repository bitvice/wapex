pub mod account;
pub mod commands;
pub mod storage;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Initialize storage on app setup to ensure it drops into app's isolated context
            match storage::AccountManager::new(app.handle()) {
                Ok(manager) => {
                    app.manage(manager);
                }
                Err(e) => {
                    eprintln!("Failed to initialize database: {}", e);
                }
            }

            // Webview state manager
            app.manage(commands::webview_manager::WebviewManager::new());

            // Setup Tray
            let _tray = tauri::tray::TrayIconBuilder::new()
                .tooltip("Wapex")
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let _ = window.hide();
                    api.prevent_close();
                }
                tauri::WindowEvent::Focused(focused) => {
                    // When main window regains focus after being minimized, show webviews
                    if *focused {
                        let app = window.app_handle();
                        let wm = app.state::<commands::webview_manager::WebviewManager>();
                        let active = wm.active_label.lock().unwrap().clone();
                        if let Some(label) = active {
                            if let Some(wv) = app.get_webview_window(&label) {
                                let _ = wv.show();
                            }
                        }
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_accounts,
            commands::add_account,
            commands::delete_account,
            commands::update_account_color,
            commands::spawn_account_webview,
            commands::update_unread_count,
            commands::proxy_notification,
            commands::update_webview_bounds,
            commands::hibernate_inactive,
            commands::hibernate_all,
            commands::get_alive_count,
            commands::hide_all_webviews,
            commands::minimize_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
