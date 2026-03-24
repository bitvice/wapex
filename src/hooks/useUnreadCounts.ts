import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";

/**
 * Tracks unread message counts per account by listening to
 * 'wapex://unread' events emitted from WhatsApp webviews.
 */
export function useUnreadCounts() {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const unlisten = listen<{ count: number; windowLabel: string }>(
      "wapex://unread",
      (event) => {
        const { count, windowLabel } = event.payload;
        // Convert window label (whatsapp_uuid_with_underscores) to account ID (uuid-with-dashes)
        const accountId = windowLabel.replace("whatsapp_", "").replace(/_/g, "-");
        setUnreadCounts((prev) => ({ ...prev, [accountId]: count }));
      }
    );

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const getCount = useCallback(
    (accountId: string) => unreadCounts[accountId] || 0,
    [unreadCounts]
  );

  return { unreadCounts, getCount };
}
