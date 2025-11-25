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
    // DEBUG: Log full payload structure
    this.logger.debug(
      `[CW-WEBHOOK] event=${body.event}, type=${body.message_type}, sender=${body.sender?.type}, private=${body.private}, source_id=${body.source_id}`,
    );
    this.logger.debug(
      `[CW-WEBHOOK] conversation.id=${body.conversation?.id}, meta.sender.identifier=${body.conversation?.meta?.sender?.identifier}, meta.sender.phone=${body.conversation?.meta?.sender?.phone_number}`,
    );
    this.logger.debug(`[CW-WEBHOOK] content="${body.content?.slice(0, 100)}"`);
    this.logger.debug(
      `[CW-WEBHOOK] content_attributes=${JSON.stringify(body.content_attributes)}`,
    );

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
    this.logger.debug(`[CW-WEBHOOK] extractChatId result: "${chatId}"`);
    if (!chatId) {
      this.logger.warn(`[CW-WEBHOOK] Could not extract chatId from payload`);
      return { status: 'error', reason: 'Could not determine chat ID' };
    }

    let remoteJid = this.formatRemoteJid(chatId);
    this.logger.debug(
      `[CW-WEBHOOK] formatRemoteJid: "${chatId}" -> "${remoteJid}"`,
    );

    // Validate and get correct JID/LID using onWhatsApp (for non-group chats)
    if (!remoteJid.includes('@g.us')) {
      try {
        const socket = this.whatsappService.getSocket(sessionId);
        if (socket) {
          const phoneNumber = chatId
            .replace('@s.whatsapp.net', '')
            .split(':')[0];
          const results = await socket.onWhatsApp(phoneNumber);
          if (results && results.length > 0 && results[0].exists) {
            // Prefer LID if available, otherwise use JID
            const validJid = results[0].lid || results[0].jid;
            this.logger.debug(
              `[CW-WEBHOOK] onWhatsApp validated: "${phoneNumber}" -> jid="${results[0].jid}", lid="${results[0].lid}", using="${validJid}"`,
            );
            remoteJid = validJid;
          } else {
            this.logger.warn(
              `[CW-WEBHOOK] Number not found on WhatsApp: ${phoneNumber}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `[CW-WEBHOOK] onWhatsApp error: ${(error as Error).message}`,
        );
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
        let quoted:
          | {
              id: string;
              remoteJid: string;
              fromMe: boolean;
              participant?: string;
            }
          | undefined;

        const replyToId =
          body.content_attributes?.in_reply_to_external_id ||
          body.content_attributes?.in_reply_to;

        if (replyToId) {
          this.logger.debug(
            `[CW-WEBHOOK] Reply detected, looking for message: ${replyToId}`,
          );

          // Try to find the original message
          let originalMessage: {
            messageId: string;
            remoteJid: string;
            waMessageKey: {
              id: string;
              remoteJid: string;
              fromMe: boolean;
              participant?: string;
            } | null;
          } | null = null;

          if (body.content_attributes?.in_reply_to_external_id) {
            // External ID is the WhatsApp message ID
            originalMessage = await this.persistenceService.findMessageByWAId(
              sessionId,
              body.content_attributes.in_reply_to_external_id,
            );
          } else if (body.content_attributes?.in_reply_to) {
            // in_reply_to is Chatwoot message ID
            originalMessage =
              await this.persistenceService.findMessageByChatwootId(
                sessionId,
                body.content_attributes.in_reply_to,
              );
          }

          if (originalMessage?.waMessageKey) {
            quoted = originalMessage.waMessageKey;
            this.logger.debug(
              `[CW-WEBHOOK] Found original message for reply: ${JSON.stringify(quoted)}`,
            );
          } else {
            this.logger.warn(
              `[CW-WEBHOOK] Could not find original message for reply: ${replyToId}`,
            );
          }
        }

        await this.messagesService.sendTextMessage(sessionId, {
          to: remoteJid,
          text: body.content,
          quoted,
        });
      }

      this.logger.log(`Chatwoot message sent to ${remoteJid}`);
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
}
