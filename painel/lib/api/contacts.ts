const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface Contact {
  jid: string
  phone?: string
  pushName?: string
  businessName?: string
  fullName?: string
  firstName?: string
}

export interface CheckPhoneResult {
  phone: string
  isRegistered: boolean
  jid: string
}

export interface ContactUserInfo {
  status?: string
  pictureId?: string
  devices?: string[]
}

export interface AvatarResponse {
  url: string
  id?: string
}

export interface BusinessProfile {
  jid?: string
  address?: string
  description?: string
  website?: string[]
  email?: string
  category?: string
  businessHours?: {
    timezone?: string
    config?: Array<{
      dayOfWeek: string
      mode: string
      openTime?: string
      closeTime?: string
    }>
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

export async function getContacts(sessionId: string): Promise<Contact[]> {
  const data = await apiRequest<Record<string, Contact>>(`/${sessionId}/contact/list`)
  
  return Object.entries(data).map(([contactJid, contact]) => ({
    ...contact,
    jid: contactJid,
  }))
}

export async function checkPhones(sessionId: string, phones: string[]): Promise<CheckPhoneResult[]> {
  return apiRequest<CheckPhoneResult[]>(`/${sessionId}/contact/check`, {
    method: 'POST',
    body: JSON.stringify({ phones }),
  })
}

export async function getContactsInfo(
  sessionId: string, 
  phones: string[]
): Promise<{ users: Record<string, ContactUserInfo> }> {
  return apiRequest(`/${sessionId}/contact/info`, {
    method: 'POST',
    body: JSON.stringify({ phones }),
  })
}

// Avatar cache to avoid repeated requests
const avatarCache = new Map<string, string | null>()

// Session profile cache (our own avatar)
const sessionProfileCache = new Map<string, { phone: string; avatar: string | null }>()

// Get our own profile (phone and avatar) for the session
export async function getMyProfile(sessionId: string): Promise<{ phone: string; avatar: string | null }> {
  if (sessionProfileCache.has(sessionId)) {
    return sessionProfileCache.get(sessionId)!
  }
  
  try {
    const response = await apiRequest<{
      profile: {
        jid?: string
        pushName?: string
        status?: string
        pictureUrl?: string
      }
    }>(`/${sessionId}/profile`)
    
    const profile = {
      phone: response.profile?.jid?.split('@')[0] || '',
      avatar: response.profile?.pictureUrl || null
    }
    sessionProfileCache.set(sessionId, profile)
    return profile
  } catch {
    const fallback = { phone: '', avatar: null }
    sessionProfileCache.set(sessionId, fallback)
    return fallback
  }
}

export async function getContactAvatar(sessionId: string, phone: string): Promise<AvatarResponse> {
  const params = new URLSearchParams({ phone })
  return apiRequest<AvatarResponse>(`/${sessionId}/contact/avatar?${params}`)
}

// Cached version for UI components
export async function getContactAvatarUrl(sessionId: string, phone: string): Promise<string | null> {
  const cacheKey = `${sessionId}:${phone}`
  
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey) || null
  }
  
  try {
    const response = await getContactAvatar(sessionId, phone)
    const url = response.url || null
    avatarCache.set(cacheKey, url)
    return url
  } catch {
    avatarCache.set(cacheKey, null)
    return null
  }
}

// Get group avatar from WhatsApp
export async function getGroupAvatar(sessionId: string, groupId: string): Promise<AvatarResponse> {
  const params = new URLSearchParams({ groupId })
  return apiRequest<AvatarResponse>(`/${sessionId}/group/avatar?${params}`)
}

// Cached version for UI components
export async function getGroupAvatarUrl(sessionId: string, groupId: string): Promise<string | null> {
  const cacheKey = `${sessionId}:group:${groupId}`
  
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey) || null
  }
  
  try {
    const response = await getGroupAvatar(sessionId, groupId)
    const url = response.url || null
    avatarCache.set(cacheKey, url)
    return url
  } catch {
    avatarCache.set(cacheKey, null)
    return null
  }
}

// Universal function to get avatar for contact or group
export async function getChatAvatarUrl(sessionId: string, jid: string, isGroup: boolean): Promise<string | null> {
  const id = jid.split('@')[0]
  if (isGroup) {
    return getGroupAvatarUrl(sessionId, id)
  }
  return getContactAvatarUrl(sessionId, id)
}

export async function getBlocklist(sessionId: string): Promise<string[]> {
  const data = await apiRequest<{ jids: string[] }>(`/${sessionId}/contact/blocklist`)
  return data.jids || []
}

export async function updateBlocklist(
  sessionId: string, 
  phone: string, 
  action: 'block' | 'unblock'
): Promise<{ action: string; phone: string }> {
  return apiRequest(`/${sessionId}/contact/blocklist`, {
    method: 'POST',
    body: JSON.stringify({ phone, action }),
  })
}

export async function getBusinessProfile(sessionId: string, phone: string): Promise<{ profile: BusinessProfile | null }> {
  const params = new URLSearchParams({ phone })
  return apiRequest(`/${sessionId}/contact/business?${params}`)
}

export async function getContactQRLink(sessionId: string, revoke = false): Promise<{ link: string }> {
  const params = new URLSearchParams()
  if (revoke) params.set('revoke', 'true')
  const query = params.toString() ? `?${params}` : ''
  return apiRequest(`/${sessionId}/contact/qrlink${query}`)
}

export async function getContactLID(sessionId: string, phone: string): Promise<{ phone: string; lid: string }> {
  const params = new URLSearchParams({ phone })
  return apiRequest(`/${sessionId}/contact/lid?${params}`)
}
