import { useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Minus, Square, X } from "lucide-react";

export function TitleBar() {
  const windowRef = useRef(getCurrentWindow());
  const appWindow = windowRef.current;

  return (
    <div className="h-8 w-full flex items-center bg-card/80 backdrop-blur-sm border-b border-border select-none shrink-0">
      {/* Left: App name with icon (draggable) */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 pl-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase"
        onDoubleClick={() => appWindow.toggleMaximize()}
      >
        <img src="/images/icon.png" alt="" className="h-5 w-5 pointer-events-none" />
        Wapex
      </div>

      {/* Middle: Draggable spacer fills remaining space */}
      <div
        data-tauri-drag-region
        className="flex-1 h-full"
        onDoubleClick={() => appWindow.toggleMaximize()}
      />

      {/* Right: Window controls (NOT draggable) */}
      <div className="flex items-center h-full">
        <button
          onClick={() => invoke("minimize_main_window")}
          className="inline-flex items-center justify-center w-10 h-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="inline-flex items-center justify-center w-10 h-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          onClick={async () => {
            const { exit } = await import("@tauri-apps/plugin-process");
            await exit(0);
          }}
          className="inline-flex items-center justify-center w-10 h-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
