"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background antialiased", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <Sidebar>
              <SidebarTrigger />
              <div className="flex h-full flex-col justify-between">
                <div className="flex-1 overflow-auto py-2">
                  <div className="py-2">
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <span className="text-primary">OnWapp</span>
                        <span className="text-muted-foreground">Admin</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Gerenciamento de Sessões WhatsApp
                      </p>
                    </div>
                    <div className="space-y-1 px-3">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          pathname === "/sessions" && "bg-accent"
                        )}
                        onClick={() => (window.location.href = "/sessions")}
                      >
                        Sessões
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          pathname.startsWith("/groups") && "bg-accent"
                        )}
                        onClick={() => (window.location.href = "/groups")}
                      >
                        Grupos
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          pathname.startsWith("/messages") && "bg-accent"
                        )}
                        onClick={() => (window.location.href = "/messages")}
                      >
                        Mensagens
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          pathname.startsWith("/webhooks") && "bg-accent"
                        )}
                        onClick={() => (window.location.href = "/webhooks")}
                      >
                        Webhooks
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          pathname.startsWith("/chatwoot") && "bg-accent"
                        )}
                        onClick={() => (window.location.href = "/chatwoot")}
                      >
                        Chatwoot
                      </Button>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          pathname.startsWith("/settings") && "bg-accent"
                        )}
                        onClick={() => (window.location.href = "/settings")}
                      >
                        Configurações
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="border-t p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                    }}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Claro
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Escuro
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Sidebar>
            <main className="flex-1 overflow-hidden">
              <div className="container relative h-full flex-col items-start justify-start p-4 md:gap-8 lg:flex">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}