"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, debounce } from "@/lib/utils";
import { Search, RefreshCw, Loader2, MessageCircle, X } from "lucide-react";
import { ChatListItem } from "./ChatListItem";
import { getChats, type Chat } from "@/lib/api";
import { toast } from "sonner";

interface ChatListProps {
  session: string;
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  refreshTrigger?: number;
}

const ITEMS_PER_PAGE = 30;
const SCROLL_THRESHOLD = 300;

export function ChatList({
  session,
  selectedChat,
  onSelectChat,
  refreshTrigger,
}: ChatListProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
  }, []);

  const fetchChats = useCallback(async (reset = false) => {
    if (!session) return;

    if (reset) {
      offsetRef.current = 0;
      setHasMore(true);
    }

    if (loadingMoreRef.current) return;

    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      loadingMoreRef.current = true;

      const response = await getChats(session);
      let newChats = response || [];

      // Client-side filtering by search
      if (searchQuery) {
        newChats = newChats.filter(chat => {
          const name = chat.name || chat.contactName || chat.jid;
          return name.toLowerCase().includes(searchQuery.toLowerCase());
        });
      }

      if (reset) {
        setChats(newChats);
        scrollRef.current?.scrollTo({ top: 0 });
      } else {
        setChats((prev) => [...prev, ...newChats]);
      }

      setHasMore(false); // No pagination since we load all chats

    } catch (error: any) {
      console.error("Failed to load chats:", error);
      toast.error(error?.message || "Falha ao carregar chats");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [session, searchQuery]);

  const handleRefresh = useCallback(() => {
    fetchChats(true);
  }, [fetchChats]);

  const handleScroll = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !hasMore || loadingMoreRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceFromBottom < SCROLL_THRESHOLD) {
      fetchChats(false);
    }
  }, [hasMore, fetchChats]);

  useEffect(() => {
    fetchChats(true);
  }, [session, searchQuery, refreshTrigger]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const filteredChats = useMemo(() => {
    return chats;
  }, [chats]);

  const rowVirtualizer = useVirtualizer({
    count: filteredChats.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="border-b p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Conversas
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9 h-9"
            data-testid="search-input"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ minHeight: 0 }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa"}
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const chat = filteredChats[virtualRow.index];
              return (
                <div
                  key={chat.jid}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ChatListItem
                    chat={chat}
                    selected={selectedChat?.jid === chat.jid}
                    onClick={() => onSelectChat(chat)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
