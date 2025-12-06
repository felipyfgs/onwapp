"use client"

import { ReactNode } from "react"
import { LogOut } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/context"

interface AppHeaderProps {
  children: ReactNode
}

export function AppHeader({ children }: AppHeaderProps) {
  const { logout } = useAuth()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border bg-card">
      <div className="flex items-center gap-2 px-4 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        {children}
      </div>
      <div className="flex items-center gap-2 px-4">
        <ModeToggle />
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  )
}

