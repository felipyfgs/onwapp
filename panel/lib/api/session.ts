import { apiClient } from '../api';
import type { 
  Session, 
  CreateSessionRequest, 
  SessionResponse, 
  SessionStatusResponse, 
  QRCodeResponse, 
  ApiResponse 
} from '../types/api';

export const sessionService = {
  /**
   * Get all sessions
   * GET /sessions
   */
  async fetchSessions(): Promise<Session[]> {
    const response = await apiClient.get<Session[]>('/sessions');
    return response.data;
  },

  /**
   * Create a new session
   * POST /sessions
   */
  async createSession(name: string): Promise<SessionResponse> {
    const request: CreateSessionRequest = { name };
    const response = await apiClient.post<SessionResponse>('/sessions', request);
    return response.data;
  },

  /**
   * Get session status
   * GET /sessions/:session/status
   */
  async getSessionStatus(session: string): Promise<SessionStatusResponse> {
    const response = await apiClient.get<SessionStatusResponse>(`/sessions/${session}/status`);
    return response.data;
  },

  /**
   * Delete a session
   * DELETE /sessions/:session
   */
  async deleteSession(session: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/sessions/${session}`);
    return response.data;
  },

  /**
   * Connect to WhatsApp
   * POST /sessions/:session/connect
   */
  async connectSession(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/sessions/${session}/connect`);
    return response.data;
  },

  /**
   * Disconnect from WhatsApp
   * POST /sessions/:session/disconnect
   */
  async disconnectSession(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/sessions/${session}/disconnect`);
    return response.data;
  },

  /**
   * Logout from WhatsApp
   * POST /sessions/:session/logout
   */
  async logoutSession(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/sessions/${session}/logout`);
    return response.data;
  },

  /**
   * Restart session
   * POST /sessions/:session/restart
   */
  async restartSession(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/sessions/${session}/restart`);
    return response.data;
  },

  /**
   * Get QR Code for connection
   * GET /sessions/:session/qr
   */
  async getQRCode(session: string): Promise<QRCodeResponse> {
    const response = await apiClient.get<QRCodeResponse>(`/sessions/${session}/qr`);
    return response.data;
  },

  /**
   * Pair with phone number
   * POST /sessions/:session/pairphone
   */
  async pairPhone(session: string, phone: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/sessions/${session}/pairphone`, { phone });
    return response.data;
  },

  /**
   * Bulk operations
   */
  async connectAllSessions(): Promise<PromiseSettledResult<ApiResponse>[]> {
    const sessions = await this.fetchSessions();
    const promises = sessions.map(session => 
      this.connectSession(session.session)
    );
    return Promise.allSettled(promises);
  },

  async disconnectAllSessions(): Promise<PromiseSettledResult<ApiResponse>[]> {
    const sessions = await this.fetchSessions();
    const promises = sessions.map(session => 
      this.disconnectSession(session.session)
    );
    return Promise.allSettled(promises);
  }
};

export default sessionService;