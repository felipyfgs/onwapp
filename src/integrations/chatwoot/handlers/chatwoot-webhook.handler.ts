import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import axios from 'axios';
import { MessagesService } from '../../../api/messages/messages.service';
import { WhatsAppService } from '../../../core/whatsapp/whatsapp.service';
import { PersistenceService } from '../../../core/persistence/persistence.service';
import { ChatwootConfigService } from '../services/chatwoot-config.service';
import {
  ChatwootWebhookPayload,
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
      }

      this.logger.log(`[${sessionId}] Message sent to ${remoteJid}`);
      return { status: 'sent', chatId: remoteJid };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Error sending message: ${(error as Error).message}`,
      );
      return { status: 'error', error: (error as Error).message };
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
   */
  private async handleAttachments(
    sessionId: string,
    remoteJid: string,
    payload: ChatwootWebhookPayload,
    quoted?: QuotedMessage,
  ): Promise<WebhookProcessingResult> {
    for (const attachment of payload.attachments!) {
      const result = await this.sendAttachment(
        sessionId,
        remoteJid,
        attachment,
        payload.content,
        quoted,
      );

      // Persist outgoing message with Chatwoot tracking for reply support
      if (result?.id && payload.id && payload.conversation?.id) {
        await this.persistenceService.createMessage(sessionId, {
          remoteJid,
          messageId: result.id,
          fromMe: true,
          timestamp: Date.now(),
          messageType: attachment.file_type || 'file',
          textContent: payload.content,
          metadata: { fileName: attachment.file_name },
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
    attachment: {
      file_type: string;
      data_url: string;
      thumb_url?: string;
      file_name?: string;
    },
    caption?: string,
    quoted?: QuotedMessage,
  ): Promise<{ id: string } | null> {
    const { file_type, data_url, file_name } = attachment;

    // Download the attachment
    let mediaData: string;
    try {
      const response = await axios.get(data_url, {
        responseType: 'arraybuffer',
      });
      mediaData = `data:${getMimeType(file_type, file_name)};base64,${Buffer.from(response.data).toString('base64')}`;
    } catch (error) {
      this.logger.error(
        `Failed to download attachment: ${(error as Error).message}`,
      );
      throw error;
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
   */
  private async handleMessageDelete(
    sessionId: string,
    payload: ChatwootWebhookPayload,
  ): Promise<WebhookProcessingResult> {
    if (!payload.id) {
      return { status: 'error', reason: 'No message ID in payload' };
    }

    try {
      // Find the WhatsApp message by Chatwoot message ID
      const message = await this.persistenceService.findMessageByChatwootId(
        sessionId,
        payload.id,
      );

      if (!message?.waMessageKey) {
        this.logger.warn(
          `[${sessionId}] Message not found for delete: chatwootId=${payload.id}`,
        );
        return { status: 'ignored', reason: 'Message not found in database' };
      }

      const socket = this.whatsappService.getSocket(sessionId);
      if (!socket) {
        return { status: 'error', reason: 'Session not connected' };
      }

      // Delete the message on WhatsApp
      const key = message.waMessageKey as {
        id: string;
        remoteJid: string;
        fromMe: boolean;
        participant?: string;
      };

      await socket.sendMessage(key.remoteJid, { delete: key });

      // Mark as deleted in our database
      await this.persistenceService.markMessageAsDeleted(sessionId, key.id);

      this.logger.log(`[${sessionId}] Message deleted on WhatsApp: ${key.id}`);
      return { status: 'deleted', reason: 'Message deleted on WhatsApp' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Error deleting message: ${(error as Error).message}`,
      );
      return { status: 'error', reason: (error as Error).message };
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
