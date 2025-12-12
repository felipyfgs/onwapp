"use client";

import { useState, useCallback, useEffect } from "react";
import { QuickReply } from "@/lib/api";
import { getGlobalChatCache } from "./useChatCache";
import { toast } from "sonner";

interface UseQuickRepliesOptions {
  session: string;
  autoLoad?: boolean;
  cacheEnabled?: boolean;
}

export function useQuickReplies({ session, autoLoad = true, cacheEnabled = true }: UseQuickRepliesOptions) {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const cache = getGlobalChatCache();

  // Load quick replies from API
  const loadQuickReplies = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first
      if (cacheEnabled) {
        const cached = cache?.getCachedQuickReplies?.(session);
        if (cached) {
          setQuickReplies(cached);
          setLoading(false);
          return;
        }
      }
      
      // Fetch from API
      const response = await fetch(`/api/${session}/quick-replies`);
      if (!response.ok) {
        throw new Error('Failed to load quick replies');
      }
      
      const data = await response.json();
      const replies = Array.isArray(data) ? data : data.data || [];
      
      setQuickReplies(replies);
      
      // Cache results
      if (cacheEnabled) {
        cache?.cacheQuickReplies?.(session, replies);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to load quick replies:', err);
    } finally {
      setLoading(false);
    }
  }, [session, cache, cacheEnabled]);

  // Create new quick reply
  const createQuickReply = useCallback(async (data: { shortcut: string; message: string }) => {
    try {
      const response = await fetch(`/api/${session}/quick-replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create quick reply');
      }
      
      const newReply: QuickReply = await response.json();
      
      setQuickReplies(prev => [...prev, newReply]);
      
      // Clear cache
      if (cacheEnabled) {
        cache?.invalidateQuickReplies?.(session);
      }
      
      toast.success('Quick reply created successfully');
      return newReply;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create quick reply';
      toast.error(errorMessage);
      throw err;
    }
  }, [session, cache, cacheEnabled]);

  // Update quick reply
  const updateQuickReply = useCallback(async (id: string, data: Partial<QuickReply>) => {
    try {
      const response = await fetch(`/api/${session}/quick-replies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update quick reply');
      }
      
      const updatedReply: QuickReply = await response.json();
      
      setQuickReplies(prev => 
        prev.map(reply => 
          reply.id === id ? updatedReply : reply
        )
      );
      
      // Clear cache
      if (cacheEnabled) {
        cache?.invalidateQuickReplies?.(session);
      }
      
      toast.success('Quick reply updated successfully');
      return updatedReply;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update quick reply';
      toast.error(errorMessage);
      throw err;
    }
  }, [session, cache, cacheEnabled]);

  // Delete quick reply
  const deleteQuickReply = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/${session}/quick-replies/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete quick reply');
      }
      
      setQuickReplies(prev => prev.filter(reply => reply.id !== id));
      
      // Clear cache
      if (cacheEnabled) {
        cache?.invalidateQuickReplies?.(session);
      }
      
      toast.success('Quick reply deleted successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quick reply';
      toast.error(errorMessage);
      throw err;
    }
  }, [session, cache, cacheEnabled]);

  // Find quick reply by shortcut
  const findQuickReply = useCallback((shortcut: string): QuickReply | null => {
    // Try exact match first
    let reply = quickReplies.find(r => r.shortcut === shortcut);
    if (reply) return reply;
    
    // Try partial match
    reply = quickReplies.find(r => 
      r.shortcut.toLowerCase().includes(shortcut.toLowerCase()) ||
      shortcut.toLowerCase().includes(r.shortcut.toLowerCase())
    );
    
    return reply || null;
  }, [quickReplies]);

  // Search quick replies
  const searchQuickReplies = useCallback((query: string): QuickReply[] => {
    if (!query.trim()) return quickReplies;
    
    const lowerQuery = query.toLowerCase();
    return quickReplies.filter(reply => 
      reply.shortcut.toLowerCase().includes(lowerQuery) ||
      reply.message.toLowerCase().includes(lowerQuery)
    );
  }, [quickReplies]);

  // Get quick reply suggestions for current text
  const getSuggestions = useCallback((text: string, cursorPosition: number): QuickReply[] => {
    // Check if text contains shortcut pattern (e.g., /hello)
    const beforeCursor = text.substring(0, cursorPosition);
    const shortcutMatch = beforeCursor.match(/\/([a-zA-Z0-9_]+)?$/);
    
    if (!shortcutMatch) return [];
    
    const shortcut = shortcutMatch[1] || "";
    return searchQuickReplies(shortcut);
  }, [searchQuickReplies]);

  // Expand shortcut in text
  const expandShortcut = useCallback((text: string, cursorPosition: number): { expandedText: string; newCursorPosition: number } | null => {
    const beforeCursor = text.substring(0, cursorPosition);
    const shortcutMatch = beforeCursor.match(/\/([a-zA-Z0-9_]+)$/);
    
    if (!shortcutMatch) return null;
    
    const shortcut = shortcutMatch[1];
    const quickReply = findQuickReply(shortcut);
    
    if (!quickReply) return null;
    
    // Replace shortcut with message
    const shortcutStart = beforeCursor.lastIndexOf('/');
    const afterCursor = text.substring(cursorPosition);
    
    const expandedText = beforeCursor.substring(0, shortcutStart) + quickReply.message + afterCursor;
    const newCursorPosition = shortcutStart + quickReply.message.length;
    
    return { expandedText, newCursorPosition };
  }, [findQuickReply]);

  // Auto-load quick replies
  useEffect(() => {
    if (autoLoad && session) {
      loadQuickReplies();
    }
  }, [autoLoad, session, loadQuickReplies]);

  // Filtered results based on search
  const filteredReplies = searchQuery 
    ? searchQuickReplies(searchQuery)
    : quickReplies;

  // Get most used quick replies
  const getMostUsed = useCallback((limit = 5): QuickReply[] => {
    // This would require usage tracking from the backend
    // For now, return first few replies
    return quickReplies.slice(0, limit);
  }, [quickReplies]);

  // Get recently used quick replies
  const getRecentlyUsed = useCallback((limit = 5): QuickReply[] => {
    // This would require usage tracking from the backend
    // For now, return last few replies
    return quickReplies.slice(-limit);
  }, [quickReplies]);

  // Validate shortcut
  const validateShortcut = useCallback((shortcut: string, excludeId?: string): { valid: boolean; error?: string } => {
    if (!shortcut.trim()) {
      return { valid: false, error: 'Shortcut cannot be empty' };
    }
    
    if (shortcut.length < 2) {
      return { valid: false, error: 'Shortcut must be at least 2 characters' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(shortcut)) {
      return { valid: false, error: 'Shortcut can only contain letters, numbers, and underscores' };
    }
    
    // Check for duplicates
    const existing = quickReplies.find(reply => 
      reply.shortcut === shortcut && reply.id !== excludeId
    );
    
    if (existing) {
      return { valid: false, error: 'Shortcut already exists' };
    }
    
    return { valid: true };
  }, [quickReplies]);

  return {
    // State
    quickReplies,
    loading,
    error,
    searchQuery,
    filteredReplies,
    
    // Actions
    loadQuickReplies,
    createQuickReply,
    updateQuickReply,
    deleteQuickReply,
    setSearchQuery,
    
    // Utilities
    findQuickReply,
    searchQuickReplies,
    getSuggestions,
    expandShortcut,
    getMostUsed,
    getRecentlyUsed,
    validateShortcut,
  };
}