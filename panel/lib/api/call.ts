import { apiClient } from '../api';
import type { 
  Call, 
  ApiResponse 
} from '../types/api';

export const callService = {
  /**
   * Get call history
   * GET /call/:session
   */
  async getCallHistory(session: string): Promise<Call[]> {
    const response = await apiClient.get<Call[]>(`/call/${session}`);
    return response.data;
  },

  /**
   * Make voice call
   * POST /call/:session/voice
   */
  async makeVoiceCall(session: string, to: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/call/${session}/voice`, { to });
    return response.data;
  },

  /**
   * Make video call
   * POST /call/:session/video
   */
  async makeVideoCall(session: string, to: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/call/${session}/video`, { to });
    return response.data;
  },

  /**
   * Reject call
   * POST /call/:session/:call/reject
   */
  async rejectCall(session: string, callId: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/call/${session}/${callId}/reject`);
    return response.data;
  },

  /**
   * Accept call
   * POST /call/:session/:call/accept
   */
  async acceptCall(session: string, callId: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/call/${session}/${callId}/accept`);
    return response.data;
  },

  /**
   * End call
   * POST /call/:session/:call/end
   */
  async endCall(session: string, callId: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/call/${session}/${callId}/end`);
    return response.data;
  }
};

export default callService;