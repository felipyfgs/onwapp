import { apiClient, ApiResponse } from "./client"

export interface CommunityGroup {
  jid: string
  name: string
  isAnnounce: boolean
}

export async function getCommunityGroups(
  sessionId: string,
  communityJid: string
): Promise<ApiResponse<CommunityGroup[]>> {
  return apiClient(
    `/${sessionId}/community/groups?jid=${encodeURIComponent(communityJid)}`
  )
}

export async function linkGroupToCommunity(
  sessionId: string,
  communityJid: string,
  groupJids: string[]
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/community/link`, {
    method: "POST",
    body: JSON.stringify({ communityJid, groupJids }),
  })
}

export async function unlinkGroupFromCommunity(
  sessionId: string,
  communityJid: string,
  groupJids: string[]
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/community/unlink`, {
    method: "POST",
    body: JSON.stringify({ communityJid, groupJids }),
  })
}
