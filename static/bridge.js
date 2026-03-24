// Wapex WhatsApp Web Injection Bridge
console.log("Wapex bridge initialized.");

// 1. Observe unread count changes from the chat list or document title.
// WhatsApp Web often updates the document.title with the unread count like "(2) WhatsApp"
const observer = new MutationObserver(() => {
  const title = document.title;
  const match = title.match(/^\((\d+)\)/);
  const windowLabel = window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label || "unknown";
  const count = match ? parseInt(match[1], 10) : 0;
  
  if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
    window.__TAURI_INTERNALS__.invoke("update_unread_count", { count, windowLabel }).catch(e => console.error(e));
  }
});

// Observe title changes
const titleElement = document.querySelector('head > title');
if (titleElement) {
  observer.observe(titleElement, { subtree: true, characterData: true, childList: true });
}

// 2. Intercept Notifications to Proxy them to Desktop + In-app Toast
const OriginalNotification = window.Notification;

class WapexNotification extends OriginalNotification {
  constructor(title, options) {
    // Don't call super() to suppress browser notification - we'll show our own toast
    super(title, options);
    
    // Get the window label from __TAURI_INTERNALS__ metadata
    const windowLabel = window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label || "unknown";

    // Relay notification info to Tauri for in-app toast
    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
      window.__TAURI_INTERNALS__.invoke("proxy_notification", {
        title,
        body: options?.body || "",
        windowLabel
      }).catch(e => console.error(e));
    }
  }
}

// Override logic
window.Notification = WapexNotification;
