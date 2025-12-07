const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface Contact {
  jid: string
  phone?: string
  pushName?: string
  businessName?: string
  fullName?: string
  firstName?: string
  isBlocked?: boolean
}

export interface ContactInfo extends Contact {
  status?: string
  avatar?: string
  isBusiness?: boolean
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
  
  // API retorna objeto com JID como chave
  return Object.entries(data).map(([contactJid, contact]) => ({
    ...contact,
    jid: contactJid,
  }))
}

export async function getContactInfo(sessionId: string, phone: string): Promise<ContactInfo> {
  const params = new URLSearchParams({ phone })
  return apiRequest<ContactInfo>(`/${sessionId}/contact/info?${params}`)
}

export async function getContactAvatar(sessionId: string, phone: string): Promise<{ url: string }> {
  const params = new URLSearchParams({ phone })
  return apiRequest<{ url: string }>(`/${sessionId}/contact/avatar?${params}`)
}

export async function checkPhone(sessionId: string, phones: string[]): Promise<{ 
  valid: { jid: string; phone: string }[]
  invalid: string[] 
}> {
  return apiRequest(`/${sessionId}/contact/check`, {
    method: 'POST',
    body: JSON.stringify({ phones }),
  })
}

export async function getBlocklist(sessionId: string): Promise<string[]> {
  const data = await apiRequest<{ blocklist: string[] }>(`/${sessionId}/contact/blocklist`)
  return data.blocklist || []
}

export async function updateBlocklist(
  sessionId: string, 
  jids: string[], 
  action: 'block' | 'unblock'
): Promise<void> {
  await apiRequest(`/${sessionId}/contact/blocklist`, {
    method: 'POST',
    body: JSON.stringify({ jids, action }),
  })
}
