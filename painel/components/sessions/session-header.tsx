import { MessageSquare, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeDropdown } from '@/components/theme'
import { logout } from '@/lib/auth'

export function SessionHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">OnWapp</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeDropdown />
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
