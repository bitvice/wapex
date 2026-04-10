pub mod webview_manager;

use crate::account::{get_account_data_dir, Account};
use crate::storage::AccountManager;
use tauri::{AppHandle, State, Manager, Emitter};
use webview_manager::WebviewManager;

#[derive(serde::Deserialize, Debug)]
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

#[tauri::command]
pub fn update_webview_bounds(app: AppHandle, label: String, bounds: Bounds) -> Result<(), String> {
    if let Some(wv_window) = app.get_webview_window(&label) {
        if let Some(main_window) = app.get_webview_window("main") {
            let main_pos = main_window.outer_position().unwrap_or(tauri::PhysicalPosition::new(0, 0));
            let scale_factor = main_window.scale_factor().unwrap_or(1.0);

            let abs_x = main_pos.x + (bounds.x * scale_factor) as i32;
            let abs_y = main_pos.y + (bounds.y * scale_factor) as i32;

            let _ = wv_window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(abs_x, abs_y)));
            let _ = wv_window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(bounds.width, bounds.height)));
        }
    }
    Ok(())
}

/// Spawns a Webview for the specific account as a CHILD of the main window.
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

        let main_window = app.get_webview_window("main").ok_or("Main window not found")?;
        let main_pos = main_window.outer_position().unwrap_or(tauri::PhysicalPosition::new(0, 0));

        let (rel_x, rel_y, w, h) = if let Some(ref b) = bounds {
            (b.x, b.y, b.width, b.height)
        } else {
            (64.0, 0.0, 736.0, 600.0)
        };

        // Convert logical relative bounds to physical absolute screen coordinates
        let scale_factor = main_window.scale_factor().unwrap_or(1.0);
        let abs_x = main_pos.x + (rel_x * scale_factor) as i32;
        let abs_y = main_pos.y + (rel_y * scale_factor) as i32;
        let phys_w = (w * scale_factor) as u32;
        let phys_h = (h * scale_factor) as u32;

        println!("[Rust] Reverting to Multi-Window: Spawning '{}' at screen ({}, {}), size=({}, {})", 
            label, abs_x, abs_y, phys_w, phys_h);

        let wv_window = tauri::WebviewWindowBuilder::new(
            &app,
            &label,
            tauri::WebviewUrl::External("https://web.whatsapp.com".parse().unwrap())
        )
        .position(abs_x as f64, abs_y as f64)
        .inner_size(w, h)
        .decorations(false)
        .always_on_top(false)
        .visible(true)
        .initialization_script(bridge_script)
        .data_directory(account_dir)
        // CRITICAL: This is what makes Drag-and-Drop work on Linux!
        .disable_drag_drop_handler() 
        .on_download(|_webview, event| {
            use tauri::webview::DownloadEvent;
            match event {
                DownloadEvent::Requested { url, destination } => {
                    let downloads_dir = dirs::download_dir()
                        .unwrap_or_else(|| std::env::home_dir().unwrap_or_default().join("Downloads"));
                    let _ = std::fs::create_dir_all(&downloads_dir);

                    let filename = url.path_segments()
                        .and_then(|segments| segments.last())
                        .and_then(|name| if name.is_empty() { None } else { Some(name.to_string()) })
                        .unwrap_or_else(|| format!("download_{}", chrono::Utc::now().timestamp()));

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
                    true
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
        });

        let _wv = wv_window.build()
            .map_err(|e| e.to_string())?;

        wm.register(label.clone());
        wm.show_only(&app, &label);

        Ok(())
    } else {
        Err("Failed to resolve data directory".to_string())
    }
}

/// Hibernate (destroy) webviews that have been idle for more than `threshold_secs`.
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

/// Minimize the main window and hide webview windows.
#[tauri::command]
pub fn minimize_main_window(app: AppHandle, wm: State<'_, WebviewManager>) {
    let created = wm.created_webviews.lock().unwrap();
    for label in created.iter() {
        if let Some(wv_window) = app.get_webview_window(label) {
            let _ = wv_window.hide();
        }
    }
    drop(created);
    
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
}

