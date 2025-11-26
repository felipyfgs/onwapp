import { Injectable, Logger } from '@nestjs/common';
import { Chatwoot } from '@prisma/client';
import {
  ChatwootConfigService,
  ChatwootContactService,
  ChatwootConversationService,
  ChatwootMessageService,
} from './services';
import { SetChatwootConfigDto } from './dto';
import {
  ChatwootContact,
  ChatwootInbox,
  CreateContactParams,
  CreateConversationParams,
  CreateMessageParams,
  CreateMessageWithAttachmentParams,
  WAMessageContent,
} from './interfaces';

/**
 * Facade service for Chatwoot integration
 *
 * This service provides a unified interface for backward compatibility.
 * For new code, prefer using the focused services directly:
 * - ChatwootConfigService
 * - ChatwootContactService
 * - ChatwootConversationService
 * - ChatwootMessageService
 *
 * @deprecated Use focused services directly for better separation of concerns
 */
@Injectable()
export class ChatwootService {
  private readonly logger = new Logger(ChatwootService.name);

  constructor(
    private readonly configService: ChatwootConfigService,
    private readonly contactService: ChatwootContactService,
    private readonly conversationService: ChatwootConversationService,
    private readonly messageService: ChatwootMessageService,
  ) {}

  // ==================== Configuration Methods ====================

  async create(sessionId: string, dto: SetChatwootConfigDto) {
    return this.configService.upsertConfig(sessionId, dto);
  }

  async find(sessionId: string) {
    return this.configService.findConfig(sessionId);
  }

  async delete(sessionId: string) {
    return this.configService.deleteConfig(sessionId);
  }

  async getConfig(sessionId: string): Promise<Chatwoot | null> {
    return this.configService.getConfig(sessionId);
  }

  async getInbox(sessionId: string): Promise<ChatwootInbox | null> {
    return this.configService.getInbox(sessionId);
  }

  async getOrCreateInbox(
    sessionId: string,
    webhookUrl?: string,
  ): Promise<ChatwootInbox | null> {
    return this.configService.getOrCreateInbox(sessionId, webhookUrl);
  }

  // ==================== Contact Methods ====================

  async findContact(
    sessionId: string,
    phoneNumber: string,
  ): Promise<ChatwootContact | null> {
    return this.contactService.findContact(sessionId, phoneNumber);
  }

  async createContact(
    sessionId: string,
    params: CreateContactParams,
  ): Promise<ChatwootContact | null> {
    return this.contactService.createContact(sessionId, params);
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
    return this.contactService.updateContact(sessionId, contactId, data);
  }

  // ==================== Conversation Methods ====================

  async createConversation(
    sessionId: string,
    params: CreateConversationParams,
  ): Promise<number | null> {
    return this.conversationService.getOrCreateConversation(sessionId, params);
  }

  // ==================== Message Methods ====================

  async createMessage(
    sessionId: string,
    conversationId: number,
    params: CreateMessageParams,
  ) {
    return this.messageService.createMessage(sessionId, conversationId, params);
  }

  async createMessageWithAttachment(
    sessionId: string,
    conversationId: number,
    params: CreateMessageWithAttachmentParams,
  ) {
    return this.messageService.createMessageWithAttachment(
      sessionId,
      conversationId,
      params,
    );
  }

  async deleteMessage(
    sessionId: string,
    conversationId: number,
    messageId: number,
  ) {
    return this.messageService.deleteMessage(
      sessionId,
      conversationId,
      messageId,
    );
  }

  // ==================== Message Utility Methods ====================

  formatMessageContent(
    content: string,
    signMsg: boolean,
    signDelimiter?: string,
    senderName?: string,
  ): string {
    return this.messageService.formatMessageContent(
      content,
      signMsg,
      signDelimiter,
      senderName,
    );
  }

  getMessageContent(message: WAMessageContent | null): string | null {
    return this.messageService.getMessageContent(message);
  }

  isMediaMessage(message: WAMessageContent | null): boolean {
    return this.messageService.isMediaMessage(message);
  }

  getMediaType(message: WAMessageContent | null): string | null {
    return this.messageService.getMediaType(message);
  }
}
