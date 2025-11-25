import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { WASocket, downloadMediaMessage, proto } from 'whaileys';
import { PersistenceService } from '../../persistence/persistence.service';
import { ChatwootService } from '../../../integrations/chatwoot/chatwoot.service';
import { WhatsAppService } from '../whatsapp.service';
import { parseMessageContent } from '../../persistence/utils/message-parser';
import { MessageStatus } from '@prisma/client';
import { formatSessionId, createSilentLogger } from '../utils/helpers';
import { getMediaFilename, isMediaMessage } from '../../../common/utils';

@Injectable()
export class MessagesHandler {
  private readonly logger = new Logger(MessagesHandler.name);

  constructor(
    @Inject(forwardRef(() => PersistenceService))
    private readonly persistenceService: PersistenceService,
    @Inject(forwardRef(() => ChatwootService))
    private readonly chatwootService: ChatwootService,
    @Inject(forwardRef(() => WhatsAppService))
    private readonly whatsappService: WhatsAppService,
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
    payload: { messages: unknown[]; type?: string },
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
        message?: Record<string, unknown> & {
          protocolMessage?: {
            key?: { id: string; remoteJid: string; fromMe?: boolean };
            editedMessage?: {
              conversation?: string;
              extendedTextMessage?: { text?: string };
            };
            type?: number;
          };
          editedMessage?: {
            message?: {
              protocolMessage?: {
                key?: { id: string; remoteJid: string; fromMe?: boolean };
                editedMessage?: {
                  conversation?: string;
                  extendedTextMessage?: { text?: string };
                };
              };
            };
          };
        };
        pushName?: string;
        messageTimestamp?: number;
      }>) {
        if (!msg.key || !msg.key.id || !msg.key.remoteJid) continue;

        // Check if this is an edited message (protocolMessage with editedMessage)
        const editedMessage =
          msg.message?.protocolMessage ||
          msg.message?.editedMessage?.message?.protocolMessage;

        if (editedMessage?.editedMessage) {
          await this.handleMessageEdit(sessionId, editedMessage, sid);
          continue;
        }

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
          // Store WAMessageKey for reply/edit/delete operations
          waMessageKey: {
            id: msg.key.id,
            remoteJid: msg.key.remoteJid,
            fromMe: msg.key.fromMe || false,
            participant: msg.key.participant,
          },
          // Store original message content for reply operations (like Evolution API)
          waMessage: msg.message || null,
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
          // Find the message to get Chatwoot IDs before marking as deleted
          const message = await this.persistenceService.findMessageByWAId(
            sessionId,
            key.id,
          );

          // Mark as deleted in our database
          await this.persistenceService.markMessageAsDeleted(sessionId, key.id);

          // Forward delete to Chatwoot if message was synced
          if (message?.chatwootMessageId && message?.chatwootConversationId) {
            await this.forwardDeleteToChatwoot(
              sessionId,
              message.chatwootConversationId,
              message.chatwootMessageId,
              sid,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao persistir messages.delete: ${(error as Error).message}`,
      );
    }
  }

  private async forwardDeleteToChatwoot(
    sessionId: string,
    conversationId: number,
    messageId: number,
    sid: string,
  ): Promise<void> {
    try {
      const config = await this.chatwootService.getConfig(sessionId);
      if (!config?.enabled) return;

      await this.chatwootService.deleteMessage(
        sessionId,
        conversationId,
        messageId,
      );
      this.logger.log(`[${sid}] [CW] Message deleted (msgId=${messageId})`);
    } catch (error) {
      this.logger.error(
        `[${sid}] [CW] Error forwarding delete: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Handle edited message from WhatsApp
   * Following Evolution API pattern: create a new message in Chatwoot with edited content
   * and reference the original message via stanzaId
   */
  private async handleMessageEdit(
    sessionId: string,
    editedMessage: {
      key?: { id: string; remoteJid: string; fromMe?: boolean };
      editedMessage?: {
        conversation?: string;
        extendedTextMessage?: { text?: string };
      };
    },
    sid: string,
  ): Promise<void> {
    try {
      const config = await this.chatwootService.getConfig(sessionId);
      if (!config?.enabled) return;

      const originalMessageId = editedMessage.key?.id;
      if (!originalMessageId) return;

      // Get edited text content
      const editedText =
        editedMessage.editedMessage?.conversation ||
        editedMessage.editedMessage?.extendedTextMessage?.text;

      if (!editedText) return;

      // Find original message to get Chatwoot IDs
      const originalMessage = await this.persistenceService.findMessageByWAId(
        sessionId,
        originalMessageId,
      );

      if (!originalMessage?.chatwootConversationId) {
        this.logger.warn(
          `[${sid}] [CW] Original message not found for edit: ${originalMessageId}`,
        );
        return;
      }

      // Update the message content in our database
      await this.persistenceService.updateMessageContent(
        sessionId,
        originalMessageId,
        editedText,
      );

      // Create a new message in Chatwoot showing the edited content
      // This appears as a customer message (incoming) but with sourceId to prevent
      // it from being sent back to WhatsApp (our webhook ignores messages with source_id)
      const formattedContent = `📝 _Mensagem editada:_\n${editedText}`;

      await this.chatwootService.createMessage(
        sessionId,
        originalMessage.chatwootConversationId,
        {
          content: formattedContent,
          messageType: 'incoming', // Shows as customer message
          sourceId: `edited-${originalMessageId}`, // Prevents loop - webhook ignores source_id
          inReplyTo: originalMessage.chatwootMessageId || undefined,
          inReplyToExternalId: originalMessageId,
        },
      );

      this.logger.log(
        `[${sid}] [CW] Message edit shown for: ${originalMessageId}`,
      );
    } catch (error) {
      this.logger.error(
        `[${sid}] [CW] Error handling message edit: ${(error as Error).message}`,
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
      key: {
        id: string;
        remoteJid: string;
        fromMe?: boolean;
        participant?: string;
      };
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

      // Skip outgoing messages (sent by us/Chatwoot) to avoid loop
      if (fromMe) return;

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
        this.logger.warn(`[${sid}] [CW] Inbox not found`);
        return;
      }

      // Find or create contact
      let contact = await this.chatwootService.findContact(
        sessionId,
        remoteJid,
      );
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
      const messageContent = this.chatwootService.getMessageContent(
        message || null,
      );
      if (!messageContent) return;

      // Format for groups
      let finalContent = messageContent;
      if (isGroup && config.signMsg) {
        const participantJid = participant || remoteJid;
        const senderName =
          pushName ||
          participantJid.replace('@s.whatsapp.net', '').split(':')[0];
        finalContent = this.chatwootService.formatMessageContent(
          messageContent,
          true,
          config.signDelimiter || '\n',
          senderName,
        );
      }

      // Extract stanzaId for reply support
      const waMessage = message as {
        extendedTextMessage?: { contextInfo?: { stanzaId?: string } };
        imageMessage?: { contextInfo?: { stanzaId?: string } };
        videoMessage?: { contextInfo?: { stanzaId?: string } };
        audioMessage?: { contextInfo?: { stanzaId?: string; ptt?: boolean } };
        documentMessage?: {
          contextInfo?: { stanzaId?: string };
          fileName?: string;
        };
        stickerMessage?: { contextInfo?: { stanzaId?: string } };
        contextInfo?: { stanzaId?: string };
      };

      const stanzaId =
        waMessage?.extendedTextMessage?.contextInfo?.stanzaId ||
        waMessage?.imageMessage?.contextInfo?.stanzaId ||
        waMessage?.videoMessage?.contextInfo?.stanzaId ||
        waMessage?.audioMessage?.contextInfo?.stanzaId ||
        waMessage?.documentMessage?.contextInfo?.stanzaId ||
        waMessage?.contextInfo?.stanzaId;

      let inReplyTo: number | undefined;
      let inReplyToExternalId: string | undefined;

      if (stanzaId) {
        inReplyToExternalId = stanzaId;
        const quotedMessage = await this.persistenceService.findMessageByWAId(
          sessionId,
          stanzaId,
        );
        if (quotedMessage?.chatwootMessageId) {
          inReplyTo = quotedMessage.chatwootMessageId;
        }
      }

      // Check if this is a media message
      const hasMedia = isMediaMessage(message || null);

      let chatwootMessage: { id: number } | null = null;

      if (hasMedia) {
        // Try to download and forward media
        const mediaBuffer = await this.downloadMedia(sessionId, msg, sid);
        if (mediaBuffer) {
          const filename = getMediaFilename(waMessage, key.id);

          chatwootMessage =
            await this.chatwootService.createMessageWithAttachment(
              sessionId,
              conversationId,
              {
                content:
                  finalContent !== messageContent ? finalContent : undefined,
                messageType: fromMe ? 'outgoing' : 'incoming',
                sourceId: key.id,
                file: { buffer: mediaBuffer, filename },
                inReplyTo,
                inReplyToExternalId,
              },
            );
        } else {
          // Fallback to text if media download fails
          chatwootMessage = await this.chatwootService.createMessage(
            sessionId,
            conversationId,
            {
              content: finalContent,
              messageType: fromMe ? 'outgoing' : 'incoming',
              sourceId: key.id,
              inReplyTo,
              inReplyToExternalId,
            },
          );
        }
      } else {
        // Send text message
        chatwootMessage = await this.chatwootService.createMessage(
          sessionId,
          conversationId,
          {
            content: finalContent,
            messageType: fromMe ? 'outgoing' : 'incoming',
            sourceId: key.id,
            inReplyTo,
            inReplyToExternalId,
          },
        );
      }

      // Update message with Chatwoot tracking data
      if (chatwootMessage) {
        await this.persistenceService.updateMessageChatwoot(sessionId, key.id, {
          chatwootConversationId: conversationId,
          chatwootMessageId: chatwootMessage.id,
          chatwootInboxId: inbox.id,
          chatwootContactId: contact.id,
        });
        this.logger.log(
          `[${sid}] [CW] Message forwarded (msgId=${chatwootMessage.id})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Chatwoot forward error: ${(error as Error).message}`,
      );
    }
  }

  private async downloadMedia(
    sessionId: string,
    msg: {
      key: { id: string; remoteJid: string; fromMe?: boolean };
      message?: Record<string, unknown>;
    },
    sid: string,
  ): Promise<Buffer | null> {
    try {
      const socket = this.whatsappService.getSocket(sessionId);
      if (!socket) return null;

      const buffer = await downloadMediaMessage(
        msg as proto.IWebMessageInfo,
        'buffer',
        {},
        {
          logger: createSilentLogger() as Parameters<
            typeof downloadMediaMessage
          >[3] extends { logger: infer L }
            ? L
            : never,
          reuploadRequest: socket.updateMediaMessage.bind(socket),
        },
      );

      return buffer as Buffer;
    } catch (error) {
      this.logger.warn(
        `[${sid}] [CW] Media download failed: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
