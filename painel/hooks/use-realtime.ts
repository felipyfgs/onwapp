"use client"

import { useEffect, useRef, useCallback } from "react"

// Use Next.js API proxy to avoid CORS issues with SSE
const SSE_URL = typeof window !== 'undefined' ? window.location.origin : ''

export type SSEEventType = 
  | "message.new" 
  | "message.status" 
  | "chat.update" 
  | "typing" 
  | "presence"
  | "connected"

export interface SSEEvent {
  type: SSEEventType
  sessionId: string
  chatJid?: string
  data: Record<string, unknown>
}

export interface NewMessageData {
  msgId: string
  chatJid: string
  senderJid: string
  pushName: string
  timestamp: number
  type: string
  mediaType: string
  content: string
  fromMe: boolean
  isGroup: boolean
}

export interface MessageStatusData {
  msgId: string
  chatJid: string
  status: "delivered" | "read" | "played" | "deleted"
  timestamp: number
}

interface UseRealtimeOptions {
  sessionId: string
  onMessage?: (data: NewMessageData) => void
  onMessageStatus?: (data: MessageStatusData) => void
  onChatUpdate?: (data: Record<string, unknown>) => void
  onConnect?: () => void
  onDisconnect?: () => void
  enabled?: boolean
}

async function getApiKey(): Promise<string> {
  if (typeof window !== "undefined") {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("api_key="))
    return cookie?.split("=")[1] || ""
  }
  return ""
}

export function useRealtime({
  sessionId,
  onMessage,
  onMessageStatus,
  onChatUpdate,
  onConnect,
  onDisconnect,
  enabled = true,
}: UseRealtimeOptions) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const isConnecting = useRef(false)
  const connectRef = useRef<(() => Promise<void>) | null>(null)
  const maxReconnectAttempts = 10
  const baseReconnectDelay = 1000

  // Use refs for callbacks to avoid stale closure issues
  const onMessageRef = useRef(onMessage)
  const onMessageStatusRef = useRef(onMessageStatus)
  const onChatUpdateRef = useRef(onChatUpdate)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)

  // Keep refs updated in effect to avoid updating during render
  useEffect(() => {
    onMessageRef.current = onMessage
    onMessageStatusRef.current = onMessageStatus
    onChatUpdateRef.current = onChatUpdate
    onConnectRef.current = onConnect
    onDisconnectRef.current = onDisconnect
  })

  const connect = useCallback(async () => {
    if (!enabled || !sessionId) return
    
    // Prevent duplicate connections
    if (isConnecting.current || eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }
    
    isConnecting.current = true

    // Get API key for auth
    const apiKey = await getApiKey()
    if (!apiKey) {
      console.warn("[SSE] No API key available")
      isConnecting.current = false
      return
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    // SSE URL through Next.js proxy to avoid CORS issues
    const url = `${SSE_URL}/api/sse/${sessionId}/events?auth=${encodeURIComponent(apiKey)}`
    
    console.log("[SSE] Connecting to", url.replace(apiKey, "***"))
    
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log("[SSE] Connection opened")
      reconnectAttempts.current = 0
      isConnecting.current = false
    }

    eventSource.addEventListener("connected", () => {
      console.log("[SSE] Connected event received")
      onConnectRef.current?.()
    })

    eventSource.addEventListener("message", (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data)
        
        switch (event.type) {
          case "message.new":
            onMessageRef.current?.(event.data as unknown as NewMessageData)
            break
          case "message.status":
            onMessageStatusRef.current?.(event.data as unknown as MessageStatusData)
            break
          case "chat.update":
            onChatUpdateRef.current?.(event.data)
            break
        }
      } catch (err) {
        console.error("[SSE] Failed to parse event:", err)
      }
    })

    eventSource.onerror = () => {
      eventSource.close()
      eventSourceRef.current = null
      isConnecting.current = false
      onDisconnectRef.current?.()

      // Reconnect with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current)
        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++
          connectRef.current?.()
        }, delay)
      } else {
        console.error("[SSE] Max reconnect attempts reached")
      }
    }
  }, [sessionId, enabled])

  // Store connect function in ref so it can be called recursively
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    reconnect: connect,
    disconnect,
  }
}
