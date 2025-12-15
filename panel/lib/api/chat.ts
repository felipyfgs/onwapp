import { apiClient } from '../api';
import type { 
  Chat, 
  ChatResponse, 
  ApiResponse 
} from '../types/api';

export const chatService = {
  /**
   * Get all chats
   * GET /chat/:session
   */
  async getChats(session: string): Promise<Chat[]> {
    const response = await apiClient.get<Chat[]>(`/chat/${session}`);
    return response.data;
  },

  /**
   * Get chat by ID
   * GET /chat/:session/:chat
   */
  async getChat(session: string, chat: string): Promise<Chat> {
    const response = await apiClient.get<Chat>(`/chat/${session}/${chat}`);
    return response.data;
  },

  /**
   * Archive chat
   * POST /chat/:session/:chat/archive
   */
  async archiveChat(session: string, chat: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chat/${session}/${chat}/archive`);
    return response.data;
  },

  /**
   * Unarchive chat
   * POST /chat/:session/:chat/unarchive
   */
  async unarchiveChat(session: string, chat: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chat/${session}/${chat}/unarchive`);
    return response.data;
  },

  /**
   * Pin chat
   * POST /chat/:session/:chat/pin
   */
  async pinChat(session: string, chat: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chat/${session}/${chat}/pin`);
    return response.data;
  },

  /**
   * Unpin chat
   * POST /chat/:session/:chat/unpin
   */
  async unpinChat(session: string, chat: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chat/${session}/${chat}/unpin`);
    return response.data;
  },

  /**
   * Mute chat
   * POST /chat/:session/:chat/mute
   */
  async muteChat(session: string, chat: string, duration?: number): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chat/${session}/${chat}/mute`, { 
      duration 
    });
    return response.data;
  },

  /**
   * Unmute chat
   * POST /chat/:session/:chat/unmute
   */
  async unmuteChat(session: string, chat: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chat/${session}/${chat}/unmute`);
    return response.data;
  },

  /**
   * Delete chat
   * DELETE /chat/:session/:chat
   */
  async deleteChat(session: string, chat: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/chat/${session}/${chat}`);
    return response.data;
  },

  /**
   * Clear chat messages
   * POST /chat/:session/:chat/clear
   */
  async clearChat(session: string, chat: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chat/${session}/${chat}/clear`);
    return response.data;
  },

  /**
   * Mark chat as read
   * POST /chat/:session/:chat/read
   */
  async markAsRead(session: string, chat: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/chat/${session}/${chat}/read`);
    return response.data;
  }
};

export default chatService;