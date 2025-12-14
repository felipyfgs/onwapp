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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader, StatsCard } from "@/components/common";
import { getGroups, createGroup, joinGroup, Group } from "@/lib/api";
import { Search, UsersRound, Plus, Users, Lock, Megaphone, RefreshCw, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function GroupsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinDialog, setJoinDialog] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [joining, setJoining] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await getGroups(sessionId);
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("rate limit")) {
        toast.error("WhatsApp está limitando as requisições", {
          description: "Aguarde alguns segundos e tente novamente.",
        });
      } else {
        toast.error("Erro ao carregar grupos", {
          description: message,
        });
      }
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async () => {
    if (!newGroupName || !sessionId) return;
    setCreating(true);
    try {
      await createGroup(sessionId, newGroupName, []);
      setCreateDialog(false);
      setNewGroupName("");
      toast.success("Grupo criado com sucesso");
      fetchGroups();
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Falha ao criar grupo");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteLink || !sessionId) return;
    setJoining(true);
    try {
      const result = await joinGroup(sessionId, inviteLink);
      setJoinDialog(false);
      setInviteLink("");
      toast.success("Entrou no grupo com sucesso");
      fetchGroups();
      if (result.groupId) {
        router.push(`/sessions/${sessionId}/groups/${encodeURIComponent(result.groupId)}`);
      }
    } catch (error) {
      console.error("Failed to join group:", error);
      toast.error("Falha ao entrar no grupo. Verifique se o link é válido.");
    } finally {
      setJoining(false);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const announceCount = groups.filter((g) => g.isAnnounce).length;
  const lockedCount = groups.filter((g) => g.isLocked).length;
  const totalParticipants = groups.reduce((acc, g) => acc + (g.participantCount || 0), 0);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader
          breadcrumbs={[
            { label: "Sessions", href: "/sessions" },
            { label: sessionId, href: `/sessions/${sessionId}` },
            { label: "Groups" },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={createDialog} onOpenChange={setCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Grupo</DialogTitle>
                  <DialogDescription>Criar um novo grupo WhatsApp</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Grupo</Label>
                    <Input
                      placeholder="Digite o nome do grupo"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateGroup} disabled={creating || !newGroupName} className="w-full">
                    {creating ? "Criando..." : "Criar Grupo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={joinDialog} onOpenChange={setJoinDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Link2 className="mr-2 h-4 w-4" />
                  Entrar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Entrar em Grupo</DialogTitle>
                  <DialogDescription>Cole um link de convite para entrar no grupo</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Link de Convite</Label>
                    <Input
                      placeholder="https://chat.whatsapp.com/..."
                      value={inviteLink}
                      onChange={(e) => setInviteLink(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setJoinDialog(false)}>Cancelar</Button>
                  <Button onClick={handleJoinGroup} disabled={joining || !inviteLink}>
                    {joining ? "Entrando..." : "Entrar no Grupo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={fetchGroups}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatsCard title="Total de Grupos" value={groups.length} icon={UsersRound} variant="primary" />
            <StatsCard title="Total de Participantes" value={totalParticipants} icon={Users} variant="chart1" />
            <StatsCard title="Somente Anúncios" value={announceCount} icon={Megaphone} variant="chart4" />
            <StatsCard title="Grupos Bloqueados" value={lockedCount} icon={Lock} variant="chart2" />
          </div>

          {/* Group List */}
          {loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <UsersRound className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhum grupo encontrado</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Tente ajustar sua busca" : "Nenhum grupo nesta sessão"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              {filteredGroups.map((group) => {
                const initials = group.name.substring(0, 2).toUpperCase();
                return (
                  <div
                    key={group.jid}
                    className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => router.push(`/sessions/${sessionId}/groups/${encodeURIComponent(group.jid)}`)}
                  >
                    <Avatar className="h-12 w-12">
                      {group.profilePicture && <AvatarImage src={group.profilePicture} alt={group.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{group.name}</p>
                        {group.isAnnounce && (
                          <Badge variant="secondary" className="text-xs">
                            <Megaphone className="h-3 w-3 mr-1" />
                            Anúncios
                          </Badge>
                        )}
                        {group.isLocked && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Bloqueado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {group.participantCount || group.participants?.length || 0} participantes
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
