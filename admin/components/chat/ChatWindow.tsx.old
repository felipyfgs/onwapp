"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Chat, Message, Ticket, Queue, acceptTicket, closeTicket, reopenTicket } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TransferTicketModal } from "./TransferTicketModal";
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Users,
  Archive,
  Trash2,
  Bell,
  BellOff,
  Pin,
  MessageSquare,
  ArrowDown,
  CheckCircle,
  RotateCcw,
  ArrowRightLeft,
  Clock,
  PlayCircle,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatWindowProps {
  chat: Chat | null;
  messages: Message[];
  loading?: boolean;
  onSendMessage: (text: string) => void;
  onSendMedia?: (type: string, file: File) => void;
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
  ticket?: Ticket | null;
  session?: string;
  queues?: Queue[];
  onTicketAction?: (switchToOpen?: boolean) => void;
}

interface ChatHeaderProps {
  chat: Chat;
  ticket?: Ticket | null;
  session?: string;
  queues?: Queue[];
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
  onTicketAction?: (switchToOpen?: boolean) => void;
}

function ChatHeader({ 
  chat, 
  ticket,
  session,
  queues = [],
  onArchive, 
  onMute, 
  onDelete,
  onTicketAction,
}: ChatHeaderProps) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const name = chat.name || chat.pushName || chat.jid.split("@")[0];
  const initials = name.substring(0, 2).toUpperCase();

  const handleAccept = async () => {
    if (!session || !ticket) return;
    setLoading(true);
    try {
      await acceptTicket(session, ticket.id);
      toast.success("Ticket aceito");
      onTicketAction?.(true); // Switch to "Atendendo" tab
    } catch (error) {
      toast.error("Erro ao aceitar ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!session || !ticket) return;
    setLoading(true);
    try {
      await closeTicket(session, ticket.id);
      toast.success("Ticket resolvido");
      onTicketAction?.();
    } catch (error) {
      toast.error("Erro ao resolver ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!session || !ticket) return;
    setLoading(true);
    try {
      await reopenTicket(session, ticket.id);
      toast.success("Ticket reaberto");
      onTicketAction?.();
    } catch (error) {
      toast.error("Erro ao reabrir ticket");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!ticket) return null;
    switch (ticket.status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando
          </Badge>
        );
      case "open":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <PlayCircle className="h-3 w-3 mr-1" />
            Atendendo
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolvido
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      <div className="flex items-center gap-3 p-3 border-b bg-background shrink-0">
        <Avatar className="h-11 w-11 shadow-sm cursor-pointer transition-transform hover:scale-105">
          {chat.profilePicture && <AvatarImage src={chat.profilePicture} alt={name} />}
          <AvatarFallback className={cn(
            "font-medium",
            chat.isGroup
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            {chat.isGroup ? <Users className="h-5 w-5" /> : initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 cursor-pointer">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{name}</p>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
            {ticket?.queue && (
              <span className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: ticket.queue.color || "#999" }}
                />
                {ticket.queue.name}
                {ticket.user?.name && ` - ${ticket.user.name}`}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {ticket && session && (
            <>
              {ticket.status === "pending" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAccept}
                  disabled={loading}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Aceitar
                </Button>
              )}
              {ticket.status === "open" && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResolve}
                    disabled={loading}
                    className="text-primary hover:bg-primary/10"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolver
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTransferOpen(true)}
                    disabled={loading}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1" />
                    Transferir
                  </Button>
                </>
              )}
              {ticket.status === "closed" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReopen}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reabrir
                </Button>
              )}
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="focus-ring"
                aria-label="Mais opções"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                {chat.isGroup ? "Info do grupo" : "Info do contato"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSearching(!isSearching)}>
                <Search className="h-4 w-4 mr-2" />
                Buscar mensagens
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="h-4 w-4 mr-2" />
                {chat.isArchived ? "Desarquivar" : "Arquivar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {ticket && session && (
        <TransferTicketModal
          open={transferOpen}
          onOpenChange={setTransferOpen}
          ticket={ticket}
          session={session}
          queues={queues}
          onTransfer={() => {
            setTransferOpen(false);
            onTicketAction?.();
          }}
        />
      )}
    </>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="px-4 py-1.5 rounded-lg bg-card border border-border/50 text-xs text-muted-foreground font-medium shadow-sm">
        {date}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Select a chat</h3>
      <p className="text-muted-foreground max-w-sm">
        Choose a conversation from the list to start messaging
      </p>
    </div>
  );
}

