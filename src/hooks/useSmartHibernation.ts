import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

const HIBERNATE_CHECK_INTERVAL = 60_000; // Check every 60s
const IDLE_THRESHOLD_SECS = 300; // Hibernate after 5 min idle

/**
 * Background hook that periodically checks for idle webviews
 * and hibernates them to save RAM.
 */
export function useSmartHibernation(activeAccountId: string | null, enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !activeAccountId) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const activeLabel = `whatsapp_${activeAccountId.replace(/-/g, "_")}`;

    const check = async () => {
      try {
        const hibernated = await invoke<string[]>("hibernate_inactive", {
          activeLabel,
          thresholdSecs: IDLE_THRESHOLD_SECS,
        });
        if (hibernated.length > 0) {
          console.log(`[Hibernate] Destroyed ${hibernated.length} idle webview(s):`, hibernated);
        }
      } catch (e) {
        console.error("[Hibernate] Check failed:", e);
      }
    };

    intervalRef.current = setInterval(check, HIBERNATE_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeAccountId, enabled]);
}
