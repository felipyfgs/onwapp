import { useEffect } from 'react'
import { useAuthStore } from '../lib/stores/auth-store'
import { useRouter } from 'next/navigation'

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    validateToken,
    logout,
    clearError,
  } = useAuthStore()

  const router = useRouter()

  // Auto-validate token on app load
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      validateToken()
    }
  }, [isAuthenticated, isLoading, validateToken])

  // Redirect to login if not authenticated and trying to access protected routes
  useEffect(() => {
    const protectedRoutes = ['/dashboard', '/tickets', '/connections', '/users', '/settings']
    const currentPath = window.location.pathname

    if (!isAuthenticated && !isLoading && protectedRoutes.some(route => currentPath.startsWith(route))) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  }
}
