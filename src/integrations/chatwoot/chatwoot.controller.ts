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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatwootConfigService } from './services';
import { ChatwootEventHandler } from './chatwoot-event.handler';
import { ChatwootWebhookHandler } from './handlers';
import {
  SetChatwootConfigDto,
  ChatwootConfigResponseDto,
  ChatwootNotConfiguredResponseDto,
  ChatwootDeleteResponseDto,
  ChatwootWebhookResponseDto,
  ZpwootEventResponseDto,
  ChatwootWebhookPayloadDto,
  ZpwootEventPayloadDto,
} from './dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Controller for Chatwoot integration
 *
 * Handles configuration management and webhook endpoints for
 * bidirectional communication between WhatsApp and Chatwoot.
 */
@ApiTags('Chatwoot')
@Controller()
export class ChatwootController {
  private readonly logger = new Logger(ChatwootController.name);

  constructor(
    private readonly configService: ChatwootConfigService,
    private readonly eventHandler: ChatwootEventHandler,
    private readonly webhookHandler: ChatwootWebhookHandler,
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
    // Handle message_updated (delete) event - Following Evolution API pattern
    if (body.event === 'message_updated' && body.content_attributes?.deleted) {
      return this.handleChatwootMessageDelete(sessionId, body);
    }

    // Only process message_created events for sending messages
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

    let remoteJid = formatRemoteJid(chatId);

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
      // Get quoted message for reply support (used for both attachments and text)
      const quoted = await this.getQuotedMessage(sessionId, body);

      // Handle attachments first
      if (body.attachments && body.attachments.length > 0) {
        for (const attachment of body.attachments) {
          const result = await this.sendAttachment(
            sessionId,
            remoteJid,
            attachment,
            body.content,
            quoted,
          );
          // Link WA message ID to Chatwoot message ID for reply tracking
          if (result?.id && body.id && body.conversation?.id) {
            await this.persistenceService.updateMessageChatwoot(
              sessionId,
              result.id,
              {
                cwMessageId: body.id,
                cwConversationId: body.conversation.id,
              },
            );
          }
        }
        // If there's text content without being part of attachment caption, send it separately
        if (body.content && body.attachments.length === 1) {
          // Content was likely included as caption, skip
          return { status: 'sent', type: 'media', chatId: remoteJid };
        }
      }

      // Send text message
      if (body.content) {
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
              cwMessageId: body.id,
              cwConversationId: body.conversation.id,
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

  /**
   * Handle message deletion from Chatwoot
   * Following Evolution API pattern: find WA message by chatwootMessageId and delete it
   */
  private async handleChatwootMessageDelete(
    sessionId: string,
    body: ChatwootWebhookPayload,
  ): Promise<{ status: string; reason?: string }> {
    if (!body.id) {
      return { status: 'error', reason: 'No message ID in payload' };
    }

    try {
      // Find the WhatsApp message by Chatwoot message ID
      const message = await this.persistenceService.findMessageByChatwootId(
        sessionId,
        body.id,
      );

      if (!message?.waMessageKey) {
        this.logger.warn(
          `[CW] Message not found for delete: chatwootId=${body.id}`,
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

      this.logger.log(`[CW] Message deleted on WhatsApp: ${key.id}`);
      return { status: 'deleted', reason: 'Message deleted on WhatsApp' };
    } catch (error) {
      this.logger.error(
        `[CW] Error deleting message: ${(error as Error).message}`,
      );
      return { status: 'error', reason: (error as Error).message };
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
    quoted?: {
      key: {
        remoteJid: string;
        fromMe: boolean;
        id: string;
        participant?: string;
      };
      message?: Record<string, unknown>;
    },
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
        return await this.messagesService.sendImageMessage(sessionId, {
          to: remoteJid,
          image: mediaData,
          caption,
          quoted,
        });
      case 'video':
        return await this.messagesService.sendVideoMessage(sessionId, {
          to: remoteJid,
          video: mediaData,
          caption,
          quoted,
        });
      case 'audio':
        // AudioService will convert to OGG/OPUS automatically (encoding=true by default)
        return await this.messagesService.sendAudioMessage(sessionId, {
          to: remoteJid,
          audio: mediaData,
          quoted,
        });
      case 'file':
      default:
        return await this.messagesService.sendDocumentMessage(sessionId, {
          to: remoteJid,
          document: mediaData,
          mimetype: getMimeType(file_type, file_name),
          fileName: file_name || 'document',
          quoted,
        });
    }
  }

  /**
   * Gets the quoted message for reply support
   * Following Evolution API pattern: looks up message by in_reply_to or in_reply_to_external_id
   */
  private async getQuotedMessage(
    sessionId: string,
    body: ChatwootWebhookPayload,
  ): Promise<
    | {
        key: {
          remoteJid: string;
          fromMe: boolean;
          id: string;
          participant?: string;
        };
        message?: Record<string, unknown>;
      }
    | undefined
  > {
    const replyToId =
      body.content_attributes?.in_reply_to_external_id ||
      body.content_attributes?.in_reply_to;

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

    if (body.content_attributes?.in_reply_to_external_id) {
      originalMessage = await this.persistenceService.findMessageByWAId(
        sessionId,
        body.content_attributes.in_reply_to_external_id,
      );
    } else if (body.content_attributes?.in_reply_to) {
      originalMessage = await this.persistenceService.findMessageByChatwootId(
        sessionId,
        body.content_attributes.in_reply_to,
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

    this.logger.warn(`[CW] Original message not found for reply: ${replyToId}`);
    return undefined;
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
