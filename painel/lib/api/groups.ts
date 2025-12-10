import { api } from "./client"

export interface GroupParticipant {
  jid: string
  isAdmin?: boolean
  isSuperAdmin?: boolean
}

export interface Group {
  jid: string
  name: string
  topic?: string
  subject?: string
  profilePicture?: string
  participantCount?: number
  participants?: GroupParticipant[]
  isAnnounce?: boolean
  isLocked?: boolean
  createdAt?: number
  ownerJid?: string
}

export interface GroupInfo extends Group {
  participants: GroupParticipant[]
  description?: string
}

interface GroupListResponse {
  data: Group[]
}

export async function getGroups(session: string): Promise<Group[]> {
  const response = await api<GroupListResponse>(`/${session}/group/list`)
  return response.data || []
}

export async function getGroupInfo(session: string, groupId: string): Promise<GroupInfo> {
  return api<GroupInfo>(`/${session}/group/info?groupId=${encodeURIComponent(groupId)}`)
}

export async function leaveGroup(session: string, groupId: string): Promise<void> {
  await api(`/${session}/group/leave`, {
    method: "POST",
    body: JSON.stringify({ groupId }),
  })
}

export async function getInviteLink(session: string, groupId: string): Promise<string> {
  const response = await api<{ link: string }>(`/${session}/group/invitelink?groupId=${encodeURIComponent(groupId)}`)
  return response.link
}

export async function getGroupAvatar(session: string, groupId: string): Promise<string | null> {
  try {
    const response = await api<{ url: string }>(`/${session}/group/avatar?groupId=${encodeURIComponent(groupId)}`)
    return response.url
  } catch {
    return null
  }
}

export async function createGroup(session: string, name: string, participants: string[]): Promise<Group> {
  return api<Group>(`/${session}/group/create`, {
    method: "POST",
    body: JSON.stringify({ name, participants }),
  })
}

export async function updateGroupName(session: string, groupId: string, name: string): Promise<void> {
  await api(`/${session}/group/name`, {
    method: "POST",
    body: JSON.stringify({ groupId, name }),
  })
}

export async function updateGroupTopic(session: string, groupId: string, topic: string): Promise<void> {
  await api(`/${session}/group/topic`, {
    method: "POST",
    body: JSON.stringify({ groupId, topic }),
  })
}
