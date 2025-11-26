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
      this.logger.warn(
        `[${sessionId}] Cannot create message: Chatwoot client not available`,
      );
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

      this.logger.debug(
        `[${sessionId}] Created message ${message.id} in conversation ${conversationId}`,
      );
      return message;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[${sessionId}] Error creating message in conversation ${conversationId}: ${errorMsg}`,
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
    if (!client) {
      this.logger.warn(
        `[${sessionId}] Cannot create message with attachment: Chatwoot client not available`,
      );
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

      this.logger.debug(
        `[${sessionId}] Created message with attachment ${message.id} in conversation ${conversationId}`,
      );
      return message;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[${sessionId}] Error creating message with attachment in conversation ${conversationId}: ${errorMsg}`,
      );
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
      this.logger.warn(
        `[${sessionId}] Cannot delete message: Chatwoot client not available`,
      );
      return false;
    }

    try {
      await client.deleteMessage(conversationId, messageId);
      this.logger.debug(
        `[${sessionId}] Deleted message ${messageId} from conversation ${conversationId}`,
      );
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[${sessionId}] Error deleting message ${messageId}: ${errorMsg}`,
      );
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
      this.logger.warn(
        `[${sessionId}] Cannot mark message as deleted: Chatwoot client not available`,
      );
      return false;
    }

    try {
      await client.updateMessage(conversationId, messageId, {
        content: '⦸ _Mensagem apagada_',
      });
      this.logger.debug(
        `[${sessionId}] Marked message ${messageId} as deleted in conversation ${conversationId}`,
      );
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[${sessionId}] Error marking message ${messageId} as deleted: ${errorMsg}`,
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

    // Debug: log message structure for interactive messages
    const msgKeys = Object.keys(message);
    if (
      msgKeys.some((k) =>
        ['listMessage', 'buttonsMessage', 'interactiveMessage'].includes(k),
      )
    ) {
      this.logger.debug(
        `Interactive message detected, keys: ${msgKeys.join(', ')}`,
      );
    }

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
   * Format list message for Chatwoot display
   */
  private formatListMessage(
    listMessage: NonNullable<WAMessageContent['listMessage']>,
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('📋 *[List]*');
    if (listMessage.title) {
      lines.push(`*${listMessage.title}*`);
    }
    if (listMessage.description) {
      lines.push(listMessage.description);
    }
    lines.push('');

    // Button text
    if (listMessage.buttonText) {
      lines.push(`🔽 _${listMessage.buttonText}_`);
      lines.push('');
    }

    // Sections
    if (listMessage.sections && listMessage.sections.length > 0) {
      for (const section of listMessage.sections) {
        if (section.title) {
          lines.push(`▸ *${section.title}*`);
        }
        if (section.rows && section.rows.length > 0) {
          for (const row of section.rows) {
            const title = row.title || 'Opção';
            const rowId = row.rowId || '';
            const description = row.description ? ` - ${row.description}` : '';
            lines.push(`   • ${title}${description}`);
            if (rowId) {
              lines.push(`     _ID: ${rowId}_`);
            }
          }
        }
        lines.push('');
      }
    }

    return lines.join('\n').trim();
  }

  /**
   * Format buttons message for Chatwoot display
   */
  private formatButtonsMessage(
    buttonsMessage: NonNullable<WAMessageContent['buttonsMessage']>,
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('🔘 *[Buttons]*');
    if (buttonsMessage.contentText) {
      lines.push(buttonsMessage.contentText);
    }
    lines.push('');

    // Buttons
    if (buttonsMessage.buttons && buttonsMessage.buttons.length > 0) {
      for (const button of buttonsMessage.buttons) {
        const text = button.buttonText?.displayText || 'Botão';
        const buttonId = button.buttonId || '';
        lines.push(`   ▪ ${text}`);
        if (buttonId) {
          lines.push(`     _ID: ${buttonId}_`);
        }
      }
      lines.push('');
    }

    // Footer
    if (buttonsMessage.footerText) {
      lines.push(`_${buttonsMessage.footerText}_`);
    }

    return lines.join('\n').trim();
  }

  /**
   * Format interactive message (newer WhatsApp format) for Chatwoot display
   */
  private formatInteractiveMessage(interactiveMessage: unknown): string {
    const msg = interactiveMessage as {
      header?: { title?: string; subtitle?: string };
      body?: { text?: string };
      footer?: { text?: string };
      nativeFlowMessage?: {
        buttons?: Array<{ name?: string; buttonParamsJson?: string }>;
        messageParamsJson?: string;
      };
    };

    const lines: string[] = [];

    // Try to detect type from structure
    const hasNativeFlow = !!msg.nativeFlowMessage;

    if (hasNativeFlow) {
      lines.push('📋 *[Interactive]*');
    } else {
      lines.push('💬 *[Interactive]*');
    }

    // Header
    if (msg.header?.title) {
      lines.push(`*${msg.header.title}*`);
    }
    if (msg.header?.subtitle) {
      lines.push(msg.header.subtitle);
    }

    // Body
    if (msg.body?.text) {
      lines.push(msg.body.text);
    }
    lines.push('');

    // Native flow buttons (list/buttons in newer format)
    if (msg.nativeFlowMessage?.buttons) {
      for (const button of msg.nativeFlowMessage.buttons) {
        if (button.name === 'single_select') {
          // This is a list
          try {
            const params = JSON.parse(button.buttonParamsJson || '{}');
            if (params.title) {
              lines.push(`🔽 _${params.title}_`);
              lines.push('');
            }
            if (params.sections) {
              for (const section of params.sections as Array<{
                title?: string;
                rows?: Array<{
                  title?: string;
                  id?: string;
                  description?: string;
                }>;
              }>) {
                if (section.title) {
                  lines.push(`▸ *${section.title}*`);
                }
                if (section.rows) {
                  for (const row of section.rows) {
                    const desc = row.description ? ` - ${row.description}` : '';
                    lines.push(`   • ${row.title || 'Opção'}${desc}`);
                    if (row.id) {
                      lines.push(`     _ID: ${row.id}_`);
                    }
                  }
                }
                lines.push('');
              }
            }
          } catch {
            lines.push('   [Lista de opções]');
          }
        } else if (button.name === 'quick_reply') {
          // Quick reply button
          try {
            const params = JSON.parse(button.buttonParamsJson || '{}');
            lines.push(`   ▪ ${params.display_text || 'Botão'}`);
            if (params.id) {
              lines.push(`     _ID: ${params.id}_`);
            }
          } catch {
            lines.push('   ▪ [Botão]');
          }
        }
      }
    }

    // Footer
    if (msg.footer?.text) {
      lines.push(`_${msg.footer.text}_`);
    }

    return lines.join('\n').trim();
  }
}
