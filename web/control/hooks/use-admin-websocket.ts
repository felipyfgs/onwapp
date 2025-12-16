"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export interface SessionEvent {
  event: string
  sessionId: string
  session: string
  status: string
  timestamp: string
  data?: {
    qrCode?: string
    qrBase64?: string
    pairingCode?: string
    reason?: string
    error?: string
  }
}

export type ConnectionState = "connecting" | "connected" | "disconnected" | "error"

interface UseAdminWebSocketOptions {
  sessionFilter?: string
  onEvent?: (event: SessionEvent) => void
  onQR?: (qrBase64: string, qrCode: string) => void
  onConnected?: (session: string) => void
  onDisconnected?: (session: string, reason?: string) => void
  onError?: (error: string) => void
  autoReconnect?: boolean
  reconnectInterval?: number
}

export function useAdminWebSocket(options: UseAdminWebSocketOptions = {}) {
  const {
    sessionFilter,
    onEvent,
    onQR,
    onConnected,
    onDisconnected,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [lastEvent, setLastEvent] = useState<SessionEvent | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const wsUrl = process.env.NEXT_PUBLIC_NATS_WS_URL || "ws://localhost:9222"

    try {
      setConnectionState("connecting")
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnectionState("connected")
        const subject = optionsRef.current.sessionFilter
          ? `admin.session.${optionsRef.current.sessionFilter}.>`
          : "admin.session.>"
        const subscribeMsg = JSON.stringify({
          type: "subscribe",
          subject,
        })
        ws.send(subscribeMsg)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SessionEvent

          if (
            optionsRef.current.sessionFilter &&
            data.session !== optionsRef.current.sessionFilter
          ) {
            return
          }

          setLastEvent(data)
          optionsRef.current.onEvent?.(data)

          switch (data.event) {
            case "qr":
              if (data.data?.qrBase64 && data.data?.qrCode) {
                optionsRef.current.onQR?.(data.data.qrBase64, data.data.qrCode)
              }
              break
            case "connected":
              optionsRef.current.onConnected?.(data.session)
              break
            case "disconnected":
            case "logged_out":
              optionsRef.current.onDisconnected?.(data.session, data.data?.reason)
              break
            case "pair_error":
            case "connect_failure":
              optionsRef.current.onError?.(data.data?.error || "Connection failed")
              break
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e)
        }
      }

      ws.onerror = () => {
        setConnectionState("error")
        optionsRef.current.onError?.("WebSocket connection error")
      }

      ws.onclose = () => {
        setConnectionState("disconnected")
        wsRef.current = null

        if (optionsRef.current.autoReconnect !== false) {
          reconnectTimeoutRef.current = setTimeout(
            connect,
            optionsRef.current.reconnectInterval || 3000
          )
        }
      }
    } catch (error) {
      setConnectionState("error")
      optionsRef.current.onError?.(`Failed to connect: ${error}`)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnectionState("disconnected")
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    connectionState,
    lastEvent,
    connect,
    disconnect,
    isConnected: connectionState === "connected",
  }
}
