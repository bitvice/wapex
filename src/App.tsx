import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import "./index.css";
import { Sidebar, type Account } from "./components/Sidebar";

function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    loadAccounts();
    // In actual implementation, we'd also listen to Tauri unread-count events here
  }, []);

  async function loadAccounts() {
    try {
      const data = await invoke<Account[]>("get_accounts");
      // For demo, just mock an unread badge on the first element if any
      if (data.length > 0) {
        data[0].unreadCount = 2;
        if (!activeAccountId) setActiveAccountId(data[0].id);
      }
      setAccounts(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddAccount() {
    if (!name.trim()) return;
    try {
      await invoke("add_account", {
        name,
        colorCode: "hsl(var(--primary))", // Fallback generated theme color
        workspaceId: null
      });
      setName("");
      loadAccounts();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleLaunchAccount() {
    const account = accounts.find(a => a.id === activeAccountId);
    if (!account) return;
    try {
      await invoke("spawn_account_webview", { account });
    } catch (e) {
      console.error(e);
    }
  }

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      <Sidebar 
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={setActiveAccountId}
        onSettingsClick={() => console.log("Settings")}
        onAddAccountClick={() => console.log("Add Acc modal")}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-black/5">
        <h1 className="text-4xl font-extrabold mb-8 text-foreground tracking-tight">Wapex Shell Dashboard</h1>
        
        {accounts.length === 0 ? (
          <div className="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-sm p-6 text-center">
            <h3 className="font-semibold leading-none tracking-tight mb-2 text-xl">No Accounts Added</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first WhatsApp integration instance.</p>
            <div className="flex gap-2">
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Ex: Main Office"
              />
              <button 
                onClick={handleAddAccount} 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow-sm p-8">
             <div className="flex items-center gap-4 mb-8">
               <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: activeAccount?.color_code || "#000" }}
               >
                 {activeAccount?.name.substring(0,2).toUpperCase()}
               </div>
               <div>
                  <h2 className="text-2xl font-semibold">{activeAccount?.name}</h2>
                  <p className="text-muted-foreground">Session Instance ID: {activeAccount?.id.split("-")[0]}</p>
               </div>
             </div>
             
             <button 
                onClick={handleLaunchAccount} 
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
              >
                Launch Account Webview
              </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
