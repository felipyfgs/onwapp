import { apiClient, ApiResponse } from "./client"

export interface Group {
  jid: string
  name: string
  topic?: string
  participantCount: number
  isAdmin: boolean
  isSuperAdmin: boolean
  profilePictureUrl?: string
  createdAt?: string
  createdBy?: string
}

export interface GroupParticipant {
  jid: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export interface GroupInfo {
  jid: string
  name: string
  topic?: string
  participants: GroupParticipant[]
  isAdmin: boolean
  isSuperAdmin: boolean
  profilePictureUrl?: string
  announce: boolean
  locked: boolean
  ephemeral?: number
  createdAt?: string
  createdBy?: string
}

export interface CreateGroupRequest {
  name: string
  participants: string[]
}

export async function getGroups(
  sessionId: string
): Promise<ApiResponse<Group[]>> {
  return apiClient<Group[]>(`/sessions/${sessionId}/group/list`)
}

export async function getGroupInfo(
  sessionId: string,
  jid: string
): Promise<ApiResponse<GroupInfo>> {
  return apiClient<GroupInfo>(`/sessions/${sessionId}/group/info?jid=${jid}`)
}

export async function createGroup(
  sessionId: string,
  data: CreateGroupRequest
): Promise<ApiResponse<Group>> {
  return apiClient<Group>(`/sessions/${sessionId}/group/create`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function leaveGroup(
  sessionId: string,
  jid: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/group/leave`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  })
}

export async function updateGroupName(
  sessionId: string,
  jid: string,
  name: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/group/name`, {
    method: "POST",
    body: JSON.stringify({ jid, name }),
  })
}

export async function updateGroupTopic(
  sessionId: string,
  jid: string,
  topic: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/group/topic`, {
    method: "POST",
    body: JSON.stringify({ jid, topic }),
  })
}

export async function setGroupPicture(
  sessionId: string,
  jid: string,
  image: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/group/photo`, {
    method: "POST",
    body: JSON.stringify({ jid, image }),
  })
}

export async function deleteGroupPicture(
  sessionId: string,
  jid: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/group/photo/remove`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  })
}

export async function addParticipants(
  sessionId: string,
  jid: string,
  participants: string[]
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/group/participants/add`, {
    method: "POST",
    body: JSON.stringify({ jid, participants }),
  })
}

export async function removeParticipants(
  sessionId: string,
  jid: string,
  participants: string[]
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/group/participants/remove`, {
    method: "POST",
    body: JSON.stringify({ jid, participants }),
  })
}

export async function promoteParticipants(
  sessionId: string,
  jid: string,
  participants: string[]
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/group/participants/promote`, {
    method: "POST",
    body: JSON.stringify({ jid, participants }),
  })
}

export async function demoteParticipants(
  sessionId: string,
  jid: string,
  participants: string[]
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/group/participants/demote`, {
    method: "POST",
    body: JSON.stringify({ jid, participants }),
  })
}

export async function getInviteLink(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ link: string }>> {
  return apiClient<{ link: string }>(`/sessions/${sessionId}/group/invitelink?jid=${jid}`)
}

export async function joinGroup(
  sessionId: string,
  inviteCode: string
): Promise<ApiResponse<{ jid: string }>> {
  return apiClient<{ jid: string }>(`/sessions/${sessionId}/group/join`, {
    method: "POST",
    body: JSON.stringify({ code: inviteCode }),
  })
}
