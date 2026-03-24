use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: String,
    pub name: String,
    pub color_code: String,
    pub workspace_id: Option<String>,
}

impl Account {
    pub fn new(name: String, color_code: String, workspace_id: Option<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            color_code,
            workspace_id,
        }
    }
}

/// Helper to generate the isolated user data directory path for an account.
/// It creates: `~/.local/share/[app-id]/profiles/[account-id]` on Linux (or OS equivalent).
pub fn get_account_data_dir(app: &AppHandle, account_id: &str) -> Option<PathBuf> {
    app.path().app_local_data_dir().ok().map(|mut p| {
        p.push("profiles");
        p.push(account_id);
        p
    })
}
