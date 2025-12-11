const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export interface Session {
  id: string;
  session: string;
  status: "connected" | "disconnected" | "connecting";
  deviceJid?: string;
  phone?: string;
  pushName?: string;
  profilePicture?: string;
  apiKey?: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    messages: number;
    chats: number;
    contacts: number;
    groups: number;
  };
}

export interface QRResponse {
  qr?: string;
  status: string;
}

export interface CreateSessionRequest {
  session: string;
  apiKey?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(API_KEY && { Authorization: API_KEY }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getSessions(): Promise<Session[]> {
  return fetchApi<Session[]>("/sessions");
}

export async function getSession(name: string): Promise<Session> {
  return fetchApi<Session>(`/${name}/status`);
}

export async function createSession(data: CreateSessionRequest): Promise<Session> {
  return fetchApi<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteSession(name: string): Promise<void> {
  await fetchApi(`/${name}`, { method: "DELETE" });
}

export async function connectSession(name: string): Promise<{ message: string; status: string }> {
  return fetchApi(`/${name}/connect`, { method: "POST" });
}

export async function disconnectSession(name: string): Promise<void> {
  await fetchApi(`/${name}/disconnect`, { method: "POST" });
}

export async function logoutSession(name: string): Promise<void> {
  await fetchApi(`/${name}/logout`, { method: "POST" });
}

export async function restartSession(name: string): Promise<Session> {
  return fetchApi<Session>(`/${name}/restart`, { method: "POST" });
}

export async function getQR(name: string): Promise<QRResponse> {
  return fetchApi<QRResponse>(`/${name}/qr`);
}
