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
    const message: SendMessageRequest = { 
      type: 'text', 
      text 
    };
    return this.sendMessage(session, chat, message);
  },

  /**
   * Send image message
   * POST /message/:session/:chat/image
   */
  async sendImage(session: string, chat: string, image: string, caption?: string): Promise<MessageResponse> {
    const message: SendMessageRequest = { 
      type: 'image', 
      image, 
      caption 
    };
    return this.sendMessage(session, chat, message);
  },

  /**
   * Send audio message
   * POST /message/:session/:chat/audio
   */
  async sendAudio(session: string, chat: string, audio: string): Promise<MessageResponse> {
    const message: SendMessageRequest = { 
      type: 'audio', 
      audio 
    };
    return this.sendMessage(session, chat, message);
  },

  /**
   * Send video message
   * POST /message/:session/:chat/video
   */
  async sendVideo(session: string, chat: string, video: string, caption?: string): Promise<MessageResponse> {
    const message: SendMessageRequest = { 
      type: 'video', 
      video, 
      caption 
    };
    return this.sendMessage(session, chat, message);
  },

  /**
   * Send document message
   * POST /message/:session/:chat/document
   */
  async sendDocument(session: string, chat: string, document: string, filename?: string): Promise<MessageResponse> {
    const message: SendMessageRequest = { 
      type: 'document', 
      document, 
      filename 
    };
    return this.sendMessage(session, chat, message);
  },

  /**
   * Send sticker message
   * POST /message/:session/:chat/sticker
   */
  async sendSticker(session: string, chat: string, sticker: string): Promise<MessageResponse> {
    const message: SendMessageRequest = { 
      type: 'sticker', 
      sticker 
    };
    return this.sendMessage(session, chat, message);
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
    const message: SendMessageRequest = { 
      type: 'location', 
      location: { latitude, longitude, address } 
    };
    return this.sendMessage(session, chat, message);
  },

  /**
   * Send contact message
   * POST /message/:session/:chat/contact
   */
  async sendContact(session: string, chat: string, contact: string, name: string): Promise<MessageResponse> {
    const message: SendMessageRequest = { 
      type: 'contact', 
      contact: { phone: contact, name } 
    };
    return this.sendMessage(session, chat, message);
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
    const message: SendMessageRequest = { 
      type: 'poll', 
      poll: { question, options, multiple } 
    };
    return this.sendMessage(session, chat, message);
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
    const message: SendMessageRequest = { 
      type: 'buttons', 
      text, 
      buttons 
    };
    return this.sendMessage(session, chat, message);
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
    const message: SendMessageRequest = { 
      type: 'list', 
      text, 
      list: { title, sections } 
    };
    return this.sendMessage(session, chat, message);
  },

  /**
   * Send interactive message
   * POST /message/:session/:chat/interactive
   */
  async sendInteractive(
    session: string, 
    chat: string, 
    interactive: any
  ): Promise<MessageResponse> {
    const message: SendMessageRequest = { 
      type: 'interactive', 
      interactive 
    };
    return this.sendMessage(session, chat, message);
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
    components?: any[]
  ): Promise<MessageResponse> {
    const message: SendMessageRequest = { 
      type: 'template', 
      template: { name: template, language, components } 
    };
    return this.sendMessage(session, chat, message);
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
    const message: SendMessageRequest = { 
      type: 'carousel', 
      carousel: { cards } 
    };
    return this.sendMessage(session, chat, message);
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