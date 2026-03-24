pub mod webview_manager;

use crate::account::{get_account_data_dir, Account};
use crate::storage::AccountManager;
use tauri::{AppHandle, State, Manager, Emitter, LogicalSize};
use webview_manager::WebviewManager;

#[derive(serde::Deserialize)]
pub struct Bounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Get all managed accounts
#[tauri::command]
pub fn get_accounts(manager: State<'_, AccountManager>) -> Result<Vec<Account>, String> {
    manager.get_accounts().map_err(|e| e.to_string())
}

/// Create a new account and persist it
#[tauri::command]
pub fn add_account(
    manager: State<'_, AccountManager>,
    name: String,
    color_code: String,
    workspace_id: Option<String>,
) -> Result<Account, String> {
    let account = Account::new(name, color_code, workspace_id);
    manager.add_account(&account).map_err(|e| e.to_string())?;
    Ok(account)
}

/// Delete an account
#[tauri::command]
pub fn delete_account(manager: State<'_, AccountManager>, id: String) -> Result<(), String> {
    manager.delete_account(&id).map_err(|e| e.to_string())
}

/// Update an account's color
#[tauri::command]
pub fn update_account_color(
    manager: State<'_, AccountManager>,
    id: String,
    color_code: String,
) -> Result<(), String> {
    manager.update_account_color(&id, &color_code).map_err(|e| e.to_string())
}

/// Receive unread count from a WhatsApp webview and relay to main window
#[tauri::command]
pub fn update_unread_count(app: AppHandle, count: u32, window_label: Option<String>) {
    let label = window_label.unwrap_or_default();
    // Emit event to main window for sidebar badge
    if let Some(main_window) = app.get_webview_window("main") {
        let payload = serde_json::json!({
            "count": count,
            "windowLabel": label
        });
        let _ = main_window.emit("wapex://unread", payload);
    }
}

/// Proxy Notification from Webview to Native OS + In-app toast
#[tauri::command]
pub fn proxy_notification(app: AppHandle, title: String, body: String, window_label: Option<String>) {
    println!("Notification via Bridge - {}: {} (from: {:?})", title, body, window_label);
    
    // Emit event to the main window for in-app toast
    if let Some(main_window) = app.get_webview_window("main") {
        let payload = serde_json::json!({
            "sender": title,
            "body": body,
            "accountLabel": window_label.unwrap_or_default()
        });
        let _ = main_window.emit("wapex://notification", payload);
    }
}

/// Resize/reposition a specific WebviewWindow to align with the frontend viewport.
/// Bounds are RELATIVE to the main window's client area (e.g. x=64 means 64px from left of main window).
#[tauri::command]
pub fn update_webview_bounds(app: AppHandle, label: String, bounds: Bounds) -> Result<(), String> {
    let main_window = app.get_webview_window("main").ok_or("Main window not found")?;
    let main_pos = main_window.outer_position().map_err(|e| e.to_string())?;
    
    // Convert relative bounds to absolute screen coordinates
    let abs_x = main_pos.x as f64 + bounds.x;
    let abs_y = main_pos.y as f64 + bounds.y;
    
    if let Some(wv_window) = app.get_webview_window(&label) {
        let _ = wv_window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(abs_x as i32, abs_y as i32)));
        let _ = wv_window.set_size(LogicalSize::new(bounds.width, bounds.height));
    }
    Ok(())
}

