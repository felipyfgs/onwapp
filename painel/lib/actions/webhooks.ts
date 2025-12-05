'use server'

import { cookies } from 'next/headers'
import type { Webhook, WebhookFormData, MessageResponse } from '@/types'

const API_URL = process.env.API_URL || 'http://localhost:8080'

async function getApiKey(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('apiKey')?.value || null
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const apiKey = await getApiKey()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers['Authorization'] = apiKey
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export async function getWebhook(sessionId: string): Promise<Webhook | null> {
  try {
    return await fetchApi<Webhook>(`/${sessionId}/webhook`)
  } catch {
    return null
  }
}

export async function setWebhook(sessionId: string, data: WebhookFormData): Promise<Webhook> {
  return fetchApi<Webhook>(`/${sessionId}/webhook`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateWebhook(sessionId: string, data: Partial<WebhookFormData>): Promise<Webhook> {
  return fetchApi<Webhook>(`/${sessionId}/webhook`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteWebhook(sessionId: string): Promise<MessageResponse> {
  return fetchApi<MessageResponse>(`/${sessionId}/webhook`, {
    method: 'DELETE',
  })
}
