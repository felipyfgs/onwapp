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

  // Método público para uso com ev.process()
  handleMessagesUpsert(
    sessionId: string,
    socket: WASocket,
    payload: { messages: unknown[]; type?: string },
  ): void {
    const sid = formatSessionId(sessionId);
    void this.processMessagesUpsert(sessionId, payload, sid);
  }

  // Método público para uso com ev.process()
  handleMessagesUpdate(sessionId: string, payload: unknown[]): void {
    const sid = formatSessionId(sessionId);
    void this.processMessagesUpdate(sessionId, payload, sid);
  }

  // Método público para messages.delete
  handleMessagesDelete(
    sessionId: string,
    payload: { keys: { id: string; remoteJid: string }[] } | { jid: string; all: true },
  ): void {
    const sid = formatSessionId(sessionId);
    void this.processMessagesDelete(sessionId, payload, sid);
  }

  // Método público para messages.reaction
  handleMessagesReaction(
    sessionId: string,
    payload: Array<{
      key: { id: string; remoteJid: string; fromMe?: boolean };
      reaction: { text?: string; key?: { id: string } };
    }>,
  ): void {
    const sid = formatSessionId(sessionId);
    void this.processMessagesReaction(sessionId, payload, sid);
  }

  // Método público para message-receipt.update
  handleMessageReceiptUpdate(sessionId: string, payload: unknown[]): void {
    const sid = formatSessionId(sessionId);
    void this.processMessageReceiptUpdate(sessionId, payload, sid);
  }

  // Método público para messages.media-update
  handleMessagesMediaUpdate(
    sessionId: string,
    payload: Array<{
      key: { id: string; remoteJid: string };
      media?: { ciphertext: Uint8Array; iv: Uint8Array };
      error?: unknown;
    }>,
  ): void {
    const sid = formatSessionId(sessionId);
    void this.processMessagesMediaUpdate(sessionId, payload, sid);
  }

  private async processMessagesUpsert(
    sessionId: string,
    payload: { messages: unknown[]; type?: string },
    sid: string,
  ): Promise<void> {
    this.logger.log('Mensagens recebidas', {
      event: 'whatsapp.messages.upsert',
      sessionId,
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

        // Check if this is a protocol message (edit or delete)
        const protocolMessage = msg.message?.protocolMessage;

        // Handle message deletion (REVOKE = type 0)
        if (protocolMessage?.type === 0 && protocolMessage?.key?.id) {
          await this.handleMessageRevoke(sessionId, protocolMessage, sid);
          continue;
        }

        // Check if this is an edited message (protocolMessage with editedMessage)
        const editedMessage =
          protocolMessage ||
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
          sender: msg.pushName,
          timestamp: msg.messageTimestamp || Date.now(),
          messageType: parsedContent.messageType,
          textContent: parsedContent.textContent,
          mediaUrl: parsedContent.mediaUrl,
          fileLength: parsedContent.fileLength,
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
      this.logger.error('Erro ao processar messages.upsert', {
        event: 'messages.upsert.failure',
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  private async processMessagesUpdate(
    sessionId: string,
    payload: unknown[],
    _sid: string,
  ): Promise<void> {
    this.logger.log('Status de mensagens atualizado', {
      event: 'whatsapp.messages.update',
      sessionId,
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
      this.logger.error('Erro ao processar messages.update', {
        event: 'whatsapp.messages.update.failure',
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  private async handleMessagesDelete(
    sessionId: string,
    payload: { keys: { id: string }[] },
    sid: string,
  ): Promise<void> {
    this.logger.log('Mensagens deletadas', {
      event: 'whatsapp.messages.delete',
      sessionId,
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
          if (message?.cwMessageId && message?.cwConversationId) {
            await this.forwardDeleteToChatwoot(
              sessionId,
              message.cwConversationId,
              message.cwMessageId,
              sid,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar messages.delete', {
        event: 'whatsapp.messages.delete.failure',
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  private async forwardDeleteToChatwoot(
    sessionId: string,
    conversationId: number,
    messageId: number,
    _sid: string,
  ): Promise<void> {
    try {
      const config = await this.chatwootService.getConfig(sessionId);
      if (!config?.enabled) return;

      await this.chatwootService.deleteMessage(
        sessionId,
        conversationId,
        messageId,
      );
      this.logger.log('Mensagem deletada no Chatwoot', {
        event: 'chatwoot.message.delete.success',
        sessionId,
        conversationId,
        messageId,
      });
    } catch (error) {
      this.logger.error('Erro ao deletar mensagem no Chatwoot', {
        event: 'chatwoot.message.delete.failure',
        sessionId,
        messageId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Handle message revoke (delete) from WhatsApp client
   */
  private async handleMessageRevoke(
    sessionId: string,
    protocolMessage: {
      key?: { id: string; remoteJid: string; fromMe?: boolean };
      type?: number;
    },
    sid: string,
  ): Promise<void> {
    const revokedMessageId = protocolMessage.key?.id;
    if (!revokedMessageId) return;

    this.logger.log('Mensagem revogada pelo remetente', {
      event: 'whatsapp.message.revoke',
      sessionId,
      messageId: revokedMessageId,
    });

    try {
      // Find the original message to get Chatwoot IDs
      const originalMessage = await this.persistenceService.findMessageByWAId(
        sessionId,
        revokedMessageId,
      );

      // Mark as deleted in our database
      await this.persistenceService.markMessageAsDeleted(
        sessionId,
        revokedMessageId,
      );

      // Forward delete notification to Chatwoot if message was synced
      if (originalMessage?.cwMessageId && originalMessage?.cwConversationId) {
        await this.forwardRevokeNotificationToChatwoot(
          sessionId,
          originalMessage.cwConversationId,
          originalMessage.cwMessageId,
          revokedMessageId,
          sid,
        );
      }
    } catch (error) {
      this.logger.error('Erro ao processar revogação de mensagem', {
        event: 'whatsapp.message.revoke.failure',
        sessionId,
        messageId: revokedMessageId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Forward message revoke to Chatwoot by deleting the message
   */
  private async forwardRevokeNotificationToChatwoot(
    sessionId: string,
    conversationId: number,
    cwMessageId: number,
    waMessageId: string,
    _sid: string,
  ): Promise<void> {
    try {
      const config = await this.chatwootService.getConfig(sessionId);
      if (!config?.enabled) return;

      await this.chatwootService.deleteMessage(
        sessionId,
        conversationId,
        cwMessageId,
      );

      this.logger.log('Mensagem revogada deletada no Chatwoot', {
        event: 'chatwoot.message.revoke.success',
        sessionId,
        cwMessageId,
        waMessageId,
      });
    } catch (error) {
      this.logger.error('Erro ao deletar mensagem revogada no Chatwoot', {
        event: 'chatwoot.message.revoke.failure',
        sessionId,
        cwMessageId,
        error: (error as Error).message,
      });
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
    _sid: string,
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

      if (!originalMessage?.cwConversationId) {
        this.logger.warn('Mensagem original não encontrada para edição', {
          event: 'chatwoot.message.edit.skip',
          sessionId,
          messageId: originalMessageId,
          reason: 'original_not_found',
        });
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
        originalMessage.cwConversationId,
        {
          content: formattedContent,
          messageType: 'incoming', // Shows as customer message
          sourceId: `edited-${originalMessageId}`, // Prevents loop - webhook ignores source_id
          inReplyTo: originalMessage.cwMessageId || undefined,
          inReplyToExternalId: originalMessageId,
        },
      );

      this.logger.log('Mensagem editada encaminhada ao Chatwoot', {
        event: 'chatwoot.message.edit.success',
        sessionId,
        messageId: originalMessageId,
      });
    } catch (error) {
      this.logger.error('Erro ao processar edição de mensagem', {
        event: 'chatwoot.message.edit.failure',
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  private async handleMessageReceiptUpdate(
    sessionId: string,
    payload: unknown[],
    _sid: string,
  ): Promise<void> {
    this.logger.log('Recibo de mensagem atualizado', {
      event: 'whatsapp.receipt.update',
      sessionId,
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
      this.logger.error('Erro ao processar recibo de mensagem', {
        event: 'whatsapp.receipt.update.failure',
        sessionId,
        error: (error as Error).message,
      });
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

      // Skip status broadcasts
      if (remoteJid === 'status@broadcast') return;

      // For outgoing messages (fromMe=true), check if it was sent via Chatwoot
      // If it was, skip to avoid duplicates. If not, forward to Chatwoot as agent message.
      if (fromMe) {
        // Check if this message was already created by Chatwoot webhook
        const existingMessage = await this.persistenceService.findMessageByWAId(
          sessionId,
          key.id,
        );
        if (existingMessage?.cwMessageId) return;
      }

      // Check ignored JIDs
      if (config.ignoreJids?.includes(remoteJid)) return;

      const isGroup = remoteJid.includes('@g.us');
      const phoneNumber = isGroup
        ? remoteJid
        : remoteJid.replace('@s.whatsapp.net', '').split(':')[0];

      // Get or create inbox
      const inbox = await this.chatwootService.getInbox(sessionId);
      if (!inbox) {
        this.logger.warn('Inbox não encontrado', {
          event: 'chatwoot.inbox.not_found',
          sessionId,
        });
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
      const stanzaId = this.extractStanzaId(message);

      let inReplyTo: number | undefined;
      let inReplyToExternalId: string | undefined;

      if (stanzaId) {
        inReplyToExternalId = stanzaId;
        const quotedMessage = await this.persistenceService.findMessageByWAId(
          sessionId,
          stanzaId,
        );
        if (quotedMessage?.cwMessageId) {
          inReplyTo = quotedMessage.cwMessageId;
        }
      }

      // Check if this is a media message
      const hasMedia = isMediaMessage(message || null);

      let chatwootMessage: { id: number } | null = null;

      if (hasMedia) {
        // Try to download and forward media
        const mediaBuffer = await this.downloadMedia(sessionId, msg, sid);
        if (mediaBuffer) {
          const filename = getMediaFilename(message, key.id);

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
          cwConversationId: conversationId,
          cwMessageId: chatwootMessage.id,
          cwInboxId: inbox.id,
          cwContactId: contact.id,
        });
        this.logger.log('Mensagem encaminhada ao Chatwoot', {
          event: 'chatwoot.message.forward.success',
          sessionId,
          conversationId,
          cwMessageId: chatwootMessage.id,
          waMessageId: key.id,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao encaminhar mensagem ao Chatwoot', {
        event: 'chatwoot.message.forward.failure',
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Extract stanzaId from WhatsApp message for reply support
   * Checks all known message types that can contain contextInfo
   */
  private extractStanzaId(
    message: Record<string, unknown> | undefined,
  ): string | undefined {
    if (!message) return undefined;

    // List of message type keys that may contain contextInfo with stanzaId
    const messageTypesWithContext = [
      'extendedTextMessage',
      'imageMessage',
      'videoMessage',
      'audioMessage',
      'documentMessage',
      'stickerMessage',
      'listResponseMessage',
      'buttonsResponseMessage',
      'templateButtonReplyMessage',
    ];

    for (const key of messageTypesWithContext) {
      const msgPart = message[key] as
        | { contextInfo?: { stanzaId?: string } }
        | undefined;
      if (msgPart?.contextInfo?.stanzaId) {
        return msgPart.contextInfo.stanzaId;
      }
    }

    // Check root contextInfo as fallback
    const rootContext = message.contextInfo as
      | { stanzaId?: string }
      | undefined;
    return rootContext?.stanzaId;
  }

  private async downloadMedia(
    sessionId: string,
    msg: {
      key: { id: string; remoteJid: string; fromMe?: boolean };
      message?: Record<string, unknown>;
    },
    _sid: string,
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
      this.logger.warn('Falha ao baixar mídia', {
        event: 'whatsapp.media.download.failure',
        sessionId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  private async processMessagesDelete(
    sessionId: string,
    payload: { keys: { id: string; remoteJid: string }[] } | { jid: string; all: true },
    _sid: string,
  ): Promise<void> {
    this.logger.log('Mensagens deletadas', {
      event: 'whatsapp.messages.delete',
      sessionId,
    });

    try {
      if ('all' in payload && payload.all) {
        this.logger.log(`[${sessionId}] Deletando todas mensagens de ${payload.jid}`);
        return;
      }

      const { keys } = payload as { keys: { id: string; remoteJid: string }[] };
      
      for (const key of keys) {
        await this.persistenceService.markMessageAsDeleted(sessionId, key.id);
        this.logger.debug(`[${sessionId}] Mensagem ${key.id} marcada como deletada`);
      }
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar messages.delete: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  private async processMessagesReaction(
    sessionId: string,
    payload: Array<{
      key: { id: string; remoteJid: string; fromMe?: boolean };
      reaction: { text?: string; key?: { id: string; participant?: string } };
    }>,
    _sid: string,
  ): Promise<void> {
    this.logger.log('Reações de mensagens', {
      event: 'whatsapp.messages.reaction',
      sessionId,
      count: payload.length,
    });

    try {
      for (const item of payload) {
        const { key, reaction } = item;
        const reactionText = reaction.text || '';
        const senderJid = reaction.key?.participant || key.remoteJid;

        await this.persistenceService.upsertMessageReaction(
          sessionId,
          key.id,
          senderJid,
          reactionText,
        );

        this.logger.debug(
          `[${sessionId}] Reação ${reactionText || '(removida)'} na mensagem ${key.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar messages.reaction: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  private async processMessageReceiptUpdate(
    sessionId: string,
    payload: unknown[],
    _sid: string,
  ): Promise<void> {
    this.logger.log('Recibo de mensagem atualizado', {
      event: 'whatsapp.message-receipt.update',
      sessionId,
      count: payload.length,
    });

    try {
      for (const receipt of payload as Array<{
        key: { id: string; remoteJid: string };
        receipt: { receiptTimestamp?: number; readTimestamp?: number; playedTimestamp?: number };
        userReceipt?: Array<{ userJid: string; receiptTimestamp?: number; readTimestamp?: number }>;
      }>) {
        if (!receipt.key?.id) continue;

        let status: MessageStatus | undefined;

        if (receipt.receipt?.playedTimestamp) {
          status = MessageStatus.read;
        } else if (receipt.receipt?.readTimestamp) {
          status = MessageStatus.read;
        } else if (receipt.receipt?.receiptTimestamp) {
          status = MessageStatus.delivered;
        }

        if (status) {
          await this.persistenceService.updateMessageStatus(
            sessionId,
            receipt.key.id,
            status,
          );
        }

        if (receipt.userReceipt) {
          for (const userReceipt of receipt.userReceipt) {
            await this.persistenceService.addMessageStatusHistory(
              sessionId,
              receipt.key.id,
              userReceipt.readTimestamp ? MessageStatus.read : MessageStatus.delivered,
              userReceipt.userJid,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar message-receipt.update: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  private async processMessagesMediaUpdate(
    sessionId: string,
    payload: Array<{
      key: { id: string; remoteJid: string };
      media?: { ciphertext: Uint8Array; iv: Uint8Array };
      error?: unknown;
    }>,
    _sid: string,
  ): Promise<void> {
    this.logger.log('Atualização de mídia', {
      event: 'whatsapp.messages.media-update',
      sessionId,
      count: payload.length,
    });

    try {
      for (const update of payload) {
        if (update.error) {
          this.logger.warn(
            `[${sessionId}] Erro na mídia da mensagem ${update.key.id}`,
          );
          continue;
        }

        if (update.media) {
          this.logger.debug(
            `[${sessionId}] Mídia atualizada para mensagem ${update.key.id}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar messages.media-update: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }
}
