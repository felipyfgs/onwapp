/**
 * JID (Jabber ID) formatting utilities for WhatsApp
 */

/**
 * Format phone number to WhatsApp JID
 * @param phoneNumber - Phone number or JID
 * @returns Formatted JID (e.g., "5511999999999@s.whatsapp.net")
 */
export function formatJid(phoneNumber: string): string {
  if (phoneNumber.includes('@')) {
    return phoneNumber;
  }

  const cleaned = phoneNumber.replace(/\D/g, '');
  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Format chat ID to remote JID
 * @param chatId - Chat ID (phone number, JID, or group ID)
 * @returns Formatted remote JID
 */
export function formatRemoteJid(chatId: string): string {
  if (chatId.includes('@')) return chatId;
  if (chatId.includes('-')) return `${chatId}@g.us`;
  return `${chatId}@s.whatsapp.net`;
}

/**
 * Extract phone number from JID
 * @param jid - WhatsApp JID
 * @returns Phone number without suffix
 */
export function extractPhoneFromJid(jid: string): string {
  return jid.replace('@s.whatsapp.net', '').replace('@g.us', '').split(':')[0];
}

/**
 * Check if JID is a group
 * @param jid - WhatsApp JID
 * @returns true if group JID
 */
export function isGroupJid(jid: string): boolean {
  return jid.includes('@g.us');
}

/**
 * Check if JID is a broadcast/status
 * @param jid - WhatsApp JID
 * @returns true if broadcast/status JID
 */
export function isStatusBroadcast(jid: string): boolean {
  return jid === 'status@broadcast';
}

/**
 * Get phone variations for Brazilian numbers (with/without 9)
 * @param phone - Phone number with country code (e.g., "+5511999999999")
 * @returns Array of phone number variations
 */
export function getBrazilPhoneVariations(phone: string): string[] {
  const numbers = [phone];

  if (phone.startsWith('+55') && phone.length === 14) {
    // Remove the 9 after area code: +55119... -> +5511...
    numbers.push(phone.slice(0, 5) + phone.slice(6));
  } else if (phone.startsWith('+55') && phone.length === 13) {
    // Add the 9 after area code: +5511... -> +55119...
    numbers.push(phone.slice(0, 5) + '9' + phone.slice(5));
  }

  return numbers;
}
