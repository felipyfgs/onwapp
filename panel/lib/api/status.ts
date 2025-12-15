import { apiClient } from '../api';
import type { 
  Status, 
  ApiResponse 
} from '../types/api';

export const statusService = {
  /**
   * Get all status/stories
   * GET /status/:session
   */
  async getStatuses(session: string): Promise<Status[]> {
    const response = await apiClient.get<Status[]>(`/status/${session}`);
    return response.data;
  },

  /**
   * Send text status
   * POST /status/:session/text
   */
  async sendTextStatus(session: string, text: string, backgroundColor?: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/status/${session}/text`, { 
      text, 
      backgroundColor 
    });
    return response.data;
  },

  /**
   * Send image status
   * POST /status/:session/image
   */
  async sendImageStatus(session: string, image: string, caption?: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/status/${session}/image`, { 
      image, 
      caption 
    });
    return response.data;
  },

  /**
   * Send video status
   * POST /status/:session/video
   */
  async sendVideoStatus(session: string, video: string, caption?: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/status/${session}/video`, { 
      video, 
      caption 
    });
    return response.data;
  },

  /**
   * Delete status
   * DELETE /status/:session/:status
   */
  async deleteStatus(session: string, statusId: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/status/${session}/${statusId}`);
    return response.data;
  }
};

export default statusService;