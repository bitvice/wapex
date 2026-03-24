import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { X } from "lucide-react";

interface ToastNotification {
  id: number;
  sender: string;
  body: string;
  accountLabel: string;
}

interface NotificationToastProps {
  accounts: Array<{ id: string; name: string; color_code: string }>;
}

export function NotificationToast({ accounts }: NotificationToastProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unlisten = listen<{ sender: string; body: string; accountLabel: string }>(
      "wapex://notification",
      (event) => {
        const { sender, body, accountLabel } = event.payload;
        const id = Date.now();
        setToasts((prev) => [...prev.slice(-4), { id, sender, body, accountLabel }]);

        // Auto-dismiss after 6 seconds
        setTimeout(() => removeToast(id), 6000);
      }
    );

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [removeToast]);

  // Find the account for a given window label
  const getAccount = (label: string) => {
    // Label format: whatsapp_<uuid_with_underscores>
    const accountId = label.replace("whatsapp_", "").replace(/_/g, "-");
    return accounts.find((a) => a.id === accountId);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-12 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, index) => {
        const account = getAccount(toast.accountLabel);
        const truncatedBody =
          toast.body.split(/\s+/).slice(0, 20).join(" ") +
          (toast.body.split(/\s+/).length > 20 ? "…" : "");

        return (
          <div
            key={toast.id}
            className="pointer-events-auto w-80 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl shadow-black/20 p-3 flex gap-3 items-start animate-in slide-in-from-right-5 fade-in duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Account avatar */}
            <div
              className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: account?.color_code || "#6B7280" }}
            >
              {(account?.name || "?").slice(0, 2).toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-foreground truncate">
                  {toast.sender}
                </span>
                {account && (
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted shrink-0">
                    {account.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {truncatedBody}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
