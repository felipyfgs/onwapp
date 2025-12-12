"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Users,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUsers,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getQueues,
  setUserQueues,
  type User,
  type Queue,
} from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    profile: "user" as "admin" | "user",
  });
  const [newPassword, setNewPassword] = useState("");
  const [userForPassword, setUserForPassword] = useState<User | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, queuesRes] = await Promise.all([
        getUsers(),
        getQueues(),
      ]);
      setUsers(usersRes.data || []);
      setQueues(queuesRes.data || []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        profile: user.profile,
      });
      setSelectedQueueIds(user.queues?.map((q) => q.id) || []);
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        profile: "user",
      });
      setSelectedQueueIds([]);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Nome e email sao obrigatorios");
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error("Senha e obrigatoria para novo usuario");
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          profile: formData.profile,
          queueIds: selectedQueueIds,
        });
        toast.success("Usuario atualizado");
      } else {
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          profile: formData.profile,
          queueIds: selectedQueueIds,
        });
        toast.success("Usuario criado");
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar usuario");
    }
  };

  const handleOpenPasswordDialog = (user: User) => {
    setUserForPassword(user);
    setNewPassword("");
    setPasswordDialogOpen(true);
  };

  const handleUpdatePassword = async () => {
    if (!userForPassword || !newPassword) {
      toast.error("Senha e obrigatoria");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      await updateUserPassword(userForPassword.id, newPassword);
      toast.success("Senha atualizada");
      setPasswordDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao atualizar senha");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuario?")) return;
    try {
      await deleteUser(userId);
      toast.success("Usuario excluido");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir usuario");
    }
  };

  const toggleQueue = (queueId: string) => {
    setSelectedQueueIds((prev) =>
      prev.includes(queueId)
        ? prev.filter((id) => id !== queueId)
        : [...prev, queueId]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Usuarios</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Gerenciar Usuarios</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Editar Usuario" : "Novo Usuario"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  {!editingUser && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Minimo 6 caracteres"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Perfil</Label>
                    <Select
                      value={formData.profile}
                      onValueChange={(value: "admin" | "user") =>
                        setFormData({ ...formData, profile: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {queues.length > 0 && (
                    <div className="space-y-2">
                      <Label>Filas</Label>
                      <div className="space-y-2 max-h-32 overflow-auto border rounded-md p-2">
                        {queues.map((queue) => (
                          <div
                            key={queue.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`queue-${queue.id}`}
                              checked={selectedQueueIds.includes(queue.id)}
                              onCheckedChange={() => toggleQueue(queue.id)}
                            />
                            <label
                              htmlFor={`queue-${queue.id}`}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: queue.color }}
                              />
                              {queue.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Password Dialog */}
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPasswordDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdatePassword}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Users List */}
          <div className="space-y-2">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback
                      className={
                        user.profile === "admin"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }
                    >
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      <Badge
                        variant={user.profile === "admin" ? "default" : "secondary"}
                      >
                        {user.profile === "admin" ? (
                          <>
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <UserIcon className="mr-1 h-3 w-3" />
                            Usuario
                          </>
                        )}
                      </Badge>
                      {user.online && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Online
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.queues && user.queues.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.queues.map((queue) => (
                          <Badge
                            key={queue.id}
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: queue.color, color: queue.color }}
                          >
                            {queue.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenPasswordDialog(user)}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Alterar Senha
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}

            {users.length === 0 && !loading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum usuario cadastrado</p>
                  <Button className="mt-4" onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeiro usuario
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
