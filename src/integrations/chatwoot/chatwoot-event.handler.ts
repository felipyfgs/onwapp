import { Injectable, Logger } from '@nestjs/common';
import { ChatwootService } from './chatwoot.service';
import { ChatwootRepository } from './chatwoot.repository';
import axios from 'axios';
import { WAMessageKey } from '../../common/interfaces';
import {
  getMediaExtension,
  extractMediaUrl,
  isGroupJid,
  extractPhoneFromJid,
} from '../../common/utils';

interface WAMessageEvent {
  key: WAMessageKey & { fromMe?: boolean };
  message?: Record<string, unknown>;
  pushName?: string;
  messageTimestamp?: number;
}

interface WebhookPayload {
  sessionId: string;
  event: string;
  timestamp: string;
  data: {
    messages?: WAMessageEvent[];
    type?: string;
  };
}

@Injectable()
export class ChatwootEventHandler {
  private readonly logger = new Logger(ChatwootEventHandler.name);

  constructor(
    private readonly chatwootService: ChatwootService,
    private readonly chatwootRepository: ChatwootRepository,
  ) {}

  async handleWebhookEvent(
    payload: WebhookPayload,
  ): Promise<{ processed: boolean; reason?: string }> {
    const { sessionId, event, data } = payload;

    const config = await this.chatwootRepository.findBySessionId(sessionId);
    if (!config?.enabled) {
      return { processed: false, reason: 'Chatwoot not enabled for session' };
    }

    switch (event) {
      case 'messages.upsert':
        return this.handleMessagesUpsert(sessionId, data, config);
      default:
        return { processed: false, reason: `Event ${event} not handled` };
    }
  }

  private async handleMessagesUpsert(
    sessionId: string,
    data: { messages?: WAMessageEvent[]; type?: string },
    config: {
      ignoreJids: string[];
      signMsg: boolean;
      signDelimiter: string | null;
    },
  ): Promise<{ processed: boolean; reason?: string }> {
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
          `Error processing message ${msg.key.id}: ${(error as Error).message}`,
        );
      }
    }

    return {
      processed: processedCount > 0,
      reason: `Processed ${processedCount}/${messages.length} messages`,
    };
  }

  private async processMessage(
    sessionId: string,
    msg: WAMessageEvent,
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
    const inbox = await this.chatwootService.getInbox(sessionId);
    if (!inbox) {
      this.logger.warn(`[${sessionId}] Chatwoot inbox not found`);
      return;
    }

    // Find or create contact
    let contact = await this.chatwootService.findContact(sessionId, remoteJid);
    if (!contact) {
      const contactName = pushName || phoneNumber;
      contact = await this.chatwootService.createContact(sessionId, {
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
    const conversationId = await this.chatwootService.createConversation(
      sessionId,
      { contactId: contact.id, inboxId: inbox.id },
    );

    if (!conversationId) {
      this.logger.error(`[${sessionId}] Failed to create conversation`);
      return;
    }

    // Get message content
    const messageContent = this.chatwootService.getMessageContent(
      message as Parameters<typeof this.chatwootService.getMessageContent>[0],
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
      finalContent = this.chatwootService.formatMessageContent(
        messageContent,
        true,
        config.signDelimiter || '\n',
        senderName,
      );
    }

    // Check for media
    const isMedia = this.chatwootService.isMediaMessage(
      message as Parameters<typeof this.chatwootService.isMediaMessage>[0],
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
      await this.chatwootService.createMessage(sessionId, conversationId, {
        content: finalContent,
        messageType: fromMe ? 'outgoing' : 'incoming',
        sourceId: key.id,
      });
    }

    this.logger.debug(
      `[${sessionId}] Message forwarded to Chatwoot conversation ${conversationId}`,
    );
  }

  private async handleMediaMessage(
    sessionId: string,
    conversationId: number,
    msg: WAMessageEvent,
    finalContent: string,
    messageContent: string,
    fromMe?: boolean,
  ): Promise<void> {
    // For media, we need to download from WhatsApp first
    // This requires the media URL from the message
    // For now, send text placeholder with media type
    const mediaType = this.chatwootService.getMediaType(
      msg.message as Parameters<typeof this.chatwootService.getMediaType>[0],
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

        await this.chatwootService.createMessageWithAttachment(
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
    await this.chatwootService.createMessage(sessionId, conversationId, {
      content: finalContent,
      messageType: fromMe ? 'outgoing' : 'incoming',
      sourceId: msg.key.id,
    });
  }
}
