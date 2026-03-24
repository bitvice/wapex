use crate::account::{get_account_data_dir, Account};
use crate::storage::AccountManager;
use tauri::{AppHandle, State, Manager};
use tauri::webview::WebviewWindowBuilder;

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

/// Spawns a webview for the specific account using isolated data directory.
#[tauri::command]
pub fn spawn_account_webview(app: AppHandle, account: Account) -> Result<(), String> {
    // Generate data dir specifically isolated for this account based on its ID
    let mut account_dir_opt = get_account_data_dir(&app, &account.id);
    
    if let Some(account_dir) = account_dir_opt {
        // Ensure path exists
        let _ = std::fs::create_dir_all(&account_dir);
        
        let label = format!("whatsapp_{}", account.id.replace("-", "_"));
        
        // Spawn webview with unique data dir
        let _webview = WebviewWindowBuilder::new(
            &app,
            &label,
            tauri::WebviewUrl::External("https://web.whatsapp.com".parse().unwrap())
        )
        .title(&account.name)
        .data_directory(account_dir)
        .build()
        .map_err(|e| e.to_string())?;

        Ok(())
    } else {
        Err("Failed to resolve data directory".to_string())
    }
}
