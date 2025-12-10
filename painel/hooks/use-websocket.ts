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
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

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
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          setLastMessage(message)
          onMessage?.(message)
        } catch (error) {
          console.error("[WS] Failed to parse message:", error)
        }
      }

      ws.onclose = () => {
        console.log(`[WS] Disconnected from ${sessionId}`)
        setIsConnected(false)
        wsRef.current = null
        onDisconnect?.()

        // Attempt reconnect
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(`[WS] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        console.error("[WS] Error:", error)
        onError?.(error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error("[WS] Failed to connect:", error)
    }
  }, [sessionId, enabled, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    reconnectAttemptsRef.current = maxReconnectAttempts // Prevent reconnect
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [maxReconnectAttempts])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    lastMessage,
    disconnect,
    reconnect: connect,
  }
}
