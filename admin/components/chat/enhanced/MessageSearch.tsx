"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar,
  Filter,
  Search,
  X,
  Clock,
  MessageCircle,
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessageSearch } from "@/hooks/chat/useMessageSearch";
import { Message } from "@/lib/api";
import { MessageBubble } from "../MessageBubble";

interface MessageSearchProps {
  session: string;
  chatJid?: string;
  onMessageSelect?: (message: Message) => void;
  className?: string;
  inline?: boolean;
}

export function MessageSearch({
  session,
  chatJid,
  onMessageSelect,
  className,
  inline = false,
}: MessageSearchProps) {
  const {
    searchResults,
    totalResults,
    hasMore,
    loading,
    error,
    currentQuery,
    search,
    loadMore,
    clearSearch,
    filters,
    updateFilters,
    highlightText,
    getSuggestions,
    exportResults,
    searchHistory,
  } = useMessageSearch(session);

  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [dateRange, setDateRange] = useState({
    from: filters.dateFrom || "",
    to: filters.dateTo || "",
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      search(value, chatJid);
    } else {
      clearSearch();
    }

    setShowSuggestions(value.trim().length > 0);
  }, [search, clearSearch, chatJid]);

  // Handle message selection
  const handleMessageClick = useCallback((message: Message) => {
    setSelectedMessage(message);
    onMessageSelect?.(message);
    setShowSuggestions(false);
  }, [onMessageSelect]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    const newFilters = { ...filters };
    
    switch (filterType) {
      case 'dateFrom':
        newFilters.dateFrom = value || undefined;
        break;
      case 'dateTo':
        newFilters.dateTo = value || undefined;
        break;
      case 'messageType':
        newFilters.messageType = value || undefined;
        break;
      case 'hasMedia':
        newFilters.hasMedia = value === 'true';
        break;
    }
    
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // Apply date range filter
  const applyDateRange = useCallback(() => {
    handleFilterChange('dateFrom', dateRange.from);
    handleFilterChange('dateTo', dateRange.to);
  }, [dateRange, handleFilterChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setDateRange({ from: "", to: "" });
    updateFilters({});
  }, [updateFilters]);

  // Get media type icon
  const getMediaTypeIcon = useCallback((messageType: string) => {
    switch (messageType) {
      case 'image':
        return <ImageIcon className="h-3 w-3" />;
      case 'video':
        return <Video className="h-3 w-3" />;
      case 'audio':
        return <Mic className="h-3 w-3" />;
      case 'document':
        return <FileText className="h-3 w-3" />;
      default:
        return <MessageCircle className="h-3 w-3" />;
    }
  }, []);

  // Suggestions dropdown
  const SuggestionsDropdown = () => {
    const suggestions = getSuggestions(currentQuery);
    
    if (suggestions.length === 0) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50">
        <div className="p-2">
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Recent searches
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm"
              onClick={() => {
                handleSearchChange(suggestion);
                inputRef.current?.focus();
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Filters popover
  const FiltersPopover = () => (
    <Popover open={showFilters} onOpenChange={setShowFilters}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
        >
          <Filter className="h-3 w-3" />
          Filters
          {(filters.dateFrom || filters.dateTo || filters.messageType || filters.hasMedia !== undefined) && (
            <div className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Date Range</h4>
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="From"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="h-8"
              />
              <Input
                type="date"
                placeholder="To"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="h-8"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={applyDateRange} className="flex-1 h-7">
                  Apply
                </Button>
                <Button size="sm" variant="outline" onClick={clearFilters} className="flex-1 h-7">
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-sm mb-2">Message Type</h4>
            <select
              value={filters.messageType || ""}
              onChange={(e) => handleFilterChange('messageType', e.target.value)}
              className="w-full h-8 px-2 rounded border bg-background text-sm"
            >
              <option value="">All types</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
            </select>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Media</h4>
            <select
              value={filters.hasMedia === true ? "true" : filters.hasMedia === false ? "false" : ""}
              onChange={(e) => handleFilterChange('hasMedia', e.target.value)}
              className="w-full h-8 px-2 rounded border bg-background text-sm"
            >
              <option value="">All messages</option>
              <option value="true">With media</option>
              <option value="false">Text only</option>
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  // Results display
  const ResultsDisplay = () => {
    if (loading && searchResults.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Searching messages...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-sm text-destructive">Search failed: {error}</p>
            <Button size="sm" variant="outline" onClick={() => search(currentQuery, chatJid)} className="mt-2">
              Try again
            </Button>
          </div>
        </div>
      );
    }

    if (searchResults.length === 0 && currentQuery) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No messages found for "{currentQuery}"</p>
          </div>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Type to search messages</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-xs text-muted-foreground">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </p>
          {totalResults > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => exportResults('json')}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {searchResults.map((message) => (
            <div
              key={message.id}
              onClick={() => handleMessageClick(message)}
              className={cn(
                "p-3 border-b hover:bg-accent cursor-pointer transition-colors",
                selectedMessage?.id === message.id && "bg-accent"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {message.senderName || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                    {message.type !== 'text' && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getMediaTypeIcon(message.type)}
                      </div>
                    )}
                  </div>
                  <div 
                    className="text-sm text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(message.content || '', currentQuery)
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="p-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  if (inline) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search messages..."
            value={currentQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-8"
          />
          {currentQuery && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <SuggestionsDropdown />
        </div>
        <ResultsDisplay />
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <CardTitle className="text-sm">Message Search</CardTitle>
          <div className="flex-1" />
          <FiltersPopover />
        </div>
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder="Search messages..."
            value={currentQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-8"
          />
          {currentQuery && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <SuggestionsDropdown />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResultsDisplay />
      </CardContent>
    </Card>
  );
}