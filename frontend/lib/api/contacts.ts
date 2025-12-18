import { apiClient } from './client'

export interface Contact {
  id: string
  tenant_id: string
  whatsapp_id: string
  name: string
  phone_number: string
  profile_pic_url?: string
  is_group: boolean
  created_at: string
  updated_at: string
}

export interface CreateContactRequest {
  whatsapp_id?: string
  name: string
  phone_number: string
  profile_pic_url?: string
  is_group?: boolean
}

export const contactsApi = {
  list: async (): Promise<Contact[]> => {
    return apiClient.get('/contacts')
  },

  get: async (id: string): Promise<Contact> => {
    return apiClient.get(`/contacts/${id}`)
  },

  create: async (data: CreateContactRequest): Promise<Contact> => {
    return apiClient.post('/contacts', data)
  },

  update: async (id: string, data: CreateContactRequest): Promise<Contact> => {
    return apiClient.put(`/contacts/${id}`, data)
  },

  delete: async (id: string): Promise<boolean> => {
    return apiClient.delete(`/contacts/${id}`)
  }
}
