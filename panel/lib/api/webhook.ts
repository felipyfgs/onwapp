import { apiClient } from '../api';
import type { 
  Webhook, 
  WebhookRequest, 
  WebhookStats, 
  ApiResponse 
} from '../types/api';

export const webhookService = {
  /**
   * Get webhook config
   * GET /webhook/:session
   */
  async getWebhook(session: string): Promise<Webhook> {
    const response = await apiClient.get<Webhook>(`/webhook/${session}`);
    return response.data;
  },

  /**
   * Set webhook config
   * POST /webhook/:session
   */
  async setWebhook(session: string, webhook: WebhookRequest): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/webhook/${session}`, webhook);
    return response.data;
  },

  /**
   * Update webhook config
   * PUT /webhook/:session
   */
  async updateWebhook(session: string, webhook: Partial<WebhookRequest>): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/webhook/${session}`, webhook);
    return response.data;
  },

  /**
   * Delete webhook config
   * DELETE /webhook/:session
   */
  async deleteWebhook(session: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/webhook/${session}`);
    return response.data;
  },

  /**
   * Get webhook stats
   * GET /webhook/:session/stats
   */
  async getWebhookStats(session: string): Promise<WebhookStats> {
    const response = await apiClient.get<WebhookStats>(`/webhook/${session}/stats`);
    return response.data;
  },

  /**
   * Test webhook
   * POST /webhook/:session/test
   */
  async testWebhook(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/webhook/${session}/test`);
    return response.data;
  },

  /**
   * Enable webhook
   * POST /webhook/:session/enable
   */
  async enableWebhook(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/webhook/${session}/enable`);
    return response.data;
  },

  /**
   * Disable webhook
   * POST /webhook/:session/disable
   */
  async disableWebhook(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/webhook/${session}/disable`);
    return response.data;
  }
};

export default webhookService;