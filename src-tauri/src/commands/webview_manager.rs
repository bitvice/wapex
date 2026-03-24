use std::collections::{HashMap, HashSet};
use std::sync::Mutex;
use std::time::Instant;
use tauri::{AppHandle, Manager};

/// Tracks the lifecycle of spawned child webviews.
/// Supports hibernation (destroying idle webviews to save RAM)
/// and show/hide toggling for account switching.
pub struct WebviewManager {
    /// Labels of webviews that are currently alive (attached to the window)
    pub created_webviews: Mutex<HashSet<String>>,
    /// Tracks last-active timestamp per label for hibernation decisions
    pub last_active: Mutex<HashMap<String, Instant>>,
    /// Labels of webviews that were hibernated (destroyed to save RAM)
    pub hibernated: Mutex<HashSet<String>>,
    /// Currently visible/active webview label
    pub active_label: Mutex<Option<String>>,
}

impl WebviewManager {
    pub fn new() -> Self {
        Self {
            created_webviews: Mutex::new(HashSet::new()),
            last_active: Mutex::new(HashMap::new()),
            hibernated: Mutex::new(HashSet::new()),
            active_label: Mutex::new(None),
        }
    }

    pub fn register(&self, label: String) {
        self.created_webviews.lock().unwrap().insert(label.clone());
        self.hibernated.lock().unwrap().remove(&label);
        self.touch(&label);
    }

    pub fn unregister(&self, label: &str) {
        self.created_webviews.lock().unwrap().remove(label);
        self.last_active.lock().unwrap().remove(label);
    }

    pub fn is_registered(&self, label: &str) -> bool {
        self.created_webviews.lock().unwrap().contains(label)
    }

    pub fn mark_hibernated(&self, label: &str) {
        self.hibernated.lock().unwrap().insert(label.to_string());
        self.unregister(label);
    }

    pub fn is_hibernated(&self, label: &str) -> bool {
        self.hibernated.lock().unwrap().contains(label)
    }

    /// Update the last-active timestamp for a webview
    pub fn touch(&self, label: &str) {
        self.last_active.lock().unwrap().insert(label.to_string(), Instant::now());
    }

    /// Hide all webviews except the active one
    /// Hide all webview windows except the active one
    pub fn show_only(&self, app: &AppHandle, active_label: &str) {
        self.touch(active_label);
        *self.active_label.lock().unwrap() = Some(active_label.to_string());
        let created = self.created_webviews.lock().unwrap();
        for label in created.iter() {
            if let Some(wv_window) = app.get_webview_window(label) {
                if label == active_label {
                    let _ = wv_window.show();
                } else {
                    let _ = wv_window.hide();
                }
            }
        }
    }

    /// Get labels of webviews idle for longer than `threshold_secs`
    pub fn get_idle_webviews(&self, active_label: &str, threshold_secs: u64) -> Vec<String> {
        let created = self.created_webviews.lock().unwrap();
        let last_active = self.last_active.lock().unwrap();
        let now = Instant::now();

        created.iter()
            .filter(|label| {
                if *label == active_label { return false; }
                if let Some(ts) = last_active.get(*label) {
                    now.duration_since(*ts).as_secs() > threshold_secs
                } else {
                    true // No timestamp = idle
                }
            })
            .cloned()
            .collect()
    }

    /// Return count of alive webviews
    pub fn alive_count(&self) -> usize {
        self.created_webviews.lock().unwrap().len()
    }
}
