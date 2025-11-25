/**
 * Chatwoot integration constants
 */

/**
 * Chatwoot event types received from Chatwoot webhooks
 */
export const CHATWOOT_EVENTS = {
  MESSAGE_CREATED: 'message_created',
  MESSAGE_UPDATED: 'message_updated',
  CONVERSATION_CREATED: 'conversation_created',
  CONVERSATION_UPDATED: 'conversation_updated',
  CONVERSATION_STATUS_CHANGED: 'conversation_status_changed',
  WEBWIDGET_TRIGGERED: 'webwidget_triggered',
} as const;

export type ChatwootEventType =
  (typeof CHATWOOT_EVENTS)[keyof typeof CHATWOOT_EVENTS];

/**
 * Chatwoot message types
 */
export const CHATWOOT_MESSAGE_TYPES = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
} as const;

export type ChatwootMessageType =
  (typeof CHATWOOT_MESSAGE_TYPES)[keyof typeof CHATWOOT_MESSAGE_TYPES];

/**
 * Chatwoot sender types
 */
export const CHATWOOT_SENDER_TYPES = {
  USER: 'user', // Agent
  CONTACT: 'contact',
} as const;

export type ChatwootSenderType =
  (typeof CHATWOOT_SENDER_TYPES)[keyof typeof CHATWOOT_SENDER_TYPES];

/**
 * Chatwoot conversation status
 */
export const CHATWOOT_CONVERSATION_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  PENDING: 'pending',
} as const;

export type ChatwootConversationStatus =
  (typeof CHATWOOT_CONVERSATION_STATUS)[keyof typeof CHATWOOT_CONVERSATION_STATUS];

/**
 * Chatwoot attachment file types
 */
export const CHATWOOT_FILE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
} as const;

export type ChatwootFileType =
  (typeof CHATWOOT_FILE_TYPES)[keyof typeof CHATWOOT_FILE_TYPES];

/**
 * WhatsApp message events handled by Chatwoot integration
 */
export const ZPWOOT_EVENTS = {
  MESSAGES_UPSERT: 'messages.upsert',
  MESSAGES_UPDATE: 'messages.update',
  MESSAGES_DELETE: 'messages.delete',
} as const;

export type ZpwootEventType =
  (typeof ZPWOOT_EVENTS)[keyof typeof ZPWOOT_EVENTS];

/**
 * Default configuration values
 */
export const CHATWOOT_DEFAULTS = {
  SIGN_DELIMITER: '\n',
  IMPORT_DAYS: 3,
  HTTP_TIMEOUT: 30000,
} as const;
