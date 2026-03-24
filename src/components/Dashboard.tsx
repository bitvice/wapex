import { Plus, Zap, Shield, Command, MessageCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface DashboardProps {
  onAddAccount: () => void;
}

export function Dashboard({ onAddAccount }: DashboardProps) {
  const { resolvedTheme } = useTheme();

  const features = [
    {
      icon: MessageCircle,
      title: "Multi-Account",
      description: "Run multiple WhatsApp accounts side by side",
      color: "#25D366",
    },
    {
      icon: Zap,
      title: "Smart Hibernation",
      description: "Idle accounts are suspended to save memory",
      color: "#F59E0B",
    },
    {
      icon: Shield,
      title: "Privacy Blur",
      description: "Auto-blur content when you switch windows",
      color: "#8B5CF6",
    },
    {
      icon: Command,
      title: "Command Palette",
      description: "Quick search everything with Ctrl+K",
      color: "#3B82F6",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img
            src={resolvedTheme === "dark" ? "/images/logo_dark.png" : "/images/logo_light.png"}
            alt="Wapex"
            className="h-32 w-auto drop-shadow-lg"
          />
        </div>

        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
          Welcome to Wapex
        </h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-sm mx-auto">
          Your multi-account WhatsApp workspace. Manage all your accounts from one powerful desktop app.
        </p>

        {/* CTA */}
        <button
          onClick={onAddAccount}
          className="inline-flex items-center gap-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 h-11 px-6 transition-all hover:scale-[1.02] active:scale-[0.98] mb-10"
        >
          <Plus size={18} />
          Add Your First Account
        </button>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {features.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-4 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Shortcut hint */}
        <p className="text-xs text-muted-foreground mt-6">
          Press{" "}
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px] font-medium">
            Ctrl+K
          </kbd>{" "}
          to open the command palette
        </p>
      </div>
    </div>
  );
}
