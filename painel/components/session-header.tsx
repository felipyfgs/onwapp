'use client'

import Link from 'next/link'
import { IconArrowLeft } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface SessionHeaderProps {
  sessionName: string
  title?: string
}

export function SessionHeader({ sessionName, title }: SessionHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-7 w-7">
            <Link href="/">
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-base font-medium">
            {title || sessionName}
          </h1>
        </div>
      </div>
    </header>
  )
}