/// Forward files to the active WhatsApp webview
#[tauri::command]
pub fn forward_files_to_webview(app: AppHandle, wm: State<'_, WebviewManager>, payloads: Vec<serde_json::Value>) {
    println!("DEBUG: forward_files_to_webview invoked with {} files", payloads.len());
    let active = wm.active_label.lock().unwrap().clone();
    
    if let Some(label) = active {
        if let Some(wv) = app.get_webview_window(&label) {
            println!("DEBUG: Found webview for label: {}", label);
            let js = format!(
                "console.log('WAPEX: Dispatching files from frontend...'); if (window.__wapex_dispatch_files) {{ window.__wapex_dispatch_files({}); }} else {{ console.error('WAPEX: window.__wapex_dispatch_files not found!'); }}", 
                serde_json::to_string(&payloads).unwrap()
            );
            let _ = wv.eval(&js);
        } else {
            println!("DEBUG: Webview NOT FOUND for label: {}", label);
        }
    }
}

/// Open WebKit DevTools on the active WhatsApp webview for debugging
#[tauri::command]
pub fn open_whatsapp_devtools(app: AppHandle, manager: State<'_, WebviewManager>) -> Result<(), String> {
    let active = manager.active_label.lock().unwrap().clone();
    if let Some(label) = active {
        if let Some(wv) = app.get_webview_window(&label) {
            wv.open_devtools();
            return Ok(());
        }
    }
    // Try to find any whatsapp_ webview
    for (_label, webview) in app.webview_windows() {
        if _label.starts_with("whatsapp_") {
            webview.open_devtools();
            return Ok(());
        }
    }
    Err("No WhatsApp webview found".to_string())
}

/// Helper to read image directly from OS clipboard to bypass WebKitGTK limitations.
#[tauri::command]
pub fn get_clipboard_image() -> Result<String, String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;
    let image = clipboard.get_image().map_err(|e| format!("No image: {}", e))?;
    
    let rgba = image::RgbaImage::from_raw(
        image.width as u32,
        image.height as u32,
        image.bytes.into_owned(),
    ).ok_or("Failed to create RgbaImage")?;
    
    let dynamic_image = image::DynamicImage::ImageRgba8(rgba);
    
    let mut buffer = std::io::Cursor::new(Vec::new());
    dynamic_image.write_to(&mut buffer, image::ImageFormat::Png)
        .map_err(|e| format!("Encode error: {}", e))?;
        
    use base64::Engine;
    Ok(base64::engine::general_purpose::STANDARD.encode(buffer.into_inner()))
}

/// Re-writes the clipboard image in PNG format and sends a real OS Ctrl+V keypress.
/// This produces a trusted paste event that WhatsApp Web accepts, bypassing isTrusted checks.
#[tauri::command]
pub fn retrigger_paste() -> Result<(), String> {
    // Re-write the clipboard image to ensure WebKit can read it as image/png
    let mut clipboard = arboard::Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;
    let image = clipboard.get_image().map_err(|e| format!("No image on clipboard: {}", e))?;
    clipboard.set_image(arboard::ImageData {
        width: image.width,
        height: image.height,
        bytes: image.bytes,
    }).map_err(|e| format!("Failed to set clipboard: {}", e))?;

    // Give clipboard time to propagate
    std::thread::sleep(std::time::Duration::from_millis(80));

    // Try enigo first (works on both X11 and Wayland)
    let enigo_result = (|| -> Result<(), String> {
        use enigo::{Direction, Enigo, Key, Keyboard, Settings};
        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| format!("{e}"))?;
        enigo.key(Key::Control, Direction::Press).map_err(|e| format!("{e}"))?;
        enigo.key(Key::Unicode('v'), Direction::Click).map_err(|e| format!("{e}"))?;
        enigo.key(Key::Control, Direction::Release).map_err(|e| format!("{e}"))?;
        Ok(())
    })();

    if enigo_result.is_err() {
        // Fallback: xdotool (X11)
        let xdotool = std::process::Command::new("xdotool")
            .args(["key", "--clearmodifiers", "ctrl+v"])
            .status();
        if xdotool.is_err() {
            return Err(format!("enigo: {:?}, xdotool not available", enigo_result));
        }
    }

    Ok(())
}
