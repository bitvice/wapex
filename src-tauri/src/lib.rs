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
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_accounts,
            commands::add_account,
            commands::delete_account,
            commands::spawn_account_webview
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
