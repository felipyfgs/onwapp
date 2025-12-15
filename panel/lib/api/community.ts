import { apiClient } from '../api';
import type { 
  Community, 
  ApiResponse 
} from '../types/api';

export const communityService = {
  /**
   * Get all communities
   * GET /community/:session
   */
  async getCommunities(session: string): Promise<Community[]> {
    const response = await apiClient.get<Community[]>(`/community/${session}`);
    return response.data;
  },

  /**
   * Get community info
   * GET /community/:session/:community
   */
  async getCommunity(session: string, community: string): Promise<Community> {
    const response = await apiClient.get<Community>(`/community/${session}/${community}`);
    return response.data;
  },

  /**
   * Create community
   * POST /community/:session
   */
  async createCommunity(session: string, name: string, description?: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/community/${session}`, { 
      name, 
      description 
    });
    return response.data;
  },

  /**
   * Update community
   * PUT /community/:session/:community
   */
  async updateCommunity(
    session: string, 
    community: string, 
    updates: Partial<{
      name: string;
      description: string;
      picture?: string;
    }>
  ): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/community/${session}/${community}`, updates);
    return response.data;
  },

  /**
   * Delete community
   * DELETE /community/:session/:community
   */
  async deleteCommunity(session: string, community: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/community/${session}/${community}`);
    return response.data;
  }
};

export default communityService;