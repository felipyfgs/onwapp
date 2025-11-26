import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import * as Boom from '@hapi/boom';
import {
  ChatwootClientConfig,
  ChatwootContact,
  ChatwootConversation,
  ChatwootMessage,
  ChatwootInbox,
  ContactsSearchResponse,
  ContactCreateResponse,
  ConversationsListResponse,
  InboxesListResponse,
  FilterPayloadItem,
} from './interfaces';
import { CHATWOOT_DEFAULTS } from './constants';

// Re-export interfaces for backward compatibility
export type {
  ChatwootClientConfig as ChatwootConfig,
  ChatwootContact,
  ChatwootConversation,
  ChatwootMessage,
  ChatwootInbox,
};

/**
 * Chatwoot API Client
 *
 * Handles all HTTP communication with the Chatwoot API.
 * Each instance is configured for a specific Chatwoot account.
 */
export class ChatwootClient {
  private readonly client: AxiosInstance;
  private readonly accountId: string;
  private readonly baseUrl: string;
  private readonly logger = new Logger(ChatwootClient.name);

  constructor(config: ChatwootClientConfig) {
    this.accountId = config.accountId;
    this.baseUrl = config.url;
    this.client = axios.create({
      baseURL: `${config.url}/api/v1/accounts/${config.accountId}`,
      headers: {
        'Content-Type': 'application/json',
        api_access_token: config.token,
      },
      timeout: CHATWOOT_DEFAULTS.HTTP_TIMEOUT,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleApiError(error),
    );
  }

  /**
   * Handle API errors and convert to Boom errors
   */
  private handleApiError(error: AxiosError): never {
    const status = error.response?.status || 500;
    const message =
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      'Chatwoot API error';

    this.logger.error(
      `Chatwoot API error: ${status} - ${message}`,
      error.stack,
    );

    if (status === 401) {
      throw Boom.unauthorized('Invalid Chatwoot API token');
    }
    if (status === 403) {
      throw Boom.forbidden('Access denied to Chatwoot resource');
    }
    if (status === 404) {
      throw Boom.notFound(message);
    }
    if (status === 422) {
      throw Boom.badData(message);
    }
    if (status >= 500) {
      throw Boom.serverUnavailable('Chatwoot service unavailable');
    }

    throw Boom.badRequest(message);
  }

  // ==================== CONTACTS ====================

  async searchContacts(query: string): Promise<ContactsSearchResponse> {
    const { data } = await this.client.get<ContactsSearchResponse>(
      '/contacts/search',
      {
        params: { q: query },
      },
    );
    return data;
  }

  async getContact(contactId: number): Promise<ChatwootContact> {
    const { data } = await this.client.get<ChatwootContact>(
      `/contacts/${contactId}`,
    );
    return data;
  }

  async createContact(contact: {
    inbox_id: number;
    name?: string;
    phone_number?: string;
    identifier?: string;
    avatar_url?: string;
    custom_attributes?: Record<string, unknown>;
  }): Promise<ContactCreateResponse> {
    const { data } = await this.client.post<ContactCreateResponse>(
      '/contacts',
      contact,
    );
    return data;
  }

  async updateContact(
    contactId: number,
    contact: Partial<{
      name: string;
      phone_number: string;
      avatar_url: string;
      identifier: string;
      custom_attributes: Record<string, unknown>;
    }>,
  ): Promise<ChatwootContact> {
    const { data } = await this.client.put<ChatwootContact>(
      `/contacts/${contactId}`,
      contact,
    );
    return data;
  }

  /**
   * Update contact with avatar file (workaround for avatar_url bug)
   */
  async updateContactWithAvatar(
    contactId: number,
    contact: {
      name?: string;
      avatarBuffer?: Buffer;
      avatarFilename?: string;
    },
  ): Promise<ChatwootContact> {
    const formData = new FormData();

    if (contact.name) {
      formData.append('name', contact.name);
    }

    if (contact.avatarBuffer && contact.avatarFilename) {
      formData.append('avatar', contact.avatarBuffer, {
        filename: contact.avatarFilename,
        contentType: 'image/png',
      });
    }

    const { data } = await this.client.put<ChatwootContact>(
      `/contacts/${contactId}`,
      formData,
      {
        headers: formData.getHeaders(),
      },
    );
    return data;
  }

  async getContactConversations(
    contactId: number,
  ): Promise<ConversationsListResponse> {
    const { data } = await this.client.get<ConversationsListResponse>(
      `/contacts/${contactId}/conversations`,
    );
    return data;
  }

  async filterContacts(
    payload: FilterPayloadItem[],
  ): Promise<ContactsSearchResponse> {
    const { data } = await this.client.post<ContactsSearchResponse>(
      '/contacts/filter',
      { payload },
    );
    return data;
  }

  // ==================== CONVERSATIONS ====================

  async createConversation(params: {
    inbox_id: number;
    contact_id: number;
    status?: 'open' | 'pending';
  }): Promise<ChatwootConversation> {
    const { data } = await this.client.post<ChatwootConversation>(
      '/conversations',
      {
        contact_id: params.contact_id.toString(),
        inbox_id: params.inbox_id.toString(),
        status: params.status,
      },
    );
    return data;
  }

  async getConversation(conversationId: number): Promise<ChatwootConversation> {
    const { data } = await this.client.get<ChatwootConversation>(
      `/conversations/${conversationId}`,
    );
    return data;
  }

  async toggleConversationStatus(
    conversationId: number,
    status: 'open' | 'resolved' | 'pending',
  ): Promise<ChatwootConversation> {
    const { data } = await this.client.post<ChatwootConversation>(
      `/conversations/${conversationId}/toggle_status`,
      { status },
    );
    return data;
  }

  // ==================== MESSAGES ====================

  async createMessage(
    conversationId: number,
    params: {
      content: string;
      message_type: 'incoming' | 'outgoing';
      private?: boolean;
      source_id?: string;
      content_attributes?: Record<string, unknown>;
      source_reply_id?: string; // Chatwoot message ID for reply threading
    },
  ): Promise<ChatwootMessage> {
    const { data } = await this.client.post<ChatwootMessage>(
      `/conversations/${conversationId}/messages`,
      params,
    );
    return data;
  }

  async createMessageWithAttachments(
    conversationId: number,
    params: {
      content?: string;
      message_type: 'incoming' | 'outgoing';
      private?: boolean;
      source_id?: string;
      attachments: Array<{
        content: Buffer;
        filename: string;
      }>;
      content_attributes?: {
        in_reply_to?: number;
        in_reply_to_external_id?: string;
      };
    },
  ): Promise<ChatwootMessage> {
    const formData = new FormData();

    if (params.content) {
      formData.append('content', params.content);
    }
    formData.append('message_type', params.message_type);
    if (params.private) {
      formData.append('private', 'true');
    }
    if (params.source_id) {
      formData.append('source_id', params.source_id);
    }

    // Add reply support
    if (params.content_attributes) {
      formData.append(
        'content_attributes',
        JSON.stringify(params.content_attributes),
      );
    }

    params.attachments.forEach((attachment) => {
      formData.append(`attachments[]`, attachment.content, {
        filename: attachment.filename,
      });
    });

    const { data } = await this.client.post<ChatwootMessage>(
      `/conversations/${conversationId}/messages`,
      formData,
      {
        headers: formData.getHeaders(),
      },
    );
    return data;
  }

  async deleteMessage(
    conversationId: number,
    messageId: number,
  ): Promise<void> {
    await this.client.delete(
      `/conversations/${conversationId}/messages/${messageId}`,
    );
  }

  async updateMessage(
    conversationId: number,
    messageId: number,
    params: { content: string },
  ): Promise<ChatwootMessage> {
    const { data } = await this.client.patch<ChatwootMessage>(
      `/conversations/${conversationId}/messages/${messageId}`,
      params,
    );
    return data;
  }

  // ==================== INBOXES ====================

  async listInboxes(): Promise<InboxesListResponse> {
    const { data } = await this.client.get<InboxesListResponse>('/inboxes');
    return data;
  }

  async getInbox(inboxId: number): Promise<ChatwootInbox> {
    const { data } = await this.client.get<ChatwootInbox>(
      `/inboxes/${inboxId}`,
    );
    return data;
  }

  async createApiInbox(params: {
    name: string;
    webhook_url?: string;
  }): Promise<ChatwootInbox> {
    const { data } = await this.client.post<ChatwootInbox>('/inboxes', {
      name: params.name,
      channel: {
        type: 'api',
        webhook_url: params.webhook_url,
      },
    });
    return data;
  }

  async updateInbox(
    inboxId: number,
    params: { name?: string; webhook_url?: string },
  ): Promise<ChatwootInbox> {
    const { data } = await this.client.patch<ChatwootInbox>(
      `/inboxes/${inboxId}`,
      params,
    );
    return data;
  }

  // ==================== PUBLIC API (for webhook identifier) ====================

  async updateLastSeen(
    inboxIdentifier: string,
    contactSourceId: string,
    conversationId: number,
  ): Promise<void> {
    const baseUrl = this.client.defaults.baseURL?.replace(
      `/api/v1/accounts/${this.accountId}`,
      '',
    );
    await axios.post(
      `${baseUrl}/public/api/v1/inboxes/${inboxIdentifier}/contacts/${contactSourceId}/conversations/${conversationId}/update_last_seen`,
    );
  }

  // ==================== MERGE CONTACTS ====================

  async mergeContacts(
    baseContactId: number,
    mergeeContactId: number,
  ): Promise<ChatwootContact> {
    const { data } = await this.client.post<ChatwootContact>(
      '/actions/contact_merge',
      {
        base_contact_id: baseContactId,
        mergee_contact_id: mergeeContactId,
      },
    );
    return data;
  }

  // ==================== UTILITY GETTERS ====================

  /**
   * Get the base URL of the Chatwoot instance
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the account ID
   */
  getAccountId(): string {
    return this.accountId;
  }
}

/**
 * Factory for creating ChatwootClient instances
 *
 * Manages client instances and ensures proper caching per session.
 */
@Injectable()
export class ChatwootClientFactory {
  private readonly logger = new Logger(ChatwootClientFactory.name);
  private readonly clients = new Map<string, ChatwootClient>();

  /**
   * Get or create a ChatwootClient for the given session
   */
  getClient(sessionId: string, config: ChatwootClientConfig): ChatwootClient {
    const cacheKey = `${sessionId}:${config.accountId}`;

    if (!this.clients.has(cacheKey)) {
      this.logger.debug(
        `Creating new Chatwoot client for session: ${sessionId}`,
      );
      this.clients.set(cacheKey, new ChatwootClient(config));
    }

    return this.clients.get(cacheKey)!;
  }

  /**
   * Remove a cached client for the given session
   */
  removeClient(sessionId: string): void {
    // Remove all clients for this session
    for (const key of this.clients.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        this.clients.delete(key);
        this.logger.debug(`Removed Chatwoot client: ${key}`);
      }
    }
  }

  /**
   * Check if a client exists for the session
   */
  hasClient(sessionId: string): boolean {
    for (const key of this.clients.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all cached clients
   */
  clearAll(): void {
    this.clients.clear();
    this.logger.debug('Cleared all Chatwoot clients');
  }
}
