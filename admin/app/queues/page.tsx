"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Trash2, Users, Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  getQueues,
  createQueue,
  updateQueue,
  deleteQueue,
  type Queue,
} from "@/lib/api";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
];

export default function QueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    greetingMessage: "",
  });

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const response = await getQueues();
      setQueues(response.data || []);
    } catch (error) {
      toast.error("Erro ao carregar filas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (queue?: Queue) => {
    if (queue) {
      setEditingQueue(queue);
      setFormData({
        name: queue.name,
        color: queue.color,
        greetingMessage: queue.greetingMessage || "",
      });
    } else {
      setEditingQueue(null);
      setFormData({
        name: "",
        color: "#3b82f6",
        greetingMessage: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }

    try {
      if (editingQueue) {
        await updateQueue(editingQueue.id, {
          name: formData.name,
          color: formData.color,
          greetingMessage: formData.greetingMessage || undefined,
        });
        toast.success("Fila atualizada");
      } else {
        await createQueue({
          name: formData.name,
          color: formData.color,
          greetingMessage: formData.greetingMessage || undefined,
        });
        toast.success("Fila criada");
      }
      setDialogOpen(false);
      fetchQueues();
    } catch (error) {
      toast.error("Erro ao salvar fila");
    }
  };

  const handleDelete = async (queueId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta fila?")) return;
    try {
      await deleteQueue(queueId);
      toast.success("Fila excluida");
      fetchQueues();
    } catch (error) {
      toast.error("Erro ao excluir fila");
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader breadcrumbs={[{ label: "Filas" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Gerenciar Filas</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Fila
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingQueue ? "Editar Fila" : "Nova Fila"}
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
                      placeholder="Ex: Vendas, Suporte, Financeiro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`h-8 w-8 rounded-full border-2 transition-transform ${
                            formData.color === color
                              ? "border-foreground scale-110"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, color })}
                        />
                      ))}
                      <Input
                        type="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="h-8 w-8 p-0 border-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="greetingMessage">Mensagem de Boas-vindas</Label>
                    <Textarea
                      id="greetingMessage"
                      value={formData.greetingMessage}
                      onChange={(e) =>
                        setFormData({ ...formData, greetingMessage: e.target.value })
                      }
                      placeholder="Mensagem enviada automaticamente ao cliente"
                      rows={3}
                    />
                  </div>
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {queues.map((queue) => (
              <Card key={queue.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: queue.color }}
                    />
                    <CardTitle className="text-base font-medium">
                      {queue.name}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(queue)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(queue.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Ticket className="h-4 w-4" />
                      {queue.ticketCount || 0} tickets
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {queue.userCount || 0} agentes
                    </span>
                  </div>
                  {queue.greetingMessage && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {queue.greetingMessage}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {queues.length === 0 && !loading && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma fila cadastrada</p>
                  <Button className="mt-4" onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira fila
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
