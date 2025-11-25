import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chatwoot } from '@prisma/client';
import { ChatwootRepository } from '../chatwoot.repository';
import { ChatwootClientFactory, ChatwootClient } from '../chatwoot.client';
import { SetChatwootConfigDto } from '../dto';
import { ChatwootInbox, ChatwootClientConfig } from '../interfaces';

/**
 * Service responsible for Chatwoot configuration management
 *
 * Handles CRUD operations for Chatwoot configuration and inbox management.
 */
@Injectable()
export class ChatwootConfigService {
  private readonly logger = new Logger(ChatwootConfigService.name);

  constructor(
    private readonly repository: ChatwootRepository,
    private readonly clientFactory: ChatwootClientFactory,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get the server webhook URL for a session
   */
  getWebhookUrl(sessionId: string): string {
    const serverUrl =
      this.configService.get<string>('SERVER_URL') ||
      `http://localhost:${this.configService.get<number>('PORT') || 3000}`;
    return `${serverUrl}/chatwoot/webhook/${sessionId}`;
  }

  /**
   * Create or update Chatwoot configuration for a session
   */
  async upsertConfig(sessionId: string, dto: SetChatwootConfigDto) {
    // Clear cached client if configuration changed
    if (dto.enabled && dto.url && dto.accountId && dto.token) {
      this.clientFactory.removeClient(sessionId);
    }

    const result = await this.repository.upsert(sessionId, dto);
    const webhookUrl = this.getWebhookUrl(sessionId);

    // Auto-create inbox if enabled
    if (dto.enabled && dto.inbox) {
      try {
        const inbox = await this.getOrCreateInbox(sessionId, webhookUrl);
        if (inbox) {
          this.logger.log(
            `Inbox "${inbox.name}" ready (id: ${inbox.id}) for session: ${sessionId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to create inbox for session ${sessionId}: ${(error as Error).message}`,
        );
      }
    }

    return {
      ...result,
      webhookUrl,
    };
  }

  /**
   * Find Chatwoot configuration for a session
   */
  async findConfig(sessionId: string) {
    const config = await this.repository.findBySessionId(sessionId);
    if (!config) {
      return null;
    }

    return {
      ...config,
      webhookUrl: this.getWebhookUrl(sessionId),
    };
  }

  /**
   * Delete Chatwoot configuration for a session
   */
  async deleteConfig(sessionId: string): Promise<void> {
    this.clientFactory.removeClient(sessionId);
    await this.repository.delete(sessionId);
  }

  /**
   * Get raw configuration from database
   */
  async getConfig(sessionId: string): Promise<Chatwoot | null> {
    return this.repository.findBySessionId(sessionId);
  }

  /**
   * Get all enabled configurations
   */
  async getAllEnabled() {
    return this.repository.findAllEnabled();
  }

  /**
   * Get a Chatwoot API client for a session
   * Returns null if configuration is invalid or disabled
   */
  getClientForConfig(config: Chatwoot): ChatwootClient | null {
    if (!config.enabled || !config.url || !config.accountId || !config.token) {
      return null;
    }

    const clientConfig: ChatwootClientConfig = {
      url: config.url,
      accountId: config.accountId,
      token: config.token,
    };

    return this.clientFactory.getClient(config.sessionId, clientConfig);
  }

  /**
   * Get Chatwoot client for a session
   */
  async getClient(sessionId: string): Promise<ChatwootClient | null> {
    const config = await this.getConfig(sessionId);
    if (!config) return null;
    return this.getClientForConfig(config);
  }

  /**
   * Get inbox for a session
   */
  async getInbox(sessionId: string): Promise<ChatwootInbox | null> {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClientForConfig(config);
    if (!client) return null;

    try {
      const inboxes = await client.listInboxes();
      return (
        inboxes.payload.find((inbox) => inbox.name === config.inbox) || null
      );
    } catch (error) {
      this.logger.error(
        `Error getting inbox for session ${sessionId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Get or create inbox for a session
   */
  async getOrCreateInbox(
    sessionId: string,
    webhookUrl?: string,
  ): Promise<ChatwootInbox | null> {
    const config = await this.getConfig(sessionId);
    if (!config) return null;

    const client = this.getClientForConfig(config);
    if (!client) return null;

    const finalWebhookUrl = webhookUrl || this.getWebhookUrl(sessionId);

    try {
      // Try to find existing inbox
      const inboxes = await client.listInboxes();
      let inbox = inboxes.payload.find((i) => i.name === config.inbox);

      if (inbox) {
        // Update webhook URL if needed
        if (inbox.webhook_url !== finalWebhookUrl) {
          inbox = await client.updateInbox(inbox.id, {
            webhook_url: finalWebhookUrl,
          });
          this.logger.log(
            `Updated inbox webhook URL for session ${sessionId}: ${finalWebhookUrl}`,
          );
        }
        return inbox;
      }

      // Create new inbox
      const inboxName = config.inbox || `WhatsApp ${sessionId.slice(0, 8)}`;
      this.logger.log(
        `Creating new inbox "${inboxName}" for session ${sessionId}`,
      );

      inbox = await client.createApiInbox({
        name: inboxName,
        webhook_url: finalWebhookUrl,
      });

      return inbox;
    } catch (error) {
      this.logger.error(
        `Error creating inbox for session ${sessionId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Check if Chatwoot is enabled and properly configured for a session
   */
  async isEnabled(sessionId: string): Promise<boolean> {
    const config = await this.getConfig(sessionId);
    return !!(
      config?.enabled &&
      config.url &&
      config.accountId &&
      config.token
    );
  }
}
