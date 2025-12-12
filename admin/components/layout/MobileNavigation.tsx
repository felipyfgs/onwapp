"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  X, 
  Home, 
  MessageSquare, 
  Users, 
  Settings, 
  Smartphone,
  Bell,
  Search,
  HelpCircle,
  LogOut
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useHelpModal } from "@/hooks/useHelpModal";

interface MobileNavigationProps {
  unreadNotifications?: number;
  pendingTickets?: number;
  onLogout?: () => void;
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    badge: null
  },
  {
    title: "Sessões",
    href: "/sessions",
    icon: Smartphone,
    badge: null
  },
  {
    title: "Chats",
    href: "/chats",
    icon: MessageSquare,
    badge: "tickets"
  },
  {
    title: "Contatos",
    href: "/contacts",
    icon: Users,
    badge: null
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
    badge: null
  }
];

export function MobileNavigation({ 
  unreadNotifications = 0,
  pendingTickets = 0,
  onLogout
}: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSearch } = useGlobalSearch();
  const { toggleHelp } = useHelpModal();

  const handleNavigation = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSearch}
              className="h-8 w-8 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {unreadNotifications > 0 && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
                >
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleHelp}
          className="h-8 w-8 p-0"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Navigation Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <SheetTitle>Menu</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <div className="overflow-y-auto h-[calc(100vh-80px)]">
            {/* User Section */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Admin User</p>
                  <p className="text-sm text-muted-foreground">admin@onwapp.com</p>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{pendingTickets}</p>
                  <p className="text-xs text-muted-foreground">Tickets Pendentes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{unreadNotifications}</p>
                  <p className="text-xs text-muted-foreground">Notificações</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Items */}
            <nav className="p-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-12 gap-3 rounded-lg",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.badge === "tickets" && pendingTickets > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {pendingTickets}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </nav>
            
            {/* Bottom Actions */}
            <div className="p-4 border-t mt-auto">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    setOpen(false);
                    toggleHelp();
                  }}
                >
                  <HelpCircle className="h-4 w-4" />
                  Ajuda e Atalhos
                </Button>
                
                {onLogout && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                    onClick={() => {
                      setOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}