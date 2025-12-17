"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { connect, NatsConnection, Subscription, StringCodec } from "nats.ws"

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
    message?: string
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

const sc = StringCodec()

export function useAdminWebSocket(options: UseAdminWebSocketOptions = {}) {
  const {
    sessionFilter,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [lastEvent, setLastEvent] = useState<SessionEvent | null>(null)
  const ncRef = useRef<NatsConnection | null>(null)
  const subRef = useRef<Subscription | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const optionsRef = useRef(options)
  const mountedRef = useRef(true)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const handleEvent = useCallback((data: SessionEvent) => {
    if (!mountedRef.current) return

    if (optionsRef.current.sessionFilter && data.session !== optionsRef.current.sessionFilter) {
      return
    }

    setLastEvent(data)
    optionsRef.current.onEvent?.(data)

    switch (data.event) {
      case "session.qr":
        if (data.data?.qrBase64) {
          optionsRef.current.onQR?.(data.data.qrBase64, data.data.qrCode || "")
        }
        break
      case "session.connected":
        optionsRef.current.onConnected?.(data.session)
        break
      case "session.disconnected":
      case "session.logged_out":
        optionsRef.current.onDisconnected?.(data.session, data.data?.reason)
        break
      case "session.pair_error":
      case "session.connect_failure":
        optionsRef.current.onError?.(data.data?.message || data.data?.error || "Connection failed")
        break
    }
  }, [])

  const connectNats = useCallback(async () => {
    if (ncRef.current) return

    const wsUrl = process.env.NEXT_PUBLIC_NATS_WS_URL || "ws://localhost:9222"

    try {
      setConnectionState("connecting")

      const nc = await connect({
        servers: [wsUrl],
        reconnect: autoReconnect,
        reconnectTimeWait: reconnectInterval,
        maxReconnectAttempts: -1,
      })

      if (!mountedRef.current) {
        await nc.close()
        return
      }

      ncRef.current = nc
      setConnectionState("connected")

      const streamPrefix = process.env.NEXT_PUBLIC_NATS_STREAM_PREFIX || "ONWAPP"
      const subject = `${streamPrefix}.admin.>`

      const sub = nc.subscribe(subject)
      subRef.current = sub

      ;(async () => {
        for await (const msg of sub) {
          if (!mountedRef.current) break
          try {
            const data = JSON.parse(sc.decode(msg.data)) as SessionEvent
            handleEvent(data)
          } catch (e) {
            console.error("Failed to parse NATS message:", e)
          }
        }
      })()

      nc.closed().then(() => {
        if (!mountedRef.current) return
        ncRef.current = null
        subRef.current = null
        setConnectionState("disconnected")

        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(connectNats, reconnectInterval)
        }
      })
    } catch (error) {
      if (!mountedRef.current) return
      setConnectionState("error")
      optionsRef.current.onError?.(`Failed to connect to NATS: ${error}`)

      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(connectNats, reconnectInterval)
      }
    }
  }, [autoReconnect, reconnectInterval, handleEvent])

  const disconnect = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (subRef.current) {
      subRef.current.unsubscribe()
      subRef.current = null
    }
    if (ncRef.current) {
      await ncRef.current.close()
      ncRef.current = null
    }
    setConnectionState("disconnected")
  }, [])

  useEffect(() => {
    mountedRef.current = true

    if (sessionFilter !== undefined) {
      connectNats()
    }

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [sessionFilter, connectNats, disconnect])

  return {
    connectionState,
    lastEvent,
    connect: connectNats,
    disconnect,
    isConnected: connectionState === "connected",
  }
}
