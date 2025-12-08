import { avatarCache, groupAvatarCache, profileCache } from '@/lib/cache'
import { apiRequest } from './config'

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

// Get our own profile (phone and avatar) for the session
export async function getMyProfile(sessionId: string): Promise<{ phone: string; avatar: string | null }> {
  const cached = profileCache.get(sessionId)
  if (cached) return cached
  
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
    profileCache.set(sessionId, profile)
    return profile
  } catch {
    const fallback = { phone: '', avatar: null }
    profileCache.set(sessionId, fallback)
    return fallback
  }
}

export async function getContactAvatar(sessionId: string, phone: string): Promise<AvatarResponse> {
  const params = new URLSearchParams({ phone })
  return apiRequest<AvatarResponse>(`/${sessionId}/contact/avatar?${params}`)
}

// Cached version with stale-while-revalidate pattern
export async function getContactAvatarUrl(sessionId: string, phone: string): Promise<string | null> {
  const cacheKey = `${sessionId}:${phone}`
  const cached = avatarCache.get(cacheKey)
  
  // Return cached value if exists
  if (cached !== undefined) {
    // Revalidate in background if stale
    if (avatarCache.isStale(cacheKey)) {
      getContactAvatar(sessionId, phone)
        .then(res => avatarCache.set(cacheKey, res.url || null))
        .catch(() => {})
    }
    return cached
  }
  
  // Fetch if no cache
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

// Cached version with stale-while-revalidate pattern
export async function getGroupAvatarUrl(sessionId: string, groupId: string): Promise<string | null> {
  const cacheKey = `${sessionId}:${groupId}`
  const cached = groupAvatarCache.get(cacheKey)
  
  // Return cached value if exists
  if (cached !== undefined) {
    // Revalidate in background if stale
    if (groupAvatarCache.isStale(cacheKey)) {
      getGroupAvatar(sessionId, groupId)
        .then(res => groupAvatarCache.set(cacheKey, res.url || null))
        .catch(() => {})
    }
    return cached
  }
  
  // Fetch if no cache
  try {
    const response = await getGroupAvatar(sessionId, groupId)
    const url = response.url || null
    groupAvatarCache.set(cacheKey, url)
    return url
  } catch {
    groupAvatarCache.set(cacheKey, null)
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
