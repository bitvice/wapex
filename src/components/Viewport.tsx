import { useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface ViewportProps {
  activeAccountId: string | null;
  account: any;
}

export function Viewport({ activeAccountId, account }: ViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spawnedRef = useRef<string | null>(null);

  /**
   * Calculate relative bounds (relative to main window's client area).
   */
  const syncWebview = useCallback(async () => {
    if (!activeAccountId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const bounds = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
    
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
  }, [activeAccountId, account]);

  // Spawn/switch on account change
  useEffect(() => {
    if (activeAccountId && account) {
      syncWebview();
    }
  }, [activeAccountId, account, syncWebview]);

  // Keep bounds in sync with window resizes and moves
  useEffect(() => {
    const onResize = () => syncWebview();
    window.addEventListener("resize", onResize);

    // Listen for custom window events from the Rust side
    let unlistenResize: (() => void) | null = null;
    let unlistenMove: (() => void) | null = null;

    listen("wapex://window-resized", () => {
      syncWebview();
    }).then(fn => { unlistenResize = fn; });

    listen("wapex://window-moved", () => {
      syncWebview();
    }).then(fn => { unlistenMove = fn; });

    return () => {
      window.removeEventListener("resize", onResize);
      if (unlistenResize) unlistenResize();
      if (unlistenMove) unlistenMove();
    };
  }, [syncWebview]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full bg-transparent relative"
      id="webview-viewport"
    >
      {/* Placeholder — the actual content is a child Webview managed by Rust */}
    </div>
  );
}
