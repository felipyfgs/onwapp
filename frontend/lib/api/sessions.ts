import { apiClient } from './client'

export interface MessagingSession {
  id: string
  tenant_id: string
  name: string
  channel_id: string
  platform: 'whatsapp' | 'telegram' | 'instagram'
  status: 'connected' | 'disconnected' | 'connecting'
  last_seen?: string
  created_at: string
  updated_at: string
}

export interface CreateSessionRequest {
  name: string
  channel_id: string
  platform: 'whatsapp' | 'telegram' | 'instagram'
}

export interface UpdateSessionRequest {
  name: string
  channel_id: string
}

export const sessionsApi = {
  // List all sessions for current tenant
  list: async (): Promise<MessagingSession[]> => {
    return apiClient.get('/sessions')
  },

  // Get single session by ID
  get: async (id: string): Promise<MessagingSession> => {
    return apiClient.get(`/sessions/${id}`)
  },

  // Create new session
  create: async (data: CreateSessionRequest): Promise<MessagingSession> => {
    return apiClient.post('/sessions', data)
  },

  // Update session
  update: async (id: string, data: UpdateSessionRequest): Promise<MessagingSession> => {
    return apiClient.put(`/sessions/${id}`, data)
  },

  // Delete session
  delete: async (id: string): Promise<boolean> => {
    return apiClient.delete(`/sessions/${id}`)
  },

  // Connect session (start WhatsApp connection, generates QR code)
  connect: async (id: string): Promise<any> => {
    return apiClient.post(`/sessions/${id}/connect`)
  },

  // Disconnect session
  disconnect: async (id: string): Promise<any> => {
    return apiClient.post(`/sessions/${id}/disconnect`)
  }
}
