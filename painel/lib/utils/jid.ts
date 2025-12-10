/**
 * JID (Jabber ID) utilities for WhatsApp
 * Personal: 559984059035@s.whatsapp.net
 * Group: 120363123456789012@g.us
 */

export function extractChatId(jid: string): string {
  // For groups, prefix with 'g-' to distinguish
  if (jid.endsWith("@g.us")) {
    return "g-" + jid.replace("@g.us", "")
  }
  // For personal chats, just the number
  return jid.replace("@s.whatsapp.net", "").replace("@c.us", "")
}

export function reconstructJid(chatId: string): string {
  // Group chat (prefixed with g-)
  if (chatId.startsWith("g-")) {
    return chatId.slice(2) + "@g.us"
  }
  // Personal chat
  return chatId + "@s.whatsapp.net"
}

export function isGroupChatId(chatId: string): boolean {
  return chatId.startsWith("g-")
}