/// Spawns or restores a WebviewWindow for the specific account using isolated data directory.
/// Each account gets its own borderless, taskbar-hidden window positioned beside the sidebar.
#[tauri::command]
pub fn spawn_account_webview(
    app: AppHandle, 
    account: Account, 
    bounds: Option<Bounds>,
    wm: State<'_, WebviewManager>
) -> Result<(), String> {
    let label = format!("whatsapp_{}", account.id.replace("-", "_"));

    // 1. If already registered/created, just show it and position it
    if wm.is_registered(&label) {
        wm.show_only(&app, &label);
        if let Some(b) = bounds {
            let _ = update_webview_bounds(app, label, b);
        }
        return Ok(());
    }

    // 2. Generate data dir isolated for this account
    let account_dir_opt = get_account_data_dir(&app, &account.id);
    if let Some(account_dir) = account_dir_opt {
        let _ = std::fs::create_dir_all(&account_dir);
        let bridge_script = include_str!("../../../static/bridge.js");

        // Get main window position for absolute coordinate calculation
        let main_window = app.get_webview_window("main").ok_or("Main window not found")?;
        let main_pos = main_window.outer_position().map_err(|e| e.to_string())?;

        let (rel_x, rel_y, w, h) = if let Some(ref b) = bounds {
            (b.x, b.y, b.width, b.height)
        } else {
            (64.0, 0.0, 736.0, 600.0)
        };

        let abs_x = main_pos.x as f64 + rel_x;
        let abs_y = main_pos.y as f64 + rel_y;

        println!("[Rust] Spawning WebviewWindow '{}' at screen=({}, {}), size=({}, {})", 
            label, abs_x, abs_y, w, h);

        // Create a standalone borderless window for this WhatsApp session
        let wv_window = tauri::WebviewWindowBuilder::new(
            &app,
            &label,
            tauri::WebviewUrl::External("https://web.whatsapp.com".parse().unwrap())
        )
        .title(&format!("WA - {}", account.name))
        .inner_size(w, h)
        .position(abs_x, abs_y)
        .decorations(false)
        .skip_taskbar(true)
        .visible(true)
        .initialization_script(bridge_script)
        .data_directory(account_dir)
        .on_download(|_webview, event| {
            use tauri::webview::DownloadEvent;
            match event {
                DownloadEvent::Requested { url, destination } => {
                    // Get the Downloads folder
                    let downloads_dir = dirs::download_dir()
                        .unwrap_or_else(|| std::env::home_dir().unwrap_or_default().join("Downloads"));
                    let _ = std::fs::create_dir_all(&downloads_dir);

                    // Extract filename from URL or use a default
                    let filename = url.path_segments()
                        .and_then(|segments| segments.last())
                        .and_then(|name| if name.is_empty() { None } else { Some(name.to_string()) })
                        .unwrap_or_else(|| format!("download_{}", chrono::Utc::now().timestamp()));

                    // Avoid overwriting: if the file exists, append a number
                    let mut final_path = downloads_dir.join(&filename);
                    if final_path.exists() {
                        let stem = final_path.file_stem().unwrap_or_default().to_string_lossy().to_string();
                        let ext = final_path.extension().map(|e: &std::ffi::OsStr| format!(".{}", e.to_string_lossy())).unwrap_or_default();
                        let mut counter = 1;
                        loop {
                            final_path = downloads_dir.join(format!("{} ({}){}", stem, counter, ext));
                            if !final_path.exists() { break; }
                            counter += 1;
                        }
                    }

                    println!("[Download] Saving to: {:?}", final_path);
                    *destination = final_path;
                    true // allow the download
                }
                DownloadEvent::Finished { url, path, success } => {
                    println!("[Download] Finished: {} -> {:?} (success: {})", url, path, success);
                    if success {
                        if let Some(file_path) = path {
                            println!("[Download] Opening with default app: {:?}", file_path);
                            let _ = std::process::Command::new("xdg-open")
                                .arg(&file_path)
                                .spawn();
                        }
                    }
                    true
                }
                _ => true,
            }
        })
        .build()
        .map_err(|e| e.to_string())?;

        // Set as always-on-top of parent briefly, then disable (prevents flash behind)
        let _ = wv_window.set_always_on_top(false);
        
        wm.register(label.clone());
        wm.show_only(&app, &label);

        Ok(())
    } else {
        Err("Failed to resolve data directory".to_string())
    }
}

/// Hibernate (destroy) webviews that have been idle for more than `threshold_secs`.
/// The active webview is never hibernated.
#[tauri::command]
pub fn hibernate_inactive(
    app: AppHandle,
    active_label: String,
    threshold_secs: u64,
    wm: State<'_, WebviewManager>,
) -> Result<Vec<String>, String> {
    let idle = wm.get_idle_webviews(&active_label, threshold_secs);
    let mut hibernated = Vec::new();

    for label in &idle {
        if let Some(wv_window) = app.get_webview_window(label) {
            println!("[Hibernate] Destroying idle webview: {}", label);
            let _ = wv_window.close();
            wm.mark_hibernated(label);
            hibernated.push(label.clone());
        }
    }

    Ok(hibernated)
}

/// Hibernate ALL webviews except the currently active one.
#[tauri::command]
pub fn hibernate_all(
    app: AppHandle,
    active_label: String,
    wm: State<'_, WebviewManager>,
) -> Result<Vec<String>, String> {
    hibernate_inactive(app, active_label, 0, wm)
}

/// Get the number of alive (non-hibernated) webview instances.
#[tauri::command]
pub fn get_alive_count(wm: State<'_, WebviewManager>) -> usize {
    wm.alive_count()
}

/// Hide ALL webview windows (e.g. when navigating to the dashboard).
#[tauri::command]
pub fn hide_all_webviews(app: AppHandle, wm: State<'_, WebviewManager>) {
    let created = wm.created_webviews.lock().unwrap();
    for label in created.iter() {
        if let Some(wv_window) = app.get_webview_window(label) {
            let _ = wv_window.hide();
        }
    }
}

/// Minimize the main window and hide webview windows (Linux/GTK).
#[tauri::command]
pub fn minimize_main_window(app: AppHandle, wm: State<'_, WebviewManager>) {
    // Hide all webview windows first
    let created = wm.created_webviews.lock().unwrap();
    for label in created.iter() {
        if let Some(wv_window) = app.get_webview_window(label) {
            let _ = wv_window.hide();
        }
    }
    drop(created);
    
    // Then minimize the main window
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
}
