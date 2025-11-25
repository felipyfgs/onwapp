/**
 * WhatsApp Message Key - identifies a unique message
 */
export interface WAMessageKey {
  id: string;
  remoteJid: string;
  fromMe: boolean;
  participant?: string;
}

/**
 * Simplified message key (without fromMe)
 * @deprecated Use WAMessageKey instead
 */
export interface MessageKey {
  remoteJid: string;
  id: string;
  participant?: string;
}
