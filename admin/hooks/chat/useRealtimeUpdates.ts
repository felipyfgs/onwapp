"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Message, Ticket, Chat } from "@/lib/api";
import { toast } from "sonner";

interface RealtimeEvent {
  type: 'message' | 'ticket' | 'chat' | 'presence' | 'typing';
  sessionId: string;
  data: any;
  timestamp: string;
}

interface TypingIndicator {
  chatJid: string;
  isTyping: boolean;
  timestamp: number;
}

interface PresenceData {
  jid: string;
  presence: 'available' | 'unavailable' | 'composing' | 'paused';
  timestamp: number;
}

interface UseRealtimeUpdatesOptions {
  session: string;
  onNewMessage?: (message: Message) => void;
  onTicketUpdate?: (ticket: Ticket) => void;
  onChatUpdate?: (chat: Chat) => void;
  onTypingIndicator?: (chatJid: string, isTyping: boolean) => void;
  onPresenceChange?: (jid: string, presence: string) => void;
  enableNotifications?: boolean;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions) {
  const {
    session,
    onNewMessage,
    onTicketUpdate,
    onChatUpdate,
    onTypingIndicator,
    onPresenceChange,
    enableNotifications = true,
  } = options;

  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [typingIndicators, setTypingIndicators] = useState<Map<string, TypingIndicator>>(new Map());
  const [presence, setPresence] = useState<Map<string, PresenceData>>(new Map());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastEventRef = useRef<string>("");

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = `${getWebSocketUrl()}/ws/${session}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setReconnecting(false);
        
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          
          // Skip duplicate events
          const eventKey = `${realtimeEvent.type}:${realtimeEvent.timestamp}:${JSON.stringify(realtimeEvent.data)}`;
          if (eventKey === lastEventRef.current) return;
          lastEventRef.current = eventKey;
          
          handleRealtimeEvent(realtimeEvent);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnected(false);
        
        // Attempt to reconnect unless it was a clean close
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      scheduleReconnect();
    }
  }, [session]);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnecting) return;
    
    setReconnecting(true);
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      connect();
    }, 5000); // 5 second delay
  }, [reconnecting, connect]);

  // Handle incoming realtime events
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    const { type, data, sessionId } = event;

    // Ignore events for other sessions
    if (sessionId !== session) return;

    switch (type) {
      case 'message':
        handleNewMessage(data as Message);
        break;
        
      case 'ticket':
        handleTicketUpdate(data as Ticket);
        break;
        
      case 'chat':
        handleChatUpdate(data as Chat);
        break;
        
      case 'presence':
        handlePresenceUpdate(data);
        break;
        
      case 'typing':
        handleTypingIndicator(data);
        break;
        
      default:
        console.warn('Unknown event type:', type);
    }
  }, [session]);

  // Handle new message
  const handleNewMessage = useCallback((message: Message) => {
    console.log('New message received:', message);
    
    // Clear typing indicator for this chat
    if (message.chatJid) {
      clearTypingIndicator(message.chatJid);
    }
    
    // Call callback
    onNewMessage?.(message);
    
    // Show notification if enabled and message is not from me
    if (enableNotifications && !message.isFromMe) {
      showNotification(
        `New message from ${message.senderName || 'Unknown'}`,
        message.content?.substring(0, 100) || 'Media message'
      );
    }
  }, [onNewMessage, enableNotifications]);

  // Handle ticket update
  const handleTicketUpdate = useCallback((ticket: Ticket) => {
    console.log('Ticket updated:', ticket);
    onTicketUpdate?.(ticket);
    
    // Show notification for new tickets or status changes
    if (enableNotifications) {
      let notificationTitle = '';
      let notificationBody = '';
      
      switch (ticket.status) {
        case 'pending':
          notificationTitle = 'New ticket';
          notificationBody = `${ticket.contactName || ticket.contactJid} is waiting`;
          break;
        case 'open':
          if (ticket.unreadCount > 0) {
            notificationTitle = 'Ticket updated';
            notificationBody = `New message in ${ticket.contactName || ticket.contactJid}`;
          }
          break;
      }
      
      if (notificationTitle) {
        showNotification(notificationTitle, notificationBody);
      }
    }
  }, [onTicketUpdate, enableNotifications]);

  // Handle chat update
  const handleChatUpdate = useCallback((chat: Chat) => {
    console.log('Chat updated:', chat);
    onChatUpdate?.(chat);
  }, [onChatUpdate]);

  // Handle presence update
  const handlePresenceUpdate = useCallback((data: { jid: string; presence: string }) => {
    const { jid, presence } = data;
    
    setPresence(prev => {
      const newMap = new Map(prev);
      newMap.set(jid, {
        jid,
        presence: presence as any,
        timestamp: Date.now(),
      });
      return newMap;
    });
    
    onPresenceChange?.(jid, presence);
  }, [onPresenceChange]);

  // Handle typing indicator
  const handleTypingIndicator = useCallback((data: { chatJid: string; isTyping: boolean }) => {
    const { chatJid, isTyping } = data;
    
    setTypingIndicators(prev => {
      const newMap = new Map(prev);
      
      if (isTyping) {
        newMap.set(chatJid, {
          chatJid,
          isTyping: true,
          timestamp: Date.now(),
        });
        
        // Clear any existing timeout for this chat
        const existingTimeout = typingTimeoutsRef.current.get(chatJid);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        // Set new timeout to clear typing indicator after 5 seconds
        const timeout = setTimeout(() => {
          clearTypingIndicator(chatJid);
        }, 5000);
        
        typingTimeoutsRef.current.set(chatJid, timeout);
      } else {
        newMap.delete(chatJid);
        clearTypingIndicator(chatJid);
      }
      
      return newMap;
    });
    
    onTypingIndicator?.(chatJid, isTyping);
  }, [onTypingIndicator]);

  // Clear typing indicator
  const clearTypingIndicator = useCallback((chatJid: string) => {
    setTypingIndicators(prev => {
      const newMap = new Map(prev);
      newMap.delete(chatJid);
      return newMap;
    });
    
    // Clear timeout
    const timeout = typingTimeoutsRef.current.get(chatJid);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeoutsRef.current.delete(chatJid);
    }
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((chatJid: string, isTyping: boolean) => {
    if (!connected || !wsRef.current) return;
    
    try {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        sessionId: session,
        data: { chatJid, isTyping },
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [connected, session]);

  // Get WebSocket URL
  const getWebSocketUrl = useCallback((): string => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
    return `${protocol}//${host}`;
  }, []);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
          });
        }
      });
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    
    if (Notification.permission === "granted") return true;
    
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    
    return false;
  }, []);

  // Cleanup on unmount
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Clear all typing timeouts
    typingTimeoutsRef.current.forEach(timeout => {
      clearTimeout(timeout);
    });
    typingTimeoutsRef.current.clear();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();
    
    // Request notification permission if enabled
    if (enableNotifications) {
      requestNotificationPermission();
    }
    
    return disconnect;
  }, [connect, disconnect, enableNotifications, requestNotificationPermission]);

  // Clean up expired typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const expired = Array.from(typingIndicators.entries())
        .filter(([_, indicator]) => now - indicator.timestamp > 10000); // 10 seconds
      
      expired.forEach(([chatJid]) => {
        clearTypingIndicator(chatJid);
      });
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [typingIndicators, clearTypingIndicator]);

  return {
    // Connection state
    connected,
    reconnecting,
    
    // Methods
    connect,
    disconnect,
    sendTypingIndicator,
    requestNotificationPermission,
    
    // State
    typingIndicators,
    presence,
    
    // Utilities
    isTyping: useCallback((chatJid: string) => {
      const indicator = typingIndicators.get(chatJid);
      return indicator?.isTyping || false;
    }, [typingIndicators]),
    
    getPresence: useCallback((jid: string) => {
      return presence.get(jid)?.presence || 'unavailable';
    }, [presence]),
  };
}