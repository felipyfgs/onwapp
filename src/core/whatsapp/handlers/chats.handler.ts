import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { WASocket } from 'whaileys';
import { PersistenceService } from '../../persistence/persistence.service';
import { formatSessionId } from '../utils/helpers';

interface ChatPayload {
  id: string;
  name?: string;
  unreadCount?: number;
  conversationTimestamp?: number;
  archived?: boolean;
  pinned?: boolean;
  mute?: { endTimestamp?: number };
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
  ) {}

  registerChatListeners(sessionId: string, socket: WASocket): void {
    const sid = formatSessionId(sessionId);

    socket.ev.on('chats.upsert' as never, (payload: ChatPayload[]) => {
      void this.handleChatsUpsert(sessionId, payload, sid);
    });

    socket.ev.on('chats.update' as never, (payload: ChatPayload[]) => {
      void this.handleChatsUpdate(sessionId, payload, sid);
    });

    socket.ev.on('contacts.upsert' as never, (payload: ContactPayload[]) => {
      void this.handleContactsUpsert(sessionId, payload, sid);
    });

    socket.ev.on('contacts.update' as never, (payload: ContactPayload[]) => {
      void this.handleContactsUpdate(sessionId, payload, sid);
    });

    this.registerOtherEvents(socket, sid);
  }

  private async handleChatsUpsert(
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
        await this.persistenceService.createOrUpdateChat(sessionId, {
          remoteJid: chat.id,
          name: chat.name,
          unread: chat.unreadCount,
          lastMessageTs: chat.conversationTimestamp,
          archived: chat.archived,
          pinned: chat.pinned,
          muted: chat.mute?.endTimestamp ? true : false,
        });
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir chats.upsert: ${(error as Error).message}`,
      );
    }
  }

  private async handleChatsUpdate(
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
        await this.persistenceService.createOrUpdateChat(sessionId, {
          remoteJid: chat.id,
          name: chat.name,
          unread: chat.unreadCount,
          lastMessageTs: chat.conversationTimestamp,
          archived: chat.archived,
          pinned: chat.pinned,
          muted: chat.mute?.endTimestamp ? true : false,
        });
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir chats.update: ${(error as Error).message}`,
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

  private async handleContactsUpdate(
    sessionId: string,
    payload: ContactPayload[],
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 contacts.update`, {
      event: 'contacts.update',
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
        `[${sid}] Erro ao persistir contacts.update: ${(error as Error).message}`,
      );
    }
  }

  private registerOtherEvents(socket: WASocket, sid: string): void {
    const otherEvents = [
      'presence.update',
      'chats.delete',
      'groups.upsert',
      'groups.update',
      'call',
    ];

    otherEvents.forEach((event) => {
      socket.ev.on(event as never, (payload: unknown) => {
        this.logger.log(`[${sid}] 📨 ${event}`, { event, payload });
      });
    });
  }
}
