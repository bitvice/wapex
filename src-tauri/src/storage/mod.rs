use crate::account::Account;
use rusqlite::{params, Connection, Result};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct AccountManager {
    pub db: Mutex<Connection>,
}

impl AccountManager {
    /// Initialize the database and table
    pub fn new(app: &AppHandle) -> Result<Self> {
        let db_path = app
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir")
            .join("metadata.sqlite");

        // Ensure directory exists
        if let Some(parent) = db_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let db = Connection::open(&db_path)?;

        db.execute(
            "CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color_code TEXT NOT NULL,
                workspace_id TEXT
            )",
            [],
        )?;

        Ok(Self {
            db: Mutex::new(db),
        })
    }

    /// Add a new account into the database
    pub fn add_account(&self, account: &Account) -> Result<()> {
        let db = self.db.lock().unwrap();
        db.execute(
            "INSERT INTO accounts (id, name, color_code, workspace_id) VALUES (?1, ?2, ?3, ?4)",
            params![
                account.id,
                account.name,
                account.color_code,
                account.workspace_id
            ],
        )?;
        Ok(())
    }

    /// Retrieve all stored accounts
    pub fn get_accounts(&self) -> Result<Vec<Account>> {
        let db = self.db.lock().unwrap();
        let mut stmt = db.prepare("SELECT id, name, color_code, workspace_id FROM accounts")?;
        let account_iter = stmt.query_map([], |row| {
            Ok(Account {
                id: row.get(0)?,
                name: row.get(1)?,
                color_code: row.get(2)?,
                workspace_id: row.get(3)?,
            })
        })?;

        let mut accounts = Vec::new();
        for account in account_iter {
            accounts.push(account?);
        }
        Ok(accounts)
    }

    /// Delete an account by id
    pub fn delete_account(&self, id: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        db.execute("DELETE FROM accounts WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// Update an account's color code
    pub fn update_account_color(&self, id: &str, color_code: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        db.execute(
            "UPDATE accounts SET color_code = ?1 WHERE id = ?2",
            params![color_code, id],
        )?;
        Ok(())
    }
}
