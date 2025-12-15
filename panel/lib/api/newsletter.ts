import { apiClient } from '../api';
import type { 
  Newsletter, 
  ApiResponse 
} from '../types/api';

export const newsletterService = {
  /**
   * Get all newsletters
   * GET /newsletter/:session
   */
  async getNewsletters(session: string): Promise<Newsletter[]> {
    const response = await apiClient.get<Newsletter[]>(`/newsletter/${session}`);
    return response.data;
  },

  /**
   * Get newsletter by ID
   * GET /newsletter/:session/:newsletter
   */
  async getNewsletter(session: string, newsletter: string): Promise<Newsletter> {
    const response = await apiClient.get<Newsletter>(`/newsletter/${session}/${newsletter}`);
    return response.data;
  },

  /**
   * Create newsletter
   * POST /newsletter/:session
   */
  async createNewsletter(
    session: string, 
    name: string, 
    description?: string
  ): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/newsletter/${session}`, { 
      name, 
      description 
    });
    return response.data;
  },

  /**
   * Update newsletter
   * PUT /newsletter/:session/:newsletter
   */
  async updateNewsletter(
    session: string, 
    newsletter: string, 
    updates: Partial<{
      name: string;
      description: string;
      picture?: string;
    }>
  ): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/newsletter/${session}/${newsletter}`, updates);
    return response.data;
  },

  /**
   * Delete newsletter
   * DELETE /newsletter/:session/:newsletter
   */
  async deleteNewsletter(session: string, newsletter: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/newsletter/${session}/${newsletter}`);
    return response.data;
  },

  /**
   * Follow newsletter
   * POST /newsletter/:session/:newsletter/follow
   */
  async followNewsletter(session: string, newsletter: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/newsletter/${session}/${newsletter}/follow`);
    return response.data;
  },

  /**
   * Unfollow newsletter
   * POST /newsletter/:session/:newsletter/unfollow
   */
  async unfollowNewsletter(session: string, newsletter: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/newsletter/${session}/${newsletter}/unfollow`);
    return response.data;
  },

  /**
   * Send newsletter message
   * POST /newsletter/:session/:newsletter/send
   */
  async sendNewsletterMessage(
    session: string, 
    newsletter: string, 
    message: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      media?: string;
      caption?: string;
    }
  ): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/newsletter/${session}/${newsletter}/send`, message);
    return response.data;
  },

  /**
   * Get newsletter followers
   * GET /newsletter/:session/:newsletter/followers
   */
  async getNewsletterFollowers(session: string, newsletter: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/newsletter/${session}/${newsletter}/followers`);
    return response.data;
  },

  /**
   * Get newsletter stats
   * GET /newsletter/:session/:newsletter/stats
   */
  async getNewsletterStats(session: string, newsletter: string): Promise<{
    followers: number;
    messages: number;
    engagement: number;
  }> {
    const response = await apiClient.get<{
      followers: number;
      messages: number;
      engagement: number;
    }>(`/newsletter/${session}/${newsletter}/stats`);
    return response.data;
  }
};

export default newsletterService;