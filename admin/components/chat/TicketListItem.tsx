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
  ArrowRightLeft,
  Trash2,
  Clock,
  User,
  PlayCircle,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { TransferTicketModal } from "./TransferTicketModal";
import {
  closeTicket,
  reopenTicket,
  deleteTicket,
  acceptTicket,
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

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await acceptTicket(session, ticket.id);
      toast.success("Ticket aceito");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao aceitar ticket");
    } finally {
      setLoading(false);
    }
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

  const handleTransferClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTransferModalOpen(true);
  };

  const getStatusColor = () => {
    switch (ticket.status) {
      case "pending": return "bg-yellow-500/10 border-yellow-200 text-yellow-700";
      case "open": return "bg-green-500/10 border-green-200 text-green-700";
      case "closed": return "bg-gray-500/10 border-gray-200 text-gray-700";
      default: return "bg-muted border-border text-muted-foreground";
    }
  };

  const getStatusIcon = () => {
    switch (ticket.status) {
      case "pending": return <Clock className="h-3 w-3" />;
      case "open": return <PlayCircle className="h-3 w-3" />;
      case "closed": return <CheckCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex gap-3 p-3 cursor-pointer transition-all duration-200 hover:bg-muted/30 active:scale-[0.98]",
          isSelected && "bg-accent/50 border-l-3 border-l-primary",
          isChecked && "bg-primary/5",
          isProcessing && "opacity-60 scale-95 transform translate-x-1"
        )}
        onClick={selectionMode ? () => onCheckChange?.(!isChecked) : onClick}
      >
        {/* Selection Checkbox */}
        {selectionMode && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10">
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => onCheckChange?.(checked as boolean)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4"
            />
          </div>
        )}

        {/* Status Indicator Bar */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1 transition-colors duration-200",
          ticket.status === "pending" && "bg-yellow-500",
          ticket.status === "open" && "bg-green-500",
          ticket.status === "closed" && "bg-gray-400"
        )} />

        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-11 w-11 shadow-sm ring-2 ring-background">
            <AvatarImage src={ticket.contactPicUrl} alt={ticket.contactName || "Contact"} />
            <AvatarFallback
              className={cn(
                "font-medium text-sm",
                ticket.isGroup
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                  : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground"
              )}
            >
              {ticket.isGroup ? (
                <Users className="h-5 w-5" />
              ) : (
                getInitials(ticket.contactName)
              )}
            </AvatarFallback>
          </Avatar>
          
          {/* Online/Active Indicator */}
          {ticket.status === "open" && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {ticket.contactName || ticket.contactJid.split("@")[0]}
              </h3>
              {ticket.isGroup && (
                <Users className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground font-medium">
                {formatTime(ticket.updatedAt)}
              </span>
              {ticket.unreadCount > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                  {ticket.unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Last Message */}
          <div className="flex items-start gap-2">
            <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {ticket.lastMessage || "Sem mensagens"}
            </p>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Badge */}
            <Badge variant="outline" className={cn(
              "h-5 text-[10px] px-2 font-medium gap-1",
              getStatusColor()
            )}>
              {getStatusIcon()}
              {ticket.status === "pending" && "Aguardando"}
              {ticket.status === "open" && "Atendendo"}
              {ticket.status === "closed" && "Resolvido"}
            </Badge>

            {/* Queue Badge */}
            {ticket.queue && (
              <Badge
                variant="secondary"
                className="h-5 text-[10px] px-2"
                style={{ 
                  backgroundColor: `${ticket.queue.color}20`, 
                  color: ticket.queue.color,
                  borderColor: `${ticket.queue.color}40`
                }}
              >
                {ticket.queue.name}
              </Badge>
            )}

            {/* User Badge */}
            {ticket.user && (
              <Badge variant="outline" className="h-5 text-[10px] px-2 gap-1">
                <User className="h-2.5 w-2.5" />
                {ticket.user.name.split(" ")[0]}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!selectionMode && (
            <>
              {ticket.status === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-green-600 hover:bg-green-50"
                  onClick={handleAccept}
                  disabled={loading}
                  title="Aceitar ticket"
                >
                  <PlayCircle className="h-4 w-4" />
                </Button>
              )}

              {ticket.status === "open" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 hover:bg-muted"
                    onClick={handleClose}
                    disabled={loading}
                    title="Resolver ticket"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 hover:bg-muted"
                    onClick={handleTransferClick}
                    disabled={loading}
                    title="Transferir ticket"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </>
              )}

              {ticket.status === "closed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 hover:bg-muted"
                  onClick={handleReopen}
                  disabled={loading}
                  title="Reabrir ticket"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </>
          )}

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {ticket.status === "pending" && (
                <DropdownMenuItem onClick={handleAccept} disabled={loading}>
                  <PlayCircle className="mr-2 h-4 w-4 text-green-600" />
                  Aceitar ticket
                </DropdownMenuItem>
              )}
              {ticket.status === "open" && (
                <>
                  <DropdownMenuItem onClick={handleClose} disabled={loading}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolver ticket
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleTransferClick} disabled={loading}>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Transferir ticket
                  </DropdownMenuItem>
                </>
              )}
              {ticket.status === "closed" && (
                <DropdownMenuItem onClick={handleReopen} disabled={loading}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reabrir ticket
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} disabled={loading} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
