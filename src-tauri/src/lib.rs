pub mod account;
pub mod commands;
pub mod storage;

use tauri::{Manager, Emitter, WebviewWindowBuilder, WebviewUrl};
use base64::{Engine as _, engine::general_purpose};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Create main window manually to disable the native drag-drop handler.
            // This allows the WindowEvent::DragDrop to reach our Rust listener.
            let _main_window = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App("index.html".into())
            )
            .title("Wapex")
            .inner_size(800.0, 600.0)
            .decorations(false)
            .maximized(true)
            .disable_drag_drop_handler()
            .build()
            .expect("failed to build main window");

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
                        // Also show the active webview
                        let app = tray.app_handle();
                        let wm = app.state::<commands::webview_manager::WebviewManager>();
                        let active = wm.active_label.lock().unwrap().clone();
                        if let Some(label) = active {
                            if let Some(wv) = app.get_webview_window(&label) {
                                let _ = wv.show();
                            }
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
                    // Hide all child webviews when main window is closed
                    let app = window.app_handle();
                    let wm = app.state::<commands::webview_manager::WebviewManager>();
                    let created = wm.created_webviews.lock().unwrap();
                    for label in created.iter() {
                        if let Some(wv) = app.get_webview_window(label) {
                            let _ = wv.hide();
                        }
                    }
                    drop(created);
                    let _ = window.hide();
                    api.prevent_close();
                }
                tauri::WindowEvent::Focused(true) => {
                    // When main window gets focus, focus the current webview
                    let app = window.app_handle();
                    let wm = app.state::<commands::webview_manager::WebviewManager>();
                    let active = wm.active_label.lock().unwrap().clone();
                    if let Some(label) = active {
                        if let Some(wv) = app.get_webview_window(&label) {
                            let _ = wv.set_focus();
                        }
                    }
                }
                tauri::WindowEvent::Moved(_) => {
                    // When the main window moves, we MUST move our custom windows too
                    let _ = window.emit("wapex://window-moved", ());
                }
                tauri::WindowEvent::Resized(_) => {
                    let _ = window.emit("wapex://window-resized", ());
                }
                tauri::WindowEvent::DragDrop(tauri::DragDropEvent::Drop { paths, .. }) => {
                    println!("DEBUG: DragDrop detected. Path count: {}", paths.len());
                    let app = window.app_handle();
                    let wm = app.state::<commands::webview_manager::WebviewManager>();
                    let active = wm.active_label.lock().unwrap().clone();
                    println!("DEBUG: Active label: {:?}", active);

                    if let Some(label) = active {
                        if let Some(wv) = app.get_webview_window(&label) {
                            println!("DEBUG: Found webview for label: {}", label);
                            let mut file_payloads = Vec::new();
                            for path in paths {
                                if std::path::Path::is_file(path) {
                                    if let Ok(data) = std::fs::read(path) {
                                        let b64 = general_purpose::STANDARD.encode(data);
                                        let mime = mime_guess::from_path(path).first_or_octet_stream();
                                        let name = path.file_name().unwrap_or_default().to_string_lossy();
                                        println!("DEBUG: Adding file: {}", name);
                                        file_payloads.push(serde_json::json!({
                                            "name": name,
                                            "data": format!("data:{};base64,{}", mime, b64)
                                        }));
                                    }
                                }
                            }
                            if !file_payloads.is_empty() {
                                let js = format!(
                                    "console.log('WAPEX: Dispatching files...'); if (window.__wapex_dispatch_files) {{ window.__wapex_dispatch_files({}); }} else {{ console.error('WAPEX: window.__wapex_dispatch_files not found!'); }}", 
                                    serde_json::to_string(&file_payloads).unwrap()
                                );
                                let _ = wv.eval(&js);
                            } else {
                                println!("DEBUG: No valid files found in drop.");
                            }
                        } else {
                            println!("DEBUG: Webview NOT FOUND for label: {}", label);
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
            commands::minimize_main_window,
            commands::forward_files_to_webview,
            commands::get_clipboard_image,
            commands::open_whatsapp_devtools,
            commands::retrigger_paste
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
