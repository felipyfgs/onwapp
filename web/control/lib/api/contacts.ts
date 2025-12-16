import { apiClient, ApiResponse } from "./client"

export interface Contact {
  jid: string
  name?: string
  pushName?: string
  phone: string
  isBlocked: boolean
  profilePictureUrl?: string
  about?: string
  isBusiness?: boolean
}

export interface ContactInfo {
  jid: string
  name?: string
  pushName?: string
  phone: string
  about?: string
  profilePictureUrl?: string
  isBusiness: boolean
  devices?: number
  businessProfile?: {
    description?: string
    category?: string
    email?: string
    website?: string
    address?: string
  }
}

export interface CheckPhoneResult {
  jid: string
  exists: boolean
  phone: string
}

export interface BusinessProfile {
  jid: string
  description?: string
  category?: string
  email?: string
  website?: string[]
  address?: string
}

export async function getContacts(
  sessionId: string
): Promise<ApiResponse<Contact[]>> {
  return apiClient<Contact[]>(`/sessions/${sessionId}/contact/list`)
}

export async function getContactInfo(
  sessionId: string,
  jid: string
): Promise<ApiResponse<ContactInfo>> {
  return apiClient<ContactInfo>(`/sessions/${sessionId}/contact/info`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  })
}

export async function checkPhone(
  sessionId: string,
  phones: string[]
): Promise<ApiResponse<CheckPhoneResult[]>> {
  return apiClient<CheckPhoneResult[]>(`/sessions/${sessionId}/contact/check`, {
    method: "POST",
    body: JSON.stringify({ phones }),
  })
}

export async function getBlocklist(
  sessionId: string
): Promise<ApiResponse<string[]>> {
  return apiClient<string[]>(`/sessions/${sessionId}/contact/blocklist`)
}

export async function updateBlocklist(
  sessionId: string,
  jid: string,
  action: "block" | "unblock"
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/contact/blocklist`, {
    method: "POST",
    body: JSON.stringify({ jid, action }),
  })
}

export async function getContactAvatar(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ url: string }>> {
  return apiClient<{ url: string }>(`/sessions/${sessionId}/contact/avatar?jid=${jid}`)
}

export async function getBusinessProfile(
  sessionId: string,
  jid: string
): Promise<ApiResponse<BusinessProfile>> {
  return apiClient<BusinessProfile>(`/sessions/${sessionId}/contact/business?jid=${jid}`)
}
