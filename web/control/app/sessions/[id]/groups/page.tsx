import { UsersRound, Search, Plus } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessions</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${id}`}>{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Groups</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Groups</h1>
            <p className="text-sm text-muted-foreground">
              View and manage your groups
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search groups..." className="pl-8" />
          </div>
          <Button variant="outline">Filter</Button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <UsersRound className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No groups yet</h3>
            <p className="text-sm text-muted-foreground">
              Connect your session to see your groups here.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
