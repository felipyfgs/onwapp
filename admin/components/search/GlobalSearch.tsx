"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Command } from "cmdk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search,
  MessageSquare,
  Users,
  Smartphone,
  Settings,
  FileText,
  Hash,
  ArrowRight,
  Clock,
  Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: "session" | "chat" | "contact" | "ticket" | "settings" | "recent";
  url: string;
  icon: React.ElementType;
  badge?: string;
  shortcut?: string;
  recent?: boolean;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "Sessão Principal",
    description: "WhatsApp Business conectado",
    category: "session",
    url: "/sessions/main",
    icon: Smartphone,
    badge: "Online"
  },
  {
    id: "2",
    title: "João Silva",
    description: "Última mensagem: há 5 minutos",
    category: "chat",
    url: "/chats?contact=joao",
    icon: MessageSquare,
    badge: "3 novas"
  },
  {
    id: "3",
    title: "Ticket #1234",
    description: "Problema com pedido - Aguardando",
    category: "ticket",
    url: "/tickets/1234",
    icon: FileText,
    badge: "Urgente"
  },
  {
    id: "4",
    title: "Contatos",
    description: "Gerenciar lista de contatos",
    category: "recent",
    url: "/contacts",
    icon: Users,
    recent: true
  },
  {
    id: "5",
    title: "Configurações da API",
    description: "Webhooks e integrações",
    category: "settings",
    url: "/settings/api",
    icon: Settings
  }
];

const recentSearches = [
  "João Silva",
  "Ticket #1234",
  "Configurações",
  "Sessões"
];

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentItems, setRecentItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setRecentItems(mockResults.filter(item => item.recent));
      return;
    }

    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    const filtered = mockResults.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
    setRecentItems([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      setResults([]);
      setRecentItems(mockResults.filter(item => item.recent));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(search);
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [search, performSearch]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.url);
    onOpenChange(false);

    // Add to recent searches
    // This would typically save to localStorage or backend
  };

  const getCategoryIcon = (category: SearchResult["category"]) => {
    switch (category) {
      case "session":
        return Smartphone;
      case "chat":
        return MessageSquare;
      case "contact":
        return Users;
      case "ticket":
        return FileText;
      case "settings":
        return Settings;
      default:
        return Hash;
    }
  };

  const getCategoryColor = (category: SearchResult["category"]) => {
    switch (category) {
      case "session":
        return "text-green-500 bg-green-50";
      case "chat":
        return "text-blue-500 bg-blue-50";
      case "contact":
        return "text-purple-500 bg-purple-50";
      case "ticket":
        return "text-orange-500 bg-orange-50";
      case "settings":
        return "text-gray-500 bg-gray-50";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const displayItems = search.length > 0 ? results : recentItems;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              ref={inputRef}
              placeholder="Buscar sessões, contatos, tickets, configurações..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch("")}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            )}
          </div>

          <Command.List className="max-h-[450px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search ? "Nenhum resultado encontrado" : "Comece a digitar para buscar"}
                </p>
                {search && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente usar termos diferentes
                  </p>
                )}
              </div>
            ) : (
              <>
                {search.length === 0 && recentItems.length > 0 && (
                  <Command.Group heading="Recentes">
                    {recentItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Command.Item
                          key={item.id}
                          value={item.title}
                          onSelect={() => handleSelect(item)}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                )}

                {search.length > 0 && (
                  <Command.Group heading="Resultados">
                    {displayItems.map((item) => {
                      const Icon = item.icon;
                      const CategoryIcon = getCategoryIcon(item.category);
                      const categoryColor = getCategoryColor(item.category);

                      return (
                        <Command.Item
                          key={item.id}
                          value={item.title}
                          onSelect={() => handleSelect(item)}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {item.title}
                              </p>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center",
                              categoryColor
                            )}>
                              <CategoryIcon className="h-3 w-3" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                )}

                {search.length === 0 && (
                  <Command.Group heading="Buscas Recentes">
                    {recentSearches.map((term, index) => (
                      <Command.Item
                        key={index}
                        value={term}
                        onSelect={() => setSearch(term)}
                        className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent cursor-pointer"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{term}</span>
                        <Star className="h-3 w-3 text-muted-foreground ml-auto" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}