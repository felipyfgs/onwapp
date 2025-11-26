import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PersistenceService } from '../../persistence/persistence.service';
import { DatabaseService } from '../../../database/database.service';
import { formatSessionId } from '../utils/helpers';

interface ChatPayload {
  id?: string;
  name?: string | null;
  unreadCount?: number | null;
  conversationTimestamp?: number | null;
  archived?: boolean | null;
  pinned?: boolean | null;
  mute?: { endTimestamp?: number | null } | null;
}

interface ContactPayload {
  id: string;
  notify?: string;
  name?: string;
  imgUrl?: string;
}

@Injectable()
export class ChatsHandler {
  private readonly logger = new Logger(ChatsHandler.name);

  constructor(
    @Inject(forwardRef(() => PersistenceService))
    private readonly persistenceService: PersistenceService,
    private readonly prisma: DatabaseService,
  ) {}

  // Métodos públicos para uso com ev.process()
  handleChatsUpsert(sessionId: string, payload: ChatPayload[]): void {
    const sid = formatSessionId(sessionId);
    void this.processChatsUpsert(sessionId, payload, sid);
  }

  handleChatsUpdate(sessionId: string, payload: ChatPayload[]): void {
    const sid = formatSessionId(sessionId);
    void this.processChatsUpdate(sessionId, payload, sid);
  }

  handleChatsDelete(sessionId: string, chatIds: string[]): void {
    const sid = formatSessionId(sessionId);
    void this.processChatsDelete(sessionId, chatIds, sid);
  }

  private async processChatsUpsert(
    sessionId: string,
    payload: ChatPayload[],
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 chats.upsert`, {
      event: 'chats.upsert',
      count: payload.length,
    });

    try {
      for (const chat of payload) {
        if (!chat.id) continue;
        await this.persistenceService.createOrUpdateChat(sessionId, {
          remoteJid: chat.id,
          name: chat.name ?? undefined,
          unread: chat.unreadCount ?? undefined,
          lastMessageTs: chat.conversationTimestamp ?? undefined,
          archived: chat.archived ?? undefined,
          pinned: chat.pinned ?? undefined,
          muted: chat.mute?.endTimestamp ? true : false,
        });
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir chats.upsert: ${(error as Error).message}`,
      );
    }
  }

  private async processChatsUpdate(
    sessionId: string,
    payload: ChatPayload[],
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 chats.update`, {
      event: 'chats.update',
      count: payload.length,
    });

    try {
      for (const chat of payload) {
        if (!chat.id) continue;
        await this.persistenceService.createOrUpdateChat(sessionId, {
          remoteJid: chat.id,
          name: chat.name ?? undefined,
          unread: chat.unreadCount ?? undefined,
          lastMessageTs: chat.conversationTimestamp ?? undefined,
          archived: chat.archived ?? undefined,
          pinned: chat.pinned ?? undefined,
          muted: chat.mute?.endTimestamp ? true : false,
        });
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir chats.update: ${(error as Error).message}`,
      );
    }
  }

  private async processChatsDelete(
    sessionId: string,
    chatIds: string[],
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 chats.delete`, {
      event: 'chats.delete',
      count: chatIds.length,
    });

    try {
      for (const chatJid of chatIds) {
        const chat = await this.prisma.chat.findFirst({
          where: {
            sessionId,
            remoteJid: chatJid,
          },
        });

        if (chat) {
          await this.prisma.message.deleteMany({
            where: { chatId: chat.id },
          });

          await this.prisma.chat.delete({
            where: { id: chat.id },
          });

          this.logger.log(`[${sid}] Chat ${chatJid} deletado`);
        }
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao processar chats.delete: ${(error as Error).message}`,
      );
    }
  }

  private async handleContactsUpsert(
    sessionId: string,
    payload: ContactPayload[],
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 contacts.upsert`, {
      event: 'contacts.upsert',
      count: payload.length,
    });

    try {
      for (const contact of payload) {
        await this.persistenceService.createOrUpdateContact(sessionId, {
          remoteJid: contact.id,
          name: contact.notify || contact.name,
          avatarUrl: contact.imgUrl,
        });
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir contacts.upsert: ${(error as Error).message}`,
      );
    }
  }
}