export function ChatWindow({
  chat,
  messages,
  loading,
  onSendMessage,
  onSendMedia,
  onArchive,
  onMute,
  onDelete,
  ticket,
  session,
  queues,
  onTicketAction,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: { message: Message; index: number }[] = [];
    
    messages.forEach((message, index) => {
      if (message.content && message.content.toLowerCase().includes(query)) {
        results.push({ message, index });
      }
    });
    
    return results;
  }, [messages, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentSearchIndex(0);
    setIsSearching(query.trim().length > 0);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setCurrentSearchIndex(0);
  };

  const navigateSearch = (direction: 'up' | 'down') => {
    if (searchResults.length === 0) return;
    
    if (direction === 'down') {
      setCurrentSearchIndex(prev => (prev + 1) % searchResults.length);
    } else {
      setCurrentSearchIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };

  const scrollToSearchResult = (index: number) => {
    if (searchResults.length === 0 || !scrollRef.current) return;
    
    const targetIndex = searchResults[index].index;
    const messageElements = scrollRef.current.querySelectorAll('[data-message-index]');
    const targetElement = messageElements[targetIndex] as HTMLElement;
    
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight the message temporarily
      targetElement.classList.add('bg-primary/10');
      setTimeout(() => {
        targetElement.classList.remove('bg-primary/10');
      }, 2000);
    }
  };

  useEffect(() => {
    if (isSearching && searchResults.length > 0) {
      scrollToSearchResult(currentSearchIndex);
    }
  }, [currentSearchIndex, isSearching, searchResults]);

  if (!chat) {
    return <EmptyState />;
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    
    messages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp).toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex h-full flex-col bg-muted/30 overflow-hidden">
      {/* Header */}
      <ChatHeader
        chat={chat}
        ticket={ticket}
        session={session}
        queues={queues}
        onArchive={onArchive}
        onMute={onMute}
        onDelete={onDelete}
        onTicketAction={onTicketAction}
      />
      
      {/* Search Bar */}
      {isSearching && (
        <div className="border-b bg-background p-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mensagens..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 focus-ring"
                aria-label="Buscar mensagens"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={clearSearch}
                  aria-label="Limpar busca"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <span>{currentSearchIndex + 1}/{searchResults.length}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigateSearch('up')}
                    disabled={searchResults.length <= 1}
                    aria-label="Resultado anterior"
                  >
                    <ChevronDown className="h-3 w-3 rotate-180" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigateSearch('down')}
                    disabled={searchResults.length <= 1}
                    aria-label="Próximo resultado"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative scrollbar-thin"
        onScroll={handleScroll}
        role="log"
        aria-label="Mensagens da conversa"
        aria-live="polite"
        aria-atomic="false"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <div className="py-4 px-2 sm:px-4 overflow-hidden">
            {groupedMessages.map((group, groupIndex) => (
              <div key={group.date}>
                <DateDivider date={group.date} />
                {group.messages.map((message, msgIndex) => {
                  const prevMessage = msgIndex > 0
                    ? group.messages[msgIndex - 1]
                    : groupIndex > 0
                      ? groupedMessages[groupIndex - 1].messages.slice(-1)[0]
                      : null;
                  
                  const showAvatar = !message.isFromMe && (
                    !prevMessage ||
                    prevMessage.isFromMe ||
                    prevMessage.senderJid !== message.senderJid
                  );
                  
                  // Calculate global message index for search
                  const globalMessageIndex = messages.findIndex(m => m.id === message.id);
                  const isSearchResult = isSearching && searchQuery &&
                    message.content &&
                    message.content.toLowerCase().includes(searchQuery.toLowerCase());
                  
                  return (
                    <div
                      key={message.id || `${groupIndex}-${msgIndex}`}
                      data-message-index={globalMessageIndex}
                      className={cn(
                        "transition-colors duration-300",
                        isSearchResult && "bg-primary/5"
                      )}
                    >
                      <MessageBubble
                        message={message}
                        showAvatar={showAvatar}
                        searchQuery={isSearching ? searchQuery : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Button
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-lg animate-bounce-subtle focus-ring"
            onClick={scrollToBottom}
            aria-label="Rolar para baixo"
            title="Rolar para baixo"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onSendMedia={onSendMedia}
        disabled={loading}
      />
    </div>
  );
}
