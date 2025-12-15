import { apiClient } from '../api';
import type { 
  Profile, 
  ApiResponse 
} from '../types/api';

export const profileService = {
  /**
   * Get profile by session
   * GET /profile/:session
   */
  async getProfile(session: string): Promise<ApiResponse<Profile>> {
    const response = await apiClient.get<ApiResponse<Profile>>(`/profile/${session}`);
    return response.data;
  },

  /**
   * Update profile
   * PUT /profile/:session
   */
  async updateProfile(session: string, profile: any): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/profile/${session}`, profile);
    return response.data;
  },

  /**
   * Update profile photo
   * PUT /profile/:session/photo
   */
  async updateProfilePhoto(session: string, photoData: any): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/profile/${session}/photo`, photoData);
    return response.data;
  },

  /**
   * Get profile by phone number
   * GET /profile/:session/:phone
   */
  async getProfileByPhone(session: string, phone: string): Promise<ApiResponse<Profile>> {
    const response = await apiClient.get<ApiResponse<Profile>>(`/profile/${session}/${phone}`);
    return response.data;
  }
};

export default profileService;
