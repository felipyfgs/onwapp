import { apiClient } from '../api';
import type { 
  Contact, 
  ContactCheckResponse, 
  ApiResponse 
} from '../types/api';

export const contactService = {
  /**
   * Get all contacts
   * GET /contact/:session
   */
  async getContacts(session: string): Promise<Contact[]> {
    const response = await apiClient.get<Contact[]>(`/contact/${session}`);
    return response.data;
  },

  /**
   * Get contact by phone
   * GET /contact/:session/:phone
   */
  async getContact(session: string, phone: string): Promise<Contact> {
    const response = await apiClient.get<Contact>(`/contact/${session}/${phone}`);
    return response.data;
  },

  /**
   * Check if contact exists
   * GET /contact/:session/:phone/exists
   */
  async checkContactExists(session: string, phone: string): Promise<ContactCheckResponse> {
    const response = await apiClient.get<ContactCheckResponse>(`/contact/${session}/${phone}/exists`);
    return response.data;
  },

  /**
   * Block contact
   * POST /contact/:session/:phone/block
   */
  async blockContact(session: string, phone: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/contact/${session}/${phone}/block`);
    return response.data;
  },

  /**
   * Unblock contact
   * POST /contact/:session/:phone/unblock
   */
  async unblockContact(session: string, phone: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/contact/${session}/${phone}/unblock`);
    return response.data;
  },

  /**
   * Sync contacts
   * POST /contact/:session/sync
   */
  async syncContacts(session: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/contact/${session}/sync`);
    return response.data;
  },

  /**
   * Add contact
   * POST /contact/:session
   */
  async addContact(session: string, phone: string, name?: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/contact/${session}`, { 
      phone, 
      name 
    });
    return response.data;
  },

  /**
   * Update contact
   * PUT /contact/:session/:phone
   */
  async updateContact(session: string, phone: string, name: string): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/contact/${session}/${phone}`, { name });
    return response.data;
  },

  /**
   * Delete contact
   * DELETE /contact/:session/:phone
   */
  async deleteContact(session: string, phone: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/contact/${session}/${phone}`);
    return response.data;
  }
};

export default contactService;