import { apiRequest } from './config'

export interface Group {
  jid: string
  name: string
  topic?: string
  participantsCount?: number
  isAdmin?: boolean
  isSuperAdmin?: boolean
  createdAt?: string
  createdBy?: string
}

export interface GroupInfo extends Group {
  participants: GroupParticipant[]
  announce?: boolean
  locked?: boolean
  ephemeral?: number
}

export interface GroupParticipant {
  jid: string
  isAdmin: boolean
  isSuperAdmin: boolean
}



export async function getGroups(sessionId: string): Promise<Group[]> {
  const data = await apiRequest<{ groups: Group[] }>(`/${sessionId}/group/list`)
  return data.groups || []
}

export async function getGroupInfo(sessionId: string, groupJid: string): Promise<GroupInfo> {
  const params = new URLSearchParams({ jid: groupJid })
  return apiRequest<GroupInfo>(`/${sessionId}/group/info?${params}`)
}

export async function createGroup(
  sessionId: string, 
  name: string, 
  participants: string[]
): Promise<{ jid: string }> {
  return apiRequest(`/${sessionId}/group/create`, {
    method: 'POST',
    body: JSON.stringify({ name, participants }),
  })
}

export async function leaveGroup(sessionId: string, groupJid: string): Promise<void> {
  await apiRequest(`/${sessionId}/group/leave`, {
    method: 'POST',
    body: JSON.stringify({ jid: groupJid }),
  })
}

export async function getInviteLink(sessionId: string, groupJid: string): Promise<{ link: string }> {
  const params = new URLSearchParams({ jid: groupJid })
  return apiRequest<{ link: string }>(`/${sessionId}/group/invitelink?${params}`)
}

export async function updateGroupName(sessionId: string, groupJid: string, name: string): Promise<void> {
  await apiRequest(`/${sessionId}/group/name`, {
    method: 'POST',
    body: JSON.stringify({ jid: groupJid, name }),
  })
}

export async function updateGroupTopic(sessionId: string, groupJid: string, topic: string): Promise<void> {
  await apiRequest(`/${sessionId}/group/topic`, {
    method: 'POST',
    body: JSON.stringify({ jid: groupJid, topic }),
  })
}

export async function addParticipants(sessionId: string, groupJid: string, participants: string[]): Promise<void> {
  await apiRequest(`/${sessionId}/group/participants/add`, {
    method: 'POST',
    body: JSON.stringify({ jid: groupJid, participants }),
  })
}

export async function removeParticipants(sessionId: string, groupJid: string, participants: string[]): Promise<void> {
  await apiRequest(`/${sessionId}/group/participants/remove`, {
    method: 'POST',
    body: JSON.stringify({ jid: groupJid, participants }),
  })
}
