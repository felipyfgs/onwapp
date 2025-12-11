"use client";

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
import { ArrowLeft, LogOut } from "lucide-react";

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
}

export function PageHeader({
  breadcrumbs,
  showBack = true,
  backUrl = "/sessions",
  showLogout = false,
  onLogout,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <BreadcrumbItem key={index} className={index === 0 ? "" : "hidden md:block"}>
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                {item.href ? (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2 px-4">
        {showBack && (
          <Button variant="outline" size="sm" onClick={() => router.push(backUrl)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sessions
          </Button>
        )}
        {showLogout && onLogout && (
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
