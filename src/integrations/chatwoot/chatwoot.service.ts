import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatwootRepository } from './chatwoot.repository';
import {
  ChatwootClient,
  ChatwootContact,
  ChatwootInbox,
} from './chatwoot.client';
import { ChatwootDto } from './dto/chatwoot.dto';
import { Chatwoot } from '@prisma/client';

interface FilterPayloadItem {
  attribute_key: string;
  filter_operator: string;
  values: string[];
  query_operator: string | null;
}

interface WAMessage {
  conversation?: string;
  extendedTextMessage?: { text: string };
  imageMessage?: { caption?: string };
  videoMessage?: { caption?: string };
  audioMessage?: Record<string, unknown>;
  documentMessage?: { fileName?: string };
  stickerMessage?: Record<string, unknown>;
  contactMessage?: Record<string, unknown>;
  locationMessage?: Record<string, unknown>;
  liveLocationMessage?: Record<string, unknown>;
  listMessage?: Record<string, unknown>;
  listResponseMessage?: Record<string, unknown>;
  buttonsResponseMessage?: Record<string, unknown>;
  templateButtonReplyMessage?: Record<string, unknown>;
  reactionMessage?: { text?: string };
}

@Injectable()
export class ChatwootService {
  private readonly logger = new Logger(ChatwootService.name);
  private clients: Map<string, ChatwootClient> = new Map();

  constructor(
    private readonly repository: ChatwootRepository,
    private readonly configService: ConfigService,
  ) {}

  private getClient(config: Chatwoot): ChatwootClient | null {
    if (!config.enabled || !config.url || !config.accountId || !config.token) {
      return null;
    }

    const key = `${config.sessionId}`;
    if (!this.clients.has(key)) {
      this.clients.set(
        key,
        new ChatwootClient({
          url: config.url,
          accountId: config.accountId,
          token: config.token,
        }),
      );
    }
    return this.clients.get(key)!;
  }

