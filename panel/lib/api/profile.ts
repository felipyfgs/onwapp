import { apiClient } from '../api';
import type { 
  Profile, 
  ProfileResponse, 
  UpdateProfileRequest, 
  UpdateProfilePhotoRequest,
  ApiResponse 
} from '../types/api';

export const profileService = {
  /**
   * Get profile by session
   * GET /profile/:session
   */
  async getProfile(session: string): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse>(`/profile/${session}`);
    return response.data;
  },

  /**
   * Update profile
   * PUT /profile/:session
   */
  async updateProfile(session: string, profile: UpdateProfileRequest): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/profile/${session}`, profile);
    return response.data;
  },

  /**
   * Update profile photo
   * PUT /profile/:session/photo
   */
  async updateProfilePhoto(session: string, photoData: UpdateProfilePhotoRequest): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/profile/${session}/photo`, photoData);
    return response.data;
  },

  /**
   * Get profile by phone number
   * GET /profile/:session/:phone
   */
  async getProfileByPhone(session: string, phone: string): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse>(`/profile/${session}/${phone}`);
    return response.data;
  }
};

export default profileService;