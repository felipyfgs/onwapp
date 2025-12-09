import { ref } from 'vue'

export interface ApiConfig {
  baseURL: string
  apiKey: string
}

const config = ref<ApiConfig>({
  baseURL: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080',
  apiKey: process.env.NUXT_PUBLIC_API_KEY || '',
})

export function useApi() {
  const setConfig = (newConfig: Partial<ApiConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const headers = new Headers(options.headers)
    
    if (config.value.apiKey) {
      headers.set('Authorization', config.value.apiKey)
    }
    headers.set('Content-Type', 'application/json')

    const url = `${config.value.baseURL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  const get = <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' })
  
  const post = <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  
  const put = <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  
  const del = <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' })

  return {
    config,
    setConfig,
    get,
    post,
    put,
    delete: del,
  }
}
