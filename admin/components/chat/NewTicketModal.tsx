"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  createTicket,
  getChats,
  getQueues,
  type Ticket,
  type Chat,
  type Queue,
} from "@/lib/api";

interface NewTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: string;
  onCreated: (ticket: Ticket) => void;
}

export function NewTicketModal({
  open,
  onOpenChange,
  session,
  onCreated,
}: NewTicketModalProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    if (open) {
      fetchChats();
      fetchQueues();
      setSelectedChat(null);
      setSearchQuery("");
      setSelectedQueueId("");
    }
  }, [open, session]);

  const fetchChats = async () => {
    if (!session) return;
    setLoadingChats(true);
    try {
      const response = await getChats(session);
      setChats(response || []);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchQueues = async () => {
    try {
      const response = await getQueues();
      setQueues(response.data || []);
    } catch (error) {
      console.error("Error fetching queues:", error);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const name = chat.name || chat.jid || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreate = async () => {
    if (!selectedChat) {
      toast.error("Selecione um contato");
      return;
    }

    setLoading(true);
    try {
      const response = await createTicket(session, {
        contactJid: selectedChat.jid,
        contactName: selectedChat.name || selectedChat.pushName,
        contactPicUrl: selectedChat.profilePicture,
        queueId: selectedQueueId && selectedQueueId !== "none" ? selectedQueueId : undefined,
        isGroup: selectedChat.isGroup,
      });
      toast.success("Ticket criado");
      onOpenChange(false);
      onCreated(response.data);
    } catch (error) {
      toast.error("Erro ao criar ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Contacts List */}
          <div className="space-y-2">
            <Label>Selecione um contato</Label>
            <ScrollArea className="h-[200px] border rounded-md">
              {loadingChats ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Nenhum contato encontrado
                </div>
              ) : (
                <div className="divide-y">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.jid}
                      className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50 ${
                        selectedChat?.jid === chat.jid ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={chat.profilePicture} />
                        <AvatarFallback className="text-xs">
                          {getInitials(chat.name || chat.pushName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {chat.name || chat.pushName || chat.jid.split("@")[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.jid.split("@")[0]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Queue Selection */}
          <div className="space-y-2">
            <Label>Fila (opcional)</Label>
            <Select value={selectedQueueId} onValueChange={setSelectedQueueId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar fila..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {queues.map((queue) => (
                  <SelectItem key={queue.id} value={queue.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: queue.color }}
                      />
                      {queue.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading || !selectedChat}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
