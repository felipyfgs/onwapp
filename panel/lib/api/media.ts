import { apiClient } from '../api';
import type { 
  MediaUploadResponse, 
  ApiResponse 
} from '../types/api';

export const mediaService = {
  /**
   * Upload media
   * POST /media/:session
   */
  async uploadMedia(session: string, file: File): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<MediaUploadResponse>(`/media/${session}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Download media
   * GET /media/:session/:media
   */
  async downloadMedia(session: string, media: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/media/${session}/${media}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Delete media
   * DELETE /media/:session/:media
   */
  async deleteMedia(session: string, media: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/media/${session}/${media}`);
    return response.data;
  },

  /**
   * Get media info
   * GET /media/:session/:media/info
   */
  async getMediaInfo(session: string, media: string): Promise<{
    id: string;
    filename: string;
    size: number;
    mimetype: string;
    createdAt: string;
  }> {
    const response = await apiClient.get<{
      id: string;
      filename: string;
      size: number;
      mimetype: string;
      createdAt: string;
    }>(`/media/${session}/${media}/info`);
    return response.data;
  },

  /**
   * Get all media for session
   * GET /media/:session
   */
  async getSessionMedia(session: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/media/${session}`);
    return response.data;
  },

  /**
   * Upload from URL
   * POST /media/:session/url
   */
  async uploadFromUrl(session: string, url: string): Promise<MediaUploadResponse> {
    const response = await apiClient.post<MediaUploadResponse>(`/media/${session}/url`, { url });
    return response.data;
  }
};

export default mediaService;