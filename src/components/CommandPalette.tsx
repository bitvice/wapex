import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Plus,
  Settings,
  Monitor,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Account } from "./Sidebar";

interface CommandPaletteProps {
  accounts: Account[];
  onSelectAccount: (accountId: string) => void;
  onAddAccount: () => void;
  onSettings: () => void;
  onHibernateAll: () => void;
  onTogglePrivacy: () => void;
  privacyEnabled: boolean;
}

export function CommandPalette({
  accounts,
  onSelectAccount,
  onAddAccount,
  onSettings,
  onHibernateAll,
  onTogglePrivacy,
  privacyEnabled,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl border-border/50 backdrop-blur-sm">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Search accounts, actions..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {/* Accounts */}
            {accounts.length > 0 && (
              <CommandGroup heading="Accounts">
                {accounts.map((account) => (
                  <CommandItem
                    key={account.id}
                    onSelect={() => runAction(() => onSelectAccount(account.id))}
                    className="gap-3 py-2.5"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: account.color_code || "#25D366" }}
                    >
                      {account.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{account.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Switch to this account
                      </span>
                    </div>
                    {(account.unreadCount || 0) > 0 && (
                      <span className="ml-auto text-xs font-bold text-destructive">
                        {account.unreadCount} unread
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            {/* Quick Actions */}
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() => runAction(onAddAccount)}
                className="gap-3 py-2.5"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>Add New Account</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>

              <CommandItem
                onSelect={() => runAction(onSettings)}
                className="gap-3 py-2.5"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Global Settings</span>
                <CommandShortcut>⌘,</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* System */}
            <CommandGroup heading="System">
              <CommandItem className="gap-3 py-2.5"
                onSelect={() => runAction(onTogglePrivacy)}
              >
                {privacyEnabled
                  ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                  : <Eye className="h-4 w-4 text-muted-foreground" />
                }
                <span>{privacyEnabled ? "Disable" : "Enable"} Privacy Blur</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>

              <CommandItem className="gap-3 py-2.5"
                onSelect={() => runAction(onHibernateAll)}
              >
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span>Hibernate All Accounts</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
