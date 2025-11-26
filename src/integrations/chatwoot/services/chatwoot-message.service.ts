import { Injectable, Logger } from '@nestjs/common';
import { ChatwootConfigService } from './chatwoot-config.service';
import {
  CreateMessageParams,
  CreateMessageWithAttachmentParams,
  ChatwootMessage,
  WAMessageContent,
} from '../interfaces';
import { CHATWOOT_DEFAULTS } from '../constants';

/**
 * Service responsible for Chatwoot message operations
 *
 * Handles message creation, formatting, and media handling.
 */
@Injectable()
export class ChatwootMessageService {
  private readonly logger = new Logger(ChatwootMessageService.name);

  constructor(private readonly configService: ChatwootConfigService) {}

  /**
   * Create a text message in Chatwoot
   */
  async createMessage(
    sessionId: string,
    conversationId: number,
    params: CreateMessageParams,
  ): Promise<ChatwootMessage | null> {
    const client = await this.configService.getClient(sessionId);
    if (!client) return null;

    try {
      // Build content_attributes for reply support
      const contentAttributes: Record<string, unknown> = {};
      if (params.inReplyTo) {
        contentAttributes.in_reply_to = params.inReplyTo;
      }
      if (params.inReplyToExternalId) {
        contentAttributes.in_reply_to_external_id = params.inReplyToExternalId;
      }

      const message = await client.createMessage(conversationId, {
        content: params.content,
        message_type: params.messageType,
        private: params.private,
        source_id: params.sourceId,
        content_attributes:
          Object.keys(contentAttributes).length > 0
            ? contentAttributes
            : undefined,
        source_reply_id: params.inReplyTo
          ? params.inReplyTo.toString()
          : undefined,
      });

      this.logger.debug(
        `Created message ${message.id} in conversation ${conversationId} for session ${sessionId}`,
      );
      return message;
    } catch (error) {
      this.logger.error(
        `Error creating message for session ${sessionId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Create a message with attachment in Chatwoot
   */
  async createMessageWithAttachment(
    sessionId: string,
    conversationId: number,
    params: CreateMessageWithAttachmentParams,
  ): Promise<ChatwootMessage | null> {
    const client = await this.configService.getClient(sessionId);
    if (!client) return null;

    try {
      // Build content_attributes for reply support
      const contentAttributes =
        params.inReplyTo || params.inReplyToExternalId
          ? {
              in_reply_to: params.inReplyTo,
              in_reply_to_external_id: params.inReplyToExternalId,
            }
          : undefined;

      const message = await client.createMessageWithAttachments(
        conversationId,
        {
          content: params.content,
          message_type: params.messageType,
          source_id: params.sourceId,
          attachments: [
            {
              content: params.file.buffer,
              filename: params.file.filename,
            },
          ],
          content_attributes: contentAttributes,
        },
      );

      this.logger.debug(
        `Created message with attachment ${message.id} in conversation ${conversationId} for session ${sessionId}`,
      );
      return message;
    } catch (error) {
      this.logger.error(
        `Error creating message with attachment for session ${sessionId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Delete a message from Chatwoot
   */
  async deleteMessage(
    sessionId: string,
    conversationId: number,
    messageId: number,
  ): Promise<boolean> {
    const client = await this.configService.getClient(sessionId);
    if (!client) return false;

    try {
      await client.deleteMessage(conversationId, messageId);
      this.logger.debug(
        `Deleted message ${messageId} from conversation ${conversationId} for session ${sessionId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting message for session ${sessionId}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Format message content with sender signature (for groups)
   */
  formatMessageContent(
    content: string,
    signMsg: boolean,
    signDelimiter?: string,
    senderName?: string,
  ): string {
    if (!signMsg || !senderName) {
      return content;
    }
    const delimiter = signDelimiter || CHATWOOT_DEFAULTS.SIGN_DELIMITER;
    return `**${senderName}**${delimiter}${content}`;
  }

  /**
   * Extract text content from WhatsApp message
   */
  getMessageContent(message: WAMessageContent | null): string | null {
    if (!message) return null;

    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage) return message.extendedTextMessage.text;
    if (message.imageMessage) return message.imageMessage.caption || '[Image]';
    if (message.videoMessage) return message.videoMessage.caption || '[Video]';
    if (message.audioMessage) return '[Audio]';
    if (message.documentMessage)
      return message.documentMessage.fileName || '[Document]';
    if (message.stickerMessage) return '[Sticker]';
    if (message.contactMessage) return '[Contact]';
    if (message.locationMessage) return '[Location]';
    if (message.liveLocationMessage) return '[Live Location]';
    if (message.listMessage) return '[List]';
    if (message.listResponseMessage) return '[List Response]';
    if (message.buttonsResponseMessage) return '[Button Response]';
    if (message.templateButtonReplyMessage) return '[Template Response]';
    if (message.reactionMessage) return message.reactionMessage.text || null;
    if (message.pollCreationMessage) return '[Poll]';

    return null;
  }

  /**
   * Check if message contains media
   */
  isMediaMessage(message: WAMessageContent | null): boolean {
    if (!message) return false;
    return !!(
      message.imageMessage ||
      message.videoMessage ||
      message.audioMessage ||
      message.documentMessage ||
      message.stickerMessage
    );
  }

  /**
   * Get media type from message
   */
  getMediaType(message: WAMessageContent | null): string | null {
    if (!message) return null;
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.stickerMessage) return 'sticker';
    return null;
  }
}
