import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { WASocket } from 'whaileys';
import { PersistenceService } from '../../persistence/persistence.service';
import { ChatwootService } from '../../../integrations/chatwoot/chatwoot.service';
import { parseMessageContent } from '../../persistence/utils/message-parser';
import { MessageStatus } from '@prisma/client';
import { formatSessionId } from '../utils/helpers';

@Injectable()
export class MessagesHandler {
  private readonly logger = new Logger(MessagesHandler.name);

  constructor(
    @Inject(forwardRef(() => PersistenceService))
    private readonly persistenceService: PersistenceService,
    @Inject(forwardRef(() => ChatwootService))
    private readonly chatwootService: ChatwootService,
  ) {}

  registerMessageListeners(sessionId: string, socket: WASocket): void {
    const sid = formatSessionId(sessionId);

    socket.ev.on(
      'messages.upsert' as never,
      (payload: { messages: unknown[] }) => {
        void this.handleMessagesUpsert(sessionId, payload, sid);
      },
    );

    socket.ev.on('messages.update' as never, (payload: unknown[]) => {
      void this.handleMessagesUpdate(sessionId, payload, sid);
    });

    socket.ev.on(
      'messages.delete' as never,
      (payload: { keys: { id: string }[] }) => {
        void this.handleMessagesDelete(sessionId, payload, sid);
      },
    );

    socket.ev.on('message-receipt.update' as never, (payload: unknown[]) => {
      void this.handleMessageReceiptUpdate(sessionId, payload, sid);
    });
  }

  private async handleMessagesUpsert(
    sessionId: string,
    payload: { messages: unknown[] },
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 messages.upsert`, {
      event: 'messages.upsert',
      count: payload.messages?.length || 0,
    });

    try {
      const { messages } = payload;

      for (const msg of messages as Array<{
        key: {
          id: string;
          remoteJid: string;
          fromMe?: boolean;
          participant?: string;
        };
        message?: Record<string, unknown>;
        pushName?: string;
        messageTimestamp?: number;
      }>) {
        if (!msg.key || !msg.key.id || !msg.key.remoteJid) continue;

        const parsedContent = parseMessageContent(msg);

        await this.persistenceService.createMessage(sessionId, {
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
        });

        if (msg.pushName && msg.key.remoteJid) {
          await this.persistenceService.createOrUpdateContact(sessionId, {
            remoteJid: msg.key.remoteJid,
            name: msg.pushName,
          });
        }

        // Forward to Chatwoot if enabled (independent of webhook)
        await this.forwardToChatwoot(sessionId, msg, sid);
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir messages.upsert: ${(error as Error).message}`,
      );
    }
  }

  private async handleMessagesUpdate(
    sessionId: string,
    payload: unknown[],
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 messages.update`, {
      event: 'messages.update',
      count: payload.length,
    });

    try {
      for (const update of payload as Array<{
        key: { id: string };
        update?: { status?: number };
      }>) {
        if (!update.key || !update.key.id) continue;

        let status: MessageStatus | undefined;

        if (update.update?.status !== undefined) {
          const statusMap: Record<number, MessageStatus> = {
            0: MessageStatus.pending,
            1: MessageStatus.sent,
            2: MessageStatus.delivered,
            3: MessageStatus.read,
            4: MessageStatus.failed,
          };
          status = statusMap[update.update.status];
        }

        if (status) {
          await this.persistenceService.updateMessageStatus(
            sessionId,
            update.key.id,
            status,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir messages.update: ${(error as Error).message}`,
      );
    }
  }

  private async handleMessagesDelete(
    sessionId: string,
    payload: { keys: { id: string }[] },
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 messages.delete`, {
      event: 'messages.delete',
      count: payload.keys?.length || 0,
    });

    try {
      const { keys } = payload;
      for (const key of keys) {
        if (key.id) {
          await this.persistenceService.markMessageAsDeleted(sessionId, key.id);
        }
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir messages.delete: ${(error as Error).message}`,
      );
    }
  }

  private async handleMessageReceiptUpdate(
    sessionId: string,
    payload: unknown[],
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 message-receipt.update`, {
      event: 'message-receipt.update',
      count: payload.length,
    });

    try {
      for (const receipt of payload as Array<{
        key: { id: string };
        receipt?: { receiptTimestamp?: number; readTimestamp?: number };
      }>) {
        if (!receipt.key || !receipt.key.id) continue;

        let status: MessageStatus | undefined;

        if (receipt.receipt?.receiptTimestamp) {
          status = receipt.receipt.readTimestamp
            ? MessageStatus.read
            : MessageStatus.delivered;
        }

        if (status) {
          await this.persistenceService.updateMessageStatus(
            sessionId,
            receipt.key.id,
            status,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir message-receipt.update: ${(error as Error).message}`,
      );
    }
  }

  private async forwardToChatwoot(
    sessionId: string,
    msg: {
      key: { id: string; remoteJid: string; fromMe?: boolean; participant?: string };
      message?: Record<string, unknown>;
      pushName?: string;
    },
    sid: string,
  ): Promise<void> {
    try {
      const config = await this.chatwootService.getConfig(sessionId);
      if (!config?.enabled) return;

      const { key, message, pushName } = msg;
      const { remoteJid, fromMe, participant } = key;

      // Skip status broadcasts
      if (remoteJid === 'status@broadcast') return;

      // Check ignored JIDs
      if (config.ignoreJids?.includes(remoteJid)) return;

      const isGroup = remoteJid.includes('@g.us');
      const phoneNumber = isGroup
        ? remoteJid
        : remoteJid.replace('@s.whatsapp.net', '').split(':')[0];

      // Get or create inbox
      const inbox = await this.chatwootService.getInbox(sessionId);
      if (!inbox) {
        this.logger.warn(`[${sid}] Chatwoot inbox not found`);
        return;
      }

      // Find or create contact
      let contact = await this.chatwootService.findContact(sessionId, remoteJid);
      if (!contact) {
        contact = await this.chatwootService.createContact(sessionId, {
          phoneNumber,
          inboxId: inbox.id,
          isGroup,
          name: pushName || phoneNumber,
          identifier: remoteJid,
        });
        if (!contact) return;
      }

      // Get or create conversation
      const conversationId = await this.chatwootService.createConversation(
        sessionId,
        { contactId: contact.id, inboxId: inbox.id },
      );
      if (!conversationId) return;

      // Get message content
      const messageContent = this.chatwootService.getMessageContent(message || null);
      if (!messageContent) return;

      // Format for groups
      let finalContent = messageContent;
      if (isGroup && config.signMsg) {
        const participantJid = participant || remoteJid;
        const senderName = pushName || participantJid.replace('@s.whatsapp.net', '').split(':')[0];
        finalContent = this.chatwootService.formatMessageContent(
          messageContent,
          true,
          config.signDelimiter || '\n',
          senderName,
        );
      }

      // Send to Chatwoot
      await this.chatwootService.createMessage(sessionId, conversationId, {
        content: finalContent,
        messageType: fromMe ? 'outgoing' : 'incoming',
        sourceId: key.id,
      });

      this.logger.debug(`[${sid}] Message forwarded to Chatwoot`);
    } catch (error) {
      this.logger.error(`[${sid}] Chatwoot forward error: ${(error as Error).message}`);
    }
  }
}
