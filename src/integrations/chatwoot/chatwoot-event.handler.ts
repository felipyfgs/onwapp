import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  ChatwootConfigService,
  ChatwootContactService,
  ChatwootConversationService,
  ChatwootMessageService,
} from './services';
import { ChatwootRepository } from './chatwoot.repository';
import {
  ZpwootWebhookPayload,
  ZpwootMessageEvent,
  WAMessageContent,
  EventHandlingResult,
} from './interfaces';
import { ZPWOOT_EVENTS } from './constants';
import {
  getMediaExtension,
  extractMediaUrl,
  isGroupJid,
  extractPhoneFromJid,
} from '../../common/utils';

/**
 * Handler for WhatsApp events forwarded to Chatwoot
 *
 * Processes incoming WhatsApp messages and forwards them to Chatwoot.
 */
@Injectable()
export class ChatwootEventHandler {
  private readonly logger = new Logger(ChatwootEventHandler.name);

  constructor(
    private readonly configService: ChatwootConfigService,
    private readonly contactService: ChatwootContactService,
    private readonly conversationService: ChatwootConversationService,
    private readonly messageService: ChatwootMessageService,
    private readonly chatwootRepository: ChatwootRepository,
  ) {}

  /**
   * Handle incoming webhook event from zpwoot
   */
  async handleWebhookEvent(
    payload: ZpwootWebhookPayload,
  ): Promise<EventHandlingResult> {
    const { sessionId, event, data } = payload;

    const config = await this.chatwootRepository.findBySessionId(sessionId);
    if (!config?.enabled) {
      return { processed: false, reason: 'Chatwoot not enabled for session' };
    }

    switch (event) {
      case ZPWOOT_EVENTS.MESSAGES_UPSERT:
        return this.handleMessagesUpsert(sessionId, data, config);
      default:
        return { processed: false, reason: `Event ${event} not handled` };
    }
  }

  /**
   * Handle messages.upsert event
   */
  private async handleMessagesUpsert(
    sessionId: string,
    data: { messages?: ZpwootMessageEvent[]; type?: string },
    config: {
      ignoreJids: string[];
      signMsg: boolean;
      signDelimiter: string | null;
    },
  ): Promise<EventHandlingResult> {
    const messages = data.messages || [];

    if (messages.length === 0) {
      return { processed: false, reason: 'No messages in payload' };
    }

    let processedCount = 0;

    for (const msg of messages) {
      try {
        await this.processMessage(sessionId, msg, config);
        processedCount++;
      } catch (error) {
        this.logger.error(
          `[${sessionId}] Error processing message ${msg.key.id}: ${(error as Error).message}`,
        );
      }
    }

    return {
      processed: processedCount > 0,
      reason: `Processed ${processedCount}/${messages.length} messages`,
    };
  }

  /**
   * Process a single WhatsApp message and forward to Chatwoot
   */
  private async processMessage(
    sessionId: string,
    msg: ZpwootMessageEvent,
    config: {
      ignoreJids: string[];
      signMsg: boolean;
      signDelimiter: string | null;
    },
  ): Promise<void> {
    const { key, message, pushName } = msg;
    const { remoteJid, fromMe, participant } = key;

    if (!remoteJid || !key.id) return;

    // Check ignored JIDs
    if (config.ignoreJids?.includes(remoteJid)) {
      this.logger.debug(`[${sessionId}] Ignoring JID: ${remoteJid}`);
      return;
    }

    // Skip status broadcasts
    if (remoteJid === 'status@broadcast') return;

    const isGroup = isGroupJid(remoteJid);
    const phoneNumber = isGroup ? remoteJid : extractPhoneFromJid(remoteJid);

    // Get or create inbox
    const inbox = await this.configService.getInbox(sessionId);
    if (!inbox) {
      this.logger.warn(`[${sessionId}] Chatwoot inbox not found`);
      return;
    }

    // Find or create contact
    let contact = await this.contactService.findContact(sessionId, remoteJid);
    if (!contact) {
      const contactName = pushName || phoneNumber;
      contact = await this.contactService.createContact(sessionId, {
        phoneNumber,
        inboxId: inbox.id,
        isGroup,
        name: contactName,
        identifier: remoteJid,
      });

      if (!contact) {
        this.logger.error(`[${sessionId}] Failed to create contact`);
        return;
      }
    }

    // Get or create conversation
    const conversationId = await this.conversationService.getOrCreateConversation(
      sessionId,
      { contactId: contact.id, inboxId: inbox.id },
    );

    if (!conversationId) {
      this.logger.error(`[${sessionId}] Failed to create conversation`);
      return;
    }

    // Get message content
    const messageContent = this.messageService.getMessageContent(
      message as WAMessageContent,
    );
    if (!messageContent) {
      this.logger.debug(`[${sessionId}] No message content to forward`);
      return;
    }

    // Format content with sender info for groups
    let finalContent = messageContent;
    if (isGroup && config.signMsg) {
      const participantJid = participant || remoteJid;
      const participantPhone = participantJid
        .replace('@s.whatsapp.net', '')
        .split(':')[0];
      const senderName = pushName || participantPhone;
      finalContent = this.messageService.formatMessageContent(
        messageContent,
        true,
        config.signDelimiter || '\n',
        senderName,
      );
    }

    // Check for media
    const isMedia = this.messageService.isMediaMessage(
      message as WAMessageContent,
    );

    if (isMedia && message) {
      await this.handleMediaMessage(
        sessionId,
        conversationId,
        msg,
        finalContent,
        messageContent,
        fromMe,
      );
    } else {
      await this.messageService.createMessage(sessionId, conversationId, {
        content: finalContent,
        messageType: fromMe ? 'outgoing' : 'incoming',
        sourceId: key.id,
      });
    }

    this.logger.debug(
      `[${sessionId}] Message forwarded to Chatwoot conversation ${conversationId}`,
    );
  }

  /**
   * Handle media messages (images, videos, documents, etc.)
   */
  private async handleMediaMessage(
    sessionId: string,
    conversationId: number,
    msg: ZpwootMessageEvent,
    finalContent: string,
    messageContent: string,
    fromMe?: boolean,
  ): Promise<void> {
    const mediaType = this.messageService.getMediaType(
      msg.message as WAMessageContent,
    );

    // Try to get media URL if available in message metadata
    const mediaUrl = extractMediaUrl(msg.message);

    if (mediaUrl) {
      try {
        const response = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
        });
        const buffer = Buffer.from(response.data);
        const extension = getMediaExtension(msg.message);
        const filename = `${mediaType}_${Date.now()}.${extension}`;

        await this.messageService.createMessageWithAttachment(
          sessionId,
          conversationId,
          {
            content: finalContent !== messageContent ? finalContent : undefined,
            messageType: fromMe ? 'outgoing' : 'incoming',
            sourceId: msg.key.id,
            file: { buffer, filename },
          },
        );
        return;
      } catch (error) {
        this.logger.warn(
          `[${sessionId}] Could not download media: ${(error as Error).message}`,
        );
      }
    }

    // Fallback: send text with media indicator
    await this.messageService.createMessage(sessionId, conversationId, {
      content: finalContent,
      messageType: fromMe ? 'outgoing' : 'incoming',
      sourceId: msg.key.id,
    });
  }
}
