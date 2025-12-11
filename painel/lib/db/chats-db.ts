import Dexie, { type Table } from "dexie"
import type { Chat, ChatMessage } from "@/lib/api/chats"

interface StoredChat extends Chat {
  sessionId: string
  updatedAt: number
}

interface StoredMessage extends ChatMessage {
  sessionId: string
}

interface StoredAvatar {
  key: string // sessionId:jid
  sessionId: string
  jid: string
  avatarUrl: string | null
  updatedAt: number
}

class ChatsDatabase extends Dexie {
  chats!: Table<StoredChat>
  messages!: Table<StoredMessage>
  avatars!: Table<StoredAvatar>

  constructor() {
    super("onwapp")
    this.version(1).stores({
      chats: "jid, sessionId, conversationTimestamp, updatedAt",
      messages: "msgId, [sessionId+chatJid], chatJid, timestamp",
    })
    // Add avatars table in version 2
    this.version(2).stores({
      chats: "jid, sessionId, conversationTimestamp, updatedAt",
      messages: "msgId, [sessionId+chatJid], chatJid, timestamp",
      avatars: "key, sessionId, updatedAt",
    })
  }

  // Avatar methods
  async saveAvatar(sessionId: string, jid: string, avatarUrl: string | null) {
    const key = `${sessionId}:${jid}`
    await this.avatars.put({
      key,
      sessionId,
      jid,
      avatarUrl,
      updatedAt: Date.now(),
    })
  }

  async getAvatar(sessionId: string, jid: string): Promise<StoredAvatar | undefined> {
    const key = `${sessionId}:${jid}`
    return this.avatars.get(key)
  }

  async getAvatars(sessionId: string): Promise<StoredAvatar[]> {
    return this.avatars.where("sessionId").equals(sessionId).toArray()
  }

  // Check if avatar cache is still valid (24h)
  isAvatarFresh(avatar: StoredAvatar | undefined, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    if (!avatar) return false
    return Date.now() - avatar.updatedAt < maxAgeMs
  }

  async saveChats(sessionId: string, chats: Chat[]) {
    const now = Date.now()
    const storedChats: StoredChat[] = chats.map((chat) => ({
      ...chat,
      sessionId,
      updatedAt: now,
    }))
    await this.chats.bulkPut(storedChats)
  }

  async getChats(sessionId: string): Promise<Chat[]> {
    return this.chats.where("sessionId").equals(sessionId).toArray()
  }

  async saveMessages(sessionId: string, messages: ChatMessage[]) {
    const storedMessages: StoredMessage[] = messages.map((msg) => ({
      ...msg,
      sessionId,
    }))
    await this.messages.bulkPut(storedMessages)
  }

  async getMessages(sessionId: string, chatJid: string): Promise<ChatMessage[]> {
    return this.messages
      .where("[sessionId+chatJid]")
      .equals([sessionId, chatJid])
      .sortBy("timestamp")
  }

  async clearSession(sessionId: string) {
    await this.chats.where("sessionId").equals(sessionId).delete()
    await this.messages.where("sessionId").equals(sessionId).delete()
    await this.avatars.where("sessionId").equals(sessionId).delete()
  }

  // Limit messages per chat to prevent memory bloat
  async trimMessages(sessionId: string, chatJid: string, maxMessages: number = 500) {
    const messages = await this.messages
      .where("[sessionId+chatJid]")
      .equals([sessionId, chatJid])
      .sortBy("timestamp")

    if (messages.length > maxMessages) {
      const toDelete = messages.slice(0, messages.length - maxMessages)
      await this.messages.bulkDelete(toDelete.map((m) => m.msgId))
    }
  }

  // Clean up old chats (not accessed in X days)
  async cleanupOldData(maxAgeDays: number = 30) {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    const oldChats = await this.chats.where("updatedAt").below(cutoff).toArray()
    
    for (const chat of oldChats) {
      await this.messages
        .where("[sessionId+chatJid]")
        .equals([chat.sessionId, chat.jid])
        .delete()
    }
    
    await this.chats.where("updatedAt").below(cutoff).delete()
    // Clean up old avatars (3 days)
    const avatarCutoff = Date.now() - 3 * 24 * 60 * 60 * 1000
    await this.avatars.where("updatedAt").below(avatarCutoff).delete()
  }

  // Get database size info
  async getStats(): Promise<{ chats: number; messages: number; avatars: number }> {
    const [chats, messages, avatars] = await Promise.all([
      this.chats.count(),
      this.messages.count(),
      this.avatars.count(),
    ])
    return { chats, messages, avatars }
  }
}

export const db = new ChatsDatabase()
