const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Simple fetch wrapper for API calls
export const apiClient = {
  async post(endpoint: string, data: any) {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw { response: { data: error, status: response.status } }
    }
    
    return response.json()
  },

  async get(endpoint: string) {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw { response: { data: error, status: response.status } }
    }
    
    return response.json()
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  const authData = localStorage.getItem("auth-storage")
  if (!authData) return null
  
  try {
    const parsed = JSON.parse(authData)
    return parsed.state?.token || null
  } catch {
    return null
  }
}

// Health check function
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (!response.ok) throw new Error("Health check failed")
    return response.json()
  } catch (error) {
    console.error("Health check failed:", error)
    throw error
  }
}
