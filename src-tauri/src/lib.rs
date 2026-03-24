pub mod account;
pub mod commands;
pub mod storage;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
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
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_accounts,
            commands::add_account,
            commands::delete_account,
            commands::spawn_account_webview,
            commands::update_unread_count,
            commands::proxy_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
