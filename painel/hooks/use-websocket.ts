"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { getStoredApiKey } from "@/lib/auth"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") || "ws://localhost:8080"

export interface WebSocketMessage {
  event: string
  sessionId: string
  data: unknown
  timestamp: number
}

interface UseWebSocketOptions {
  sessionId: string
  enabled?: boolean
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket({
  sessionId,
  enabled = true,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReconnectRef = useRef(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  const callbacksRef = useRef({ onMessage, onConnect, onDisconnect, onError })
  useEffect(() => {
    callbacksRef.current = { onMessage, onConnect, onDisconnect, onError }
  }, [onMessage, onConnect, onDisconnect, onError])

  const connect = useCallback(() => {
    if (!enabled || !sessionId) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const apiKey = getStoredApiKey()
    const url = `${WS_URL}/${sessionId}/ws${apiKey ? `?auth=${apiKey}` : ""}`

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        console.log(`[WS] Connected to ${sessionId}`)
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        callbacksRef.current.onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          setLastMessage(message)
          callbacksRef.current.onMessage?.(message)
        } catch (error) {
          console.error("[WS] Failed to parse message:", error)
        }
      }

      ws.onclose = (event) => {
        const reason = event.reason || "unknown"
        const wasClean = event.wasClean ? "clean" : "unclean"
        console.log(`[WS] Disconnected from ${sessionId} (code: ${event.code}, ${wasClean}, reason: ${reason})`)
        setIsConnected(false)
        wsRef.current = null
        callbacksRef.current.onDisconnect?.()
      }

      ws.onerror = (error) => {
        // WebSocket error events don't contain useful info (browser security)
        // Log context instead
        console.warn(`[WS] Connection error for session ${sessionId} (state: ${ws.readyState})`)
        callbacksRef.current.onError?.(error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error("[WS] Failed to connect:", error)
    }
  }, [sessionId, enabled])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Handle reconnection logic
  useEffect(() => {
    if (!isConnected && enabled && shouldReconnectRef.current) {
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++
        console.log(`[WS] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
      }
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [isConnected, enabled, maxReconnectAttempts, reconnectInterval, connect])

  useEffect(() => {
    shouldReconnectRef.current = true
    if (enabled) {
      connect()
    }

    return () => {
      // Cleanup: close WebSocket on unmount or when deps change
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [enabled, sessionId, connect])

  return {
    isConnected,
    lastMessage,
    disconnect,
    reconnect: connect,
  }
}
