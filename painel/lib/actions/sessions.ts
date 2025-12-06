'use server'

import { unstable_cache, revalidateTag } from 'next/cache'
import {
  Session,
  CreateSessionRequest,
  QRResponse,
  MessageResponse,
  WebhookConfig,
  WebhookResponse,
  APIHealthResponse,
  SessionStatusResponse,
} from '@/types/session'

const API_URL = process.env.API_URL || 'http://localhost:8080'
const API_KEY = process.env.API_KEY || ''

// Cache tags for revalidation
const CACHE_TAGS = {
  sessions: 'sessions',
  session: (id: string) => `session-${id}`,
  qr: (id: string) => `qr-${id}`,
  webhook: (id: string) => `webhook-${id}`,
  health: 'api-health',
} as const

// Cache durations in seconds
const CACHE_DURATION = {
  sessions: 30,
  qr: 10,
  webhook: 60,
  health: 15,
  status: 5,
} as const

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
} as const

// Revalidation profile for Next.js 16
const REVALIDATE_PROFILE = { expire: 0 }

// Action result types for enhanced error handling
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type VoidActionResult =
  | { success: true }
  | { success: false; error: string }

// Debounce state for QR polling (per session)
const qrPollTimestamps = new Map<string, number>()
const QR_POLL_INTERVAL = 2000 // minimum 2s between QR polls

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          ...options.headers,
        },
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(error.error || `HTTP ${res.status}`)
      }

      return res.json()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry for client errors (4xx)
      if (lastError.message.includes('HTTP 4')) {
        throw lastError
      }

      if (attempt < retries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay
        )
        await sleep(delay)
      }
    }
  }

  throw lastError ?? new Error('Request failed after retries')
}

// Cached fetch for sessions list
const fetchSessionsCached = unstable_cache(
  async (): Promise<Session[]> => {
    return fetchWithRetry<Session[]>('/sessions')
  },
  ['sessions-list'],
  { tags: [CACHE_TAGS.sessions], revalidate: CACHE_DURATION.sessions }
)

// Cached fetch for session status
const fetchSessionStatusCached = (session: string) =>
  unstable_cache(
    async (): Promise<SessionStatusResponse> => {
      return fetchWithRetry<SessionStatusResponse>(`/${session}/status`)
    },
    [`session-status-${session}`],
    { tags: [CACHE_TAGS.session(session)], revalidate: CACHE_DURATION.status }
  )

// Cached fetch for QR code with debounce
const fetchQRCodeCached = (session: string) =>
  unstable_cache(
    async (): Promise<QRResponse> => {
      return fetchWithRetry<QRResponse>(`/${session}/qr`, {}, 1)
    },
    [`qr-${session}`],
    { tags: [CACHE_TAGS.qr(session)], revalidate: CACHE_DURATION.qr }
  )

// Cached fetch for webhook config
const fetchWebhookCached = (session: string) =>
  unstable_cache(
    async (): Promise<WebhookResponse | null> => {
      try {
        return await fetchWithRetry<WebhookResponse>(`/${session}/webhook`)
      } catch {
        return null
      }
    },
    [`webhook-${session}`],
    { tags: [CACHE_TAGS.webhook(session)], revalidate: CACHE_DURATION.webhook }
  )

// Cached fetch for API health
const fetchHealthCached = unstable_cache(
  async (): Promise<APIHealthResponse> => {
    return fetchWithRetry<APIHealthResponse>('/health', {}, 1)
  },
  ['api-health'],
  { tags: [CACHE_TAGS.health], revalidate: CACHE_DURATION.health }
)

// Public Server Actions - backward compatible (throw on error)

export async function getSessions(): Promise<Session[]> {
  return fetchSessionsCached()
}

export async function getSessionsForce(): Promise<Session[]> {
  revalidateTag(CACHE_TAGS.sessions, REVALIDATE_PROFILE)
  return fetchSessionsCached()
}

export async function createSession(data: CreateSessionRequest): Promise<Session> {
  const result = await fetchWithRetry<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidateTag(CACHE_TAGS.sessions, REVALIDATE_PROFILE)
  return result
}

export async function deleteSession(session: string): Promise<void> {
  await fetchWithRetry<MessageResponse>(`/${session}`, { method: 'DELETE' })
  revalidateTag(CACHE_TAGS.sessions, REVALIDATE_PROFILE)
  revalidateTag(CACHE_TAGS.session(session), REVALIDATE_PROFILE)
}

export async function connectSession(session: string): Promise<MessageResponse> {
  const result = await fetchWithRetry<MessageResponse>(`/${session}/connect`, {
    method: 'POST',
  })
  revalidateTag(CACHE_TAGS.session(session), REVALIDATE_PROFILE)
  revalidateTag(CACHE_TAGS.qr(session), REVALIDATE_PROFILE)
  return result
}

