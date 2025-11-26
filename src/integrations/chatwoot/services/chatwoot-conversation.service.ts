import { Injectable, Logger } from '@nestjs/common';
import { ChatwootConfigService } from './chatwoot-config.service';
import { CreateConversationParams } from '../interfaces';

/**
 * Service responsible for Chatwoot conversation operations
 *
 * Handles conversation creation, status management, and retrieval.
 */
@Injectable()
export class ChatwootConversationService {
  private readonly logger = new Logger(ChatwootConversationService.name);

  constructor(private readonly configService: ChatwootConfigService) {}

  /**
   * Get or create a conversation for a contact
   *
   * If a conversation already exists for the contact in the inbox,
   * it will be reused based on configuration settings.
   */
  async getOrCreateConversation(
    sessionId: string,
    params: CreateConversationParams,
  ): Promise<number | null> {
    const config = await this.configService.getConfig(sessionId);
    if (!config) return null;

    const client = this.configService.getClientForConfig(config);
    if (!client) return null;

    try {
      // Get existing conversations for the contact
      const conversations = await client.getContactConversations(
        params.contactId,
      );

      // For groups, always reopen conversations (single conversation per group)
      // For individual chats, respect reopenConversation config
      const shouldReopen = params.isGroup || config.reopen;

      // Find existing conversation in the same inbox
      const existingConversation = conversations.payload.find(
        (conv) =>
          conv.inbox_id === params.inboxId &&
          (shouldReopen || conv.status !== 'resolved'),
      );

      if (existingConversation) {
        // Reopen resolved conversation if needed
        if (shouldReopen && existingConversation.status === 'resolved') {
          const newStatus = config.pending ? 'pending' : 'open';
          await client.toggleConversationStatus(
            existingConversation.id,
            newStatus,
          );
          this.logger.debug(
            `Reopened conversation ${existingConversation.id} to ${newStatus} for session ${sessionId}`,
          );
        }
        // Update status to pending if configured and conversation is not open
        else if (config.pending && existingConversation.status !== 'open') {
          await client.toggleConversationStatus(
            existingConversation.id,
            'pending',
          );
          this.logger.debug(
            `Set conversation ${existingConversation.id} to pending for session ${sessionId}`,
          );
        }
        return existingConversation.id;
      }

      // Create new conversation
      const conversation = await client.createConversation({
        inbox_id: params.inboxId,
        contact_id: params.contactId,
        status: config.pending ? 'pending' : 'open',
      });

      this.logger.debug(
        `Created conversation ${conversation.id} for session ${sessionId}`,
      );
      return conversation.id;
    } catch (error) {
      this.logger.error(
        `Error creating conversation for session ${sessionId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Update conversation status
   */
  async updateStatus(
    sessionId: string,
    conversationId: number,
    status: 'open' | 'resolved' | 'pending',
  ): Promise<boolean> {
    const client = await this.configService.getClient(sessionId);
    if (!client) return false;

    try {
      await client.toggleConversationStatus(conversationId, status);
      this.logger.debug(
        `Updated conversation ${conversationId} status to ${status} for session ${sessionId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error updating conversation status for session ${sessionId}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Get conversation details
   */
  async getConversation(sessionId: string, conversationId: number) {
    const client = await this.configService.getClient(sessionId);
    if (!client) return null;

    try {
      return await client.getConversation(conversationId);
    } catch (error) {
      this.logger.error(
        `Error getting conversation ${conversationId} for session ${sessionId}: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
