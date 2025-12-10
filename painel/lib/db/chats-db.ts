import Dexie, { type Table } from "dexie"
import type { Chat, ChatMessage } from "@/lib/api/chats"

interface StoredChat extends Chat {
  sessionId: string
  updatedAt: number
}

interface StoredMessage extends ChatMessage {
  sessionId: string
}

class ChatsDatabase extends Dexie {
  chats!: Table<StoredChat>
  messages!: Table<StoredMessage>

  constructor() {
    super("onwapp")
    this.version(1).stores({
      chats: "jid, sessionId, conversationTimestamp, updatedAt",
      messages: "msgId, [sessionId+chatJid], chatJid, timestamp",
    })
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
  }

  // Get database size info
  async getStats(): Promise<{ chats: number; messages: number }> {
    const [chats, messages] = await Promise.all([
      this.chats.count(),
      this.messages.count(),
    ])
    return { chats, messages }
  }
}

export const db = new ChatsDatabase()
