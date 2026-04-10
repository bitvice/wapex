import { cn } from "@/lib/utils";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Plus, Settings } from "lucide-react";

export interface Account {
  id: string;
  name: string;
  color_code: string;
  workspace_id: string | null;
  unreadCount?: number;
}

interface SidebarProps {
  accounts: Account[];
  activeAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  onSettingsClick: () => void;
  onAddAccountClick: () => void;
  unreadCounts: Record<string, number>;
}

const getInitials = (name: string) => {
  return name.substring(0, 2).toUpperCase();
};

export function Sidebar({
  accounts,
  activeAccountId,
  onSelectAccount,
  onSettingsClick,
  onAddAccountClick,
  unreadCounts,
}: SidebarProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraggingOver) {
      console.log("SIDEBAR: Drag Over detected");
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = () => {
    console.log("SIDEBAR: Drag Leave detected");
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    try {
      console.log(`SIDEBAR: Processing ${files.length} dropped files`);
      const payloads = await Promise.all(
        Array.from(files).map(async (file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                data: reader.result // includes "data:mimeType;base64," natively
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );
      
      console.log("SIDEBAR: Forwarding to Rust backend...");
      await invoke("forward_files_to_webview", { payloads });
      console.log("SIDEBAR: Forwarded successfully.");
    } catch (err) {
      console.error("SIDEBAR: Error processing dropped files:", err);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "w-16 shrink-0 flex flex-col items-center py-4 bg-card border-r border-border h-full overflow-hidden transition-colors duration-200 relative",
        isDraggingOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
      )}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center p-2 bg-primary/10 rounded-r-lg border-2 border-dashed border-primary animate-in fade-in zoom-in duration-150">
           <div className="text-[10px] font-bold text-primary uppercase text-center rotate-90 whitespace-nowrap">
             Drop here to send
           </div>
        </div>
      )}
      {/* App Logo or Main Indicator */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectAccount(null as any)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden mb-4 shadow-sm transition-all duration-200 hover:rounded-xl hover:shadow-md cursor-pointer bg-blue-900"
            >
              <img src="/images/icon.png" alt="Wapex" className="h-12 w-12 object-cover" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Wapex Dashboard</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator className="w-8 mb-4 h-0.5" />

      {/* Accounts List (Workspace Mode via ScrollArea) */}
      <ScrollArea className="flex-1 w-full px-2">
        <div className="flex flex-col items-center gap-3 py-2">
          <TooltipProvider delayDuration={0}>
            {accounts.map((account) => {
              const isActive = activeAccountId === account.id;
              return (
                <div key={account.id} className="relative group flex items-center justify-center w-full">
                  {/* Active Indicator Line */}
                  <div
                    className={cn(
                      "absolute left-0 w-1 bg-primary rounded-r-md transition-all duration-200",
                      isActive
                        ? "h-10 opacity-100"
                        : "h-4 opacity-0 group-hover:opacity-100 group-hover:h-5"
                    )}
                  />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectAccount(account.id)}
                        className={cn(
                          "relative flex h-12 w-12 items-center justify-center rounded-[24px] text-white font-semibold transition-all duration-200 ease-in-out cursor-pointer overflow-hidden group-hover:rounded-[16px]",
                          isActive ? "rounded-[16px]" : "hover:rounded-[16px]"
                        )}
                        style={{ backgroundColor: account.color_code || "#25D366" }}
                      >
                        {getInitials(account.name)}
                        {/* Unread Badge */}
                        {(unreadCounts[account.id] || 0) > 0 && (
                          <div className="absolute -bottom-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white border-2 border-card z-10">
                            {unreadCounts[account.id]}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{account.name}</TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </ScrollArea>

      <Separator className="w-8 my-4 h-0.5" />

      {/* Footer Settings / Add */}
      <div className="flex flex-col gap-3">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddAccountClick}
                className="group flex h-12 w-12 items-center justify-center rounded-[24px] bg-muted text-muted-foreground transition-all duration-200 hover:rounded-[16px] hover:bg-accent hover:text-accent-foreground"
              >
                <Plus size={24} className="transition-transform group-hover:rotate-90" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Add WhatsApp Account</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSettingsClick}
                className="group flex h-12 w-12 items-center justify-center rounded-[24px] bg-transparent text-muted-foreground transition-all duration-200 hover:rounded-[16px] hover:bg-accent hover:text-accent-foreground"
              >
                <Settings size={24} className="transition-transform group-hover:rotate-90" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Global Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
