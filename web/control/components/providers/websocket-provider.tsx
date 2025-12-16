"use client"

import { createContext, useContext, ReactNode } from "react"
import {
  useAdminWebSocket,
  SessionEvent,
  ConnectionState,
} from "@/hooks/use-admin-websocket"

interface WebSocketContextValue {
  connectionState: ConnectionState
  lastEvent: SessionEvent | null
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const websocket = useAdminWebSocket()

  return (
    <WebSocketContext.Provider value={websocket}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider")
  }
  return context
}
