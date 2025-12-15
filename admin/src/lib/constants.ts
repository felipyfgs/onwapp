// Constantes da aplicação

// URLs da API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '76A598BD32F86E989D9FAB93C5E3B';

// URLs do NATS WebSocket
export const NATS_WS_URL = typeof window !== 'undefined'
  ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/nats`
  : process.env.NEXT_PUBLIC_NATS_WS_URL || 'ws://localhost:9222';

// Tipos de eventos NATS
export const NATS_EVENT_TYPES = {
  SESSION_CONNECTED: 'session.connected',
  SESSION_DISCONNECTED: 'session.disconnected',
  SESSION_LOGGED_OUT: 'session.logged_out',
  SESSION_QR: 'session.qr',
  SESSION_PAIR_SUCCESS: 'session.pair_success',
  SESSION_PAIR_ERROR: 'session.pair_error',
  SESSION_CONNECT_FAILURE: 'session.connect_failure',
};

// Status da sessão
export const SESSION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  QR: 'qr',
  ERROR: 'error',
};

// Tipos de mensagem
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  DOCUMENT: 'document',
  STICKER: 'sticker',
  LOCATION: 'location',
  CONTACT: 'contact',
  POLL: 'poll',
  BUTTONS: 'buttons',
  LIST: 'list',
  INTERACTIVE: 'interactive',
  TEMPLATE: 'template',
  CAROUSEL: 'carousel',
};

// Status da mensagem
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

// Eventos do webhook
export const WEBHOOK_EVENTS = {
  MESSAGE_CREATED: 'message_created',
  MESSAGE_UPDATED: 'message_updated',
  MESSAGE_DELETED: 'message_deleted',
  CALL_STARTED: 'call_started',
  CALL_ENDED: 'call_ended',
  PRESENCE_UPDATED: 'presence_updated',
  GROUP_PARTICIPANT_ADDED: 'group_participant_added',
  GROUP_PARTICIPANT_REMOVED: 'group_participant_removed',
  GROUP_INFO_UPDATED: 'group_info_updated',
  GROUP_PICTURE_UPDATED: 'group_picture_updated',
  CONTACT_UPDATED: 'contact_updated',
};