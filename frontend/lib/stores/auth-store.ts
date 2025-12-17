import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '../api/auth'

export interface AuthState {
  user: authApi.User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: authApi.LoginCredentials) => Promise<void>
  register: (credentials: authApi.RegisterCredentials) => Promise<void>
  validateToken: () => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(credentials)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
          localStorage.setItem('authToken', response.token)
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      register: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(credentials)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
          localStorage.setItem('authToken', response.token)
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          })
          throw error
        }
      },

      validateToken: async () => {
        set({ isLoading: true, error: null })
        try {
          const user = await authApi.validateToken()
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
          localStorage.removeItem('authToken')
        }
      },

      logout: () => {
        authApi.logout()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
)
