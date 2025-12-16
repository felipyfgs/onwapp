import { apiClient, ApiResponse } from "./client"

export interface RejectCallRequest {
  callId: string
  callFrom: string
}

export async function rejectCall(
  sessionId: string,
  data: RejectCallRequest
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/call/reject`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
