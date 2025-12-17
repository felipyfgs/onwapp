import { apiClient, ApiResponse } from "./client"

export interface Profile {
  pushName?: string
  about?: string
  phone?: string
  profilePictureUrl?: string
  businessName?: string
  platform?: string
}

export async function getProfile(
  sessionId: string
): Promise<ApiResponse<Profile>> {
  return apiClient<Profile>(`/sessions/${sessionId}/profile`)
}

export async function setPushName(
  sessionId: string,
  name: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/profile/name`, {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export async function setStatus(
  sessionId: string,
  status: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/profile/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  })
}

export async function setProfilePicture(
  sessionId: string,
  image: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/profile/picture`, {
    method: "POST",
    body: JSON.stringify({ image }),
  })
}

export async function deleteProfilePicture(
  sessionId: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/profile/picture/remove`, {
    method: "POST",
  })
}
