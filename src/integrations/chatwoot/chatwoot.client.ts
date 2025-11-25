import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

export interface ChatwootConfig {
  url: string;
  accountId: string;
  token: string;
}

export interface ChatwootContact {
  id: number;
  name?: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  thumbnail?: string;
  custom_attributes?: Record<string, unknown>;
}

export interface ChatwootConversation {
  id: number;
  inbox_id: number;
  contact_id: number;
  status: 'open' | 'resolved' | 'pending';
  messages?: ChatwootMessage[];
}

export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: 'incoming' | 'outgoing';
  content_type?: string;
  private?: boolean;
  source_id?: string;
  attachments?: ChatwootAttachment[];
}

export interface ChatwootAttachment {
  id: number;
  file_type: string;
  data_url: string;
}

export interface ChatwootInbox {
  id: number;
  name: string;
  channel_type: string;
  webhook_url?: string;
}

interface ContactsSearchResponse {
  payload: ChatwootContact[];
}

interface ContactCreateResponse {
  payload: { contact: ChatwootContact };
}

interface ConversationsListResponse {
  payload: ChatwootConversation[];
}

interface InboxesListResponse {
  payload: ChatwootInbox[];
}

interface FilterPayloadItem {
  attribute_key: string;
  filter_operator: string;
  values: string[];
  query_operator: string | null;
}

export class ChatwootClient {
  private client: AxiosInstance;
  private accountId: string;

  constructor(config: ChatwootConfig) {
    this.accountId = config.accountId;
    this.client = axios.create({
      baseURL: `${config.url}/api/v1/accounts/${config.accountId}`,
      headers: {
        'Content-Type': 'application/json',
        api_access_token: config.token,
      },
      timeout: 30000,
    });
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
}
