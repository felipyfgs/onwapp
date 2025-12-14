"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/common";
import {
    getGroupInfo,
    getGroupPicture,
    getGroupInviteLink,
    getGroupRequests,
    updateGroupName,
    updateGroupTopic,
    setGroupAnnounce,
    setGroupLocked,
    setGroupApprovalMode,
    setGroupMemberAddMode,
    leaveGroup,
    addGroupParticipants,
    removeGroupParticipants,
    promoteParticipants,
    demoteParticipants,
    handleGroupRequest,
    sendGroupMessage,
    GroupInfo,
    GroupParticipant,
    JoinRequest,
} from "@/lib/api";
import {
    ArrowLeft,
    Users,
    Settings,
    Link2,
    MessageSquare,
    MoreVertical,
    Crown,
    Shield,
    UserMinus,
    UserPlus,
    Copy,
    RefreshCw,
    Check,
    X,
    Megaphone,
    Lock,
    Send,
    LogOut,
    Search,
} from "lucide-react";
import { toast } from "sonner";

export default function GroupDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;
    const groupId = decodeURIComponent(params.groupId as string);

    const [loading, setLoading] = useState(true);
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string>("");
    const [inviteLink, setInviteLink] = useState<string>("");
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("participants");

    // Edit states
    const [editingName, setEditingName] = useState(false);
    const [editingTopic, setEditingTopic] = useState(false);
    const [newName, setNewName] = useState("");
    const [newTopic, setNewTopic] = useState("");

    // Dialog states
    const [addParticipantDialog, setAddParticipantDialog] = useState(false);
    const [newParticipantPhone, setNewParticipantPhone] = useState("");
    const [messageDialog, setMessageDialog] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [leaveDialog, setLeaveDialog] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchGroupInfo = useCallback(async () => {
        try {
            const response = await getGroupInfo(sessionId, groupId);
            setGroupInfo(response.data);
            setNewName(response.data.name);
            setNewTopic(response.data.topic || "");
        } catch (error) {
            console.error("Failed to fetch group info:", error);
            toast.error("Falha ao carregar informações do grupo");
        }
    }, [sessionId, groupId]);

    const fetchAvatar = useCallback(async () => {
        try {
            const response = await getGroupPicture(sessionId, groupId);
            setAvatarUrl(response.url || "");
        } catch {
            setAvatarUrl("");
        }
    }, [sessionId, groupId]);

    const fetchInviteLink = useCallback(async () => {
        try {
            const response = await getGroupInviteLink(sessionId, groupId);
            setInviteLink(response.link || "");
        } catch {
            setInviteLink("");
        }
    }, [sessionId, groupId]);

    const fetchJoinRequests = useCallback(async () => {
        try {
            const response = await getGroupRequests(sessionId, groupId);
            setJoinRequests(response.participants || []);
        } catch {
            setJoinRequests([]);
        }
    }, [sessionId, groupId]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchGroupInfo(), fetchAvatar()]);
            setLoading(false);
        };
        loadData();
    }, [fetchGroupInfo, fetchAvatar]);

    useEffect(() => {
        if (activeTab === "invites") {
            fetchInviteLink();
            fetchJoinRequests();
        }
    }, [activeTab, fetchInviteLink, fetchJoinRequests]);

    const handleUpdateName = async () => {
        if (!newName.trim()) return;
        try {
            await updateGroupName(sessionId, groupId, newName);
            toast.success("Nome do grupo atualizado");
            setEditingName(false);
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao atualizar nome");
        }
    };

    const handleUpdateTopic = async () => {
        try {
            await updateGroupTopic(sessionId, groupId, newTopic);
            toast.success("Descrição do grupo atualizada");
            setEditingTopic(false);
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao atualizar descrição");
        }
    };

    const handleToggleAnnounce = async (value: boolean) => {
        try {
            await setGroupAnnounce(sessionId, groupId, value);
            toast.success(value ? "Somente admins podem enviar mensagens" : "Todos podem enviar mensagens");
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao atualizar configuração");
        }
    };

    const handleToggleLocked = async (value: boolean) => {
        try {
            await setGroupLocked(sessionId, groupId, value);
            toast.success(value ? "Somente admins podem editar info" : "Todos podem editar info");
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao atualizar configuração");
        }
    };

    const handleToggleApproval = async (value: boolean) => {
        try {
            await setGroupApprovalMode(sessionId, groupId, value);
            toast.success(value ? "Solicitações precisam aprovação" : "Qualquer um com link pode entrar");
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao atualizar configuração");
        }
    };

    const handleMemberAddMode = async (mode: "admin_add" | "all_member_add") => {
        try {
            await setGroupMemberAddMode(sessionId, groupId, mode);
            toast.success("Modo de adição atualizado");
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao atualizar configuração");
        }
    };

    const handleAddParticipant = async () => {
        if (!newParticipantPhone.trim()) return;
        const phone = newParticipantPhone.replace(/\D/g, "");
        const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
        try {
            await addGroupParticipants(sessionId, groupId, [jid]);
            toast.success("Participante adicionado");
            setAddParticipantDialog(false);
            setNewParticipantPhone("");
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao adicionar participante");
        }
    };

    const handleRemoveParticipant = async (participantJid: string) => {
        try {
            await removeGroupParticipants(sessionId, groupId, [participantJid]);
            toast.success("Participante removido");
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao remover participante");
        }
    };

    const handlePromote = async (participantJid: string) => {
        try {
            await promoteParticipants(sessionId, groupId, [participantJid]);
            toast.success("Participante promovido a admin");
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao promover participante");
        }
    };

    const handleDemote = async (participantJid: string) => {
        try {
            await demoteParticipants(sessionId, groupId, [participantJid]);
            toast.success("Admin rebaixado");
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao rebaixar participante");
        }
    };

    const handleJoinRequest = async (participantJid: string, action: "approve" | "reject") => {
        try {
            await handleGroupRequest(sessionId, groupId, [participantJid], action);
            toast.success(action === "approve" ? "Solicitação aprovada" : "Solicitação rejeitada");
            fetchJoinRequests();
            fetchGroupInfo();
        } catch (error) {
            toast.error("Falha ao processar solicitação");
        }
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success("Link copiado");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResetLink = async () => {
        try {
            const response = await getGroupInviteLink(sessionId, groupId, true);
            setInviteLink(response.link || "");
            toast.success("Link de convite resetado");
        } catch (error) {
            toast.error("Falha ao resetar link");
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        try {
            await sendGroupMessage(sessionId, groupId, messageText);
            toast.success("Mensagem enviada");
            setMessageDialog(false);
            setMessageText("");
        } catch (error) {
            toast.error("Falha ao enviar mensagem");
        }
    };

    const handleLeaveGroup = async () => {
        try {
            await leaveGroup(sessionId, groupId);
            toast.success("Saiu do grupo");
            router.push(`/sessions/${sessionId}/groups`);
        } catch (error) {
            toast.error("Falha ao sair do grupo");
        }
    };

    const filteredParticipants = groupInfo?.participants?.filter((p) =>
        p.jid.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const formatJid = (jid: string) => {
        return jid.replace("@s.whatsapp.net", "").replace("@g.us", "");
    };

    if (loading) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <PageHeader
                        breadcrumbs={[
                            { label: "Sessions", href: "/sessions" },
                            { label: sessionId, href: `/sessions/${sessionId}` },
                            { label: "Groups", href: `/sessions/${sessionId}/groups` },
                            { label: "Carregando..." },
                        ]}
                    />
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        <div className="flex items-center gap-4 mb-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    if (!groupInfo) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <PageHeader
                        breadcrumbs={[
                            { label: "Sessions", href: "/sessions" },
                            { label: sessionId, href: `/sessions/${sessionId}` },
                            { label: "Groups", href: `/sessions/${sessionId}/groups` },
                            { label: "Não Encontrado" },
                        ]}
                    />
                    <div className="flex flex-1 flex-col items-center justify-center p-4">
                        <p>Grupo não encontrado</p>
                        <Button className="mt-4" onClick={() => router.push(`/sessions/${sessionId}/groups`)}>
                            Voltar para Grupos
                        </Button>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    const initials = groupInfo.name.substring(0, 2).toUpperCase();

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <PageHeader
                    breadcrumbs={[
                        { label: "Sessions", href: "/sessions" },
                        { label: sessionId, href: `/sessions/${sessionId}` },
                        { label: "Groups", href: `/sessions/${sessionId}/groups` },
                        { label: groupInfo.name },
                    ]}
                />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/sessions/${sessionId}/groups`)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Avatar className="h-20 w-20">
                            {avatarUrl && <AvatarImage src={avatarUrl} alt={groupInfo.name} />}
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                {editingName ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="h-8 w-64"
                                            autoFocus
                                        />
                                        <Button size="sm" onClick={handleUpdateName}>Salvar</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancelar</Button>
                                    </div>
                                ) : (
                                    <h1
                                        className="text-2xl font-bold truncate cursor-pointer hover:text-primary"
                                        onClick={() => setEditingName(true)}
                                    >
                                        {groupInfo.name}
                                    </h1>
                                )}
                                {groupInfo.isAnnounce && (
                                    <Badge variant="secondary">
                                        <Megaphone className="h-3 w-3 mr-1" />
                                        Anúncios
                                    </Badge>
                                )}
                                {groupInfo.isLocked && (
                                    <Badge variant="outline">
                                        <Lock className="h-3 w-3 mr-1" />
                                        Bloqueado
                                    </Badge>
                                )}
                            </div>
                            {editingTopic ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <Textarea
                                        value={newTopic}
                                        onChange={(e) => setNewTopic(e.target.value)}
                                        className="h-16 w-96"
                                        placeholder="Descrição do grupo"
                                    />
                                    <Button size="sm" onClick={handleUpdateTopic}>Salvar</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingTopic(false)}>Cancelar</Button>
                                </div>
                            ) : (
                                <p
                                    className="text-muted-foreground mt-1 cursor-pointer hover:text-foreground"
                                    onClick={() => setEditingTopic(true)}
                                >
                                    {groupInfo.topic || "Clique para adicionar descrição"}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                                {groupInfo.participants?.length || 0} participantes
                                {groupInfo.created && ` • Criado em ${new Date(groupInfo.created * 1000).toLocaleDateString()}`}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setMessageDialog(true)}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Mensagem
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                        <TabsList>
                            <TabsTrigger value="participants">
                                <Users className="h-4 w-4 mr-2" />
                                Participantes
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                <Settings className="h-4 w-4 mr-2" />
                                Configurações
                            </TabsTrigger>
                            <TabsTrigger value="invites">
                                <Link2 className="h-4 w-4 mr-2" />
                                Convites
                            </TabsTrigger>
                        </TabsList>

                        {/* Participants Tab */}
                        <TabsContent value="participants" className="mt-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Participantes ({groupInfo.participants?.length || 0})</CardTitle>
                                        <Button size="sm" onClick={() => setAddParticipantDialog(true)}>
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Adicionar
                                        </Button>
                                    </div>
                                    <div className="relative mt-2">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar participantes..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y max-h-[500px] overflow-auto">
                                        {filteredParticipants.map((participant) => (
                                            <div key={participant.jid} className="flex items-center gap-3 p-3 hover:bg-accent">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>{formatJid(participant.jid).substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{formatJid(participant.jid)}</p>
                                                    <div className="flex gap-1">
                                                        {participant.isSuperAdmin && (
                                                            <Badge variant="default" className="text-xs">
                                                                <Crown className="h-3 w-3 mr-1" />
                                                                Dono
                                                            </Badge>
                                                        )}
                                                        {participant.isAdmin && !participant.isSuperAdmin && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                Admin
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {participant.isAdmin && !participant.isSuperAdmin ? (
                                                            <DropdownMenuItem onClick={() => handleDemote(participant.jid)}>
                                                                <Shield className="h-4 w-4 mr-2" />
                                                                Rebaixar de Admin
                                                            </DropdownMenuItem>
                                                        ) : !participant.isSuperAdmin ? (
                                                            <DropdownMenuItem onClick={() => handlePromote(participant.jid)}>
                                                                <Shield className="h-4 w-4 mr-2" />
                                                                Promover a Admin
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                        {!participant.isSuperAdmin && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => handleRemoveParticipant(participant.jid)}
                                                                >
                                                                    <UserMinus className="h-4 w-4 mr-2" />
                                                                    Remover
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Settings Tab */}
                        <TabsContent value="settings" className="mt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Configurações do Grupo</CardTitle>
                                        <CardDescription>Configure como o grupo funciona</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="announce">Somente Anúncios</Label>
                                                <p className="text-sm text-muted-foreground">Somente admins podem enviar</p>
                                            </div>
                                            <Switch
                                                id="announce"
                                                checked={groupInfo.isAnnounce || false}
                                                onCheckedChange={handleToggleAnnounce}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="locked">Bloqueado</Label>
                                                <p className="text-sm text-muted-foreground">Somente admins podem editar</p>
                                            </div>
                                            <Switch
                                                id="locked"
                                                checked={groupInfo.isLocked || false}
                                                onCheckedChange={handleToggleLocked}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="approval">Requer Aprovação</Label>
                                                <p className="text-sm text-muted-foreground">Solicitações precisam aprovação</p>
                                            </div>
                                            <Switch
                                                id="approval"
                                                checked={groupInfo.defaultMembershipApprovalMode === "request_required"}
                                                onCheckedChange={handleToggleApproval}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Quem pode adicionar membros</Label>
                                            <Select
                                                value={groupInfo.memberAddMode || "all_member_add"}
                                                onValueChange={(v) => handleMemberAddMode(v as "admin_add" | "all_member_add")}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all_member_add">Todos os Participantes</SelectItem>
                                                    <SelectItem value="admin_add">Somente Admins</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-destructive/50">
                                    <CardHeader>
                                        <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                                        <CardDescription>Ações irreversíveis</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="destructive" onClick={() => setLeaveDialog(true)}>
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sair do Grupo
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Invites Tab */}
                        <TabsContent value="invites" className="mt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Link de Convite</CardTitle>
                                        <CardDescription>Compartilhe para convidar pessoas</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex gap-2">
                                            <Input value={inviteLink} readOnly className="font-mono text-sm" />
                                            <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <Button variant="outline" onClick={handleResetLink} className="w-full">
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Resetar Link
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Solicitações ({joinRequests.length})</CardTitle>
                                        <CardDescription>Solicitações pendentes</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {joinRequests.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">Nenhuma solicitação pendente</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {joinRequests.map((request) => (
                                                    <div key={request.jid} className="flex items-center gap-2 p-2 rounded bg-accent">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{formatJid(request.jid).substring(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="flex-1 text-sm font-medium">{formatJid(request.jid)}</span>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-green-600"
                                                            onClick={() => handleJoinRequest(request.jid, "approve")}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => handleJoinRequest(request.jid, "reject")}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Add Participant Dialog */}
                <Dialog open={addParticipantDialog} onOpenChange={setAddParticipantDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Participante</DialogTitle>
                            <DialogDescription>Digite o telefone da pessoa</DialogDescription>
                        </DialogHeader>
                        <Input
                            placeholder="5511999999999"
                            value={newParticipantPhone}
                            onChange={(e) => setNewParticipantPhone(e.target.value)}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddParticipantDialog(false)}>Cancelar</Button>
                            <Button onClick={handleAddParticipant}>Adicionar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Send Message Dialog */}
                <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enviar Mensagem</DialogTitle>
                        </DialogHeader>
                        <Textarea
                            placeholder="Digite sua mensagem..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            rows={4}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setMessageDialog(false)}>Cancelar</Button>
                            <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                                <Send className="h-4 w-4 mr-2" />
                                Enviar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Leave Group Confirmation */}
                <AlertDialog open={leaveDialog} onOpenChange={setLeaveDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Sair do Grupo?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja sair de "{groupInfo.name}"? Você precisará de um link de convite para voltar.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive text-destructive-foreground">
                                Sair do Grupo
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
