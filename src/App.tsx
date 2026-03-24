import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import "./index.css";
import { Sidebar, type Account } from "./components/Sidebar";
import { Viewport } from "./components/Viewport";
import { Dashboard } from "./components/Dashboard";
import { CommandPalette } from "./components/CommandPalette";
import { TitleBar } from "./components/TitleBar";
import { SettingsDialog } from "./components/SettingsDialog";
import { NotificationToast } from "./components/NotificationToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { usePrivacyBlur } from "./hooks/usePrivacyBlur";
import { useSmartHibernation } from "./hooks/useSmartHibernation";
import { useSettings } from "./hooks/useSettings";
import { useUnreadCounts } from "./hooks/useUnreadCounts";

function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  // Settings
  const { sidebarPosition } = useSettings();

  // Unread counts per account
  const { unreadCounts } = useUnreadCounts();

  // Privacy Blur: blur content when window loses focus
  const { isBlurred, isEnabled: privacyEnabled, setIsEnabled: setPrivacyEnabled } = usePrivacyBlur();

  // Smart Hibernation: auto-destroy idle webviews
  const [hibernationEnabled, setHibernationEnabled] = useState(true);
  useSmartHibernation(activeAccountId, hibernationEnabled);

  // Hibernate all handler for command palette
  async function handleHibernateAll() {
    if (!activeAccountId) return;
    const activeLabel = `whatsapp_${activeAccountId.replace(/-/g, "_")}`;
    try {
      const result = await invoke<string[]>("hibernate_all", { activeLabel });
      console.log(`Hibernated ${result.length} webview(s)`);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  // Hide all WhatsApp windows when returning to the dashboard
  useEffect(() => {
    if (!activeAccountId) {
      invoke("hide_all_webviews").catch(console.error);
    }
  }, [activeAccountId]);

  async function loadAccounts() {
    try {
      const data = await invoke<Account[]>("get_accounts");
      setAccounts(data);
      if (data.length > 0 && !activeAccountId) {
        setActiveAccountId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddAccount() {
    if (!name.trim()) return;
    try {
      const colors = ["#25D366", "#075E54", "#34B7F1", "#ECE5DD", "#00A884"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      await invoke("add_account", {
        name,
        colorCode: color,
        workspaceId: null
      });
      setName("");
      loadAccounts();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      <TitleBar />

      <div className={`flex flex-1 overflow-hidden ${sidebarPosition === 'right' ? 'flex-row-reverse' : ''}`}>
      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        accounts={accounts}
        onSelectAccount={setActiveAccountId}
        onAddAccount={() => setAddDialogOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onHibernateAll={handleHibernateAll}
        onTogglePrivacy={() => setPrivacyEnabled(p => !p)}
        privacyEnabled={privacyEnabled}
      />

      {/* Add Account Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add WhatsApp Account</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <input
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Account name (e.g. Main Office)"
              onKeyDown={(e) => { if (e.key === 'Enter') { handleAddAccount(); setAddDialogOpen(false); } }}
              autoFocus
            />
            <button
              onClick={() => { handleAddAccount(); setAddDialogOpen(false); }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              Create Account
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Sidebar 
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={setActiveAccountId}
        onSettingsClick={() => setSettingsOpen(true)}
        onAddAccountClick={() => setAddDialogOpen(true)}
        unreadCounts={unreadCounts}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-background">
        {!activeAccount ? (
          <Dashboard onAddAccount={() => setAddDialogOpen(true)} />
        ) : (
          <Viewport 
             activeAccountId={activeAccountId} 
             account={activeAccount}
             sidebarPosition={sidebarPosition}
          />
        )}

        {/* Privacy Blur Overlay */}
        {isBlurred && activeAccount && (
          <div className="absolute inset-0 z-50 backdrop-blur-xl bg-background/60 flex items-center justify-center transition-all duration-300">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <p className="text-lg font-semibold text-foreground">Privacy Mode Active</p>
              <p className="text-sm text-muted-foreground">Click to focus the window</p>
            </div>
          </div>
        )}
      </main>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        privacyEnabled={privacyEnabled}
        onTogglePrivacy={() => setPrivacyEnabled(p => !p)}
        hibernationEnabled={hibernationEnabled}
        onToggleHibernation={() => setHibernationEnabled(h => !h)}
        accounts={accounts}
        onAccountsChanged={loadAccounts}
      />
      </div>

      {/* In-app notification toasts */}
      <NotificationToast accounts={accounts} />
    </div>
  );
}

export default App;
