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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  transferTicket,
  getUsers,
  type Ticket,
  type Queue,
  type User,
} from "@/lib/api";

interface TransferTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket;
  session: string;
  queues: Queue[];
  onTransfer: () => void;
}

export function TransferTicketModal({
  open,
  onOpenChange,
  ticket,
  session,
  queues,
  onTransfer,
}: TransferTicketModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedQueueId, setSelectedQueueId] = useState<string>("");
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedUserId(ticket.userId || "");
      setSelectedQueueId(ticket.queueId || "");
      fetchUsers();
    }
  }, [open, ticket]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const data: { userId?: string; queueId?: string } = {};
      
      if (selectedUserId && selectedUserId !== "none") {
        data.userId = selectedUserId;
      } else if (selectedUserId === "none") {
        data.userId = "";
      }
      
      if (selectedQueueId && selectedQueueId !== "none") {
        data.queueId = selectedQueueId;
      } else if (selectedQueueId === "none") {
        data.queueId = "";
      }

      await transferTicket(session, ticket.id, data);
      toast.success("Ticket transferido");
      onOpenChange(false);
      onTransfer();
    } catch (error) {
      toast.error("Erro ao transferir ticket");
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label>Atribuir para</Label>
            <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userPopoverOpen}
                  className="w-full justify-between"
                  disabled={loadingUsers}
                >
                  {loadingUsers ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </span>
                  ) : selectedUser ? (
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          selectedUser.online ? "bg-green-500" : "bg-gray-400"
                        )}
                      />
                      {selectedUser.name}
                    </span>
                  ) : (
                    "Selecionar usuario..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar usuario..." />
                  <CommandList>
                    <CommandEmpty>Nenhum usuario encontrado</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setSelectedUserId("none");
                          setUserPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedUserId === "none" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Nenhum (enviar para fila)
                      </CommandItem>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() => {
                            setSelectedUserId(user.id);
                            setUserPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span
                            className={cn(
                              "mr-2 h-2 w-2 rounded-full",
                              user.online ? "bg-green-500" : "bg-gray-400"
                            )}
                          />
                          {user.name}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {user.profile}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Queue Selection */}
          <div className="space-y-2">
            <Label>Fila</Label>
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
          <Button onClick={handleTransfer} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
