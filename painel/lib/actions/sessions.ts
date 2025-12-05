'use server'

import { cookies } from 'next/headers'
import type { Session, CreateSessionRequest, QRResponse, MessageResponse } from '@/types'

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

export async function getSessions(): Promise<Session[]> {
  return fetchApi<Session[]>('/sessions')
}

export async function getSession(sessionId: string): Promise<Session> {
  return fetchApi<Session>(`/${sessionId}/status`)
}

export async function createSession(data: CreateSessionRequest): Promise<Session> {
  return fetchApi<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteSession(sessionId: string): Promise<MessageResponse> {
  return fetchApi<MessageResponse>(`/${sessionId}`, {
    method: 'DELETE',
  })
}

export async function connectSession(sessionId: string): Promise<MessageResponse> {
  return fetchApi<MessageResponse>(`/${sessionId}/connect`, {
    method: 'POST',
  })
}

export async function disconnectSession(sessionId: string): Promise<MessageResponse> {
  return fetchApi<MessageResponse>(`/${sessionId}/disconnect`, {
    method: 'POST',
  })
}

export async function logoutSession(sessionId: string): Promise<MessageResponse> {
  return fetchApi<MessageResponse>(`/${sessionId}/logout`, {
    method: 'POST',
  })
}

export async function restartSession(sessionId: string): Promise<MessageResponse> {
  return fetchApi<MessageResponse>(`/${sessionId}/restart`, {
    method: 'POST',
  })
}

export async function getSessionQR(sessionId: string): Promise<QRResponse> {
  return fetchApi<QRResponse>(`/${sessionId}/qr`)
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/sessions`, {
      headers: {
        'Authorization': apiKey,
      },
      cache: 'no-store',
    })
    return response.ok
  } catch {
    return false
  }
}
