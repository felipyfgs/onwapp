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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Inbox,
  CheckCircle,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  CheckCheck,
  PlayCircle,
  X,
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
import { cn, debounce } from "@/lib/utils";

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
    setBulkLoading(true);
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
    
    setBulkLoading(false);
    clearSelection();
    fetchTickets(true);
    onTicketUpdate();
    
    if (failed > 0) {
      toast.error(`${failed} ticket(s) falharam`);
    }
    if (success > 0) {
      toast.success(`${success} ticket(s) aceitos`);
    }
  }, [selectedIds, session, clearSelection, fetchTickets, onTicketUpdate]);

  const handleBulkResolve = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
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
    
    setBulkLoading(false);
    clearSelection();
    fetchTickets(true);
    onTicketUpdate();
    
    if (failed > 0) {
      toast.error(`${failed} ticket(s) falharam`);
    }
    if (success > 0) {
      toast.success(`${success} ticket(s) resolvidos`);
    }
  }, [selectedIds, session, clearSelection, fetchTickets, onTicketUpdate]);

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
    estimateSize: () => 76,
    overscan: 5,
  });

  const openCount = stats?.open || 0;
  const pendingCount = stats?.pending || 0;
  const closedCount = stats?.closed || 0;

  const TabButton = ({ 
    value, 
    active, 
    onClick, 
    icon: Icon, 
    label, 
    count 
  }: { 
    value: string; 
    active: boolean; 
    onClick: () => void; 
    icon: React.ElementType; 
    label: string; 
    count?: number;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 text-xs sm:text-sm font-medium transition-colors",
        active 
          ? "bg-accent text-accent-foreground border-b-2 border-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="ml-0 sm:ml-1 h-5 min-w-5 px-1 text-xs shrink-0">
          {count}
        </Badge>
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
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm">Carregando tickets...</p>
        </div>
      );
    }

    if (tickets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
          {mainTab === "search" ? (
            <>
              <Search className="h-10 w-10 mb-2" />
              <p className="text-sm">
                {searchQuery ? "Nenhum resultado encontrado" : "Digite para buscar tickets"}
              </p>
            </>
          ) : mainTab === "closed" ? (
            <>
              <CheckCircle className="h-10 w-10 mb-2" />
              <p className="text-sm">Nenhum ticket resolvido</p>
            </>
          ) : (
            <>
              <Inbox className="h-10 w-10 mb-2" />
              <p className="text-sm">
                Nenhum ticket {subTab === "open" ? "em atendimento" : "aguardando"}
              </p>
            </>
          )}
        </div>
      );
    }

    return (
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
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
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {loadingMore ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Carregando mais...</span>
                      </div>
                    ) : hasMore ? (
                      <span className="text-sm text-muted-foreground/50">...</span>
                    ) : (
                      <span className="text-sm">Fim da lista</span>
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
      <div className="flex shrink-0 border-b bg-card overflow-x-auto scrollbar-hide">
        <TabButton
          value="open"
          active={mainTab === "open"}
          onClick={() => setMainTab("open")}
          icon={Inbox}
          label="Abertos"
          count={openCount + pendingCount}
        />
        <TabButton
          value="closed"
          active={mainTab === "closed"}
          onClick={() => setMainTab("closed")}
          icon={CheckCircle}
          label="Resolvidos"
          count={closedCount}
        />
        <TabButton
          value="search"
          active={mainTab === "search"}
          onClick={() => setMainTab("search")}
          icon={Search}
          label="Buscar"
        />
      </div>

      {/* Options Bar */}
      <div className="flex items-center gap-2 p-2 bg-card border-b shrink-0">
        {mainTab === "search" ? (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou numero..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewTicketModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <Label htmlFor="showAll" className="text-xs text-muted-foreground hidden sm:inline">
                Todos
              </Label>
              <Switch
                id="showAll"
                checked={showAll}
                onCheckedChange={setShowAll}
              />
            </div>
          </>
        )}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchTickets(true)}
          className="h-8 w-8"
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

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
      <div className="flex-1 min-h-0 overflow-hidden">
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
