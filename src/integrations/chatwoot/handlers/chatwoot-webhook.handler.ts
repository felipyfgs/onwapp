import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { MessagesService } from '../../../api/messages/messages.service';
import { WhatsAppService } from '../../../core/whatsapp/whatsapp.service';
import { PersistenceService } from '../../../core/persistence/persistence.service';
import { ChatwootConfigService } from '../services/chatwoot-config.service';
import {
  ChatwootWebhookPayload,
  ChatwootWebhookAttachment,
  QuotedMessage,
  WebhookProcessingResult,
} from '../interfaces';
import { CHATWOOT_EVENTS, CHATWOOT_SENDER_TYPES } from '../constants';
import { formatRemoteJid, getMimeType } from '../../../common/utils';

/**
 * Handler for incoming webhooks from Chatwoot
 *
 * Processes Chatwoot events (message_created, message_updated)
 * and sends corresponding messages to WhatsApp.
 */
@Injectable()
export class ChatwootWebhookHandler {
  private readonly logger = new Logger(ChatwootWebhookHandler.name);

  constructor(
    private readonly configService: ChatwootConfigService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => WhatsAppService))
    private readonly whatsappService: WhatsAppService,
    private readonly persistenceService: PersistenceService,
  ) {}

  /**
   * Process incoming webhook from Chatwoot
   */
  async handleWebhook(
    sessionId: string,
    payload: ChatwootWebhookPayload,
  ): Promise<WebhookProcessingResult> {
    // Handle message deletion
    if (
      payload.event === CHATWOOT_EVENTS.MESSAGE_UPDATED &&
      payload.content_attributes?.deleted
    ) {
      return this.handleMessageDelete(sessionId, payload);
    }

    // Only process message_created events
    if (payload.event !== CHATWOOT_EVENTS.MESSAGE_CREATED) {
      return {
        status: 'ignored',
        reason: `Event ${payload.event} not handled`,
      };
    }

    // Validate the message should be processed
    const validationResult = this.validateOutgoingMessage(payload);
    if (validationResult) {
      return validationResult;
    }

    // Extract chat ID from webhook payload
    const chatId = this.extractChatId(payload);
    if (!chatId) {
      this.logger.warn(
        `[${sessionId}] Could not extract chatId from webhook payload`,
      );
      return { status: 'error', reason: 'Could not determine chat ID' };
    }

    // Format and validate the remote JID
    let remoteJid = formatRemoteJid(chatId);
    remoteJid = await this.validateAndResolveJid(sessionId, remoteJid, chatId);

    try {
      // Get quoted message for reply support
      const quoted = await this.getQuotedMessage(sessionId, payload);

      // Handle attachments first
      if (payload.attachments && payload.attachments.length > 0) {
        return this.handleAttachments(sessionId, remoteJid, payload, quoted);
      }

      // Send text message
      if (payload.content) {
        await this.sendTextMessage(sessionId, remoteJid, payload, quoted);
        this.logger.log(`[${sessionId}] Message sent to ${remoteJid}`);
        return { status: 'sent', chatId: remoteJid };
      }

      // No content to send
      return { status: 'ignored', reason: 'No content or attachments to send' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[${sessionId}] Error sending message to ${remoteJid}: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { status: 'error', error: errorMsg };
    }
  }

  /**
   * Validate that message should be processed for sending
   */
  private validateOutgoingMessage(
    payload: ChatwootWebhookPayload,
  ): WebhookProcessingResult | null {
    // Ignore private messages
    if (payload.private) {
      return { status: 'ignored', reason: 'Private message' };
    }

    // Only outgoing messages
    if (payload.message_type !== 'outgoing') {
      return { status: 'ignored', reason: 'Not an outgoing message' };
    }

    // Only from agents (not contacts)
    if (payload.sender?.type !== CHATWOOT_SENDER_TYPES.USER) {
      return { status: 'ignored', reason: 'Not from agent' };
    }

    // Ignore messages created via API (to avoid loop)
    if (payload.source_id) {
      return { status: 'ignored', reason: 'Message from API (has source_id)' };
    }

    return null;
  }

  /**
   * Extract chat ID from webhook payload
   */
  private extractChatId(payload: ChatwootWebhookPayload): string | null {
    const identifier = payload.conversation?.meta?.sender?.identifier;
    if (identifier) return identifier;

    const phoneNumber = payload.conversation?.meta?.sender?.phone_number;
    if (phoneNumber) {
      return phoneNumber.replace('+', '').replace(/\D/g, '');
    }

    return null;
  }

  /**
   * Validate and resolve JID using WhatsApp
   */
  private async validateAndResolveJid(
    sessionId: string,
    remoteJid: string,
    chatId: string,
  ): Promise<string> {
    // Skip validation for groups
    if (remoteJid.includes('@g.us')) {
      return remoteJid;
    }

    try {
      const socket = this.whatsappService.getSocket(sessionId);
      if (socket) {
        const phoneNumber = chatId.replace('@s.whatsapp.net', '').split(':')[0];
        const results = await socket.onWhatsApp(phoneNumber);
        if (results && results.length > 0 && results[0].exists) {
          return results[0].jid;
        }
        this.logger.warn(
          `[${sessionId}] Number not on WhatsApp: ${phoneNumber}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[${sessionId}] onWhatsApp error: ${(error as Error).message}`,
      );
    }

    return remoteJid;
  }

  /**
   * Handle message attachments
   * Each attachment is sent separately to WhatsApp (WhatsApp doesn't support multiple files in one message)
   * The original Chatwoot message keeps all attachments as sent by the agent
   */
  private async handleAttachments(
    sessionId: string,
    remoteJid: string,
    payload: ChatwootWebhookPayload,
    quoted?: QuotedMessage,
  ): Promise<WebhookProcessingResult> {
    const attachments = payload.attachments!;
    const conversationId = payload.conversation?.id;

    if (attachments.length > 1) {
      this.logger.log(
        `[${sessionId}] Sending ${attachments.length} attachments separately to WhatsApp`,
      );
    }

    // Send each attachment separately to WhatsApp
    // First attachment gets the caption and quote, subsequent ones don't
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      const isFirst = i === 0;

      const result = await this.sendAttachment(
        sessionId,
        remoteJid,
        attachment,
        isFirst ? payload.content : undefined, // Caption only on first
        isFirst ? quoted : undefined, // Quote only on first
      );

      // Persist outgoing message with Chatwoot tracking
      // All messages link to the same Chatwoot message ID for deletion support
      if (result?.id && payload.id && conversationId) {
        await this.persistenceService.createMessage(sessionId, {
          remoteJid,
          messageId: result.id,
          fromMe: true,
          timestamp: Date.now(),
          messageType: attachment.file_type || 'file',
          textContent: isFirst ? payload.content : undefined,
          metadata: { fileName: attachment.file_name, attachmentIndex: i },
          cwMessageId: payload.id, // All files link to same Chatwoot message
          cwConversationId: conversationId,
          waMessageKey: {
            id: result.id,
            remoteJid,
            fromMe: true,
          },
        });
      }
    }

    return { status: 'sent', type: 'media', chatId: remoteJid };
  }

  /**
   * Send a text message to WhatsApp
   */
  private async sendTextMessage(
    sessionId: string,
    remoteJid: string,
    payload: ChatwootWebhookPayload,
    quoted?: QuotedMessage,
  ): Promise<void> {
    const result = await this.messagesService.sendTextMessage(sessionId, {
      to: remoteJid,
      text: payload.content!,
      quoted,
    });

    // Persist outgoing message with Chatwoot tracking for reply support
    if (result?.id && payload.id && payload.conversation?.id) {
      await this.persistenceService.createMessage(sessionId, {
        remoteJid,
        messageId: result.id,
        fromMe: true,
        timestamp: Date.now(),
        messageType: 'conversation',
        textContent: payload.content,
        metadata: {},
        cwMessageId: payload.id,
        cwConversationId: payload.conversation.id,
        waMessageKey: {
          id: result.id,
          remoteJid,
          fromMe: true,
        },
      });
    }
  }

  /**
   * Send an attachment to WhatsApp
   */
  private async sendAttachment(
    sessionId: string,
    remoteJid: string,
    attachment: ChatwootWebhookAttachment,
    caption?: string,
    quoted?: QuotedMessage,
  ): Promise<{ id: string } | null> {
    const { file_type, data_url, file_name } = attachment;

    // Download the attachment
    let mediaData: string;
    try {
      const response = await axios.get<ArrayBuffer>(data_url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout for large files
      });
      mediaData = `data:${getMimeType(file_type, file_name)};base64,${Buffer.from(response.data).toString('base64')}`;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage =
        axiosError.response?.status !== undefined
          ? `HTTP ${axiosError.response.status}`
          : axiosError.message;
      this.logger.error(
        `[${sessionId}] Failed to download attachment from ${data_url}: ${errorMessage}`,
      );
      throw new Error(`Attachment download failed: ${errorMessage}`);
    }

    // Send based on file type
    switch (file_type) {
      case 'image':
        return this.messagesService.sendImageMessage(sessionId, {
          to: remoteJid,
          image: mediaData,
          caption,
          quoted,
        });
      case 'video':
        return this.messagesService.sendVideoMessage(sessionId, {
          to: remoteJid,
          video: mediaData,
          caption,
          quoted,
        });
      case 'audio':
        return this.messagesService.sendAudioMessage(sessionId, {
          to: remoteJid,
          audio: mediaData,
          quoted,
        });
      case 'file':
      default:
        return this.messagesService.sendDocumentMessage(sessionId, {
          to: remoteJid,
          document: mediaData,
          mimetype: getMimeType(file_type, file_name),
          fileName: file_name || 'document',
          quoted,
        });
    }
  }

  /**
   * Handle message deletion from Chatwoot
   * Supports deleting multiple WhatsApp messages if the Chatwoot message had multiple attachments
   */
  private async handleMessageDelete(
    sessionId: string,
    payload: ChatwootWebhookPayload,
  ): Promise<WebhookProcessingResult> {
    const chatwootMessageId = payload.id;
    if (!chatwootMessageId) {
      return { status: 'error', reason: 'No message ID in payload' };
    }

    try {
      // Find ALL WhatsApp messages linked to this Chatwoot message ID
      // (multiple files sent together share the same cwMessageId)
      const messages =
        await this.persistenceService.findAllMessagesByChatwootId(
          sessionId,
          chatwootMessageId,
        );

      if (messages.length === 0) {
        this.logger.debug(
          `[${sessionId}] No messages found for delete: chatwootId=${chatwootMessageId}`,
        );
        return { status: 'ignored', reason: 'Message not found in database' };
      }

      const socket = this.whatsappService.getSocket(sessionId);
      if (!socket) {
        this.logger.warn(
          `[${sessionId}] Cannot delete message: session not connected`,
        );
        return { status: 'error', reason: 'Session not connected' };
      }

      // Delete all linked messages on WhatsApp
      let deletedCount = 0;
      const errors: string[] = [];

      for (const message of messages) {
        if (!message.waMessageKey) {
          this.logger.debug(
            `[${sessionId}] Skipping message without waMessageKey: ${message.messageId}`,
          );
          continue;
        }

        const key = message.waMessageKey as {
          id: string;
          remoteJid: string;
          fromMe: boolean;
          participant?: string;
        };

        try {
          await socket.sendMessage(key.remoteJid, { delete: key });
          await this.persistenceService.markMessageAsDeleted(sessionId, key.id);
          deletedCount++;
          this.logger.debug(
            `[${sessionId}] Deleted message on WhatsApp: ${key.id}`,
          );
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`${key.id}: ${errorMsg}`);
          this.logger.error(
            `[${sessionId}] Failed to delete message ${key.id}: ${errorMsg}`,
          );
        }
      }

      if (deletedCount > 0) {
        this.logger.log(
          `[${sessionId}] Deleted ${deletedCount}/${messages.length} messages on WhatsApp for chatwootId=${chatwootMessageId}`,
        );
      }

      return {
        status: deletedCount > 0 ? 'deleted' : 'error',
        reason:
          deletedCount > 0
            ? `Deleted ${deletedCount} message(s) on WhatsApp`
            : `Failed to delete messages: ${errors.join(', ')}`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[${sessionId}] Error deleting message: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { status: 'error', reason: errorMsg };
    }
  }

  /**
   * Get quoted message for reply support
   */
  private async getQuotedMessage(
    sessionId: string,
    payload: ChatwootWebhookPayload,
  ): Promise<QuotedMessage | undefined> {
    const replyToId =
      payload.content_attributes?.in_reply_to_external_id ||
      payload.content_attributes?.in_reply_to;

    if (!replyToId) return undefined;

    let originalMessage: {
      messageId: string;
      remoteJid: string;
      waMessageKey: {
        id: string;
        remoteJid: string;
        fromMe: boolean;
        participant?: string;
      } | null;
      waMessage: Record<string, unknown> | null;
    } | null = null;

    if (payload.content_attributes?.in_reply_to_external_id) {
      originalMessage = await this.persistenceService.findMessageByWAId(
        sessionId,
        payload.content_attributes.in_reply_to_external_id,
      );
    } else if (payload.content_attributes?.in_reply_to) {
      originalMessage = await this.persistenceService.findMessageByChatwootId(
        sessionId,
        payload.content_attributes.in_reply_to,
      );
    }

    if (originalMessage?.waMessageKey) {
      const simplifiedMessage = this.simplifyQuotedMessage(
        originalMessage.waMessage,
      );
      return {
        key: { ...originalMessage.waMessageKey },
        message: simplifiedMessage,
      };
    }

    this.logger.warn(
      `[${sessionId}] Original message not found for reply: ${replyToId}`,
    );
    return undefined;
  }

  /**
   * Simplify WhatsApp message for quoted replies
   */
  private simplifyQuotedMessage(
    waMessage: Record<string, unknown> | null,
  ): Record<string, unknown> {
    if (!waMessage) {
      return {};
    }

    const excludeFields = [
      'messageContextInfo',
      'deviceListMetadata',
      'deviceListMetadataVersion',
      'messageSecret',
      'senderKeyDistributionMessage',
    ];

    const contentTypes = [
      'conversation',
      'extendedTextMessage',
      'imageMessage',
      'videoMessage',
      'audioMessage',
      'documentMessage',
      'documentWithCaptionMessage',
      'stickerMessage',
      'contactMessage',
      'contactsArrayMessage',
      'locationMessage',
      'liveLocationMessage',
      'pollCreationMessage',
      'reactionMessage',
    ];

    const simplified: Record<string, unknown> = {};

    for (const contentType of contentTypes) {
      if (waMessage[contentType]) {
        if (contentType === 'extendedTextMessage') {
          const extMsg = waMessage[contentType] as Record<string, unknown>;
          simplified[contentType] = { text: extMsg.text };
        } else if (contentType === 'conversation') {
          simplified[contentType] = waMessage[contentType];
        } else {
          const content = { ...(waMessage[contentType] as object) };
          delete (content as Record<string, unknown>).contextInfo;
          simplified[contentType] = content;
        }
        break;
      }
    }

    if (Object.keys(simplified).length === 0) {
      for (const [key, value] of Object.entries(waMessage)) {
        if (!excludeFields.includes(key)) {
          simplified[key] = value;
        }
      }
    }

    return simplified;
  }
}
