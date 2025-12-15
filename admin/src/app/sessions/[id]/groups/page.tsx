"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";

interface Group {
  id: string;
  jid: string;
  name: string;
  topic: string;
  participantCount: number;
  isAnnounce: boolean;
  isLocked: boolean;
  createdAt: number;
  participants?: Participant[];
  inviteLink?: string;
}

interface Participant {
  jid: string;
  name: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export default function GroupsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { toast } = useToast();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newParticipants, setNewParticipants] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    if (sessionId) {
      fetchGroups();
    }
  }, [sessionId]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.getJoinedGroups(sessionId);
      setGroups(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch groups");
      toast({
        variant: "destructive",
        title: "Erro ao buscar grupos",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao buscar os grupos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    try {
      const response = await api.getGroupInfo(sessionId, groupId);
      setSelectedGroup(response.data);
      setActiveTab("details");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar detalhes do grupo",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao buscar os detalhes do grupo.",
      });
    }
  };

  const createGroup = async () => {
    if (!newGroupName) {
      toast({
        variant: "destructive",
        title: "Nome do grupo é obrigatório",
      });
      return;
    }

    try {
      const participants = newParticipants.split(",").map(p => p.trim()).filter(p => p);
      const response = await api.createGroup(sessionId, {
        name: newGroupName,
        description: newGroupDescription,
        participants: participants,
      });

      toast({
        title: "Grupo criado com sucesso",
        description: "O grupo foi criado com sucesso.",
      });

      setShowCreateDialog(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setNewParticipants("");
      fetchGroups();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao criar grupo",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao criar o grupo.",
      });
    }
  };

  const getInviteLink = async (groupId: string) => {
    try {
      const response = await api.getInviteLink(sessionId, groupId);
      setInviteLink(response.link);
      setShowInviteDialog(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao obter link de convite",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao obter o link de convite.",
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      await api.leaveGroup(sessionId, groupId);
      toast({
        title: "Você saiu do grupo",
        description: "Você saiu do grupo com sucesso.",
      });
      fetchGroups();
      setSelectedGroup(null);
      setActiveTab("list");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao sair do grupo",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao sair do grupo.",
      });
    }
  };

  if (loading && groups.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Grupos do WhatsApp</h1>
        <Button onClick={() => setShowCreateDialog(true)}>Novo Grupo</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Grupos</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedGroup}>
            Detalhes do Grupo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Nenhum grupo encontrado</h2>
              <p className="text-gray-500 mb-4">
                Você não está participando de nenhum grupo no momento.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} size="lg">
                Criar Grupo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Card
                  key={group.jid}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => fetchGroupDetails(group.jid)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{group.name}</CardTitle>
                      <Badge variant={group.isAnnounce ? "secondary" : "default"}>
                        {group.isAnnounce ? "Anúncio" : "Normal"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-2 truncate">{group.topic}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {group.participantCount} participantes
                      </span>
                      <span className="text-sm text-gray-500">
                        Criado: {new Date(group.createdAt * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details">
          {selectedGroup && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedGroup.name}</CardTitle>
                      <p className="text-sm text-gray-500">{selectedGroup.topic}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={selectedGroup.isAnnounce ? "secondary" : "default"}>
                        {selectedGroup.isAnnounce ? "Anúncio" : "Normal"}
                      </Badge>
                      {selectedGroup.isLocked && (
                        <Badge variant="outline">Trancado</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Participantes</p>
                      <p className="font-medium">{selectedGroup.participantCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Criado em</p>
                      <p className="font-medium">
                        {new Date(selectedGroup.createdAt * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID do Grupo</p>
                      <p className="font-medium truncate">{selectedGroup.jid}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => getInviteLink(selectedGroup.jid)}
                    >
                      Obter Link de Convite
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => leaveGroup(selectedGroup.jid)}
                    >
                      Sair do Grupo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Participantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {selectedGroup.participants?.map((participant) => (
                      <div key={participant.jid} className="flex items-center gap-4 py-2 border-b last:border-b-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${participant.name}`}
                          />
                          <AvatarFallback>
                            {participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-sm text-gray-500">{participant.jid}</p>
                        </div>
                        <div className="flex gap-2">
                          {participant.isAdmin && (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                          {participant.isSuperAdmin && (
                            <Badge variant="outline">Super Admin</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Nome do Grupo</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nome do grupo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupDescription">Descrição (Opcional)</Label>
              <Textarea
                id="groupDescription"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Descrição do grupo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants">Participantes (Separados por vírgula)</Label>
              <Input
                id="participants"
                value={newParticipants}
                onChange={(e) => setNewParticipants(e.target.value)}
                placeholder="Números de telefone ou JIDs dos participantes"
              />
              <p className="text-sm text-gray-500">
                Digite os números de telefone ou JIDs dos participantes separados por vírgula.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={createGroup}>Criar Grupo</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Convite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteLink">Link de Convite</Label>
              <Input
                id="inviteLink"
                value={inviteLink}
                readOnly
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                toast({
                  title: "Link copiado",
                  description: "O link de convite foi copiado para a área de transferência.",
                });
              }}
            >
              Copiar Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}