export async function disconnectSession(session: string): Promise<MessageResponse> {
  const result = await fetchWithRetry<MessageResponse>(`/${session}/disconnect`, {
    method: 'POST',
  })
  revalidateTag(CACHE_TAGS.session(session), REVALIDATE_PROFILE)
  return result
}

export async function logoutSession(session: string): Promise<MessageResponse> {
  const result = await fetchWithRetry<MessageResponse>(`/${session}/logout`, {
    method: 'POST',
  })
  revalidateTag(CACHE_TAGS.session(session), REVALIDATE_PROFILE)
  revalidateTag(CACHE_TAGS.sessions, REVALIDATE_PROFILE)
  return result
}

export async function restartSession(session: string): Promise<MessageResponse> {
  const result = await fetchWithRetry<MessageResponse>(`/${session}/restart`, {
    method: 'POST',
  })
  revalidateTag(CACHE_TAGS.session(session), REVALIDATE_PROFILE)
  return result
}

export async function getQRCode(
  session: string,
  bypassDebounce = false
): Promise<QRResponse> {
  // Debounce QR polling
  if (!bypassDebounce) {
    const lastPoll = qrPollTimestamps.get(session) ?? 0
    const now = Date.now()

    if (now - lastPoll < QR_POLL_INTERVAL) {
      return fetchQRCodeCached(session)()
    }

    qrPollTimestamps.set(session, now)
  }

  return fetchQRCodeCached(session)()
}

export async function getQRCodeForce(session: string): Promise<QRResponse> {
  revalidateTag(CACHE_TAGS.qr(session), REVALIDATE_PROFILE)
  qrPollTimestamps.set(session, Date.now())
  return fetchQRCodeCached(session)()
}

export async function getAPIHealth(): Promise<APIHealthResponse> {
  return fetchHealthCached()
}

export async function getSessionStatus(
  session: string
): Promise<SessionStatusResponse> {
  return fetchSessionStatusCached(session)()
}

export async function getSessionStatusForce(
  session: string
): Promise<SessionStatusResponse> {
  revalidateTag(CACHE_TAGS.session(session), REVALIDATE_PROFILE)
  return fetchSessionStatusCached(session)()
}

export async function pairPhone(
  session: string,
  phone: string
): Promise<MessageResponse> {
  const result = await fetchWithRetry<MessageResponse>(`/${session}/pairphone`, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
  revalidateTag(CACHE_TAGS.session(session), REVALIDATE_PROFILE)
  return result
}

export async function getWebhook(session: string): Promise<WebhookResponse | null> {
  return fetchWebhookCached(session)()
}

export async function getWebhookForce(
  session: string
): Promise<WebhookResponse | null> {
  revalidateTag(CACHE_TAGS.webhook(session), REVALIDATE_PROFILE)
  return fetchWebhookCached(session)()
}

export async function setWebhook(
  session: string,
  data: WebhookConfig
): Promise<MessageResponse> {
  const result = await fetchWithRetry<MessageResponse>(`/${session}/webhook`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidateTag(CACHE_TAGS.webhook(session), REVALIDATE_PROFILE)
  return result
}

export async function updateWebhook(
  session: string,
  data: WebhookConfig
): Promise<MessageResponse> {
  const result = await fetchWithRetry<MessageResponse>(`/${session}/webhook`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidateTag(CACHE_TAGS.webhook(session), REVALIDATE_PROFILE)
  return result
}

export async function deleteWebhook(session: string): Promise<MessageResponse> {
  const result = await fetchWithRetry<MessageResponse>(`/${session}/webhook`, {
    method: 'DELETE',
  })
  revalidateTag(CACHE_TAGS.webhook(session), REVALIDATE_PROFILE)
  return result
}

// Utility to invalidate all caches for a session
export async function invalidateSessionCache(session: string): Promise<void> {
  revalidateTag(CACHE_TAGS.session(session), REVALIDATE_PROFILE)
  revalidateTag(CACHE_TAGS.qr(session), REVALIDATE_PROFILE)
  revalidateTag(CACHE_TAGS.webhook(session), REVALIDATE_PROFILE)
  revalidateTag(CACHE_TAGS.sessions, REVALIDATE_PROFILE)
}

// Utility to invalidate all caches
export async function invalidateAllCaches(): Promise<void> {
  revalidateTag(CACHE_TAGS.sessions, REVALIDATE_PROFILE)
  revalidateTag(CACHE_TAGS.health, REVALIDATE_PROFILE)
}

// Safe variants with ActionResult for new code (optional use)
export async function getSessionsSafe(): Promise<ActionResult<Session[]>> {
  try {
    const data = await fetchSessionsCached()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function createSessionSafe(
  data: CreateSessionRequest
): Promise<ActionResult<Session>> {
  try {
    const result = await createSession(data)
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function deleteSessionSafe(session: string): Promise<VoidActionResult> {
  try {
    await deleteSession(session)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
