import type {
  GroupsResponse,
  GroupInfoResponse,
  CreateGroupRequest,
  GroupActionRequest,
  ParticipantsActionRequest,
} from "@/lib/types/group"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ""

// Função para fazer retry com exponential backoff
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit, maxRetries: number = 3): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { Authorization: API_KEY } : {}),
          ...options?.headers,
        },
      })

      if (response.ok) {
        return response.json()
      }

      // Tratar especificamente status 429 (Too Many Requests)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * Math.pow(2, attempt), 30000)
        
        if (attempt < maxRetries) {
          await sleep(waitTime)
          continue
        }
      }

      // Tentar parsear o erro apenas se for JSON
      let errorData: { error?: string; message?: string } = { error: response.statusText }
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = await response.json()
        } catch {
          // Se falhar o parse, mantém o statusText
        }
      }

      const errorMessage = errorData.error || errorData.message || `API request failed: ${response.status}`
      lastError = new Error(errorMessage)
      break

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Se não for a última tentativa e for um erro de rede, tenta novamente
      if (attempt < maxRetries && lastError.message.includes('fetch')) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000)
        await sleep(waitTime)
        continue
      }
      break
    }
  }

  throw lastError || new Error('Failed after retries')
}

export async function getGroups(session: string): Promise<GroupsResponse> {
  return fetchAPI<GroupsResponse>(`/${session}/group/list`)
}

export async function getGroupInfo(session: string, groupId: string): Promise<GroupInfoResponse> {
  return fetchAPI<GroupInfoResponse>(`/${session}/group/info?groupId=${encodeURIComponent(groupId)}`)
}

export async function getGroupAvatar(session: string, groupId: string): Promise<{ url: string; id?: string }> {
  return fetchAPI<{ url: string; id?: string }>(`/${session}/group/avatar?groupId=${encodeURIComponent(groupId)}`)
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

export async function promoteParticipants(session: string, data: ParticipantsActionRequest): Promise<void> {
  return fetchAPI<void>(`/${session}/group/participants/promote`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function demoteParticipants(session: string, data: ParticipantsActionRequest): Promise<void> {
  return fetchAPI<void>(`/${session}/group/participants/demote`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateGroupName(session: string, groupId: string, name: string): Promise<void> {
  return fetchAPI<void>(`/${session}/group/name`, {
    method: "POST",
    body: JSON.stringify({ groupId, value: name }),
  })
}

export async function updateGroupTopic(session: string, groupId: string, topic: string): Promise<void> {
  return fetchAPI<void>(`/${session}/group/topic`, {
    method: "POST",
    body: JSON.stringify({ groupId, value: topic }),
  })
}

export async function setGroupPicture(session: string, groupId: string, image: string): Promise<void> {
  return fetchAPI<void>(`/${session}/group/photo`, {
    method: "POST",
    body: JSON.stringify({ groupId, image }),
  })
}

export async function deleteGroupPicture(session: string, groupId: string): Promise<void> {
  return fetchAPI<void>(`/${session}/group/photo/remove`, {
    method: "POST",
    body: JSON.stringify({ groupId }),
  })
}

export async function setGroupAnnounce(session: string, groupId: string, announce: boolean): Promise<void> {
  return fetchAPI<void>(`/${session}/group/announce`, {
    method: "POST",
    body: JSON.stringify({ groupId, announce }),
  })
}

export async function setGroupLocked(session: string, groupId: string, locked: boolean): Promise<void> {
  return fetchAPI<void>(`/${session}/group/locked`, {
    method: "POST",
    body: JSON.stringify({ groupId, locked }),
  })
}

export async function setGroupApprovalMode(session: string, groupId: string, approvalMode: boolean): Promise<void> {
  return fetchAPI<void>(`/${session}/group/approval`, {
    method: "POST",
    body: JSON.stringify({ groupId, approvalMode }),
  })
}

export async function setGroupMemberAddMode(session: string, groupId: string, mode: string): Promise<void> {
  return fetchAPI<void>(`/${session}/group/memberadd`, {
    method: "POST",
    body: JSON.stringify({ groupId, mode }),
  })
}

export async function getGroupInfoFromLink(session: string, link: string): Promise<GroupInfoResponse> {
  return fetchAPI<GroupInfoResponse>(`/${session}/group/inviteinfo?link=${encodeURIComponent(link)}`)
}

export async function joinGroup(session: string, inviteLink: string): Promise<{ groupId: string }> {
  return fetchAPI<{ groupId: string }>(`/${session}/group/join`, {
    method: "POST",
    body: JSON.stringify({ inviteLink }),
  })
}

export async function getGroupRequests(session: string, groupId: string): Promise<{ participants: Array<{ jid: string; requestedAt?: string }> }> {
  return fetchAPI<{ participants: Array<{ jid: string; requestedAt?: string }> }>(`/${session}/group/requests?groupId=${encodeURIComponent(groupId)}`)
}

export async function updateGroupRequests(session: string, groupId: string, participants: string[], action: 'approve' | 'reject'): Promise<void> {
  return fetchAPI<void>(`/${session}/group/requests/action`, {
    method: "POST",
    body: JSON.stringify({ groupId, participants, action }),
  })
}
