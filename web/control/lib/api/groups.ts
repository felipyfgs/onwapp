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

export async function getGroupAvatar(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ url: string }>> {
  return apiClient<{ url: string }>(
    `/sessions/${sessionId}/group/avatar?jid=${encodeURIComponent(jid)}`
  )
}

export async function setAnnounceMode(
  sessionId: string,
  jid: string,
  announce: boolean
): Promise<ApiResponse<{ message: string }>> {
  return apiClient<{ message: string }>(`/sessions/${sessionId}/group/announce`, {
    method: "POST",
    body: JSON.stringify({ jid, announce }),
  })
}

export async function setLockedMode(
  sessionId: string,
  jid: string,
  locked: boolean
): Promise<ApiResponse<{ message: string }>> {
  return apiClient<{ message: string }>(`/sessions/${sessionId}/group/locked`, {
    method: "POST",
    body: JSON.stringify({ jid, locked }),
  })
}

export async function setApprovalMode(
  sessionId: string,
  jid: string,
  approval: boolean
): Promise<ApiResponse<{ message: string }>> {
  return apiClient<{ message: string }>(`/sessions/${sessionId}/group/approval`, {
    method: "POST",
    body: JSON.stringify({ jid, approval }),
  })
}

export async function setMemberAddMode(
  sessionId: string,
  jid: string,
  memberAdd: boolean
): Promise<ApiResponse<{ message: string }>> {
  return apiClient<{ message: string }>(`/sessions/${sessionId}/group/memberadd`, {
    method: "POST",
    body: JSON.stringify({ jid, memberAdd }),
  })
}

export interface GroupInviteInfo {
  jid: string
  name: string
  size: number
  topic?: string
}

export async function getGroupInfoFromInvite(
  sessionId: string,
  code: string
): Promise<ApiResponse<GroupInviteInfo>> {
  return apiClient<GroupInviteInfo>(
    `/sessions/${sessionId}/group/inviteinfo?code=${encodeURIComponent(code)}`
  )
}

export interface JoinRequest {
  jid: string
  phone: string
  requestedAt: string
}

export async function getJoinRequests(
  sessionId: string,
  groupJid: string
): Promise<ApiResponse<JoinRequest[]>> {
  return apiClient<JoinRequest[]>(
    `/sessions/${sessionId}/group/requests?jid=${encodeURIComponent(groupJid)}`
  )
}

export async function handleJoinRequest(
  sessionId: string,
  groupJid: string,
  participantJids: string[],
  action: "approve" | "reject"
): Promise<ApiResponse<{ message: string }>> {
  return apiClient<{ message: string }>(`/sessions/${sessionId}/group/requests/action`, {
    method: "POST",
    body: JSON.stringify({ jid: groupJid, participants: participantJids, action }),
  })
}

export async function revokeInviteLink(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ inviteLink: string }>> {
  return apiClient<{ inviteLink: string }>(`/sessions/${sessionId}/group/invitelink/revoke`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  })
}
