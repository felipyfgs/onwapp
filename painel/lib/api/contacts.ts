import { api } from "./client"

export interface Contact {
  jid: string
  phone?: string
  name?: string
  pushName?: string
  businessName?: string
  profilePicture?: string
  isBusiness?: boolean
}

export interface CheckPhoneResult {
  phone: string
  isRegistered: boolean
  jid?: string
}

export interface ContactInfo {
  jid: string
  fullName?: string
  firstName?: string
  pushName?: string
  businessName?: string
  profilePicture?: string
  status?: string
}

export async function getContacts(session: string): Promise<Contact[]> {
  return api<Contact[]>(`/${session}/contact/list`)
}

export async function checkPhones(session: string, phones: string[]): Promise<CheckPhoneResult[]> {
  return api<CheckPhoneResult[]>(`/${session}/contact/check`, {
    method: "POST",
    body: JSON.stringify({ phones }),
  })
}

export async function getBlocklist(session: string): Promise<string[]> {
  return api<string[]>(`/${session}/contact/blocklist`)
}

export async function updateBlocklist(session: string, phone: string, action: "block" | "unblock"): Promise<void> {
  await api(`/${session}/contact/blocklist`, {
    method: "POST",
    body: JSON.stringify({ phone, action }),
  })
}

export async function getContactInfo(session: string, phones: string[]): Promise<Record<string, ContactInfo>> {
  const params = new URLSearchParams()
  phones.forEach(p => params.append("phones", p))
  const response = await api<{ users: Record<string, ContactInfo> }>(`/${session}/contact/info?${params.toString()}`)
  return response.users
}

export async function getAvatar(session: string, phone: string): Promise<string | null> {
  try {
    const response = await api<{ url: string }>(`/${session}/contact/avatar?phone=${phone}`)
    return response.url
  } catch {
    return null
  }
}

export async function getBusinessProfile(session: string, phone: string): Promise<Record<string, unknown> | null> {
  try {
    return await api<Record<string, unknown>>(`/${session}/contact/business?phone=${phone}`)
  } catch {
    return null
  }
}
