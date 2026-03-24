import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { Sun, Moon, Monitor, Eye, EyeOff, Zap, ZapOff, PanelLeft, PanelRight, Palette, ChevronDown } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  privacyEnabled: boolean;
  onTogglePrivacy: () => void;
  hibernationEnabled: boolean;
  onToggleHibernation: () => void;
  accounts: Array<{ id: string; name: string; color_code: string }>;
  onAccountsChanged: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  privacyEnabled,
  onTogglePrivacy,
  hibernationEnabled,
  onToggleHibernation,
  accounts,
  onAccountsChanged,
}: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { sidebarPosition, setSidebarPosition } = useSettings();
  const [expandedColorId, setExpandedColorId] = useState<string | null>(null);

  const themes = [
    { value: "light" as const, label: "Light", icon: Sun, description: "Clean and bright interface" },
    { value: "dark" as const, label: "Dark", icon: Moon, description: "Easy on the eyes" },
    { value: "system" as const, label: "System", icon: Monitor, description: "Follow OS preference" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Appearance</h3>
            <p className="text-xs text-muted-foreground mb-3">Choose your preferred color theme</p>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                    theme === value
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                    theme === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-accent"
                  }`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-sm font-medium ${
                    theme === value ? "text-primary" : "text-foreground"
                  }`}>
                    {label}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    {description}
                  </span>
                  {/* Selection indicator */}
                  {theme === value && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Position */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Layout</h3>
            <p className="text-xs text-muted-foreground mb-3">Choose sidebar placement</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "left" as const, label: "Left", icon: PanelLeft },
                { value: "right" as const, label: "Right", icon: PanelRight },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSidebarPosition(value)}
                  className={`group relative flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 cursor-pointer ${
                    sidebarPosition === value
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                  }`}
                >
                  <Icon size={18} className={sidebarPosition === value ? "text-primary" : "text-muted-foreground"} />
                  <span className={`text-sm font-medium ${sidebarPosition === value ? "text-primary" : "text-foreground"}`}>
                    {label}
                  </span>
                  {sidebarPosition === value && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Privacy & Performance */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Privacy & Performance</h3>
            <div className="space-y-2">
              {/* Privacy Blur Toggle */}
              <button
                onClick={onTogglePrivacy}
                className="w-full flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {privacyEnabled
                    ? <EyeOff size={18} className="text-primary" />
                    : <Eye size={18} className="text-muted-foreground" />
                  }
                  <div className="text-left">
                    <p className="text-sm font-medium">Privacy Blur</p>
                    <p className="text-xs text-muted-foreground">Blur content when window loses focus</p>
                  </div>
                </div>
                <div className={`relative h-6 w-11 rounded-full transition-colors ${
                  privacyEnabled ? "bg-primary" : "bg-muted"
                }`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    privacyEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                  }`} />
                </div>
              </button>

              {/* Smart Hibernation Toggle */}
              <button
                onClick={onToggleHibernation}
                className="w-full flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {hibernationEnabled
                    ? <Zap size={18} className="text-primary" />
                    : <ZapOff size={18} className="text-muted-foreground" />
                  }
                  <div className="text-left">
                    <p className="text-sm font-medium">Smart Hibernation</p>
                    <p className="text-xs text-muted-foreground">Auto-suspend idle accounts to save RAM</p>
                  </div>
                </div>
                <div className={`relative h-6 w-11 rounded-full transition-colors ${
                  hibernationEnabled ? "bg-primary" : "bg-muted"
                }`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    hibernationEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                  }`} />
                </div>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Account Colors */}
          {accounts.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Palette size={14} />
                  Account Colors
                </h3>
                <p className="text-xs text-muted-foreground mb-3">Personalize each account's color</p>
                <div className="space-y-2">
                  {accounts.map((account) => {
                    const COLORS = [
                      "#25D366", "#075E54", "#34B7F1", "#00A884",
                      "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899",
                      "#3B82F6", "#06B6D4", "#10B981", "#F97316",
                    ];
                    const isExpanded = expandedColorId === account.id;
                    return (
                      <div key={account.id} className="rounded-lg border border-border overflow-hidden">
                        {/* Clickable row */}
                        <button
                          onClick={() => setExpandedColorId(isExpanded ? null : account.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div
                            className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            style={{ backgroundColor: account.color_code }}
                          >
                            {account.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium truncate">{account.name}</p>
                          </div>
                          <ChevronDown
                            size={14}
                            className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>

                        {/* Expandable color palette */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 flex gap-1.5 flex-wrap animate-in fade-in slide-in-from-top-1 duration-200">
                            {COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={async () => {
                                  await invoke("update_account_color", { id: account.id, colorCode: color });
                                  onAccountsChanged();
                                }}
                                className={`h-6 w-6 rounded-full transition-all cursor-pointer hover:scale-125 ${
                                  account.color_code === color
                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                                    : "opacity-70 hover:opacity-100"
                                }`}
                                style={{ backgroundColor: color }}
                                aria-label={`Set color to ${color}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="h-px bg-border" />
            </>
          )}

          {/* About */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Wapex v0.1.0</span>
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+K</kbd> for command palette</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
