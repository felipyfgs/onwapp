import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Logger,
  HttpCode,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ChatwootService } from './chatwoot.service';
import { ChatwootEventHandler } from './chatwoot-event.handler';
import { ChatwootDto } from './dto/chatwoot.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { Public } from '../../common/decorators/public.decorator';
import { MessagesService } from '../../api/messages/messages.service';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { PersistenceService } from '../../core/persistence/persistence.service';
import axios from 'axios';

interface ChatwootWebhookPayload {
  id?: number; // Chatwoot message ID
  event?: string;
  message_type?: string;
  content?: string;
  private?: boolean;
  source_id?: string;
  content_attributes?: {
    in_reply_to?: number; // Chatwoot message ID being replied to
    in_reply_to_external_id?: string; // External (WA) message ID being replied to
  };
  conversation?: {
    id: number;
    status?: string;
    meta?: {
      sender?: {
        identifier?: string;
        phone_number?: string;
        name?: string;
      };
    };
  };
  sender?: {
    id: number;
    name?: string;
    type?: string;
  };
  attachments?: Array<{
    file_type: string;
    data_url: string;
    thumb_url?: string;
    file_name?: string;
  }>;
}

interface ZpwootWebhookPayload {
  sessionId: string;
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

@Controller()
export class ChatwootController {
  private readonly logger = new Logger(ChatwootController.name);

