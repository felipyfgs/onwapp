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

export async function getContactAvatar(sessionId: string, phone: string): Promise<AvatarResponse> {
  const params = new URLSearchParams({ phone })
  return apiRequest<AvatarResponse>(`/${sessionId}/contact/avatar?${params}`)
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
