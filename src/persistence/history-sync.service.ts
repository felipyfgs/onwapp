import { Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from './persistence.service';
import { parseMessageContent } from './utils/message-parser';
import { proto } from 'whaileys';

interface HistorySyncData {
  chats: any[];
  contacts: any[];
  messages: any[];
  isLatest: boolean;
  progress?: number | null;
  syncType?: proto.HistorySync.HistorySyncType;
}

@Injectable()
export class HistorySyncService {
  private readonly logger = new Logger(HistorySyncService.name);
  private syncInProgress: Map<string, boolean> = new Map();
  private syncStats: Map<
    string,
    {
      totalContacts: number;
      totalChats: number;
      totalMessages: number;
      startTime: Date;
    }
  > = new Map();

  constructor(private readonly persistenceService: PersistenceService) {}

  isSessionSyncing(sessionId: string): boolean {
    return this.syncInProgress.get(sessionId) || false;
  }

  async processHistorySync(
    sessionId: string,
    data: HistorySyncData,
  ): Promise<void> {
    const sid = sessionId.slice(0, 8);

    if (!this.syncInProgress.get(sessionId)) {
      this.syncInProgress.set(sessionId, true);
      this.syncStats.set(sessionId, {
        totalContacts: 0,
        totalChats: 0,
        totalMessages: 0,
        startTime: new Date(),
      });
      this.logger.log(
        `[${sid}] 🔄 Iniciando sincronização de histórico (tipo: ${data.syncType})`,
      );
    }

    const stats = this.syncStats.get(sessionId);
    if (!stats) return;

    try {
      if (data.contacts && data.contacts.length > 0) {
        const contactsData = data.contacts
          .filter((c) => c.id)
          .map((contact) => ({
            remoteJid: contact.id,
            name: contact.notify || contact.name,
            profilePicUrl: contact.imgUrl,
          }));

        const contactsCount = await this.persistenceService.createContactsBatch(
          sessionId,
          contactsData,
        );
        stats.totalContacts += contactsCount;
      }

      if (data.chats && data.chats.length > 0) {
        const chatsData = data.chats.map((chat) => ({
          remoteJid: chat.id,
          name: chat.name,
          unreadCount: chat.unreadCount || 0,
          lastMessageTimestamp: chat.conversationTimestamp,
          archived: chat.archived || false,
          pinned: chat.pinned || false,
          muted: chat.mute?.endTimestamp ? true : false,
        }));

        const chatsCount = await this.persistenceService.createChatsBatch(
          sessionId,
          chatsData,
        );
        stats.totalChats += chatsCount;
      }

      if (data.messages && data.messages.length > 0) {
        const messagesData = data.messages
          .filter((msg) => msg.key && msg.key.id && msg.key.remoteJid)
          .map((msg) => {
            const parsedContent = parseMessageContent(msg);
            return {
              remoteJid: msg.key.remoteJid,
              messageId: msg.key.id,
              fromMe: msg.key.fromMe || false,
              senderJid: msg.key.participant || msg.key.remoteJid,
              senderName: msg.pushName,
              timestamp: msg.messageTimestamp || Date.now(),
              messageType: parsedContent.messageType,
              textContent: parsedContent.textContent,
              mediaUrl: parsedContent.mediaUrl,
              metadata: parsedContent.metadata,
            };
          });

        const messagesCount = await this.persistenceService.createMessagesBatch(
          sessionId,
          messagesData,
        );
        stats.totalMessages += messagesCount;
      }

      const progress = data.progress ? `${data.progress}%` : 'N/A';
      this.logger.log(
        `[${sid}] 📊 Progresso: ${progress} | Contatos: ${stats.totalContacts} | Chats: ${stats.totalChats} | Mensagens: ${stats.totalMessages}`,
      );

      if (data.isLatest) {
        const duration = Date.now() - stats.startTime.getTime();
        const durationSec = (duration / 1000).toFixed(2);
        this.logger.log(
          `[${sid}] ✅ Sincronização completa em ${durationSec}s | Total: ${stats.totalContacts} contatos, ${stats.totalChats} chats, ${stats.totalMessages} mensagens`,
        );
        this.syncInProgress.delete(sessionId);
        this.syncStats.delete(sessionId);
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao processar history sync: ${error.message}`,
        error.stack,
      );

      if (data.isLatest) {
        this.syncInProgress.delete(sessionId);
        this.syncStats.delete(sessionId);
      }
    }
  }

  cancelSync(sessionId: string): void {
    const sid = sessionId.slice(0, 8);
    if (this.syncInProgress.get(sessionId)) {
      this.logger.warn(`[${sid}] ⚠️ Sincronização cancelada`);
      this.syncInProgress.delete(sessionId);
      this.syncStats.delete(sessionId);
    }
  }
}
