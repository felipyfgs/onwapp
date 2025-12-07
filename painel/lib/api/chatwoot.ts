const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface ChatwootConfig {
  enabled: boolean
  url: string
  token: string
  account: number
  inboxId: number
  inbox?: string
  signAgent: boolean
  signSeparator: string
  autoReopen: boolean
  startPending: boolean
  mergeBrPhones: boolean
  syncContacts: boolean
  syncMessages: boolean
  syncDays: number
  ignoreChats: string[]
  autoCreate: boolean
  number?: string
  organization?: string
  logo?: string
  chatwootDbHost?: string
  chatwootDbPort?: number
  chatwootDbUser?: string
  chatwootDbPass?: string
  chatwootDbName?: string
}

export interface SyncStatus {
  status: 'idle' | 'running' | 'completed' | 'failed'
  type?: string
  progress?: number
  total?: number
  error?: string
  startedAt?: string
  completedAt?: string
}

export interface SyncOverview {
  whatsapp: { contacts: number }
  chatwoot: {
    contacts: number
    conversations: number
    messages: number
    openConversations: number
  }
}

async function getApiKey(): Promise<string> {
  if (typeof window !== 'undefined') {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('api_key='))
    return cookie?.split('=')[1] || ''
  }
  return ''
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = await getApiKey()
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export async function getChatwootConfig(sessionId: string): Promise<ChatwootConfig> {
  return apiRequest<ChatwootConfig>(`/sessions/${sessionId}/chatwoot/find`)
}

export async function setChatwootConfig(
  sessionId: string,
  config: Partial<ChatwootConfig>
): Promise<ChatwootConfig> {
  return apiRequest<ChatwootConfig>(`/sessions/${sessionId}/chatwoot/set`, {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function deleteChatwootConfig(sessionId: string): Promise<void> {
  await apiRequest(`/sessions/${sessionId}/chatwoot`, { method: 'DELETE' })
}

export async function validateChatwootCredentials(data: {
  url: string
  token: string
  account: number
}): Promise<{ valid: boolean; error?: string }> {
  return apiRequest('/chatwoot/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function syncChatwoot(
  sessionId: string,
  type: 'all' | 'contacts' | 'messages' = 'all',
  days?: number
): Promise<SyncStatus> {
  const endpoint = type === 'all' 
    ? `/sessions/${sessionId}/chatwoot/sync`
    : `/sessions/${sessionId}/chatwoot/sync/${type}`
  
  const url = days ? `${endpoint}?days=${days}` : endpoint
  return apiRequest<SyncStatus>(url, { method: 'POST' })
}

export async function getSyncStatus(sessionId: string): Promise<SyncStatus> {
  return apiRequest<SyncStatus>(`/sessions/${sessionId}/chatwoot/sync/status`)
}

export async function getSyncOverview(sessionId: string): Promise<SyncOverview> {
  return apiRequest<SyncOverview>(`/sessions/${sessionId}/chatwoot/overview`)
}

export async function resolveAllConversations(sessionId: string): Promise<{ resolved: number }> {
  return apiRequest(`/sessions/${sessionId}/chatwoot/resolve-all`, { method: 'POST' })
}

export async function resetChatwoot(sessionId: string): Promise<{
  deleted: { contacts: number; conversations: number; messages: number }
}> {
  return apiRequest(`/sessions/${sessionId}/chatwoot/reset`, { method: 'POST' })
}
