// Tipos para integração NATS no frontend ONWApp

export interface NatsMessage {
  subject: string;
  data: any;
  timestamp: Date;
  raw?: Uint8Array;
}

export interface NatsConnectionState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  reconnectCount: number;
  lastError?: string;
}

export interface NatsSubscriptionOptions {
  queue?: string;
  maxMessages?: number;
  timeout?: number;
}

export type NatsMessageHandler = (message: NatsMessage) => void;

// Tipos do Sistema de Tickets (WhaTicket inspired)
export interface Ticket {
  id: string;
  contactName: string;
  contactNumber: string;
  lastMessage: string;
  status: 'open' | 'pending' | 'closed' | 'scheduled';
  queue: Queue;
  assignedTo?: User | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface Queue {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  from: 'contact' | 'user';
  content: string;
  timestamp: Date;
  mediaUrl?: string;
}