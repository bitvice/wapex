import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Plus, Settings, MessageCircle } from "lucide-react";

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
}: SidebarProps) {
  return (
    <div className="w-16 flex flex-col items-center py-4 bg-card border-r border-border h-screen overflow-hidden">
      {/* App Logo or Main Indicator */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-sm transition-all duration-200 hover:rounded-xl cursor-default">
              <MessageCircle size={24} />
            </div>
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
                        {(account.unreadCount || 0) > 0 && (
                          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground border-2 border-card z-10">
                            {account.unreadCount}
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
