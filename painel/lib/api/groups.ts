import type {
  GroupsResponse,
  GroupInfoResponse,
  CreateGroupRequest,
  GroupActionRequest,
  ParticipantsActionRequest,
} from "@/lib/types/group"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ""

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: API_KEY } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || error.message || `API request failed: ${response.status}`)
  }

  return response.json()
}

export async function getGroups(session: string): Promise<GroupsResponse> {
  return fetchAPI<GroupsResponse>(`/${session}/group/list`)
}

export async function getGroupInfo(session: string, groupId: string): Promise<GroupInfoResponse> {
  return fetchAPI<GroupInfoResponse>(`/${session}/group/info?groupId=${encodeURIComponent(groupId)}`)
}

export async function createGroup(session: string, data: CreateGroupRequest): Promise<GroupInfoResponse> {
  return fetchAPI<GroupInfoResponse>(`/${session}/group/create`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function leaveGroup(session: string, data: GroupActionRequest): Promise<void> {
  return fetchAPI<void>(`/${session}/group/leave`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getInviteLink(session: string, groupId: string): Promise<{ link: string }> {
  return fetchAPI<{ link: string }>(`/${session}/group/invitelink?groupId=${encodeURIComponent(groupId)}`)
}

export async function addParticipants(session: string, data: ParticipantsActionRequest): Promise<void> {
  return fetchAPI<void>(`/${session}/group/participants/add`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function removeParticipants(session: string, data: ParticipantsActionRequest): Promise<void> {
  return fetchAPI<void>(`/${session}/group/participants/remove`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
