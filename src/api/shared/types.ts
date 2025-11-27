import { WAMessageKey } from '@whiskeysockets/baileys';

/**
 * Common response types for API operations
 */
export interface SuccessResponse {
  success: boolean;
}

/**
 * Generic error response
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

/**
 * Message key structure used across the API
 */
export interface MessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
  participant?: string;
}

/**
 * Receipt types for message acknowledgment
 */
export type ReceiptType = 'read' | 'read-self' | 'played';

/**
 * Common JID formatting utilities
 */
export const JidUtils = {
  formatUserJid: (phone: string): string => {
    return phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
  },

  formatGroupJid: (groupId: string): string => {
    return groupId.includes('@') ? groupId : `${groupId}@g.us`;
  },

  isGroupJid: (jid: string): boolean => {
    return jid.endsWith('@g.us');
  },

  isUserJid: (jid: string): boolean => {
    return jid.endsWith('@s.whatsapp.net');
  },

  extractPhoneNumber: (jid: string): string => {
    return jid.split('@')[0];
  },
};

/**
 * Converts internal WAMessageKey to API MessageKey
 */
export function toMessageKey(key: WAMessageKey): MessageKey {
  return {
    remoteJid: key.remoteJid || '',
    fromMe: key.fromMe || false,
    id: key.id || '',
    participant: key.participant || undefined,
  };
}