  constructor(
    private readonly chatwootService: ChatwootService,
    private readonly chatwootEventHandler: ChatwootEventHandler,
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => WhatsAppService))
    private readonly whatsappService: WhatsAppService,
    private readonly persistenceService: PersistenceService,
  ) {}

  @Post('session/:sessionId/chatwoot/set')
  @UseGuards(ApiKeyGuard)
  async setChatwoot(
    @Param('sessionId') sessionId: string,
    @Body() dto: ChatwootDto,
  ) {
    this.logger.log(`Setting Chatwoot config for session: ${sessionId}`);
    return this.chatwootService.create(sessionId, dto);
  }

  @Get('session/:sessionId/chatwoot/find')
  @UseGuards(ApiKeyGuard)
  async findChatwoot(@Param('sessionId') sessionId: string) {
    const config = await this.chatwootService.find(sessionId);
    if (!config) {
      return {
        enabled: false,
        message: 'Chatwoot not configured for this session',
      };
    }
    return config;
  }

  @Delete('session/:sessionId/chatwoot')
  @UseGuards(ApiKeyGuard)
  async deleteChatwoot(@Param('sessionId') sessionId: string) {
    await this.chatwootService.delete(sessionId);
    return { success: true, message: 'Chatwoot configuration deleted' };
  }

  /**
   * Internal endpoint to receive zpwoot webhook events and forward to Chatwoot
   * Configure your zpwoot webhook URL to point to this endpoint
   */
  @Post('chatwoot/receive/:sessionId')
  @Public()
  @HttpCode(200)
  async receiveZpwootEvent(
    @Param('sessionId') sessionId: string,
    @Body() payload: ZpwootWebhookPayload,
  ) {
    this.logger.debug(`Received zpwoot event for Chatwoot: ${payload.event}`);

    try {
      const result = await this.chatwootEventHandler.handleWebhookEvent({
        ...payload,
        sessionId,
      });
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing zpwoot event: ${(error as Error).message}`,
      );
      return { processed: false, error: (error as Error).message };
    }
  }

  /**
   * Webhook endpoint that Chatwoot calls when agents send messages
   * Configure this URL in Chatwoot inbox settings
   */
  @Post('chatwoot/webhook/:sessionId')
  @Public()
  @HttpCode(200)
  async receiveChatwootWebhook(
    @Param('sessionId') sessionId: string,
    @Body() body: ChatwootWebhookPayload,
  ) {
    // Only process message_created events
    if (body.event !== 'message_created') {
      return { status: 'ignored', reason: `Event ${body.event} not handled` };
    }

    // Ignore private messages and non-outgoing messages
    if (body.private) {
      return { status: 'ignored', reason: 'Private message' };
    }

    if (body.message_type !== 'outgoing') {
      return { status: 'ignored', reason: 'Not an outgoing message' };
    }

    // Only process messages from agents (not from contacts)
    if (body.sender?.type !== 'user') {
      return { status: 'ignored', reason: 'Not from agent' };
    }

    // Ignore messages created via API (to avoid loop)
    if (body.source_id) {
      return { status: 'ignored', reason: 'Message from API (has source_id)' };
    }

    // Get chat ID from conversation metadata
    const chatId = this.extractChatId(body);
    if (!chatId) {
      this.logger.warn(`[CW] Could not extract chatId from webhook payload`);
      return { status: 'error', reason: 'Could not determine chat ID' };
    }

    let remoteJid = this.formatRemoteJid(chatId);

    // Validate number exists on WhatsApp (for non-group chats)
    // Following Evolution API pattern - always use JID (@s.whatsapp.net), not LID
    if (!remoteJid.includes('@g.us')) {
      try {
        const socket = this.whatsappService.getSocket(sessionId);
        if (socket) {
          const phoneNumber = chatId
            .replace('@s.whatsapp.net', '')
            .split(':')[0];
          const results = await socket.onWhatsApp(phoneNumber);
          if (results && results.length > 0 && results[0].exists) {
            remoteJid = results[0].jid;
          } else {
            this.logger.warn(`[CW] Number not on WhatsApp: ${phoneNumber}`);
          }
        }
      } catch (error) {
        this.logger.error(`[CW] onWhatsApp error: ${(error as Error).message}`);
      }
    }

    try {
      // Handle attachments first
      if (body.attachments && body.attachments.length > 0) {
        for (const attachment of body.attachments) {
          await this.sendAttachment(
            sessionId,
            remoteJid,
            attachment,
            body.content,
          );
        }
        // If there's text content without being part of attachment caption, send it separately
        if (body.content && body.attachments.length === 1) {
          // Content was likely included as caption, skip
          return { status: 'sent', type: 'media', chatId: remoteJid };
        }
      }

      // Send text message
      if (body.content) {
        // Check if this is a reply to another message
        // Baileys expects quoted to be { key: { remoteJid, fromMe, id, participant? }, message?: IMessage }
        // Following Evolution API pattern: Quoted = { key: proto.IMessageKey, message: proto.IMessage }
        let quoted:
          | {
              key: {
                remoteJid: string;
                fromMe: boolean;
                id: string;
                participant?: string;
              };
              message?: Record<string, unknown>;
            }
          | undefined;

        const replyToId =
          body.content_attributes?.in_reply_to_external_id ||
          body.content_attributes?.in_reply_to;

        if (replyToId) {
          // Try to find the original message for reply
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

          if (body.content_attributes?.in_reply_to_external_id) {
            originalMessage = await this.persistenceService.findMessageByWAId(
              sessionId,
              body.content_attributes.in_reply_to_external_id,
            );
          } else if (body.content_attributes?.in_reply_to) {
            originalMessage =
              await this.persistenceService.findMessageByChatwootId(
                sessionId,
                body.content_attributes.in_reply_to,
              );
          }

          if (originalMessage?.waMessageKey) {
            const simplifiedMessage = this.simplifyQuotedMessage(
              originalMessage.waMessage,
            );
            quoted = {
              key: { ...originalMessage.waMessageKey },
              message: simplifiedMessage,
            };
          } else {
            this.logger.warn(
              `[CW] Original message not found for reply: ${replyToId}`,
            );
          }
        }

        const result = await this.messagesService.sendTextMessage(sessionId, {
          to: remoteJid,
          text: body.content,
          quoted,
        });

        // Link WA message ID to Chatwoot message ID for reply tracking
        if (result?.id && body.id && body.conversation?.id) {
          await this.persistenceService.updateMessageChatwoot(
            sessionId,
            result.id,
            {
              chatwootMessageId: body.id,
              chatwootConversationId: body.conversation.id,
            },
          );
        }
      }

      this.logger.log(`[CW] Message sent to ${remoteJid}`);
      return { status: 'sent', chatId: remoteJid };
    } catch (error) {
      this.logger.error(
        `Error sending Chatwoot message: ${(error as Error).message}`,
      );
      return { status: 'error', error: (error as Error).message };
    }
  }

  private extractChatId(body: ChatwootWebhookPayload): string | null {
    const identifier = body.conversation?.meta?.sender?.identifier;
    if (identifier) return identifier;

    const phoneNumber = body.conversation?.meta?.sender?.phone_number;
    if (phoneNumber) {
      return phoneNumber.replace('+', '').replace(/\D/g, '');
    }

    return null;
  }

  private formatRemoteJid(chatId: string): string {
    if (chatId.includes('@')) return chatId;
    if (chatId.includes('-')) return `${chatId}@g.us`;
    return `${chatId}@s.whatsapp.net`;
  }

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
  ): Promise<void> {
    const { file_type, data_url, file_name } = attachment;

    // Download the attachment
    let mediaData: string;
    try {
      const response = await axios.get(data_url, {
        responseType: 'arraybuffer',
      });
      mediaData = `data:${this.getMimeType(file_type, file_name)};base64,${Buffer.from(response.data).toString('base64')}`;
    } catch (error) {
      this.logger.error(
        `Failed to download attachment: ${(error as Error).message}`,
      );
      throw error;
    }

    // Send based on file type
    switch (file_type) {
      case 'image':
        await this.messagesService.sendImageMessage(sessionId, {
          to: remoteJid,
          image: mediaData,
          caption,
        });
        break;
      case 'video':
        await this.messagesService.sendVideoMessage(sessionId, {
          to: remoteJid,
          video: mediaData,
          caption,
        });
        break;
      case 'audio':
        // AudioService will convert to OGG/OPUS automatically (encoding=true by default)
        await this.messagesService.sendAudioMessage(sessionId, {
          to: remoteJid,
          audio: mediaData,
        });
        break;
      case 'file':
      default:
        await this.messagesService.sendDocumentMessage(sessionId, {
          to: remoteJid,
          document: mediaData,
          mimetype: this.getMimeType(file_type, file_name),
          fileName: file_name || 'document',
        });
        break;
    }
  }

  private getMimeType(fileType: string, fileName?: string): string {
    const ext = fileName?.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      image: 'image/jpeg',
      video: 'video/mp4',
      audio: 'audio/mpeg',
      file: 'application/octet-stream',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return (
      mimeTypes[ext || ''] || mimeTypes[fileType] || 'application/octet-stream'
    );
  }

  /**
   * Simplifies a WhatsApp message for use in quoted replies.
   * Removes metadata fields that can cause issues with Baileys.
   * Keeps only the essential message content (text, image, video, etc.)
   */
  private simplifyQuotedMessage(
    waMessage: Record<string, unknown> | null,
  ): Record<string, unknown> {
    if (!waMessage) {
      return {};
    }

    // Fields to exclude - these are metadata that shouldn't be in quoted message
    const excludeFields = [
      'messageContextInfo',
      'deviceListMetadata',
      'deviceListMetadataVersion',
      'messageSecret',
      'senderKeyDistributionMessage',
    ];

    // Priority order of message content types
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

    // Find and include message content
    for (const contentType of contentTypes) {
      if (waMessage[contentType]) {
        // For extendedTextMessage, simplify to just the text
        if (contentType === 'extendedTextMessage') {
          const extMsg = waMessage[contentType] as Record<string, unknown>;
          simplified[contentType] = {
            text: extMsg.text,
          };
        } else if (contentType === 'conversation') {
          simplified[contentType] = waMessage[contentType];
        } else {
          // For media messages, include the content but remove nested contextInfo
          const content = { ...(waMessage[contentType] as object) };
          delete (content as Record<string, unknown>).contextInfo;
          simplified[contentType] = content;
        }
        break; // Found the content type, no need to continue
      }
    }

    // If no known content type found, include all fields except excluded ones
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
