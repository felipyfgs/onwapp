import {
  ChatwootConversationStatus,
  ChatwootFileType,
  ChatwootMessageType,
} from '../constants';

/**
 * Chatwoot API client configuration
 */
export interface ChatwootClientConfig {
  url: string;
  accountId: string;
  token: string;
}

/**
 * Chatwoot Contact entity
 */
export interface ChatwootContact {
  id: number;
  name?: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  thumbnail?: string;
  custom_attributes?: Record<string, unknown>;
}

/**
 * Chatwoot Conversation entity
 */
export interface ChatwootConversation {
  id: number;
  inbox_id: number;
  contact_id: number;
  status: ChatwootConversationStatus;
  messages?: ChatwootMessage[];
}

/**
 * Chatwoot Message entity
 */
export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: ChatwootMessageType;
  content_type?: string;
  private?: boolean;
  source_id?: string;
  attachments?: ChatwootAttachment[];
}

/**
 * Chatwoot Attachment entity
 */
export interface ChatwootAttachment {
  id: number;
  file_type: ChatwootFileType;
  data_url: string;
  thumb_url?: string;
  file_name?: string;
}

/**
 * Chatwoot Inbox entity
 */
export interface ChatwootInbox {
  id: number;
  name: string;
  channel_type: string;
  webhook_url?: string;
}

/**
 * Chatwoot webhook payload - incoming from Chatwoot
 */
export interface ChatwootWebhookPayload {
  id?: number;
  event?: string;
  message_type?: string;
  content?: string;
  private?: boolean;
  source_id?: string;
  content_attributes?: ChatwootContentAttributes;
  conversation?: ChatwootWebhookConversation;
  sender?: ChatwootWebhookSender;
  attachments?: ChatwootWebhookAttachment[];
  inbox?: { id?: number; name?: string };
  account?: { id?: number; name?: string };
}

export interface ChatwootContentAttributes {
  in_reply_to?: number;
  in_reply_to_external_id?: string;
  deleted?: boolean;
}

export interface ChatwootWebhookConversation {
  id: number;
  status?: string;
  meta?: {
    sender?: {
      identifier?: string;
      phone_number?: string;
      name?: string;
    };
  };
}

export interface ChatwootWebhookSender {
  id: number;
  name?: string;
  available_name?: string;
  type?: string;
}

export interface ChatwootWebhookAttachment {
  file_type: string;
  data_url: string;
  thumb_url?: string;
  file_name?: string;
}

/**
 * Zpwoot webhook payload - sent to Chatwoot integration
 */
export interface ZpwootWebhookPayload {
  sessionId: string;
  event: string;
  timestamp: string;
  data: ZpwootEventData;
}

export interface ZpwootEventData {
  messages?: ZpwootMessageEvent[];
  type?: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * WhatsApp message event structure
 */
export interface ZpwootMessageEvent {
  key: ZpwootMessageKey;
  message?: WAMessageContent;
  pushName?: string;
  messageTimestamp?: number;
}

export interface ZpwootMessageKey {
  id: string;
  remoteJid: string;
  fromMe?: boolean;
  participant?: string;
}

/**
 * WhatsApp message content types
 */
export interface WAMessageContent {
  conversation?: string;
  extendedTextMessage?: { text: string; contextInfo?: Record<string, unknown> };
  imageMessage?: {
    caption?: string;
    url?: string;
    mimetype?: string;
    contextInfo?: Record<string, unknown>;
  };
  videoMessage?: {
    caption?: string;
    url?: string;
    mimetype?: string;
    contextInfo?: Record<string, unknown>;
  };
  audioMessage?: {
    ptt?: boolean;
    url?: string;
    mimetype?: string;
  };
  documentMessage?: {
    fileName?: string;
    url?: string;
    mimetype?: string;
    caption?: string;
  };
  stickerMessage?: {
    url?: string;
    mimetype?: string;
  };
  contactMessage?: Record<string, unknown>;
  contactsArrayMessage?: Record<string, unknown>;
  locationMessage?: Record<string, unknown>;
  liveLocationMessage?: Record<string, unknown>;
  listMessage?: {
    title?: string;
    description?: string;
    buttonText?: string;
    listType?: number;
    sections?: Array<{
      title?: string;
      rows?: Array<{
        title?: string;
        description?: string;
        rowId?: string;
      }>;
    }>;
  };
  buttonsMessage?: {
    contentText?: string;
    footerText?: string;
    headerType?: number;
    buttons?: Array<{
      buttonId?: string;
      buttonText?: { displayText?: string };
      type?: number;
    }>;
  };
  listResponseMessage?: {
    title?: string;
    listType?: number;
    singleSelectReply?: { selectedRowId?: string };
    description?: string;
  };
  buttonsResponseMessage?: {
    selectedButtonId?: string;
    selectedDisplayText?: string;
    type?: number;
  };
  templateButtonReplyMessage?: {
    selectedId?: string;
    selectedDisplayText?: string;
    selectedIndex?: number;
  };
  reactionMessage?: { text?: string };
  pollCreationMessage?: Record<string, unknown>;
}

/**
 * Quoted message structure for replies
 */
export interface QuotedMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
  };
  message?: Record<string, unknown>;
}

/**
 * API response wrappers
 */
export interface ContactsSearchResponse {
  payload: ChatwootContact[];
}

export interface ContactCreateResponse {
  payload: { contact: ChatwootContact };
}

export interface ConversationsListResponse {
  payload: ChatwootConversation[];
}

export interface InboxesListResponse {
  payload: ChatwootInbox[];
}

/**
 * Filter payload for contact search
 */
export interface FilterPayloadItem {
  attribute_key: string;
  filter_operator: string;
  values: string[];
  query_operator: string | null;
}

/**
 * Create contact parameters
 */
export interface CreateContactParams {
  phoneNumber: string;
  inboxId: number;
  isGroup: boolean;
  name?: string;
  avatarUrl?: string;
  identifier?: string;
}

/**
 * Create conversation parameters
 */
export interface CreateConversationParams {
  contactId: number;
  inboxId: number;
  status?: 'open' | 'pending';
}

/**
 * Create message parameters
 */
export interface CreateMessageParams {
  content: string;
  messageType: ChatwootMessageType;
  private?: boolean;
  sourceId?: string;
  inReplyTo?: number;
  inReplyToExternalId?: string;
}

/**
 * Create message with attachment parameters
 */
export interface CreateMessageWithAttachmentParams {
  content?: string;
  messageType: ChatwootMessageType;
  sourceId?: string;
  file: {
    buffer: Buffer;
    filename: string;
  };
  inReplyTo?: number;
  inReplyToExternalId?: string;
}

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  status: string;
  reason?: string;
  type?: string;
  chatId?: string;
  error?: string;
}

/**
 * Event handling result
 */
export interface EventHandlingResult {
  processed: boolean;
  reason?: string;
}
