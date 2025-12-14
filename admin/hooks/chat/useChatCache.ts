"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Message, Chat } from "@/lib/api";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface ChatCacheConfig {
  maxSize: number;
  defaultTTL: number; // in milliseconds
  cleanupInterval: number;
}

const DEFAULT_CONFIG: ChatCacheConfig = {
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
};

export function useChatCache(config: Partial<ChatCacheConfig> = {}) {
  const cacheConfig = { ...DEFAULT_CONFIG, ...config };
  const cacheRef = useRef<Map<string, CacheItem<any>>>(new Map());
  const cleanupIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    size: 0,
  });

  // Cleanup expired items
  const cleanup = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;

    for (const [key, item] of cache.entries()) {
      if (now > item.expiresAt) {
        cache.delete(key);
      }
    }

    // Enforce max size
    if (cache.size > cacheConfig.maxSize) {
      const entries = Array.from(cache.entries());
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest entries
      const toRemove = entries.slice(0, cache.size - cacheConfig.maxSize);
      toRemove.forEach(([key]) => cache.delete(key));
    }

    updateCacheStats();
  }, [cacheConfig]);

  // Update cache statistics
  const updateCacheStats = useCallback(() => {
    setCacheStats(prev => ({
      ...prev,
      size: cacheRef.current.size,
    }));
  }, []);

  // Generate cache key
  const generateKey = useCallback((prefix: string, ...parts: string[]) => {
    return [prefix, ...parts].join(':');
  }, []);

  // Set item in cache
  const set = useCallback(<T>(
    key: string,
    data: T,
    ttl: number = cacheConfig.defaultTTL
  ) => {
    const now = Date.now();
    const expiresAt = now + ttl;

    cacheRef.current.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });

    updateCacheStats();
  }, [cacheConfig.defaultTTL, updateCacheStats]);

  // Get item from cache
  const get = useCallback(<T>(key: string): T | null => {
    const cache = cacheRef.current;
    const item = cache.get(key);

    if (!item) {
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    const now = Date.now();
    if (now > item.expiresAt) {
      cache.delete(key);
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    return item.data as T;
  }, [setCacheStats]);

  // Delete item from cache
  const del = useCallback((key: string) => {
    const deleted = cacheRef.current.delete(key);
    if (deleted) {
      updateCacheStats();
    }
    return deleted;
  }, [updateCacheStats]);

  // Clear all cache
  const clear = useCallback(() => {
    cacheRef.current.clear();
    updateCacheStats();
  }, [updateCacheStats]);

  // Message-specific cache methods
  const cacheMessages = useCallback((
    session: string,
    chatJid: string,
    messages: Message[],
    ttl?: number
  ) => {
    const key = generateKey('messages', session, chatJid);
    set(key, messages, ttl);
  }, [generateKey, set]);

  const getCachedMessages = useCallback((
    session: string,
    chatJid: string
  ): Message[] | null => {
    const key = generateKey('messages', session, chatJid);
    return get(key);
  }, [generateKey, get]);

  // Chat-specific cache methods
  const cacheChat = useCallback((
    session: string,
    chat: Chat,
    ttl?: number
  ) => {
    const key = generateKey('chat', session, chat.jid);
    set(key, chat, ttl);
  }, [generateKey, set]);

  const getCachedChat = useCallback((
    session: string,
    chatJid: string
  ): Chat | null => {
    const key = generateKey('chat', session, chatJid);
    return get(key);
  }, [generateKey, get]);

  // Ticket-specific cache methods
  const cacheTicketList = useCallback((
    session: string,
    params: string,
    tickets: any[],
    ttl?: number
  ) => {
    const key = generateKey('tickets', session, params);
    set(key, tickets, ttl);
  }, [generateKey, set]);

  const getCachedTicketList = useCallback((
    session: string,
    params: string
  ): any[] | null => {
    const key = generateKey('tickets', session, params);
    return get(key);
  }, [generateKey, get]);

  // Invalidate cache for specific patterns
  const invalidatePattern = useCallback((pattern: string) => {
    const cache = cacheRef.current;
    const regex = new RegExp(pattern);

    for (const [key] of cache.entries()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }

    updateCacheStats();
  }, [updateCacheStats]);

  const invalidateSession = useCallback((session: string) => {
    invalidatePattern(`.*:${session}:.*`);
  }, [invalidatePattern]);

  const invalidateChat = useCallback((session: string, chatJid: string) => {
    invalidatePattern(`(messages|chat):${session}:${chatJid}`);
  }, [invalidatePattern]);

  const invalidateTickets = useCallback((session: string) => {
    invalidatePattern(`tickets:${session}:.*`);
  }, [invalidatePattern]);

  // Setup cleanup interval
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(cleanup, cacheConfig.cleanupInterval);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [cleanup, cacheConfig.cleanupInterval]);

  // Initial cleanup
  useEffect(() => {
    cleanup();
  }, [cleanup]);

  // Debug: Log cache stats in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Chat Cache Stats:', cacheStats);
    }
  }, [cacheStats]);

  return {
    // Generic cache methods
    set,
    get,
    delete: del,
    clear,

    // Specific cache methods
    cacheMessages,
    getCachedMessages,
    cacheChat,
    getCachedChat,
    cacheTicketList,
    getCachedTicketList,

    // Invalidation methods
    invalidatePattern,
    invalidateSession,
    invalidateChat,
    invalidateTickets,

    // Cache statistics
    stats: cacheStats,

    // Cleanup method
    cleanup,
  };
}

// Global cache instance for sharing between components
let globalCache: ReturnType<typeof useChatCache> | null = null;

export function getGlobalChatCache() {
  if (!globalCache) {
    globalCache = useChatCache();
  }
  return globalCache;
}