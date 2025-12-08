/**
 * Get API URL based on environment
 * - Server-side: uses API_URL (can be internal docker network like http://onwapp_api:8080)
 * - Client-side: uses Next.js proxy route to avoid CORS and hardcoded domains
 */
export function getApiUrl(): string {
  // Server-side: use API_URL env var (can be internal docker network)
  if (typeof window === 'undefined') {
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  }
  // Client-side: use Next.js proxy to avoid CORS and hardcoded domains
  return '/api/proxy'
}

/**
 * Get API Key from cookies (client-side only)
 */
export async function getApiKey(): Promise<string> {
  if (typeof window !== 'undefined') {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('api_key='))
    return cookie?.split('=')[1] || ''
  }
  return ''
}

/**
 * Make authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = await getApiKey()
  const apiUrl = getApiUrl()
  
  const res = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}