  async create(sessionId: string, dto: ChatwootDto) {
    const result = await this.repository.upsert(sessionId, dto);

    if (dto.enabled && dto.url && dto.accountId && dto.token) {
      this.clients.delete(sessionId);
    }

    const serverUrl =
      this.configService.get<string>('SERVER_URL') ||
      `http://localhost:${this.configService.get<number>('PORT') || 3000}`;

    const webhookUrl = `${serverUrl}/chatwoot/webhook/${sessionId}`;

    // Auto-create inbox if enabled
    if (dto.enabled && dto.nameInbox) {
      try {
        const inbox = await this.getOrCreateInbox(sessionId, webhookUrl);
        if (inbox) {
          this.logger.log(`Inbox "${inbox.name}" ready (id: ${inbox.id})`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to create inbox: ${(error as Error).message}`,
        );
      }
    }

    return {
      ...result,
      webhookUrl,
    };
  }

  async find(sessionId: string) {
    const config = await this.repository.findBySessionId(sessionId);
    if (!config) {
      return null;
    }

    const serverUrl =
      this.configService.get<string>('SERVER_URL') ||
      `http://localhost:${this.configService.get<number>('PORT') || 3000}`;

    return {
      ...config,
      webhookUrl: `${serverUrl}/chatwoot/webhook/${sessionId}`,
    };
  }

  async delete(sessionId: string) {
    this.clients.delete(sessionId);
    return this.repository.delete(sessionId);
  }

  async getConfig(sessionId: string): Promise<Chatwoot | null> {
    return this.repository.findBySessionId(sessionId);
  }

  async getInbox(sessionId: string): Promise<ChatwootInbox | null> {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClient(config);
    if (!client) return null;

    try {
      const inboxes = await client.listInboxes();
      return (
        inboxes.payload.find((inbox) => inbox.name === config.nameInbox) || null
      );
    } catch (error) {
      this.logger.error(`Error getting inbox: ${(error as Error).message}`);
      return null;
    }
  }

  async getOrCreateInbox(
    sessionId: string,
    webhookUrl: string,
  ): Promise<ChatwootInbox | null> {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClient(config);
    if (!client) return null;

    try {
      // First, try to find existing inbox
      const inboxes = await client.listInboxes();
      let inbox = inboxes.payload.find(
        (inbox) => inbox.name === config.nameInbox,
      );

      if (inbox) {
        // Update webhook URL if needed
        if (inbox.webhook_url !== webhookUrl) {
          inbox = await client.updateInbox(inbox.id, {
            webhook_url: webhookUrl,
          });
          this.logger.log(`Inbox webhook URL updated: ${webhookUrl}`);
        }
        return inbox;
      }

      // Create new inbox
      this.logger.log(`Creating new inbox: ${config.nameInbox}`);
      inbox = await client.createApiInbox({
        name: config.nameInbox || `WhatsApp ${sessionId.slice(0, 8)}`,
        webhook_url: webhookUrl,
      });

      return inbox;
    } catch (error) {
      this.logger.error(`Error creating inbox: ${(error as Error).message}`);
      return null;
    }
  }

  async findContact(
    sessionId: string,
    phoneNumber: string,
  ): Promise<ChatwootContact | null> {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClient(config);
    if (!client) return null;

    try {
      const isGroup = phoneNumber.includes('@g.us');
      const query = isGroup
        ? phoneNumber
        : `+${phoneNumber.replace('@s.whatsapp.net', '').split(':')[0]}`;

      if (isGroup) {
        const result = await client.searchContacts(query);
        return result.payload.find((c) => c.identifier === phoneNumber) || null;
      }

      const filterPayload = this.buildPhoneFilterPayload(query);
      const result = await client.filterContacts(filterPayload);

      if (result.payload.length === 0) return null;
      if (result.payload.length === 1) return result.payload[0];

      return this.findBestMatchingContact(
        result.payload,
        query,
        config.mergeBrazilContacts,
      );
    } catch (error) {
      this.logger.error(`Error finding contact: ${error.message}`);
      return null;
    }
  }

  private buildPhoneFilterPayload(query: string): FilterPayloadItem[] {
    const numbers = this.getPhoneVariations(query);
    return numbers.map((number, index) => ({
      attribute_key: 'phone_number',
      filter_operator: 'equal_to',
      values: [number.replace('+', '')],
      query_operator: index === numbers.length - 1 ? null : 'OR',
    }));
  }

  private getPhoneVariations(phone: string): string[] {
    const numbers = [phone];
    if (phone.startsWith('+55') && phone.length === 14) {
      numbers.push(phone.slice(0, 5) + phone.slice(6));
    } else if (phone.startsWith('+55') && phone.length === 13) {
      numbers.push(phone.slice(0, 5) + '9' + phone.slice(5));
    }
    return numbers;
  }

  private findBestMatchingContact(
    contacts: ChatwootContact[],
    query: string,
    mergeBrazilContacts: boolean,
  ): ChatwootContact | null {
    const phoneVariations = this.getPhoneVariations(query);

    if (
      contacts.length === 2 &&
      mergeBrazilContacts &&
      query.startsWith('+55')
    ) {
      const contact = contacts.find((c) => c.phone_number?.length === 14);
      if (contact) return contact;
    }

    for (const contact of contacts) {
      if (phoneVariations.includes(contact.phone_number || '')) {
        return contact;
      }
    }

    return contacts[0];
  }

  async createContact(
    sessionId: string,
    params: {
      phoneNumber: string;
      inboxId: number;
      isGroup: boolean;
      name?: string;
      avatarUrl?: string;
      identifier?: string;
    },
  ): Promise<ChatwootContact | null> {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClient(config);
    if (!client) return null;

    try {
      const contactData: {
        inbox_id: number;
        name: string;
        identifier: string;
        phone_number?: string;
        avatar_url?: string;
      } = {
        inbox_id: params.inboxId,
        name: params.name || params.phoneNumber,
        identifier: params.identifier || params.phoneNumber,
      };

      if (!params.isGroup) {
        contactData.phone_number = `+${params.phoneNumber}`;
      }

      if (params.avatarUrl) {
        contactData.avatar_url = params.avatarUrl;
      }

      const result = await client.createContact(contactData);
      return result.payload?.contact || null;
    } catch (error) {
      this.logger.error(`Error creating contact: ${error.message}`);
      return null;
    }
  }

  async updateContact(
    sessionId: string,
    contactId: number,
    data: Partial<{
      name: string;
      avatar_url: string;
      identifier: string;
    }>,
  ): Promise<ChatwootContact | null> {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClient(config);
    if (!client) return null;

    try {
      return await client.updateContact(contactId, data);
    } catch (error) {
      this.logger.error(`Error updating contact: ${error.message}`);
      return null;
    }
  }

  async createConversation(
    sessionId: string,
    params: {
      contactId: number;
      inboxId: number;
      status?: 'open' | 'pending';
    },
  ): Promise<number | null> {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClient(config);
    if (!client) return null;

    try {
      const conversations = await client.getContactConversations(
        params.contactId,
      );
      const existingConversation = conversations.payload.find(
        (conv) =>
          conv.inbox_id === params.inboxId &&
          (config.reopenConversation || conv.status !== 'resolved'),
      );

      if (existingConversation) {
        if (
          config.conversationPending &&
          existingConversation.status !== 'open'
        ) {
          await client.toggleConversationStatus(
            existingConversation.id,
            'pending',
          );
        }
        return existingConversation.id;
      }

      const conversation = await client.createConversation({
        inbox_id: params.inboxId,
        contact_id: params.contactId,
        status: config.conversationPending ? 'pending' : 'open',
      });

      return conversation.id;
    } catch (error) {
      this.logger.error(`Error creating conversation: ${error.message}`);
      return null;
    }
  }

  async createMessage(
    sessionId: string,
    conversationId: number,
    params: {
      content: string;
      messageType: 'incoming' | 'outgoing';
      private?: boolean;
      sourceId?: string;
    },
  ) {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClient(config);
    if (!client) return null;

    try {
      return await client.createMessage(conversationId, {
        content: params.content,
        message_type: params.messageType,
        private: params.private,
        source_id: params.sourceId,
      });
    } catch (error) {
      this.logger.error(`Error creating message: ${error.message}`);
      return null;
    }
  }

  async createMessageWithAttachment(
    sessionId: string,
    conversationId: number,
    params: {
      content?: string;
      messageType: 'incoming' | 'outgoing';
      sourceId?: string;
      file: {
        buffer: Buffer;
        filename: string;
      };
    },
  ) {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClient(config);
    if (!client) return null;

    try {
      return await client.createMessageWithAttachments(conversationId, {
        content: params.content,
        message_type: params.messageType,
        source_id: params.sourceId,
        attachments: [
          {
            content: params.file.buffer,
            filename: params.file.filename,
          },
        ],
      });
    } catch (error) {
      this.logger.error(
        `Error creating message with attachment: ${error.message}`,
      );
      return null;
    }
  }

  async deleteMessage(
    sessionId: string,
    conversationId: number,
    messageId: number,
  ) {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClient(config);
    if (!client) return null;

    try {
      await client.deleteMessage(conversationId, messageId);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting message: ${error.message}`);
      return false;
    }
  }

  formatMessageContent(
    content: string,
    signMsg: boolean,
    signDelimiter?: string,
    senderName?: string,
  ): string {
    if (!signMsg || !senderName) {
      return content;
    }
    const delimiter = signDelimiter || '\n';
    return `**${senderName}**${delimiter}${content}`;
  }

  getMessageContent(message: WAMessage | null): string | null {
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
    if (message.reactionMessage) return message.reactionMessage.text || null;

    return null;
  }

  isMediaMessage(message: WAMessage | null): boolean {
    if (!message) return false;
    return !!(
      message.imageMessage ||
      message.videoMessage ||
      message.audioMessage ||
      message.documentMessage ||
      message.stickerMessage
    );
  }

  getMediaType(message: WAMessage | null): string | null {
    if (!message) return null;
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.stickerMessage) return 'sticker';
    return null;
  }
}
