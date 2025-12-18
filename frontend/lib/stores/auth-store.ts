import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: string
  name: string
  email: string
  tenant_id: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (credentials: { email: string; password: string }) => Promise<void>
  register: (data: { name: string; email: string; password: string }) => Promise<void>
  logout: () => void
  checkAuth: () => boolean
}

// Mock implementation para desenvolvimento
const mockLogin = async (credentials: { email: string; password: string }): Promise<{ user: User; token: string }> => {
  // Simular chamada API
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  if (credentials.email === "demo@onwapp.com" && credentials.password === "demo1234") {
    return {
      user: {
        id: "user-123",
        name: "Demo User",
        email: "demo@onwapp.com",
        tenant_id: "tenant-123"
      },
      token: "mock-jwt-token-demo-123"
    }
  }
  
  // Para outros casos, retorna sucesso
  return {
    user: {
      id: "user-123",
      name: credentials.email.split("@")[0],
      email: credentials.email,
      tenant_id: "tenant-123"
    },
    token: "mock-jwt-token-" + Math.random().toString(36).substr(2, 9)
  }
}

const mockRegister = async (data: { name: string; email: string; password: string }): Promise<{ user: User; token: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    user: {
      id: "user-" + Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      tenant_id: "tenant-" + Math.random().toString(36).substr(2, 9)
    },
    token: "mock-jwt-token-" + Math.random().toString(36).substr(2, 9)
  }
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
          const response = await mockLogin(credentials)
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          const message = error.message || "Falha ao fazer login"
          set({ error: message, isLoading: false })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await mockRegister(data)
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          const message = error.message || "Falha ao criar conta"
          set({ error: message, isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem("auth-storage")
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      },

      checkAuth: (): boolean => {
        // Sincronizado com persist, apenas verifica se há dados
        const currentState = useAuthStore.getState()
        if (currentState.isAuthenticated && currentState.token) {
          return true
        }

        // Se não está no state, tenta do storage
        const saved = localStorage.getItem("auth-storage")
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (parsed.state?.token && parsed.state?.isAuthenticated) {
              set({
                user: parsed.state.user,
                token: parsed.state.token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
              return true
            }
          } catch (e) {
            console.warn("Erro ao parsear auth storage")
            localStorage.removeItem("auth-storage")
          }
        }
        return false
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
