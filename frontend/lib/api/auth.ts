import { apiClient } from './client'

export interface User {
  id: string
  tenant_id: string
  name: string
  email: string
  role: string
  online: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  role: string
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', credentials)
  return response.data
}

export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', credentials)
  return response.data
}

export const validateToken = async (): Promise<User> => {
  const response = await apiClient.post('/auth/validate')
  return response.data
}

export const logout = (): void => {
  localStorage.removeItem('authToken')
  window.location.href = '/login'
}
