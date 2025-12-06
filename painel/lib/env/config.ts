// Runtime environment configuration types
export type RuntimeEnvConfig = {
  apiUrl: string
  apiKey: string
}

// This will be read at runtime on the server
export const runtimeEnvConfig: RuntimeEnvConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
}
