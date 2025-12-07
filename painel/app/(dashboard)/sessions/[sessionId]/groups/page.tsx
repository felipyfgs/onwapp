"use client"

import { useState, useEffect, use } from "react"
import { Loader2, Users, Search, Link as LinkIcon, UserPlus, LogOut } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getGroups, getInviteLink, leaveGroup, type Group } from "@/lib/api/groups"

export default function GroupsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const data = await getGroups(sessionId)
        setGroups(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  const filteredGroups = groups.filter(group => {
    if (!search) return true
    return (
      group.name.toLowerCase().includes(search.toLowerCase()) ||
      group.topic?.toLowerCase().includes(search.toLowerCase())
    )
  })

  const handleCopyLink = async (groupJid: string) => {
    try {
      const { link } = await getInviteLink(sessionId, groupJid)
      await navigator.clipboard.writeText(link)
      alert('Link copiado!')
    } catch (err) {
      alert('Erro ao obter link')
    }
  }

  const handleLeaveGroup = async (groupJid: string) => {
    if (!confirm('Deseja sair deste grupo?')) return
    try {
      await leaveGroup(sessionId, groupJid)
      setGroups(prev => prev.filter(g => g.jid !== groupJid))
    } catch (err) {
      alert('Erro ao sair do grupo')
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessoes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Grupos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="size-6" />
              Grupos
            </h1>
            <p className="text-muted-foreground">
              {groups.length} grupos
            </p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="size-12 mb-4" />
            <p>{search ? 'Nenhum grupo encontrado' : 'Nenhum grupo'}</p>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {filteredGroups.map((group) => (
              <div
                key={group.jid}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{group.name}</span>
                    {group.isAdmin && (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {group.topic || `${group.participantsCount || 0} participantes`}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Acoes
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCopyLink(group.jid)}>
                      <LinkIcon className="size-4 mr-2" />
                      Copiar link
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleLeaveGroup(group.jid)}
                      className="text-destructive"
                    >
                      <LogOut className="size-4 mr-2" />
                      Sair do grupo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
