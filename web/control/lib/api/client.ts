const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  message: string
  code?: string
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(process.env.NEXT_PUBLIC_API_KEY && {
      "X-API-Key": process.env.NEXT_PUBLIC_API_KEY,
    }),
    ...options?.headers,
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || "Request failed",
      }
    }

    return {
      success: true,
      data: data.data ?? data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`
}
