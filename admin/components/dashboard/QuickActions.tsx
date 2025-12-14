"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  MessageSquare, 
  Users, 
  Settings, 
  Smartphone, 
  Search,
  BarChart3,
  Bell,
  Zap,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  badge?: string;
  variant?: "default" | "primary" | "secondary";
  shortcut?: string;
}

interface QuickActionsProps {
  sessionCount?: number;
  unreadChats?: number;
  unreadMessages?: number;
}

export function QuickActions({
  sessionCount = 0,
  unreadChats = 0,
  unreadMessages = 0
}: QuickActionsProps) {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: "new-session",
      title: "Nova Sessão",
      description: "Conectar nova conta WhatsApp",
      icon: Smartphone,
      action: () => router.push("/sessions"),
      variant: "primary",
      shortcut: "N"
    },
    {
      id: "view-chats",
      title: "Ver Chats",
      description: "Acessar conversas",
      icon: Plus,
      action: () => router.push("/chats"),
      badge: unreadChats > 0 ? unreadChats.toString() : undefined,
      variant: unreadChats > 0 ? "primary" : "default",
      shortcut: "T"
    },
    {
      id: "view-messages",
      title: "Mensagens",
      description: "Ver conversas recentes",
      icon: MessageSquare,
      action: () => router.push("/chats"),
      badge: unreadMessages > 0 ? unreadMessages.toString() : undefined,
      shortcut: "M"
    },
    {
      id: "manage-contacts",
      title: "Contatos",
      description: "Gerenciar lista de contatos",
      icon: Users,
      action: () => router.push("/contacts"),
      shortcut: "C"
    },
    {
      id: "search",
      title: "Busca Global",
      description: "Buscar em toda a plataforma",
      icon: Search,
      action: () => {
        // Trigger global search
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          metaKey: true
        }));
      },
      shortcut: "Ctrl+K"
    },
    {
      id: "analytics",
      title: "Análises",
      description: "Ver estatísticas e relatórios",
      icon: BarChart3,
      action: () => router.push("/analytics"),
      shortcut: "A"
    },
    {
      id: "notifications",
      title: "Notificações",
      description: "Gerenciar alertas e preferências",
      icon: Bell,
      action: () => router.push("/settings/notifications"),
      badge: "3", // Example notification count
      shortcut: "Alt+N"
    },
    {
      id: "settings",
      title: "Configurações",
      description: "Ajustes da plataforma",
      icon: Settings,
      action: () => router.push("/settings"),
      shortcut: "S"
    }
  ];

  const getActionStyles = (variant: QuickAction["variant"]) => {
    switch (variant) {
      case "primary":
        return "bg-primary text-primary-foreground hover:bg-primary/90 border-primary/20";
      case "secondary":
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
      default:
        return "hover:bg-accent hover:text-accent-foreground";
    }
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Ações Rápidas
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {actions.length} disponíveis
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="ghost"
                className={cn(
                  "h-auto p-4 flex flex-col items-start gap-2 relative group transition-all duration-200",
                  getActionStyles(action.variant)
                )}
                onClick={action.action}
                title={`${action.title} (${action.shortcut})`}
              >
                {action.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
                  >
                    {action.badge}
                  </Badge>
                )}
                <div className="flex items-center gap-2 w-full">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {action.description}
                  </p>
                </div>
                {action.shortcut && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 mt-1">
                    {action.shortcut}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono">
              Ctrl+K
            </kbd>
            para busca global •
            <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono">
              ?
            </kbd>
            para ajuda
          </p>
        </div>
      </CardContent>
    </Card>
  );
}