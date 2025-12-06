"use client"

import * as React from "react"
import { 
  Camera, 
  Check, 
  Copy,
  Crown, 
  ImageIcon,
  Link2, 
  Loader2, 
  LogOut, 
  MessageSquare,
  MoreVertical, 
  Pencil,
  Plus, 
  RefreshCw,
  Search, 
  Shield, 
  ShieldCheck,
  Trash2, 
  UserCheck,
  UserMinus, 
  UserPlus, 
  Users2, 
  X 
} from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

import type { Group, GroupParticipant } from "@/lib/types/group"
import {
  getGroups,
  getGroupInfo,
  getGroupAvatar,
  getInviteLink,
  leaveGroup,
  createGroup,
  updateGroupName,
  updateGroupTopic,
  setGroupPicture,
  deleteGroupPicture,
  setGroupAnnounce,
  setGroupLocked,
  setGroupApprovalMode,
  setGroupMemberAddMode,
  addParticipants,
  removeParticipants,
  promoteParticipants,
  demoteParticipants,
  joinGroup,
  getGroupInfoFromLink,
  getGroupRequests,
  updateGroupRequests,
} from "@/lib/api/groups"

interface GroupsListProps {
  sessionId: string
}

export function GroupsList({ sessionId }: GroupsListProps) {
  const [loading, setLoading] = React.useState(true)
  const [groups, setGroups] = React.useState<Group[]>([])
  const [search, setSearch] = React.useState("")

  // Group details
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [loadingDetails, setLoadingDetails] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("info")

  // Actions
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false)
  const [leaving, setLeaving] = React.useState(false)
  const [inviteLink, setInviteLink] = React.useState("")
  const [loadingLink, setLoadingLink] = React.useState(false)

  // Create group
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [newGroupName, setNewGroupName] = React.useState("")
  const [newGroupParticipants, setNewGroupParticipants] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  // Join group
  const [joinDialogOpen, setJoinDialogOpen] = React.useState(false)
  const [joinLink, setJoinLink] = React.useState("")
  const [joining, setJoining] = React.useState(false)
  const [previewGroup, setPreviewGroup] = React.useState<Group | null>(null)
  const [loadingPreview, setLoadingPreview] = React.useState(false)

  // Edit group
  const [editName, setEditName] = React.useState("")
  const [editTopic, setEditTopic] = React.useState("")
  const [savingName, setSavingName] = React.useState(false)
  const [savingTopic, setSavingTopic] = React.useState(false)

  // Photo
  const [photoDialogOpen, setPhotoDialogOpen] = React.useState(false)
  const [newPhoto, setNewPhoto] = React.useState("")
  const [savingPhoto, setSavingPhoto] = React.useState(false)
  const photoInputRef = React.useRef<HTMLInputElement>(null)

  // Avatars
  const [groupAvatars, setGroupAvatars] = React.useState<Record<string, string>>({})
  const [selectedGroupAvatar, setSelectedGroupAvatar] = React.useState<string>("")

  // Settings
  const [savingSettings, setSavingSettings] = React.useState<string | null>(null)

  // Participants
  const [addParticipantOpen, setAddParticipantOpen] = React.useState(false)
  const [newParticipants, setNewParticipants] = React.useState("")
  const [addingParticipants, setAddingParticipants] = React.useState(false)
  const [participantAction, setParticipantAction] = React.useState<{jid: string, action: string} | null>(null)

  // Join requests
  const [joinRequests, setJoinRequests] = React.useState<Array<{ jid: string; requestedAt?: string }>>([])
  const [loadingRequests, setLoadingRequests] = React.useState(false)

  // Helpers
  const getGroupJid = (g: Group | null) => g?.jid || g?.JID || ""
  const getGroupName = (g: Group | null) => g?.name || g?.Name || getGroupJid(g).split("@")[0] || "Grupo"
  const getGroupTopic = (g: Group | null) => g?.topic || g?.Topic || ""
  const getGroupAnnounce = (g: Group | null) => g?.isAnnounce ?? g?.IsAnnounce ?? false
  const getGroupLocked = (g: Group | null) => g?.isLocked ?? g?.IsLocked ?? false
  const getGroupApproval = (g: Group | null) => g?.isJoinApprovalRequired ?? g?.IsJoinApprovalRequired ?? false
  const getGroupMemberAddMode = (g: Group | null) => g?.memberAddMode || g?.MemberAddMode || "all_member_add"
  const getParticipants = (g: Group | null) => g?.participants || g?.Participants || []
  const getParticipantJid = (p: GroupParticipant | null) => p?.jid || p?.JID || ""
  const isParticipantAdmin = (p: GroupParticipant | null) => p?.isAdmin ?? p?.IsAdmin ?? false
  const isParticipantSuperAdmin = (p: GroupParticipant | null) => p?.isSuperAdmin ?? p?.IsSuperAdmin ?? false

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }
      toast.success("Copiado!")
    } catch {
      toast.error("Erro ao copiar")
    }
  }

  const loadGroups = React.useCallback(async () => {
    try {
      const response = await getGroups(sessionId)
      setGroups(response.data || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar grupos")
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const refreshGroupInfo = async (refreshAvatar = false) => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return
    try {
      const [info, avatar] = await Promise.all([
        getGroupInfo(sessionId, jid),
        refreshAvatar ? getGroupAvatar(sessionId, jid).catch(() => ({ url: "" })) : Promise.resolve(null)
      ])
      setSelectedGroup(info.data)
      setEditName(getGroupName(info.data))
      setEditTopic(getGroupTopic(info.data))
      if (avatar?.url) {
        setSelectedGroupAvatar(avatar.url)
        setGroupAvatars(prev => ({ ...prev, [jid]: avatar.url }))
      }
    } catch (error) {
      console.error("Failed to refresh:", error)
    }
  }

  const handleViewDetails = async (group: Group) => {
    const jid = getGroupJid(group)
    if (!jid) {
      toast.error("Grupo sem identificador válido")
      return
    }

    setSelectedGroup(group)
    setEditName(getGroupName(group))
    setEditTopic(getGroupTopic(group))
    setDetailsOpen(true)
    setInviteLink("")
    setActiveTab("info")
    setLoadingDetails(true)
    setSelectedGroupAvatar(groupAvatars[jid] || "")

    try {
      const [info, avatar] = await Promise.all([
        getGroupInfo(sessionId, jid),
        getGroupAvatar(sessionId, jid).catch(() => ({ url: "" }))
      ])
      setSelectedGroup(info.data)
      setEditName(getGroupName(info.data))
      setEditTopic(getGroupTopic(info.data))
      if (avatar.url) {
        setSelectedGroupAvatar(avatar.url)
        setGroupAvatars(prev => ({ ...prev, [jid]: avatar.url }))
      }
    } catch (error) {
      console.error("Failed to load group details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleGetInviteLink = async () => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return
    setLoadingLink(true)

    try {
      const response = await getInviteLink(sessionId, jid)
      setInviteLink(response.link)
      await copyToClipboard(response.link)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao obter link")
    } finally {
      setLoadingLink(false)
    }
  }

  const handleLeaveGroup = async () => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return
    setLeaving(true)

    try {
      await leaveGroup(sessionId, { groupId: jid })
      toast.success("Você saiu do grupo")
      setLeaveDialogOpen(false)
      setDetailsOpen(false)
      loadGroups()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao sair do grupo")
    } finally {
      setLeaving(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Digite o nome do grupo")
      return
    }

    const participants = newGroupParticipants
      .split(/[,\n\s]+/)
      .map(p => p.trim().replace(/\D/g, ""))
      .filter(p => p.length >= 10)

    if (participants.length === 0) {
      toast.error("Adicione pelo menos um participante válido")
      return
    }

    setCreating(true)
    try {
      await createGroup(sessionId, { name: newGroupName.trim(), participants })
      toast.success("Grupo criado!")
      setCreateDialogOpen(false)
      setNewGroupName("")
      setNewGroupParticipants("")
      loadGroups()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar grupo")
    } finally {
      setCreating(false)
    }
  }

  const handlePreviewGroup = async () => {
    if (!joinLink.trim()) return
    setLoadingPreview(true)
    setPreviewGroup(null)

    try {
      const response = await getGroupInfoFromLink(sessionId, joinLink.trim())
      setPreviewGroup(response.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Link inválido")
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!joinLink.trim()) return
    setJoining(true)

    try {
      await joinGroup(sessionId, joinLink.trim())
      toast.success("Entrou no grupo!")
      setJoinDialogOpen(false)
      setJoinLink("")
      setPreviewGroup(null)
      loadGroups()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao entrar")
    } finally {
      setJoining(false)
    }
  }

  const handleSaveName = async () => {
    const jid = getGroupJid(selectedGroup)
    if (!jid || !editName.trim()) return
    setSavingName(true)

    try {
      await updateGroupName(sessionId, jid, editName.trim())
      toast.success("Nome atualizado!")
      await refreshGroupInfo()
      loadGroups()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro")
    } finally {
      setSavingName(false)
    }
  }

  const handleSaveTopic = async () => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return
    setSavingTopic(true)

    try {
      await updateGroupTopic(sessionId, jid, editTopic.trim())
      toast.success("Descrição atualizada!")
      await refreshGroupInfo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro")
    } finally {
      setSavingTopic(false)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 10MB)")
      return
    }

    // Convert to JPEG and resize for WhatsApp compatibility
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const maxSize = 640
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.drawImage(img, 0, 0, width, height)
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.85)
      const base64 = jpegDataUrl.split(",")[1]
      setNewPhoto(base64)
    }
    img.onerror = () => toast.error("Erro ao processar imagem")
    img.src = URL.createObjectURL(file)
  }

  const handleSavePhoto = async () => {
    const jid = getGroupJid(selectedGroup)
    if (!jid || !newPhoto) return
    setSavingPhoto(true)

    try {
      await setGroupPicture(sessionId, jid, newPhoto)
      toast.success("Foto atualizada!")
      setPhotoDialogOpen(false)
      setNewPhoto("")
      // Wait a bit for WhatsApp to propagate the new photo
      await new Promise(r => setTimeout(r, 1000))
      await refreshGroupInfo(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro")
    } finally {
      setSavingPhoto(false)
    }
  }

  const handleDeletePhoto = async () => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return
    setSavingPhoto(true)

    try {
      await deleteGroupPicture(sessionId, jid)
      toast.success("Foto removida!")
      setPhotoDialogOpen(false)
      await refreshGroupInfo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro")
    } finally {
      setSavingPhoto(false)
    }
  }

  const handleToggleSetting = async (setting: 'announce' | 'locked' | 'approval', value: boolean) => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return
    setSavingSettings(setting)

    try {
      if (setting === 'announce') await setGroupAnnounce(sessionId, jid, value)
      else if (setting === 'locked') await setGroupLocked(sessionId, jid, value)
      else if (setting === 'approval') await setGroupApprovalMode(sessionId, jid, value)
      
      toast.success("Configuração atualizada!")
      await refreshGroupInfo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro")
    } finally {
      setSavingSettings(null)
    }
  }

  const handleMemberAddModeChange = async (mode: string) => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return
    setSavingSettings('memberAdd')

    try {
      await setGroupMemberAddMode(sessionId, jid, mode)
      toast.success("Configuração atualizada!")
      await refreshGroupInfo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro")
    } finally {
      setSavingSettings(null)
    }
  }

  const handleAddParticipants = async () => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return

    const participants = newParticipants
      .split(/[,\n\s]+/)
      .map(p => p.trim().replace(/\D/g, ""))
      .filter(p => p.length >= 10)

    if (participants.length === 0) {
      toast.error("Adicione números válidos")
      return
    }

    setAddingParticipants(true)
    try {
      await addParticipants(sessionId, { groupId: jid, participants })
      toast.success("Participantes adicionados!")
      setAddParticipantOpen(false)
      setNewParticipants("")
      await refreshGroupInfo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro")
    } finally {
      setAddingParticipants(false)
    }
  }

  const handleParticipantAction = async () => {
    if (!participantAction) return
    const jid = getGroupJid(selectedGroup)
    if (!jid) return

    const { jid: pJid, action } = participantAction

    try {
      if (action === 'remove') {
        await removeParticipants(sessionId, { groupId: jid, participants: [pJid] })
        toast.success("Participante removido!")
      } else if (action === 'promote') {
        await promoteParticipants(sessionId, { groupId: jid, participants: [pJid] })
        toast.success("Promovido a admin!")
      } else if (action === 'demote') {
        await demoteParticipants(sessionId, { groupId: jid, participants: [pJid] })
        toast.success("Admin rebaixado!")
      }
      await refreshGroupInfo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro")
    } finally {
      setParticipantAction(null)
    }
  }

  const handleLoadRequests = async () => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return
    setLoadingRequests(true)

    try {
      const response = await getGroupRequests(sessionId, jid)
      setJoinRequests(response.participants || [])
    } catch {
      setJoinRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleRequestAction = async (participantJid: string, action: 'approve' | 'reject') => {
    const jid = getGroupJid(selectedGroup)
    if (!jid) return

    try {
      await updateGroupRequests(sessionId, jid, [participantJid], action)
      toast.success(action === 'approve' ? "Aprovado!" : "Rejeitado!")
      handleLoadRequests()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro")
    }
  }

  React.useEffect(() => {
    if (activeTab === 'requests' && selectedGroup) {
      handleLoadRequests()
    }
  }, [activeTab, selectedGroup])

  const filteredGroups = groups.filter((g) => {
    const searchTerm = search.toLowerCase()
    return getGroupName(g).toLowerCase().includes(searchTerm) || 
           getGroupJid(g).toLowerCase().includes(searchTerm)
  })

  const admins = getParticipants(selectedGroup).filter(p => isParticipantAdmin(p) || isParticipantSuperAdmin(p))
  const members = getParticipants(selectedGroup).filter(p => !isParticipantAdmin(p) && !isParticipantSuperAdmin(p))

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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Grupos</CardTitle>
              <Badge variant="secondary">{groups.length}</Badge>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setJoinDialogOpen(true)} variant="outline" size="sm">
                <Link2 className="h-4 w-4" />
                Entrar
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4" />
                Criar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon-sm" onClick={loadGroups}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum grupo encontrado</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group, index) => (
                <Card
                  key={getGroupJid(group) || `group-${index}`}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleViewDetails(group)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        {groupAvatars[getGroupJid(group)] && (
                          <AvatarImage src={groupAvatars[getGroupJid(group)]} alt={getGroupName(group)} />
                        )}
                        <AvatarFallback className="text-lg bg-primary/10">
                          {getGroupName(group).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-medium truncate">{getGroupName(group)}</h4>
                        {getGroupTopic(group) && (
                          <p className="text-sm text-muted-foreground truncate">{getGroupTopic(group)}</p>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            <Users2 className="h-3 w-3" />
                            {group.participantCount || getParticipants(group).length || "?"}
                          </Badge>
                          {getGroupAnnounce(group) && (
                            <Badge variant="outline" className="text-xs">
                              <MessageSquare className="h-3 w-3" />
                              Anúncio
                            </Badge>
                          )}
                          {getGroupLocked(group) && (
                            <Badge variant="outline" className="text-xs">
                              <ShieldCheck className="h-3 w-3" />
                              Bloqueado
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 cursor-pointer hover:opacity-80" onClick={() => setPhotoDialogOpen(true)}>
                {selectedGroupAvatar && (
                  <AvatarImage src={selectedGroupAvatar} alt={getGroupName(selectedGroup)} />
                )}
                <AvatarFallback className="text-xl bg-primary/10">
                  {getGroupName(selectedGroup).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="truncate">{getGroupName(selectedGroup)}</DialogTitle>
                <DialogDescription className="truncate">
                  {getGroupTopic(selectedGroup) || "Clique no avatar para alterar a foto"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-4 shrink-0">
                <TabsTrigger value="info" className="text-xs sm:text-sm">
                  <Pencil className="mr-1.5 h-3.5 w-3.5 hidden sm:inline" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="participants" className="text-xs sm:text-sm">
                  <Users2 className="mr-1.5 h-3.5 w-3.5 hidden sm:inline" />
                  Membros
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs sm:text-sm">
                  <Shield className="mr-1.5 h-3.5 w-3.5 hidden sm:inline" />
                  Config
                </TabsTrigger>
                <TabsTrigger value="requests" className="text-xs sm:text-sm">
                  <UserCheck className="mr-1.5 h-3.5 w-3.5 hidden sm:inline" />
                  Pedidos
                  {joinRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-1.5 h-5 w-5 p-0 text-xs">
                      {joinRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="info" className="space-y-6 mt-0">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wide">Nome do Grupo</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        placeholder="Nome do grupo"
                      />
                      <Button 
                        onClick={handleSaveName} 
                        disabled={savingName || editName === getGroupName(selectedGroup)} 
                        size="sm"
                      >
                        {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wide">Descrição</Label>
                    <div className="flex gap-2">
                      <Textarea 
                        value={editTopic} 
                        onChange={(e) => setEditTopic(e.target.value)} 
                        placeholder="Descrição do grupo"
                        rows={3} 
                        className="resize-none"
                      />
                      <Button 
                        onClick={handleSaveTopic} 
                        disabled={savingTopic || editTopic === getGroupTopic(selectedGroup)} 
                        size="sm" 
                        className="self-end"
                      >
                        {savingTopic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                          {selectedGroup?.participantCount || getParticipants(selectedGroup).length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Participantes</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{admins.length}</div>
                        <div className="text-xs text-muted-foreground">Administradores</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Invite Link */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wide">Link de Convite</Label>
                    {inviteLink ? (
                      <div className="flex gap-2">
                        <Input value={inviteLink} readOnly className="font-mono text-xs" />
                        <Button variant="outline" size="icon-sm" onClick={() => copyToClipboard(inviteLink)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={handleGetInviteLink} disabled={loadingLink} variant="outline" className="w-full">
                        {loadingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        Gerar Link de Convite
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Actions */}
                  <Button variant="destructive" onClick={() => setLeaveDialogOpen(true)} className="w-full">
                    <LogOut className="h-4 w-4" />
                    Sair do Grupo
                  </Button>
                </TabsContent>

                <TabsContent value="participants" className="space-y-4 mt-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {getParticipants(selectedGroup).length} participantes
                    </span>
                    <Button size="sm" onClick={() => setAddParticipantOpen(true)}>
                      <UserPlus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>

                  {/* Admins */}
                  {admins.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground tracking-wide">
                        Administradores ({admins.length})
                      </Label>
                      <div className="space-y-1">
                        {admins.map((p) => {
                          const pJid = getParticipantJid(p)
                          const isSuperAdmin = isParticipantSuperAdmin(p)
                          return (
                            <div key={pJid} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">{pJid.split("@")[0].slice(-2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{pJid.split("@")[0]}</p>
                                  {isSuperAdmin && (
                                    <Badge variant="default" className="text-[10px] h-4">
                                      <Crown className="mr-1 h-2.5 w-2.5" />Criador
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {!isSuperAdmin && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setParticipantAction({jid: pJid, action: 'demote'})}>
                                      <UserMinus />
                                      Rebaixar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => setParticipantAction({jid: pJid, action: 'remove'})} 
                                      className="text-destructive"
                                    >
                                      <Trash2 />
                                      Remover
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Members */}
                  {members.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground tracking-wide">
                        Membros ({members.length})
                      </Label>
                      <div className="space-y-1 max-h-[250px] overflow-y-auto">
                        {members.map((p) => {
                          const pJid = getParticipantJid(p)
                          return (
                            <div key={pJid} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">{pJid.split("@")[0].slice(-2)}</AvatarFallback>
                                </Avatar>
                                <p className="text-sm">{pJid.split("@")[0]}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setParticipantAction({jid: pJid, action: 'promote'})}>
                                    <Shield />
                                    Promover a Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => setParticipantAction({jid: pJid, action: 'remove'})} 
                                    className="text-destructive"
                                  >
                                    <Trash2 />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-0">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Modo Anúncio</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Apenas admins podem enviar mensagens</p>
                        </div>
                        <Switch
                          checked={getGroupAnnounce(selectedGroup)}
                          onCheckedChange={(v) => handleToggleSetting('announce', v)}
                          disabled={savingSettings === 'announce'}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Restringir Edições</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Apenas admins podem editar info do grupo</p>
                        </div>
                        <Switch
                          checked={getGroupLocked(selectedGroup)}
                          onCheckedChange={(v) => handleToggleSetting('locked', v)}
                          disabled={savingSettings === 'locked'}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Aprovar Membros</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Admins precisam aprovar novos membros</p>
                        </div>
                        <Switch
                          checked={getGroupApproval(selectedGroup)}
                          onCheckedChange={(v) => handleToggleSetting('approval', v)}
                          disabled={savingSettings === 'approval'}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Quem pode adicionar membros</span>
                        </div>
                        <Select
                          value={getGroupMemberAddMode(selectedGroup)}
                          onValueChange={handleMemberAddModeChange}
                          disabled={savingSettings === 'memberAdd'}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_member_add">Todos os membros</SelectItem>
                            <SelectItem value="admin_add">Apenas administradores</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Foto do Grupo</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => setPhotoDialogOpen(true)}>
                            <ImageIcon className="h-4 w-4" />
                            Alterar Foto
                          </Button>
                          <Button variant="outline" onClick={handleDeletePhoto} disabled={savingPhoto}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="requests" className="mt-0">
                  {loadingRequests ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : joinRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma solicitação pendente</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {joinRequests.map((req) => (
                        <Card key={req.jid}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{req.jid.split("@")[0]}</p>
                              {req.requestedAt && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(req.requestedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleRequestAction(req.jid, 'reject')}>
                                <X className="h-4 w-4" />
                              </Button>
                              <Button size="sm" onClick={() => handleRequestAction(req.jid, 'approve')}>
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Leave Group Confirmation */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você sairá do grupo &quot;{getGroupName(selectedGroup)}&quot;. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup} disabled={leaving} className="bg-destructive text-destructive-foreground">
              {leaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Participant Action Confirmation */}
      <AlertDialog open={!!participantAction} onOpenChange={() => setParticipantAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {participantAction?.action === 'remove' && 'Remover participante?'}
              {participantAction?.action === 'promote' && 'Promover a admin?'}
              {participantAction?.action === 'demote' && 'Rebaixar admin?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {participantAction?.action === 'remove' && `O participante ${participantAction?.jid.split("@")[0]} será removido do grupo.`}
              {participantAction?.action === 'promote' && `O participante ${participantAction?.jid.split("@")[0]} será promovido a administrador.`}
              {participantAction?.action === 'demote' && `O admin ${participantAction?.jid.split("@")[0]} será rebaixado a membro comum.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleParticipantAction}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo</DialogTitle>
            <DialogDescription>Crie um novo grupo do WhatsApp.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Grupo</Label>
              <Input 
                placeholder="Ex: Família, Trabalho..." 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Participantes</Label>
              <Textarea
                placeholder="Digite os números (um por linha)&#10;Ex:&#10;5511999999999&#10;5511888888888"
                value={newGroupParticipants}
                onChange={(e) => setNewGroupParticipants(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Formato: código do país + número (ex: 5511999999999)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateGroup} disabled={creating || !newGroupName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={(open) => { setJoinDialogOpen(open); if (!open) { setJoinLink(""); setPreviewGroup(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar em Grupo</DialogTitle>
            <DialogDescription>Cole o link de convite do grupo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link de Convite</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://chat.whatsapp.com/..."
                  value={joinLink}
                  onChange={(e) => setJoinLink(e.target.value)}
                />
                <Button variant="outline" onClick={handlePreviewGroup} disabled={loadingPreview || !joinLink.trim()}>
                  {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {previewGroup && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getGroupName(previewGroup).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getGroupName(previewGroup)}</p>
                      {getGroupTopic(previewGroup) && (
                        <p className="text-sm text-muted-foreground">{getGroupTopic(previewGroup)}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setJoinDialogOpen(false); setJoinLink(""); setPreviewGroup(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleJoinGroup} disabled={joining || !joinLink.trim()}>
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Entrar no Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Participantes</DialogTitle>
            <DialogDescription>Digite os números dos participantes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Digite os números (um por linha)&#10;Ex:&#10;5511999999999&#10;5511888888888"
              value={newParticipants}
              onChange={(e) => setNewParticipants(e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Formato: código do país + número</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddParticipantOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddParticipants} disabled={addingParticipants || !newParticipants.trim()}>
              {addingParticipants ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={(open) => { setPhotoDialogOpen(open); if (!open) setNewPhoto(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Foto do Grupo</DialogTitle>
            <DialogDescription>Selecione uma imagem para o grupo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div 
                className="w-32 h-32 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                onClick={() => photoInputRef.current?.click()}
              >
                {newPhoto ? (
                  <img src={`data:image/jpeg;base64,${newPhoto}`} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">Clique para selecionar uma imagem (será convertida para JPEG 640x640)</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPhotoDialogOpen(false); setNewPhoto(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleSavePhoto} disabled={savingPhoto || !newPhoto}>
              {savingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
