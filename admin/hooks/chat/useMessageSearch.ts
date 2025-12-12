"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Message } from "@/lib/api";
import { getGlobalChatCache } from "./useChatCache";

interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  messageType?: string;
  sender?: string;
  hasMedia?: boolean;
}

interface SearchOptions {
  query: string;
  session: string;
  chatJid?: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  messages: Message[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  error?: string;
}

export function useMessageSearch(session: string) {
  const [searchState, setSearchState] = useState<SearchResult>({
    messages: [],
    total: 0,
    hasMore: true,
    loading: false,
  });
  
  const [currentSearch, setCurrentSearch] = useState<string>("");
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: "",
    session,
  });
  
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const cache = getGlobalChatCache();

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (options: SearchOptions) => {
      if (!options.query.trim()) {
        setSearchState(prev => ({ ...prev, messages: [], total: 0, loading: false }));
        return;
      }

      setSearchState(prev => ({ ...prev, loading: true, error: undefined }));

      try {
        // Check cache first
        const cacheKey = generateCacheKey(options);
        const cached = cache?.get(cacheKey);
        
        if (cached) {
          setSearchState({
            messages: cached.messages,
            total: cached.total,
            hasMore: cached.hasMore,
            loading: false,
          });
          return;
        }

        // Perform API search
        const results = await searchMessagesAPI(options);
        
        // Cache results
        cache?.set(cacheKey, results, 2 * 60 * 1000); // 2 minutes cache
        
        setSearchState({
          messages: results.messages,
          total: results.total,
          hasMore: results.hasMore,
          loading: false,
        });

        // Update search history
        if (options.query && !searchHistory.includes(options.query)) {
          setSearchHistory(prev => [options.query, ...prev.slice(0, 9)]);
        }

      } catch (error) {
        console.error("Search failed:", error);
        setSearchState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Search failed",
        }));
      }
    }, 300),
    [cache, searchHistory]
  );

  // Generate cache key
  const generateCacheKey = useCallback((options: SearchOptions): string => {
    const parts = [
      'search',
      options.session,
      options.query,
      options.chatJid || 'all',
      JSON.stringify(options.filters || {}),
      options.limit?.toString() || '50',
      options.offset?.toString() || '0',
    ];
    return parts.join(':');
  }, []);

  // Mock API search function (replace with actual API call)
  const searchMessagesAPI = useCallback(async (options: SearchOptions) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // In a real implementation, this would call the backend
    const response = await fetch(`/api/${options.session}/messages/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    return response.json();
  }, []);

  // Perform search
  const search = useCallback((query: string, chatJid?: string) => {
    const options: SearchOptions = {
      query,
      session,
      chatJid,
      filters,
      limit: 50,
      offset: 0,
    };
    
    setCurrentSearch(query);
    setSearchOptions(options);
    debouncedSearch(options);
  }, [session, filters, debouncedSearch]);

  // Load more results
  const loadMore = useCallback(() => {
    if (!searchState.hasMore || searchState.loading) return;
    
    const options: SearchOptions = {
      ...searchOptions,
      offset: searchOptions.offset + (searchOptions.limit || 50),
    };
    
    setSearchOptions(options);
    debouncedSearch(options);
  }, [searchState.hasMore, searchState.loading, searchOptions, debouncedSearch]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Re-run search with new filters
    if (currentSearch) {
      search(currentSearch, searchOptions.chatJid);
    }
  }, [filters, currentSearch, searchOptions.chatJid, search]);

  // Clear search
  const clearSearch = useCallback(() => {
    setCurrentSearch("");
    setSearchOptions({ query: "", session });
    setSearchState({
      messages: [],
      total: 0,
      hasMore: true,
      loading: false,
    });
  }, [session]);

  // Highlight search query in text
  const highlightText = useCallback((text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }, []);

  // Escape regex special characters
  const escapeRegExp = useCallback((string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);

  // Get search suggestions based on history
  const getSuggestions = useCallback((query: string): string[] => {
    if (!query.trim()) return [];
    
    return searchHistory.filter(item =>
      item.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }, [searchHistory]);

  // Filter search results by date
  const filterByDate = useCallback((messages: Message[], dateFrom?: string, dateTo?: string): Message[] => {
    if (!dateFrom && !dateTo) return messages;
    
    return messages.filter(message => {
      const messageDate = new Date(message.timestamp);
      
      if (dateFrom && messageDate < new Date(dateFrom)) return false;
      if (dateTo && messageDate > new Date(dateTo)) return false;
      
      return true;
    });
  }, []);

  // Export search results
  const exportResults = useCallback(async (format: 'json' | 'csv' = 'json') => {
    try {
      const data = {
        query: currentSearch,
        filters,
        results: searchState.messages,
        total: searchState.total,
        exportedAt: new Date().toISOString(),
      };
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export logic here
        console.log('CSV export not implemented yet');
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [currentSearch, filters, searchState]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    // Search state
    searchResults: searchState.messages,
    totalResults: searchState.total,
    hasMore: searchState.hasMore,
    loading: searchState.loading,
    error: searchState.error,
    currentQuery: currentSearch,
    
    // Search methods
    search,
    loadMore,
    clearSearch,
    
    // Filters
    filters,
    updateFilters,
    
    // Utilities
    highlightText,
    getSuggestions,
    filterByDate,
    exportResults,
    
    // History
    searchHistory,
    clearHistory,
  };
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}