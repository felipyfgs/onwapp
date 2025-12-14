import { useState, useCallback, useRef } from 'react';
import { Message, getChatMessages } from '@/lib/api';

export interface MessageSearchFilters {
    dateFrom?: string;
    dateTo?: string;
    messageType?: string;
    hasMedia?: boolean;
}

const MEDIA_TYPES = ['image', 'video', 'audio', 'ptt', 'document', 'sticker'];

export function useMessageSearch(session: string) {
    const [searchResults, setSearchResults] = useState<Message[]>([]);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [currentQuery, setCurrentQuery] = useState('');
    const [filters, setFilters] = useState<MessageSearchFilters>({});
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [currentChatJid, setCurrentChatJid] = useState<string | null>(null);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Filter messages based on query and filters
    const filterMessages = useCallback((messages: Message[], query: string, appliedFilters: MessageSearchFilters): Message[] => {
        return messages.filter(message => {
            // Text search
            if (query) {
                const content = (message.content || '').toLowerCase();
                const senderName = (message.senderName || '').toLowerCase();
                const queryLower = query.toLowerCase();

                if (!content.includes(queryLower) && !senderName.includes(queryLower)) {
                    return false;
                }
            }

            // Date filters
            if (appliedFilters.dateFrom) {
                const messageDate = new Date(message.timestamp);
                const fromDate = new Date(appliedFilters.dateFrom);
                if (messageDate < fromDate) return false;
            }

            if (appliedFilters.dateTo) {
                const messageDate = new Date(message.timestamp);
                const toDate = new Date(appliedFilters.dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (messageDate > toDate) return false;
            }

            // Message type filter
            if (appliedFilters.messageType) {
                if (message.type !== appliedFilters.messageType) return false;
            }

            // Has media filter
            if (appliedFilters.hasMedia !== undefined) {
                const isMedia = MEDIA_TYPES.includes(message.type);
                if (appliedFilters.hasMedia && !isMedia) return false;
                if (!appliedFilters.hasMedia && isMedia) return false;
            }

            return true;
        });
    }, []);

    const search = useCallback(async (query: string, chatJid?: string) => {
        // Clear timeout for debouncing
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        setCurrentQuery(query);
        setError(null);

        if (!query.trim() && !filters.dateFrom && !filters.dateTo && !filters.messageType && filters.hasMedia === undefined) {
            setSearchResults([]);
            setTotalResults(0);
            return;
        }

        setLoading(true);

        try {
            // If we have a chat JID and it's different from current, load messages
            if (chatJid && chatJid !== currentChatJid) {
                const messages = await getChatMessages(session, chatJid, 500);
                setAllMessages(Array.isArray(messages) ? messages : []);
                setCurrentChatJid(chatJid);

                // Filter the loaded messages
                const filtered = filterMessages(messages, query, filters);
                setSearchResults(filtered);
                setTotalResults(filtered.length);
                setHasMore(false);
            } else if (chatJid) {
                // Use cached messages
                const filtered = filterMessages(allMessages, query, filters);
                setSearchResults(filtered);
                setTotalResults(filtered.length);
            } else {
                // No chat selected - can't search all chats without backend support
                setSearchResults([]);
                setTotalResults(0);
                setError('Select a chat to search messages');
            }

            // Add to search history
            if (query.trim() && !searchHistory.includes(query.trim())) {
                setSearchHistory(prev => [query.trim(), ...prev].slice(0, 10));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
            setSearchResults([]);
            setTotalResults(0);
        } finally {
            setLoading(false);
        }
    }, [session, filters, allMessages, currentChatJid, searchHistory, filterMessages]);

    const loadMore = useCallback(async () => {
        // Client-side search doesn't need pagination as we load all at once
        // This is kept for API compatibility
    }, []);

    const clearSearch = useCallback(() => {
        setSearchResults([]);
        setTotalResults(0);
        setCurrentQuery('');
        setError(null);
    }, []);

    const updateFilters = useCallback((newFilters: MessageSearchFilters) => {
        setFilters(newFilters);

        // Re-run search with new filters if there's a query or any filter
        if (currentQuery || newFilters.dateFrom || newFilters.dateTo || newFilters.messageType || newFilters.hasMedia !== undefined) {
            const filtered = filterMessages(allMessages, currentQuery, newFilters);
            setSearchResults(filtered);
            setTotalResults(filtered.length);
        }
    }, [currentQuery, allMessages, filterMessages]);

    const highlightText = useCallback((text: string, query: string): string => {
        if (!query.trim()) return text;

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

        return parts.map((part) =>
            part.toLowerCase() === query.toLowerCase()
                ? `<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">${part}</mark>`
                : part
        ).join('');
    }, []);

    const getSuggestions = useCallback((query: string): string[] => {
        if (!query.trim()) return searchHistory.slice(0, 5);
        return searchHistory
            .filter(h => h.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5);
    }, [searchHistory]);

    const exportResults = useCallback((format: 'json' | 'csv') => {
        if (searchResults.length === 0) return;

        let content: string;
        let filename: string;
        let mimeType: string;

        if (format === 'json') {
            content = JSON.stringify(searchResults, null, 2);
            filename = `search-results-${Date.now()}.json`;
            mimeType = 'application/json';
        } else {
            const headers = ['ID', 'Sender', 'Content', 'Type', 'Timestamp'];
            const rows = searchResults.map(m => [
                m.id,
                m.senderName || '',
                (m.content || '').replace(/"/g, '""'),
                m.type,
                m.timestamp
            ]);

            content = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            filename = `search-results-${Date.now()}.csv`;
            mimeType = 'text/csv';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }, [searchResults]);

    // Reload messages for current chat
    const reloadMessages = useCallback(async (chatJid: string) => {
        if (!chatJid) return;

        setLoading(true);
        try {
            const messages = await getChatMessages(session, chatJid, 500);
            setAllMessages(Array.isArray(messages) ? messages : []);
            setCurrentChatJid(chatJid);

            if (currentQuery || filters.dateFrom || filters.dateTo || filters.messageType || filters.hasMedia !== undefined) {
                const filtered = filterMessages(messages, currentQuery, filters);
                setSearchResults(filtered);
                setTotalResults(filtered.length);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [session, currentQuery, filters, filterMessages]);

    return {
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
        reloadMessages,
    };
}
