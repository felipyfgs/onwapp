"use client"

import * as React from "react"
import { Link2, Loader2, LogOut, Search, Users2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import type { Group } from "@/lib/types/group"
import { getGroups, getGroupInfo, getInviteLink, leaveGroup } from "@/lib/api/groups"

interface GroupsListProps {
  sessionId: string
}

export function GroupsList({ sessionId }: GroupsListProps) {
  const [loading, setLoading] = React.useState(true)
  const [groups, setGroups] = React.useState<Group[]>([])
  const [search, setSearch] = React.useState("")

  // Group details dialog
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [loadingDetails, setLoadingDetails] = React.useState(false)

  // Leave group dialog
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false)
  const [groupToLeave, setGroupToLeave] = React.useState<Group | null>(null)
  const [leaving, setLeaving] = React.useState(false)

  // Invite link
  const [inviteLink, setInviteLink] = React.useState("")
  const [loadingLink, setLoadingLink] = React.useState(false)

  const loadGroups = React.useCallback(async () => {
    try {
      const response = await getGroups(sessionId)
      setGroups(response.data || [])
    } catch (error) {
      console.error("Failed to load groups:", error)
      const message = error instanceof Error ? error.message : "Erro ao carregar grupos"
      if (message.includes("rate") || message.includes("429")) {
        toast.error("Limite de requisições excedido. Tente novamente em alguns minutos.")
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const handleViewDetails = async (group: Group) => {
    setSelectedGroup(group)
    setDetailsOpen(true)
    setInviteLink("")
    setLoadingDetails(true)

    try {
      const info = await getGroupInfo(sessionId, group.jid)
      setSelectedGroup(info.data)
    } catch (error) {
      console.error("Failed to load group details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleGetInviteLink = async () => {
    if (!selectedGroup) return
    setLoadingLink(true)

    try {
      const response = await getInviteLink(sessionId, selectedGroup.jid)
      setInviteLink(response.link)
      await navigator.clipboard.writeText(response.link)
      toast.success("Link copiado!")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao obter link")
    } finally {
      setLoadingLink(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!groupToLeave) return
    setLeaving(true)

    try {
      await leaveGroup(sessionId, { groupId: groupToLeave.jid })
      toast.success("Você saiu do grupo")
      setLeaveDialogOpen(false)
      setDetailsOpen(false)
      loadGroups()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao sair do grupo")
    } finally {
      setLeaving(false)
    }
  }

  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Grupos</CardTitle>
          </div>
          <CardDescription>{groups.length} grupos encontrados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum grupo encontrado
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
                <Card
                  key={group.jid}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewDetails(group)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg">
                          {group.name?.charAt(0)?.toUpperCase() || "G"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{group.name}</h4>
                        {group.topic && (
                          <p className="text-sm text-muted-foreground truncate">
                            {group.topic}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <Users2 className="mr-1 h-3 w-3" />
                            {group.participantCount || "?"}
                          </Badge>
                          {group.isAnnounce && (
                            <Badge variant="outline" className="text-xs">
                              Anúncio
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              {selectedGroup?.topic || "Sem descrição"}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Participantes:</span>
                  <span className="ml-2 font-medium">
                    {selectedGroup?.participantCount || selectedGroup?.participants?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="ml-2 font-medium">
                    {selectedGroup?.createdAt
                      ? new Date(selectedGroup.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              {selectedGroup?.participants && selectedGroup.participants.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">
                    Administradores:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.participants
                      .filter((p) => p.isAdmin || p.isSuperAdmin)
                      .map((p) => (
                        <Badge key={p.jid} variant="outline">
                          {p.jid.split("@")[0]}
                          {p.isSuperAdmin && " (Criador)"}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {inviteLink && (
                <div className="p-3 rounded bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">Link de convite:</p>
                  <p className="text-sm font-mono break-all">{inviteLink}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleGetInviteLink} disabled={loadingLink}>
              {loadingLink ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Copiar Link
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setGroupToLeave(selectedGroup)
                setLeaveDialogOpen(true)
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair do Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Group Confirmation */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a sair do grupo "{groupToLeave?.name}". Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              disabled={leaving}
              className="bg-destructive text-destructive-foreground"
            >
              {leaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
