"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ArrowLeft, LogOut, Search, HelpCircle } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  showBack?: boolean;
  backUrl?: string;
  showLogout?: boolean;
  onLogout?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({
  breadcrumbs,
  showBack = true,
  backUrl = "/sessions",
  showLogout = false,
  onLogout,
  actions,
}: PageHeaderProps) {
  const router = useRouter();
  const { toggleSearch } = useGlobalSearch();
  const { toggleHelp } = useHelpModal();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 px-4 flex-1 min-w-0">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <Fragment key={index}>
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className={index === 0 ? "" : "hidden md:block"}>
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex items-center gap-2 px-4">
        {/* Global Search Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSearch}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
          title="Busca global (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
          <span className="text-xs">Buscar</span>
        </Button>
        
        {/* Help Button */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
          title="Ajuda e atalhos (?)"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        
        {actions}
        
        {showBack && (
          <Button variant="outline" size="sm" onClick={() => router.push(backUrl)} className="hidden sm:flex">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sessions
          </Button>
        )}
        
        {showLogout && onLogout && (
          <Button variant="outline" size="sm" onClick={onLogout} className="hidden sm:flex">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        )}
        
        {/* Notifications */}
        <NotificationCenter />
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Mobile Menu Button */}
        <div className="sm:hidden flex items-center gap-1">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {showLogout && onLogout && (
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
