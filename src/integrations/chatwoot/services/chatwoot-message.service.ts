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
 * Media type constants for WhatsApp message types
 */
const WA_MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  STICKER: 'sticker',
} as const;

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
    if (!client) {
      this.logger.warn('Cliente Chatwoot não disponível', {
        event: 'chatwoot.message.create.skip',
        sessionId,
        reason: 'client_unavailable',
      });
      return null;
    }

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

      this.logger.log('Mensagem criada no Chatwoot', {
        event: 'chatwoot.message.create.success',
        sessionId,
        conversationId,
        messageId: message.id,
      });
      return message;
    } catch (error) {
      this.logger.error('Falha ao criar mensagem no Chatwoot', {
        event: 'chatwoot.message.create.failure',
        sessionId,
        conversationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
    if (!client) {
      this.logger.warn('Cliente Chatwoot não disponível', {
        event: 'chatwoot.message.attachment.skip',
        sessionId,
        reason: 'client_unavailable',
      });
      return null;
    }

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

      this.logger.log('Mensagem com anexo criada no Chatwoot', {
        event: 'chatwoot.message.attachment.success',
        sessionId,
        conversationId,
        messageId: message.id,
        filename: params.file.filename,
      });
      return message;
    } catch (error) {
      this.logger.error('Falha ao criar mensagem com anexo no Chatwoot', {
        event: 'chatwoot.message.attachment.failure',
        sessionId,
        conversationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Delete a message from Chatwoot
   *
   * Used when forwarding WhatsApp message deletions to Chatwoot.
   */
  async deleteMessage(
    sessionId: string,
    conversationId: number,
    messageId: number,
  ): Promise<boolean> {
    const client = await this.configService.getClient(sessionId);
    if (!client) {
      this.logger.warn('Cliente Chatwoot não disponível', {
        event: 'chatwoot.message.delete.skip',
        sessionId,
        reason: 'client_unavailable',
      });
      return false;
    }

    try {
      await client.deleteMessage(conversationId, messageId);
      this.logger.log('Mensagem deletada no Chatwoot', {
        event: 'chatwoot.message.delete.success',
        sessionId,
        conversationId,
        messageId,
      });
      return true;
    } catch (error) {
      this.logger.error('Falha ao deletar mensagem no Chatwoot', {
        event: 'chatwoot.message.delete.failure',
        sessionId,
        messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Mark a message as deleted by updating its content (WhatsApp style)
   *
   * This is an alternative to hard delete - shows a "message deleted" placeholder.
   * Currently used when we want to preserve the message in Chatwoot but indicate it was deleted.
   */
  async markMessageAsDeleted(
    sessionId: string,
    conversationId: number,
    messageId: number,
  ): Promise<boolean> {
    const client = await this.configService.getClient(sessionId);
    if (!client) {
      this.logger.warn('Cliente Chatwoot não disponível', {
        event: 'chatwoot.message.mark_deleted.skip',
        sessionId,
        reason: 'client_unavailable',
      });
      return false;
    }

    try {
      await client.updateMessage(conversationId, messageId, {
        content: '⦸ _Mensagem apagada_',
      });
      this.logger.log('Mensagem marcada como apagada no Chatwoot', {
        event: 'chatwoot.message.mark_deleted.success',
        sessionId,
        conversationId,
        messageId,
      });
      return true;
    } catch (error) {
      this.logger.error('Falha ao marcar mensagem como apagada no Chatwoot', {
        event: 'chatwoot.message.mark_deleted.failure',
        sessionId,
        messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
    if (message.listMessage) {
      return this.formatListMessage(message.listMessage);
    }
    if (message.buttonsMessage) {
      return this.formatButtonsMessage(message.buttonsMessage);
    }
    // Handle interactive messages (newer WhatsApp format for lists/buttons)
    if ((message as Record<string, unknown>).interactiveMessage) {
      return this.formatInteractiveMessage(
        (message as Record<string, unknown>).interactiveMessage,
      );
    }
    if (message.listResponseMessage) {
      const title = message.listResponseMessage.title || '';
      const rowId =
        message.listResponseMessage.singleSelectReply?.selectedRowId || '';
      if (title && rowId) return `[List Response] ${title}\n📋 ID: ${rowId}`;
      if (title) return `[List Response] ${title}`;
      if (rowId) return `[List Response] ID: ${rowId}`;
      return '[List Response]';
    }
    if (message.buttonsResponseMessage) {
      const text = message.buttonsResponseMessage.selectedDisplayText || '';
      const buttonId = message.buttonsResponseMessage.selectedButtonId || '';
      if (text && buttonId)
        return `[Button Response] ${text}\n🔘 ID: ${buttonId}`;
      if (text) return `[Button Response] ${text}`;
      if (buttonId) return `[Button Response] ID: ${buttonId}`;
      return '[Button Response]';
    }
    if (message.templateButtonReplyMessage) {
      const text = message.templateButtonReplyMessage.selectedDisplayText || '';
      const selectedId = message.templateButtonReplyMessage.selectedId || '';
      if (text && selectedId)
        return `[Template Response] ${text}\n📝 ID: ${selectedId}`;
      if (text) return `[Template Response] ${text}`;
      if (selectedId) return `[Template Response] ID: ${selectedId}`;
      return '[Template Response]';
    }
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
    if (message.imageMessage) return WA_MEDIA_TYPES.IMAGE;
    if (message.videoMessage) return WA_MEDIA_TYPES.VIDEO;
    if (message.audioMessage) return WA_MEDIA_TYPES.AUDIO;
    if (message.documentMessage) return WA_MEDIA_TYPES.DOCUMENT;
    if (message.stickerMessage) return WA_MEDIA_TYPES.STICKER;
    return null;
  }

  /**
   * Format list message for Chatwoot display (simplified)
   */
  private formatListMessage(
    listMessage: NonNullable<WAMessageContent['listMessage']>,
  ): string {
    const lines: string[] = ['📋 *Lista*'];
    if (listMessage.description) lines.push(listMessage.description);
    if (listMessage.sections) {
      for (const section of listMessage.sections) {
        if (section.rows) {
          for (const row of section.rows) {
            lines.push(`• ${row.title || 'Opção'} (${row.rowId || ''})`);
          }
        }
      }
    }
    return lines.join('\n').trim();
  }

  /**
   * Format buttons message for Chatwoot display (simplified)
   */
  private formatButtonsMessage(
    buttonsMessage: NonNullable<WAMessageContent['buttonsMessage']>,
  ): string {
    const lines: string[] = ['🔘 *Botões*'];
    if (buttonsMessage.contentText) lines.push(buttonsMessage.contentText);
    if (buttonsMessage.buttons) {
      for (const button of buttonsMessage.buttons) {
        const text = button.buttonText?.displayText || 'Botão';
        lines.push(`• ${text} (${button.buttonId || ''})`);
      }
    }
    return lines.join('\n').trim();
  }

  /**
   * Format interactive message (newer WhatsApp format) for Chatwoot display
   */
  private formatInteractiveMessage(interactiveMessage: unknown): string {
    const msg = interactiveMessage as {
      body?: { text?: string };
      nativeFlowMessage?: {
        buttons?: Array<{ name?: string; buttonParamsJson?: string }>;
      };
    };

    const lines: string[] = ['📋 *Interativo*'];
    if (msg.body?.text) lines.push(msg.body.text);

    if (msg.nativeFlowMessage?.buttons) {
      for (const button of msg.nativeFlowMessage.buttons) {
        try {
          const params = JSON.parse(button.buttonParamsJson || '{}');
          if (button.name === 'single_select' && params.sections) {
            for (const section of params.sections as Array<{
              rows?: Array<{ title?: string; id?: string }>;
            }>) {
              if (section.rows) {
                for (const row of section.rows) {
                  lines.push(`• ${row.title || 'Opção'} (${row.id || ''})`);
                }
              }
            }
          } else if (button.name === 'quick_reply') {
            lines.push(
              `• ${params.display_text || 'Botão'} (${params.id || ''})`,
            );
          }
        } catch {
          lines.push('• [Opção]');
        }
      }
    }

    return lines.join('\n').trim();
  }
}
