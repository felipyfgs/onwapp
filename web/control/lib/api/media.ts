import { apiClient, getApiUrl, ApiResponse } from "./client"

export type MediaType = "image" | "video" | "audio" | "document" | "sticker"

export interface MediaFile {
  id: string
  sessionId: string
  msgId: string
  chatJid: string
  mediaType: MediaType
  mimeType: string
  fileSize: number
  fileName?: string
  storageUrl?: string
  storageKey?: string
  thumbnailUrl?: string
  downloaded: boolean
  downloadError?: string
  createdAt: string
}

export interface MediaListParams {
  limit?: number
  offset?: number
  mediaType?: MediaType
  chatJid?: string
}

export async function getMediaList(
  sessionId: string,
  params?: MediaListParams
): Promise<ApiResponse<MediaFile[]>> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set("limit", params.limit.toString())
  if (params?.offset) searchParams.set("offset", params.offset.toString())
  if (params?.mediaType) searchParams.set("mediaType", params.mediaType)
  if (params?.chatJid) searchParams.set("chatJid", params.chatJid)
  const query = searchParams.toString()
  return apiClient<MediaFile[]>(`/sessions/${sessionId}/media/list${query ? `?${query}` : ""}`)
}

export async function getPendingMedia(
  sessionId: string
): Promise<ApiResponse<MediaFile[]>> {
  return apiClient<MediaFile[]>(`/sessions/${sessionId}/media/pending`)
}

export async function processMedia(
  sessionId: string,
  mediaIds?: string[]
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/media/process`, {
    method: "POST",
    body: JSON.stringify({ ids: mediaIds }),
  })
}

export async function retryMediaDownload(
  sessionId: string,
  mediaId: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/media/retry`, {
    method: "POST",
    body: JSON.stringify({ id: mediaId }),
  })
}

export function getMediaStreamUrl(sessionId: string, mediaId: string): string {
  return getApiUrl(`/public/${sessionId}/media/stream?id=${mediaId}`)
}

export function getMediaDownloadUrl(sessionId: string, mediaId: string): string {
  return getApiUrl(`/sessions/${sessionId}/media/download?id=${mediaId}`)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getMediaIcon(mediaType: MediaType): string {
  switch (mediaType) {
    case "image":
      return "Image"
    case "video":
      return "Video"
    case "audio":
      return "Music"
    case "document":
      return "FileText"
    case "sticker":
      return "Sticker"
    default:
      return "File"
  }
}
