export interface GroupParticipant {
  jid?: string
  JID?: string
  isAdmin?: boolean
  IsAdmin?: boolean
  isSuperAdmin?: boolean
  IsSuperAdmin?: boolean
}

export interface Group {
  // whatsmeow returns 'JID' (uppercase), our DTO returns 'jid' (lowercase)
  jid?: string
  JID?: string
  // whatsmeow uses 'Name' for the GroupName field, but it's serialized as 'Name' or 'name'
  name?: string
  // whatsmeow uses 'GroupName' which maps to 'Name' in JSON
  Name?: string
  topic?: string
  // whatsmeow also returns Topic as separate field
  Topic?: string
  topicId?: string
  topicSetAt?: string
  topicSetBy?: string
  createdAt?: string
  createdBy?: string
  ownerJid?: string
  OwnerJID?: string
  // whatsmeow returns participants array with length
  participantCount?: number
  participants?: GroupParticipant[]
  Participants?: GroupParticipant[]
  // Settings
  isAnnounce?: boolean
  IsAnnounce?: boolean
  isLocked?: boolean
  IsLocked?: boolean
  isJoinApprovalRequired?: boolean
  IsJoinApprovalRequired?: boolean
  memberAddMode?: string
  MemberAddMode?: string
}

export interface JoinRequest {
  jid: string
  JID?: string
  requestedAt?: string
  RequestedAt?: string
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
