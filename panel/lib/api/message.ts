import { apiClient } from '../api';
import type { 
  Message, 
  SendMessageRequest, 
  MessageResponse, 
  ApiResponse 
} from '../types/api';

export const messageService = {
  /**
   * Get messages from chat
   * GET /message/:session/:chat
   */
  async getMessages(session: string, chat: string, limit?: number): Promise<Message[]> {
    const response = await apiClient.get<Message[]>(`/message/${session}/${chat}`, {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Send message
   * POST /message/:session/:chat
   */
  async sendMessage(session: string, chat: string, message: SendMessageRequest): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}`, message);
    return response.data;
  },

  /**
   * Send text message
   * POST /message/:session/:chat/text
   */
  async sendText(session: string, chat: string, text: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/text`, { text });
    return response.data;
  },

  /**
   * Send image message
   * POST /message/:session/:chat/image
   */
  async sendImage(session: string, chat: string, image: string, caption?: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/image`, { image, caption });
    return response.data;
  },

  /**
   * Send audio message
   * POST /message/:session/:chat/audio
   */
  async sendAudio(session: string, chat: string, audio: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/audio`, { audio });
    return response.data;
  },

  /**
   * Send video message
   * POST /message/:session/:chat/video
   */
  async sendVideo(session: string, chat: string, video: string, caption?: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/video`, { video, caption });
    return response.data;
  },

  /**
   * Send document message
   * POST /message/:session/:chat/document
   */
  async sendDocument(session: string, chat: string, document: string, filename?: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/document`, { document, filename });
    return response.data;
  },

  /**
   * Send sticker message
   * POST /message/:session/:chat/sticker
   */
  async sendSticker(session: string, chat: string, sticker: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/sticker`, { sticker });
    return response.data;
  },

  /**
   * Send location message
   * POST /message/:session/:chat/location
   */
  async sendLocation(
    session: string, 
    chat: string, 
    latitude: number, 
    longitude: number, 
    address?: string
  ): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/location`, { 
      location: { latitude, longitude, address } 
    });
    return response.data;
  },

  /**
   * Send contact message
   * POST /message/:session/:chat/contact
   */
  async sendContact(session: string, chat: string, contact: string, name: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/contact`, { 
      contact: { phone: contact, name } 
    });
    return response.data;
  },

  /**
   * Send poll message
   * POST /message/:session/:chat/poll
   */
  async sendPoll(
    session: string, 
    chat: string, 
    question: string, 
    options: string[], 
    multiple?: boolean
  ): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/poll`, { 
      poll: { question, options, multiple } 
    });
    return response.data;
  },

  /**
   * Send buttons message
   * POST /message/:session/:chat/buttons
   */
  async sendButtons(
    session: string, 
    chat: string, 
    text: string, 
    buttons: Array<{ id: string; text: string }>
  ): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/buttons`, { 
      text, 
      buttons 
    });
    return response.data;
  },

  /**
   * Send list message
   * POST /message/:session/:chat/list
   */
  async sendList(
    session: string, 
    chat: string, 
    text: string, 
    title: string, 
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/list`, { 
      text, 
      list: { title, sections } 
    });
    return response.data;
  },

  /**
   * Send interactive message
   * POST /message/:session/:chat/interactive
   */
  async sendInteractive(
    session: string, 
    chat: string, 
    interactive: Record<string, unknown>
  ): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/interactive`, { interactive });
    return response.data;
  },

  /**
   * Send template message
   * POST /message/:session/:chat/template
   */
  async sendTemplate(
    session: string, 
    chat: string, 
    template: string, 
    language: string, 
    components?: unknown[]
  ): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/template`, { 
      template: { name: template, language, components } 
    });
    return response.data;
  },

  /**
   * Send carousel message
   * POST /message/:session/:chat/carousel
   */
  async sendCarousel(
    session: string, 
    chat: string, 
    cards: Array<{
      title: string;
      subtitle?: string;
      image?: string;
      buttons: Array<{ id: string; text: string }>;
    }>
  ): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/carousel`, { 
      carousel: { cards } 
    });
    return response.data;
  },

  /**
   * React to message
   * POST /message/:session/:chat/:id/react
   */
  async reactToMessage(session: string, chat: string, messageId: string, emoji: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/message/${session}/${chat}/${messageId}/react`, { emoji });
    return response.data;
  },

  /**
   * Delete message
   * DELETE /message/:session/:chat/:id
   */
  async deleteMessage(session: string, chat: string, messageId: string, forEveryone?: boolean): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/message/${session}/${chat}/${messageId}`, {
      params: { forEveryone }
    });
    return response.data;
  },

  /**
   * Forward message
   * POST /message/:session/:chat/:id/forward
   */
  async forwardMessage(session: string, chat: string, messageId: string, to: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/message/${session}/${chat}/${messageId}/forward`, { to });
    return response.data;
  },

  /**
   * Star message
   * POST /message/:session/:chat/:id/star
   */
  async starMessage(session: string, chat: string, messageId: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/message/${session}/${chat}/${messageId}/star`);
    return response.data;
  },

  /**
   * Unstar message
   * POST /message/:session/:chat/:id/unstar
   */
  async unstarMessage(session: string, chat: string, messageId: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/message/${session}/${chat}/${messageId}/unstar`);
    return response.data;
  }
};

export default messageService;
