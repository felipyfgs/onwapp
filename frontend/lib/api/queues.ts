import { apiClient } from './client'

export interface Queue {
  id: string
  tenant_id: string
  name: string
  color: string
  greeting_message: string
  order_num: number
  created_at: string
}

export interface CreateQueueRequest {
  name: string
  color: string
  greeting_message?: string
  order_num?: number
}

export const queuesApi = {
  list: async (): Promise<Queue[]> => {
    return apiClient.get('/queues')
  },

  get: async (id: string): Promise<Queue> => {
    return apiClient.get(`/queues/${id}`)
  },

  create: async (data: CreateQueueRequest): Promise<Queue> => {
    return apiClient.post('/queues', data)
  },

  update: async (id: string, data: CreateQueueRequest): Promise<Queue> => {
    return apiClient.put(`/queues/${id}`, data)
  },

  delete: async (id: string): Promise<boolean> => {
    return apiClient.delete(`/queues/${id}`)
  }
}
