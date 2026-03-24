// Wapex WhatsApp Web Injection Bridge
console.log("Wapex bridge initialized.");

// 1. Observe unread count changes from the chat list or document title.
// WhatsApp Web often updates the document.title with the unread count like "(2) WhatsApp"
const observer = new MutationObserver(() => {
  const title = document.title;
  const match = title.match(/^\((\d+)\)/);
  if (match) {
    const count = parseInt(match[1], 10);
    // Safely attempt to notify the Tauri backend
    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
      window.__TAURI_INTERNALS__.invoke("update_unread_count", { count }).catch(e => console.error(e));
    }
  } else {
    // Zero unread
    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
      window.__TAURI_INTERNALS__.invoke("update_unread_count", { count: 0 }).catch(e => console.error(e));
    }
  }
});

// Observe title changes
const titleElement = document.querySelector('head > title');
if (titleElement) {
  observer.observe(titleElement, { subtree: true, characterData: true, childList: true });
}

// 2. Intercept Notifications to Proxy them to Desktop (MVP level)
const OriginalNotification = window.Notification;

class WapexNotification extends OriginalNotification {
  constructor(title, options) {
    super(title, options);
    
    // Relay notification info to Tauri
    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
      window.__TAURI_INTERNALS__.invoke("proxy_notification", {
        title,
        body: options?.body || ""
      }).catch(e => console.error(e));
    }
  }
}

// Override logic only if Notifications are completely allowed or not yet asked to prevent breaking WA
window.Notification = WapexNotification;
