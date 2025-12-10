"use client"

import { useEffect, useRef, useCallback } from "react"

interface UseAutoRefreshOptions {
  enabled?: boolean
  interval?: number
  onRefresh: () => Promise<void>
}

export function useAutoRefresh({
  enabled = true,
  interval = 10000,
  onRefresh,
}: UseAutoRefreshOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    
    isRefreshingRef.current = true
    try {
      await onRefresh()
    } finally {
      isRefreshingRef.current = false
    }
  }, [onRefresh])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      refresh()
      timeoutRef.current = setTimeout(tick, interval)
    }

    timeoutRef.current = setTimeout(tick, interval)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, interval, refresh])

  return { refresh }
}
