"use client";

import { useState, memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  MoreVertical,
  CheckCircle,
  RefreshCw,
  ArrowRightLeft,
  Trash2,
  Clock,
  User,
} from "lucide-react";
import { TransferTicketModal } from "./TransferTicketModal";
import {
  closeTicket,
  reopenTicket,
  deleteTicket,
  type Ticket,
  type Queue,
} from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TicketListItemProps {
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
  session: string;
  queues: Queue[];
  onUpdate: () => void;
  selectionMode?: boolean;
  isChecked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  isProcessing?: boolean;
}

function TicketListItemComponent({
  ticket,
  isSelected,
  onClick,
  session,
  queues,
  onUpdate,
  selectionMode,
  isChecked,
  onCheckChange,
  isProcessing,
}: TicketListItemProps) {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await closeTicket(session, ticket.id);
      toast.success("Ticket fechado");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao fechar ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await reopenTicket(session, ticket.id);
      toast.success("Ticket reaberto");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao reabrir ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este ticket?")) return;
    setLoading(true);
    try {
      await deleteTicket(session, ticket.id);
      toast.success("Ticket excluido");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao excluir ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-all duration-300 ease-in-out",
          isSelected && "bg-accent border-l-2 border-l-primary",
          isChecked && "bg-primary/5",
          isProcessing && "opacity-50 scale-95 transform translate-x-2"
        )}
        onClick={selectionMode ? () => onCheckChange?.(!isChecked) : onClick}
      >
        {selectionMode && (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => onCheckChange?.(checked as boolean)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 shrink-0"
          />
        )}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={ticket.contactPicUrl} />
          <AvatarFallback
            className={
              ticket.isGroup
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }
          >
            {ticket.isGroup ? (
              <Users className="h-4 w-4" />
            ) : (
              getInitials(ticket.contactName)
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">
              {ticket.contactName || ticket.contactJid.split("@")[0]}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatTime(ticket.updatedAt)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {ticket.lastMessage || "Sem mensagens"}
          </p>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {ticket.status === "pending" && (
              <Badge variant="secondary" className="h-5 text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5">
                <Clock className="h-3 w-3 mr-0.5" />
                Aguardando
              </Badge>
            )}
            {ticket.queue && (
              <Badge
                variant="outline"
                className="h-5 text-[10px] px-1.5"
                style={{ borderColor: ticket.queue.color, color: ticket.queue.color }}
              >
                {ticket.queue.name}
              </Badge>
            )}
            {ticket.user && (
              <Badge variant="outline" className="h-5 text-[10px] px-1.5">
                <User className="h-3 w-3 mr-0.5" />
                {ticket.user.name.split(" ")[0]}
              </Badge>
            )}
            {ticket.unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
                {ticket.unreadCount}
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setTransferModalOpen(true);
              }}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transferir
            </DropdownMenuItem>
            {ticket.status !== "closed" ? (
              <DropdownMenuItem onClick={handleClose} disabled={loading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolver
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleReopen} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reabrir
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={loading}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TransferTicketModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        ticket={ticket}
        session={session}
        queues={queues}
        onTransfer={onUpdate}
      />
    </>
  );
}

export const TicketListItem = memo(TicketListItemComponent, (prev, next) => {
  return (
    prev.ticket.id === next.ticket.id &&
    prev.ticket.updatedAt === next.ticket.updatedAt &&
    prev.ticket.status === next.ticket.status &&
    prev.ticket.unreadCount === next.ticket.unreadCount &&
    prev.isSelected === next.isSelected &&
    prev.selectionMode === next.selectionMode &&
    prev.isChecked === next.isChecked &&
    prev.isProcessing === next.isProcessing
  );
});
