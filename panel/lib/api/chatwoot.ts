import { apiClient } from '../api';
import type { 
  ChatwootConfig, 
  ChatwootRequest, 
  ChatwootStats, 
  ApiResponse 
} from '../types/api';

export const chatwootService = {
  /**
   * Get Chatwoot config
   * GET /chatwoot/:session
   */
  async getChatwootConfig(session: string): Promise<ChatwootConfig> {
    const response = await apiClient.get<ChatwootConfig>(`/chatwoot/${session}`);
    return response.data;
  },

  /**
   * Set Chatwoot config
   * POST /chatwoot/:session
   */
  async setChatwootConfig(session: string, config: ChatwootRequest): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chatwoot/${session}`, config);
    return response.data;
  },

  /**
   * Update Chatwoot config
   * PUT /chatwoot/:session
   */
  async updateChatwootConfig(session: string, config: Partial<ChatwootRequest>): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/chatwoot/${session}`, config);
    return response.data;
  },

  /**
   * Delete Chatwoot config
   * DELETE /chatwoot/:session
   */
  async deleteChatwootConfig(session: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/chatwoot/${session}`);
    return response.data;
  },

  /**
   * Test Chatwoot connection
   * POST /chatwoot/:session/test
   */
  async testChatwoot(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chatwoot/${session}/test`);
    return response.data;
  },

  /**
   * Get Chatwoot stats
   * GET /chatwoot/:session/stats
   */
  async getChatwootStats(session: string): Promise<ChatwootStats> {
    const response = await apiClient.get<ChatwootStats>(`/chatwoot/${session}/stats`);
    return response.data;
  },

  /**
   * Enable Chatwoot
   * POST /chatwoot/:session/enable
   */
  async enableChatwoot(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chatwoot/${session}/enable`);
    return response.data;
  },

  /**
   * Disable Chatwoot
   * POST /chatwoot/:session/disable
   */
  async disableChatwoot(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chatwoot/${session}/disable`);
    return response.data;
  },

  /**
   * Sync Chatwoot contacts
   * POST /chatwoot/:session/sync
   */
  async syncChatwootContacts(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chatwoot/${session}/sync`);
    return response.data;
  },

  /**
   * Get Chatwoot conversations
   * GET /chatwoot/:session/conversations
   */
  async getChatwootConversations(session: string): Promise<unknown[]> {
    const response = await apiClient.get<unknown[]>(`/chatwoot/${session}/conversations`);
    return response.data;
  },

  /**
   * Send message to Chatwoot
   * POST /chatwoot/:session/send
   */
  async sendToChatwoot(session: string, content: string, conversationId: number): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chatwoot/${session}/send`, { 
      content, 
      conversationId 
    });
    return response.data;
  }
};

export default chatwootService;