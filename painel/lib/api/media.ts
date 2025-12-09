import { apiRequest } from './config'

/**
 * Retry downloading a specific media from WhatsApp
 * @param sessionId - Session ID
 * @param messageId - Message ID of the media to retry
 * @returns Promise with the retry response
 */
export async function retryMediaDownload(
  sessionId: string,
  messageId: string
): Promise<{ message: string; msgId: string }> {
  const response = await apiRequest<{ message: string; msgId: string }>(
    `/${sessionId}/media/retry?messageId=${messageId}`,
    { method: 'POST' }
  )
  return response
}
