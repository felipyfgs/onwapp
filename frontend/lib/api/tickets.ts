import { apiClient } from './client'

export interface Ticket {
  id: string
  tenant_id: string
  contact_id: string
  queue_id?: string
  user_id?: string
  session_id: string
  status: 'open' | 'pending' | 'closed'
  unread_messages: boolean
  last_message_at?: string
  created_at: string
  updated_at: string
  // Joined data (will be added by backend)
  contact_name?: string
  contact_phone?: string
  queue_name?: string
}

export interface CreateTicketRequest {
  contact_id: string
  queue_id?: string
  session_id: string
}

export const ticketsApi = {
  list: async (): Promise<Ticket[]> => {
    return apiClient.get('/tickets')
  },

  get: async (id: string): Promise<Ticket> => {
    return apiClient.get(`/tickets/${id}`)
  },

  create: async (data: CreateTicketRequest): Promise<Ticket> => {
    return apiClient.post('/tickets', data)
  },

  update: async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
    return apiClient.put(`/tickets/${id}`, data)
  },

  delete: async (id: string): Promise<boolean> => {
    return apiClient.delete(`/tickets/${id}`)
  },

  close: async (id: string): Promise<Ticket> => {
    return apiClient.post(`/tickets/${id}/close`)
  }
}
