import { api, API_URL } from "./client"

export interface MediaItem {
  id: string
  sessionId: string
  msgId: string
  mediaType: string
  mimeType?: string
  fileSize?: number
  fileName?: string
  storageUrl?: string
  downloaded: boolean
  chatJid?: string
  fromMe?: boolean
  caption?: string
  width?: number
  height?: number
  duration?: number
  createdAt?: string
}

export interface MediaListResponse {
  media: MediaItem[]
  count: number
  limit: number
  offset: number
}

export async function getMediaList(
  session: string,
  options?: {
    mediaType?: string
    limit?: number
    offset?: number
  }
): Promise<MediaListResponse> {
  const params = new URLSearchParams()
  if (options?.mediaType) params.set("mediaType", options.mediaType)
  if (options?.limit) params.set("limit", options.limit.toString())
  if (options?.offset) params.set("offset", options.offset.toString())

  const query = params.toString()
  const response = await api<MediaListResponse>(`/${session}/media/list${query ? `?${query}` : ""}`)
  return {
    media: response.media || [],
    count: response.count || 0,
    limit: response.limit || 100,
    offset: response.offset || 0,
  }
}

export async function getPendingMedia(session: string): Promise<MediaItem[]> {
  return api<MediaItem[]>(`/${session}/media/pending`)
}

export async function processMedia(session: string, mediaId: string): Promise<MediaItem> {
  return api<MediaItem>(`/${session}/media/process`, {
    method: "POST",
    body: JSON.stringify({ mediaId }),
  })
}

export async function retryMediaDownload(session: string, mediaId: string): Promise<MediaItem> {
  return api<MediaItem>(`/${session}/media/retry`, {
    method: "POST",
    body: JSON.stringify({ mediaId }),
  })
}

export function getMediaStreamUrl(session: string, mediaId: string): string {
  return `${API_URL}/${session}/media/stream?mediaId=${mediaId}`
}

export function getMediaDownloadUrl(session: string, mediaId: string): string {
  return `${API_URL}/${session}/media/download?mediaId=${mediaId}`
}
