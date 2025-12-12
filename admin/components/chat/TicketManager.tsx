"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn, debounce } from "@/lib/utils";
import {
  Inbox,
  CheckCircle,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  CheckCheck,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { TicketListItem } from "./TicketListItem";
import { NewTicketModal } from "./NewTicketModal";
import {
  getTickets,
  getTicketStats,
  getQueues,
  acceptTicket,
  closeTicket,
  type Ticket,
  type TicketStats,
  type Queue,
} from "@/lib/api";
import { toast } from "sonner";

interface TicketManagerProps {
  session: string;
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  onTicketUpdate: () => void;
  refreshTrigger?: number;
  activeSubTab?: "open" | "pending";
  onSubTabChange?: (tab: "open" | "pending") => void;
}

const ITEMS_PER_PAGE = 30;
const SCROLL_THRESHOLD = 300;

export function TicketManager({
  session,
  selectedTicket,
  onSelectTicket,
  onTicketUpdate,
  refreshTrigger,
  activeSubTab,
  onSubTabChange,
}: TicketManagerProps) {
  const [mainTab, setMainTab] = useState<"open" | "closed" | "search">("open");
  const [subTab, setSubTab] = useState<"open" | "pending">(activeSubTab || "pending");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchEnabled, setGlobalSearchEnabled] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const [selectedQueueId, setSelectedQueueId] = useState<string>("all");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 300),
    []
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const fetchTickets = useCallback(async (reset = true) => {
    if (!session) return;
    if (!reset && loadingMoreRef.current) return;

    if (reset) {
      setLoading(true);
      offsetRef.current = 0;
      setHasMore(true);
    } else {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    try {
      const params: { status?: string; queueId?: string; search?: string; limit?: number; offset?: number } = {
        limit: ITEMS_PER_PAGE,
        offset: reset ? 0 : offsetRef.current,
      };

      if (mainTab === "open") {
        params.status = subTab;
      } else if (mainTab === "closed") {
        params.status = "closed";
      } else if (mainTab === "search" && searchQuery) {
        params.search = searchQuery;
      }

      if (selectedQueueId && selectedQueueId !== "all") {
        params.queueId = selectedQueueId;
      }

      const [ticketsRes, statsRes] = await Promise.all([
        getTickets(session, params),
        reset ? getTicketStats(session) : Promise.resolve(null),
      ]);

      const newTickets = ticketsRes.data || [];

      if (reset) {
        setTickets(newTickets);
        if (statsRes) setStats(statsRes.data);
        offsetRef.current = ITEMS_PER_PAGE;
      } else {
        setTickets(prev => [...prev, ...newTickets]);
        offsetRef.current += ITEMS_PER_PAGE;
      }

      setHasMore(newTickets.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [session, mainTab, subTab, searchQuery, selectedQueueId]);

  const fetchQueues = useCallback(async () => {
    try {
      const response = await getQueues();
      setQueues(response.data || []);
    } catch (error) {
      console.error("Error fetching queues:", error);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  useEffect(() => {
    fetchTickets(true);
  }, [session, mainTab, subTab, searchQuery, selectedQueueId, refreshTrigger]);

  useEffect(() => {
    if (activeSubTab !== undefined && activeSubTab !== subTab) {
      setSubTab(activeSubTab);
      setMainTab("open");
    }
  }, [activeSubTab]);

  const loadMore = useCallback(() => {
    if (!loadingMoreRef.current && hasMore && !loading) {
      fetchTickets(false);
    }
  }, [fetchTickets, hasMore, loading]);

  const toggleSelection = useCallback((ticketId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(ticketId);
      } else {
        newSet.delete(ticketId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(tickets.map(t => t.id)));
  }, [tickets]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleBulkAccept = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setAcceptLoading(true);
    setProcessingIds(new Set(selectedIds));
    let success = 0;
    let failed = 0;
    
    for (const ticketId of selectedIds) {
      try {
        await acceptTicket(session, ticketId);
        success++;
      } catch {
        failed++;
      }
    }
    
    setAcceptLoading(false);
    
    // Animação de desaparecimento suave
    setTimeout(() => {
      setProcessingIds(new Set());
      clearSelection();
      fetchTickets(true);
      onTicketUpdate();
    }, 300);
    
    if (failed > 0) {
      toast.error(`${failed} ticket(s) falharam`);
    }
    if (success > 0) {
      toast.success(`${success} ticket(s) aceitos`);
    }
  }, [selectedIds, session, fetchTickets, onTicketUpdate]);

  const handleBulkResolve = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setResolveLoading(true);
    setProcessingIds(new Set(selectedIds));
    let success = 0;
    let failed = 0;
    
    for (const ticketId of selectedIds) {
      try {
        await closeTicket(session, ticketId);
        success++;
      } catch {
        failed++;
      }
    }
    
    setResolveLoading(false);
    
    // Animação de desaparecimento suave
    setTimeout(() => {
      setProcessingIds(new Set());
      clearSelection();
      fetchTickets(true);
      onTicketUpdate();
    }, 300);
    
    if (failed > 0) {
      toast.error(`${failed} ticket(s) falharam`);
    }
    if (success > 0) {
      toast.success(`${success} ticket(s) resolvidos`);
    }
  }, [selectedIds, session, fetchTickets, onTicketUpdate]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < SCROLL_THRESHOLD) {
      loadMore();
    }
  }, [loadMore]);

  const virtualizer = useVirtualizer({
    count: tickets.length + (hasMore ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 110,
    overscan: 5,
    enabled: !loading && processingIds.size === 0,
  });

  // Memoizar estilo do container para evitar flushSync
  const containerStyle = useMemo(() => {
    if (!virtualizer || typeof virtualizer.getTotalSize !== 'function') {
      return {
        height: "0px",
        width: "100%",
        position: "relative" as const,
      };
    }
    return {
      height: `${virtualizer.getTotalSize()}px`,
      width: "100%",
      position: "relative" as const,
    };
  }, [virtualizer, tickets.length, hasMore]);

  const openCount = stats?.open || 0;
  const pendingCount = stats?.pending || 0;
  const closedCount = stats?.closed || 0;

  const TabButton = ({
    value,
    active,
    onClick,
    icon: Icon,
    label,
    count,
    ...props
  }: {
    value: string;
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    count?: number;
    [key: string]: any;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 text-xs sm:text-sm font-medium transition-colors transition-smooth relative",
        active
          ? "bg-accent text-accent-foreground border-b-2 border-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
      role="tab"
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge
          variant="secondary"
          className={cn(
            "ml-0 sm:ml-1 h-5 min-w-5 px-1 text-xs shrink-0 animate-scale-in",
            active && "bg-primary text-primary-foreground"
          )}
        >
          {count}
        </Badge>
      )}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-scale-in" />
      )}
    </button>
  );

  const SubTabButton = ({ 
    value, 
    active, 
    onClick, 
    label, 
    count,
    variant = "default"
  }: { 
    value: string; 
    active: boolean; 
    onClick: () => void; 
    label: string; 
    count?: number;
    variant?: "default" | "warning";
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 min-w-0 flex items-center justify-center gap-1 px-2 py-2 text-xs sm:text-sm font-medium transition-colors rounded-md",
        active 
          ? "bg-background text-foreground shadow-sm" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge 
          variant="secondary" 
          className={cn(
            "ml-1 h-5 min-w-5 px-1 text-xs shrink-0",
            variant === "warning" && "bg-yellow-500/20 text-yellow-600"
          )}
        >
          {count}
        </Badge>
      )}
    </button>
  );

  const renderTicketList = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 animate-fade-in">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <div className="absolute inset-0 h-8 w-8 rounded-full border-4 border-primary/20 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm mt-2">Carregando tickets...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Isso pode levar alguns instantes</p>
        </div>
      );
    }

    if (tickets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 animate-fade-in">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
            {mainTab === "search" ? (
              <Search className="h-10 w-10 relative" />
            ) : mainTab === "closed" ? (
              <CheckCircle className="h-10 w-10 relative" />
            ) : (
              <Inbox className="h-10 w-10 relative" />
            )}
          </div>
          <p className="text-sm font-medium mb-1">
            {mainTab === "search"
              ? (searchQuery ? "Nenhum resultado encontrado" : "Digite para buscar tickets")
              : mainTab === "closed"
              ? "Nenhum ticket resolvido"
              : `Nenhum ticket ${subTab === "open" ? "em atendimento" : "aguardando"}`
            }
          </p>
          <p className="text-xs text-muted-foreground/60">
            {mainTab === "search" && searchQuery && "Tente usar termos diferentes"}
            {mainTab === "open" && "Novos tickets aparecerão aqui automaticamente"}
            {mainTab === "closed" && "Tickets resolvidos aparecerão aqui"}
          </p>
        </div>
      );
    }

    return (
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
      >
        <div style={containerStyle}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index >= tickets.length;
            const ticket = tickets[virtualRow.index];

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualRow.size + "px",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground py-4">
                    {loadingMore ? (
                      <div className="flex items-center gap-2 animate-fade-in">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Carregando mais...</span>
                      </div>
                    ) : hasMore ? (
                      <span className="text-sm text-muted-foreground/50">...</span>
                    ) : (
                      <div className="flex flex-col items-center animate-fade-in">
                        <span className="text-sm">Fim da lista</span>
                        <span className="text-xs text-muted-foreground/60 mt-1">
                          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} carregado{tickets.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <TicketListItem
                    ticket={ticket}
                    isSelected={selectedTicket?.id === ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    session={session}
                    queues={queues}
                    onUpdate={() => {
                      fetchTickets(true);
                      onTicketUpdate();
                    }}
                    selectionMode={selectionMode}
                    isChecked={selectedIds.has(ticket.id)}
                    isProcessing={processingIds.has(ticket.id)}
                    onCheckChange={(checked) => toggleSelection(ticket.id, checked)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Main Tabs */}
      <div className="flex shrink-0 border-b bg-card overflow-x-auto scrollbar-hide" role="tablist" aria-label="Navegação de tickets">
        <TabButton
          value="open"
          active={mainTab === "open"}
          onClick={() => setMainTab("open")}
          icon={Inbox}
          label="Abertos"
          count={openCount + pendingCount}
          data-testid="tab-1"
          aria-selected={mainTab === "open"}
          aria-controls="tickets-panel"
        />
        <TabButton
          value="closed"
          active={mainTab === "closed"}
          onClick={() => setMainTab("closed")}
          icon={CheckCircle}
          label="Resolvidos"
          count={closedCount}
          data-testid="tab-2"
          aria-selected={mainTab === "closed"}
          aria-controls="tickets-panel"
        />
        <TabButton
          value="search"
          active={mainTab === "search"}
          onClick={() => setMainTab("search")}
          icon={Search}
          label="Buscar"
          data-testid="tab-3"
          aria-selected={mainTab === "search"}
          aria-controls="tickets-panel"
        />
      </div>

      {/* Options Bar */}
      <div className="flex items-center gap-2 p-2 bg-card border-b shrink-0">
        {/* Universal Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={mainTab === "search" ? "Buscar em todos os tickets..." : "Buscar tickets..."}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchInput && !globalSearchEnabled) {
                setGlobalSearchEnabled(true);
                setMainTab("search");
              }
            }}
            className={cn(
              "pl-10 pr-8 focus-ring transition-smooth",
              globalSearchEnabled && "border-primary animate-pulse-once"
            )}
            data-testid="search-input"
            aria-label="Buscar tickets"
            role="searchbox"
            aria-expanded={globalSearchEnabled}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                if (globalSearchEnabled) {
                  setGlobalSearchEnabled(false);
                  setMainTab("open");
                }
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        {mainTab !== "search" && !globalSearchEnabled && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewTicketModalOpen(true)}
              className="w-8 h-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (selectionMode) {
                  clearSelection();
                } else {
                  setSelectionMode(true);
                }
              }}
              className="w-8 h-8 p-0"
            >
              {selectionMode ? (
                <X className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
          </>
        )}

        {/* Queue Filter */}
        <Select value={selectedQueueId} onValueChange={setSelectedQueueId}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Fila" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {queues.map((queue) => (
              <SelectItem key={queue.id} value={queue.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: queue.color }}
                  />
                  {queue.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchTickets(true)}
          className="h-8 w-8"
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>

        {/* Show All Toggle (only when not searching) */}
        {mainTab !== "search" && !globalSearchEnabled && (
          <div className="flex items-center gap-2">
            <Label htmlFor="showAll" className="text-xs text-muted-foreground hidden sm:inline">
              Todos
            </Label>
            <Switch
              id="showAll"
              checked={showAll}
              onCheckedChange={setShowAll}
            />
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectionMode && (
        <div className={cn(
          "flex items-center justify-between px-3 py-2 border-b shrink-0 transition-all duration-200",
          selectedIds.size > 0 
            ? "bg-primary/5 border-primary/20" 
            : "bg-muted/20 border-muted/30"
        )}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">
                {selectedIds.size}
              </span>
              <span className="text-muted-foreground">
                {selectedIds.size === 1 ? "selecionado" : "selecionados"}
              </span>
            </div>
            
            {selectedIds.size > 0 && (
              <div className="h-4 w-px bg-border mx-1" />
            )}
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                disabled={selectedIds.size === tickets.length}
                className="h-7 w-7 p-0"
              >
                <CheckSquare className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={acceptLoading || resolveLoading}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkAccept}
                disabled={acceptLoading || resolveLoading}
                className="h-7 w-7 p-0"
              >
                {acceptLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkResolve}
                disabled={acceptLoading || resolveLoading}
                className="h-7 w-7 p-0"
              >
                {resolveLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sub Tabs for Open */}
      {mainTab === "open" && (
        <div className="flex gap-1 p-1 bg-muted/50 shrink-0 overflow-x-auto scrollbar-hide">
          <SubTabButton
            value="open"
            active={subTab === "open"}
            onClick={() => {
              setSubTab("open");
              onSubTabChange?.("open");
            }}
            label="Atendendo"
            count={openCount}
          />
          <SubTabButton
            value="pending"
            active={subTab === "pending"}
            onClick={() => {
              setSubTab("pending");
              onSubTabChange?.("pending");
            }}
            label="Aguardando"
            count={pendingCount}
            variant="warning"
          />
        </div>
      )}

      {/* Ticket List */}
      <div
        className="flex-1 min-h-0 overflow-hidden scrollbar-thin"
        role="tabpanel"
        id="tickets-panel"
        aria-label={`Lista de tickets - ${mainTab === "open" ? "Abertos" : mainTab === "closed" ? "Resolvidos" : "Busca"}`}
      >
        {renderTicketList()}
      </div>

      <NewTicketModal
        open={newTicketModalOpen}
        onOpenChange={setNewTicketModalOpen}
        session={session}
        onCreated={(ticket) => {
          fetchTickets(true);
          onSelectTicket(ticket);
        }}
      />
    </div>
  );
}
