import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import "./index.css";

interface Account {
  id: string;
  name: string;
  color_code: string;
  workspace_id: string | null;
}

function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const data = await invoke<Account[]>("get_accounts");
      setAccounts(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddAccount() {
    if (!name) return;
    try {
      await invoke("add_account", {
        name,
        colorCode: "#00FF00",
        workspaceId: null
      });
      setName("");
      loadAccounts();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSpawnAccount(account: Account) {
    try {
      await invoke("spawn_account_webview", { account });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="container border rounded p-4 mx-auto max-w-lg mt-10">
      <h1 className="text-2xl font-bold mb-4">Wapex Accounts</h1>
      
      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="New account name..."
        />
        <button onClick={handleAddAccount} className="bg-primary text-primary-foreground p-2 rounded">
          Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {accounts.map(acc => (
          <div key={acc.id} className="border p-2 rounded flex justify-between">
            <span>{acc.name}</span>
            <button onClick={() => handleSpawnAccount(acc)} className="underline text-blue-500">
              Launch Webview
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;
