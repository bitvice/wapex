import { useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import type { SidebarPosition } from "@/hooks/useSettings";

const SIDEBAR_WIDTH = 64; // w-16 = 4rem = 64px
const TITLEBAR_HEIGHT = 32; // h-8 = 2rem = 32px

interface ViewportProps {
  activeAccountId: string | null;
  account: any;
  sidebarPosition: SidebarPosition;
}

export function Viewport({ activeAccountId, account, sidebarPosition }: ViewportProps) {
  const spawnedRef = useRef<string | null>(null);

  /**
   * Calculate relative bounds (relative to main window's client area).
   * The Rust backend converts these to absolute screen coordinates.
   */
  const getBounds = useCallback(() => {
    return {
      x: sidebarPosition === "left" ? SIDEBAR_WIDTH : 0,
      y: TITLEBAR_HEIGHT,
      width: window.innerWidth - SIDEBAR_WIDTH,
      height: window.innerHeight - TITLEBAR_HEIGHT,
    };
  }, [sidebarPosition]);

  const syncWebview = useCallback(async () => {
    if (!activeAccountId) return;

    const bounds = getBounds();
    const label = `whatsapp_${activeAccountId.replace(/-/g, "_")}`;

    try {
      if (spawnedRef.current !== activeAccountId) {
        console.log(`[Viewport] Spawning for ${activeAccountId}:`, bounds);
        await invoke("spawn_account_webview", { account, bounds });
        spawnedRef.current = activeAccountId;
      } else {
        await invoke("update_webview_bounds", { label, bounds });
      }
    } catch (e) {
      console.error("Failed to sync webview:", e);
    }
  }, [activeAccountId, account, getBounds]);

  // Spawn/switch on account change
  useEffect(() => {
    if (activeAccountId && account) {
      syncWebview();
    }
  }, [activeAccountId, account, syncWebview]);

  // Keep bounds in sync with window resizes AND moves
  useEffect(() => {
    const onResize = () => syncWebview();
    window.addEventListener("resize", onResize);

    // Listen for main window move events (Tauri API) to reposition the WebviewWindow
    let unlistenMove: (() => void) | null = null;
    const appWindow = getCurrentWindow();
    appWindow.onMoved(() => {
      syncWebview();
    }).then(fn => { unlistenMove = fn; });

    // Also listen for our custom window-moved event from the Rust side
    let unlistenCustomMove: (() => void) | null = null;
    listen("wapex://window-moved", () => {
      syncWebview();
    }).then(fn => { unlistenCustomMove = fn; });

    return () => {
      window.removeEventListener("resize", onResize);
      if (unlistenMove) unlistenMove();
      if (unlistenCustomMove) unlistenCustomMove();
    };
  }, [syncWebview]);

  return (
    <div
      className="flex-1 w-full h-full bg-transparent relative"
      id="webview-viewport"
    >
      {/* Placeholder — the actual content is a separate borderless WebviewWindow */}
    </div>
  );
}
