"use client";

import * as React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    if (segments.length === 0) {
      return [{ label: 'Início', href: '/' }];
    }

    // Mapeamento de rotas para labels
    const routeMap: Record<string, string> = {
      'sessions': 'Sessões',
      'webhooks': 'Webhooks',
      'chatwoot': 'Chatwoot',
      'settings': 'Configurações',
      'groups': 'Grupos',
      'messages': 'Mensagens',
      'activity': 'Atividade',
      'logs': 'Logs'
    };

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const label = routeMap[segment] || segment;
      breadcrumbs.push({ label, href: currentPath });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background antialiased", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                  <Breadcrumb>
                    <BreadcrumbList>
                      {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.href}>
                          {index === breadcrumbs.length - 1 ? (
                            <BreadcrumbItem>
                              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                            </BreadcrumbItem>
                          ) : (
                            <>
                              <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                              </BreadcrumbItem>
                              <BreadcrumbSeparator className="hidden md:block" />
                            </>
                          )}
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTheme(theme === "dark" ? "light" : "dark");
                      }}
                    >
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
