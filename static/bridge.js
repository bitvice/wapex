// Wapex WhatsApp Web Injection Bridge
console.log("Wapex bridge initialized.");

// 1. Observe unread count changes
const observer = new MutationObserver(() => {
  const title = document.title;
  const match = title.match(/^\((\d+)\)/);
  const windowLabel = window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label || "unknown";
  const count = match ? parseInt(match[1], 10) : 0;
  if (count > 0 || title.includes("WhatsApp")) {
    window.__TAURI_INTERNALS__?.invoke?.("update_unread_count", { count, windowLabel }).catch(() => {});
  }
});
const titleElement = document.querySelector('head > title');
if (titleElement) {
  observer.observe(titleElement, { subtree: true, characterData: true, childList: true });
}

// 2. Intercept Notifications
const OriginalNotification = window.Notification;
class WapexNotification extends OriginalNotification {
  constructor(title, options) {
    super(title, options);
    const windowLabel = window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label || "unknown";
    window.__TAURI_INTERNALS__?.invoke?.("proxy_notification", {
      title,
      body: options?.body || "",
      windowLabel
    }).catch(() => {});
  }
}
window.Notification = WapexNotification;

// 3. File forwarding (called by Rust when files are dropped on the sidebar)
window.__wapex_dispatch_files = async (base64Files) => {
  console.log(`[Bridge] Dispatching ${base64Files.length} file(s) via attach button...`);
  try {
    const files = await Promise.all(base64Files.map(async (item) => {
      const res = await fetch(item.data);
      const blob = await res.blob();
      return new File([blob], item.name, { type: blob.type || "image/png" });
    }));

    const dataTransfer = new DataTransfer();
    files.forEach(f => dataTransfer.items.add(f));

    // Find all hidden file inputs (WhatsApp keeps them in DOM at all times)
    const allInputs = Array.from(document.querySelectorAll('input[type="file"]'));
    console.log(`[Bridge] Found ${allInputs.length} file input(s)`);

    let fileInput = allInputs.find(i => (i.getAttribute("accept") || "").includes("image"))
                 || allInputs[0];

    if (!fileInput) {
      // Fallback: click + button to mount inputs
      const plusBtn = document.querySelector('span[data-icon="plus"]')
                   || document.querySelector('span[data-icon="attach-menu-plus"]');
      if (plusBtn) {
        const btn = plusBtn.closest('[role="button"]') || plusBtn.parentElement;
        btn?.click();
        await new Promise(r => setTimeout(r, 400));
        fileInput = document.querySelector('input[type="file"][accept*="image"]')
                 || document.querySelector('input[type="file"]');
      }
    }

    if (!fileInput) {
      console.error("[Bridge] No file input found. Is a chat open?");
      return;
    }

    // Set files using native prototype setter (works in WebKit)
    const nativeDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "files");
    if (nativeDesc?.set) {
      nativeDesc.set.call(fileInput, dataTransfer.files);
    } else {
      Object.defineProperty(fileInput, "files", { value: dataTransfer.files, configurable: true });
    }
    fileInput.dispatchEvent(new Event("input",  { bubbles: true, cancelable: true }));
    fileInput.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    console.log("[Bridge] File injection complete.");
  } catch (err) {
    console.error("[Bridge] dispatch_files error:", err);
  }
};

// 4. Image paste fix for WebKitGTK on Linux
//
// Problem: When Ctrl+V is pressed with an image on the clipboard, WebKitGTK either
// doesn't expose the image in clipboardData at all, or WhatsApp's React handler
// rejects it due to isTrusted=false checks on synthetic events.
//
// Solution: Intercept the paste, call Rust to:
//   1) Re-write the clipboard image as PNG (ensures WebKit-readable format)
//   2) Send a REAL OS-level Ctrl+V via enigo
// The resulting paste event has isTrusted=true and WhatsApp handles it natively.

let __wapex_skip_next_paste = false;

window.addEventListener("paste", (e) => {
  // This paste was sent by our retrigger — let WhatsApp handle it
  if (__wapex_skip_next_paste) {
    __wapex_skip_next_paste = false;
    console.log("[Bridge] Trusted retrigger paste — passing to WhatsApp.");
    return;
  }

  const items = e.clipboardData?.items;

  // Check for image content
  let hasImage = false;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) { hasImage = true; break; }
    }
  }

  // Pure text paste — never interfere
  const text = e.clipboardData?.getData("text/plain");
  if (!hasImage && text && text.length > 0) {
    return;
  }

  // Image paste (or empty clipboard that may contain a stripped image)
  // Prevent WhatsApp's broken handler and re-trigger with a real OS keypress
  e.preventDefault();
  e.stopPropagation();

  console.log(`[Bridge] Image paste intercepted (hasImage=${hasImage}). Calling retrigger_paste...`);

  window.__TAURI_INTERNALS__?.invoke?.("retrigger_paste")
    .then(() => {
      console.log("[Bridge] retrigger_paste succeeded. Next paste will pass through.");
      __wapex_skip_next_paste = true;
      // Safety reset in case the retrigger paste never fires
      setTimeout(() => { __wapex_skip_next_paste = false; }, 3000);
    })
    .catch((err) => {
      console.error("[Bridge] retrigger_paste failed:", err);
      // Fallback: no image on clipboard or keyboard automation unavailable
    });
}, true);

// 5. F12 → open WebKit DevTools on this webview
window.addEventListener("keydown", (e) => {
  if (e.key === "F12") {
    e.preventDefault();
    window.__TAURI_INTERNALS__?.invoke?.("open_whatsapp_devtools").catch(console.error);
  }
});

console.log("Wapex bridge: Ready.");
