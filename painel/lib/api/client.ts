import { getStoredApiKey } from "@/lib/auth"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const apiKey = getStoredApiKey()
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(apiKey && { Authorization: apiKey }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new ApiError(response.status, error.error || "Request failed")
  }

  return response.json()
}
