export interface GroupParticipant {
  jid: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export interface Group {
  jid: string
  name: string
  topic?: string
  topicId?: string
  topicSetAt?: string
  topicSetBy?: string
  createdAt?: string
  createdBy?: string
  participantCount?: number
  participants?: GroupParticipant[]
  isAnnounce?: boolean
  isLocked?: boolean
}

export interface GroupsResponse {
  data: Group[]
}

export interface GroupInfoResponse {
  groupId: string
  data: Group
}

export interface CreateGroupRequest {
  name: string
  participants: string[]
}

export interface GroupActionRequest {
  groupId: string
}

export interface ParticipantsActionRequest {
  groupId: string
  participants: string[]
}
