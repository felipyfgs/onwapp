// Base Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Session Types
export interface Session {
  id: string;
  session: string;
  status: 'connected' | 'disconnected' | 'connecting';
  deviceJid?: string;
  phone?: string;
  apiKey?: string;
  pushName?: string;
  profilePicture?: string;
  qr?: string;
  stats?: {
    messages: number;
    chats: number;
    groups: number;
    contacts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SessionStatus {
  status: string;
  qr?: string;
  pairingCode?: string;
}

export interface CreateSessionRequest {
  session?: string;
  name?: string;
}

export interface SessionResponse {
  success: boolean;
  session: Session;
  message?: string;
}

export interface SessionStatusResponse {
  success: boolean;
  status: SessionStatus;
  message?: string;
}

// Profile Types
export interface Profile {
  name: string;
  status: string;
  picture?: string;
}

// Contact Types
export interface Contact {
  jid: string;
  name: string;
  phone: string;
  avatar?: string;
  blocked?: boolean;
  about?: string;
  isBusiness?: boolean;
  businessProfile?: BusinessProfile;
}

export interface BusinessProfile {
  id: string;
  name: string;
  description?: string;
  email?: string;
  address?: string;
  website?: string[];
  category?: string;
  hours?: BusinessHours[];
  services?: string[];
}

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
}

export interface ContactBlocklist {
  jids: string[];
}

// Chat Types
export interface Chat {
  jid: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  archived?: boolean;
  muted?: boolean;
  pinned?: boolean;
  disappearingTimer?: number;
  isGroup?: boolean;
  participantCount?: number;
}

export interface ChatInfo {
  jid: string;
  name: string;
  description?: string;
  participants?: Participant[];
  createdAt?: string;
  createdBy?: string;
}

export interface Participant {
  jid: string;
  name: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface ChatResponse {
  success: boolean;
  chat?: Chat;
  chats?: Chat[];
  message?: string;
}

export interface Presence {
  jid: string;
  lastSeen?: string;
  isOnline: boolean;
  presence: 'available' | 'unavailable' | 'composing' | 'recording';
}

// Message Types
export type MessageType = 
  | 'text' 
  | 'image' 
  | 'audio' 
  | 'video' 
  | 'document' 
  | 'sticker' 
  | 'location' 
  | 'contact' 
  | 'poll' 
  | 'buttons' 
  | 'list' 
  | 'interactive' 
  | 'template' 
  | 'carousel';

export interface Message {
  id: string;
  chatJid: string;
  fromMe: boolean;
  sender?: string;
  timestamp: string;
  text?: string;
  type: MessageType;
  mediaUrl?: string;
  mediaKey?: string;
  mediaType?: string;
  caption?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  mimeType?: string;
  location?: LocationData;
  contact?: ContactData;
  poll?: PollData;
  buttons?: ButtonData[];
  list?: ListData;
  interactive?: InteractiveData;
  template?: TemplateData;
  carousel?: CarouselData[];
  reactions?: Reaction[];
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface MessageResponse {
  success: boolean;
  message?: Message;
  messageId?: string;
  error?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface ContactData {
  displayName: string;
  vcard: string;
  phoneNumber: string;
}

export interface PollData {
  question: string;
  options: PollOption[];
  allowsMultipleAnswers: boolean;
  messageSecret?: string;
}

export interface PollOption {
  optionName: string;
  optionId: number;
}

export interface ButtonData {
  buttonId: string;
  buttonText: string;
  type: 'reply' | 'url' | 'call';
  url?: string;
  phoneNumber?: string;
}

export interface ListData {
  title: string;
  description?: string;
  buttonText: string;
  sections: ListSection[];
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface ListRow {
  rowId: string;
  title: string;
  description?: string;
}

export interface InteractiveData {
  header?: InteractiveHeader;
  body: InteractiveBody;
  footer?: InteractiveFooter;
  action: InteractiveAction;
}

export interface InteractiveHeader {
  type: 'text' | 'image' | 'video' | 'document';
  text?: string;
  media?: string;
}

export interface InteractiveBody {
  text: string;
}

export interface InteractiveFooter {
  text: string;
}

export interface InteractiveAction {
  type: 'button' | 'list' | 'cta_url';
  buttons?: ButtonData[];
  sections?: ListSection[];
  ctaUrl?: {
    displayText: string;
    url: string;
  };
}

export interface TemplateData {
  name: string;
  language: string;
  components: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  parameters?: TemplateParameter[];
}

export interface TemplateParameter {
  type: 'text' | 'image' | 'video' | 'document' | 'currency' | 'date_time';
  text?: string;
  media?: string;
  currency?: {
    fallbackValue: string;
    code: string;
    amount: number;
  };
  dateTime?: {
    fallbackValue: string;
  };
}

export interface CarouselData {
  cards: CarouselCard[];
}

export interface CarouselCard {
  header?: InteractiveHeader;
  body: InteractiveBody;
  action?: InteractiveAction;
}

export interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

// Group Types
export interface Group {
  jid: string;
  name: string;
  subject: string;
  owner: string;
  participants: GroupParticipant[];
  createdAt: string;
  description?: string;
  picture?: string;
  isLocked?: boolean;
  isAnnounceOnly?: boolean;
  approvalMode?: boolean;
  memberAddMode?: string;
}

export interface GroupParticipant {
  jid: string;
  name: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface GroupInvite {
  code: string;
  link: string;
  createdAt: string;
  creator: string;
}

export interface GroupRequest {
  jid: string;
  name: string;
  requestTime: string;
}

// Media Types
export interface MediaItem {
  messageId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  isPending: boolean;
  timestamp: string;
}

// Newsletter Types
export interface Newsletter {
  jid: string;
  name: string;
  description?: string;
  picture?: string;
  subscribers: number;
  isFollowing: boolean;
  isMuted: boolean;
  createdAt: string;
}

// Webhook Types
export interface WebhookConfig {
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Chatwoot Types
export interface ChatwootConfig {
  url: string;
  accountId: string;
  token: string;
  enabled: boolean;
  inboxId?: string;
  syncStatus?: 'syncing' | 'completed' | 'error';
  lastSync?: string;
}

export interface ChatwootStats {
  totalConversations: number;
  resolvedConversations: number;
  pendingConversations: number;
  lastSync: string;
  syncStatus: 'syncing' | 'completed' | 'error';
}

// Status Types
export interface Status {
  id: string;
  jid: string;
  timestamp: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'text';
  caption?: string;
  text?: string;
  backgroundColor?: string;
  views: number;
  isViewed: boolean;
}

export interface StatusStory {
  id: string;
  timestamp: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  views: number;
  isViewed: boolean;
}

export interface StatusPrivacy {
  whoCanSee: 'all' | 'contacts' | 'contacts_except' | 'only_share_with';
  contacts?: string[];
}

// Community Types
export interface Community {
  jid: string;
  name: string;
  description?: string;
  picture?: string;
  createdAt: string;
  owner: string;
  participantCount: number;
}

// Call Types
export interface Call {
  id: string;
  from: string;
  to: string;
  type: 'voice' | 'video';
  status: 'incoming' | 'outgoing' | 'missed' | 'rejected' | 'accepted' | 'ended';
  duration?: number;
  timestamp: string;
}

// Request Types
export interface SendMessageRequest {
  jid: string;
  text?: string;
  media?: File;
  caption?: string;
  options?: MessageOptions;
}

export interface MessageOptions {
  quotedMessageId?: string;
  mentions?: string[];
  sendSeen?: boolean;
  linkPreview?: boolean;
}

export interface CreateGroupRequest {
  name: string;
  subject?: string;
  participants: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  subject?: string;
  announce?: boolean;
  locked?: boolean;
  approval?: boolean;
  memberAdd?: string;
}

export interface WebhookRequest {
  url: string;
  events: string[];
  enabled: boolean;
}

export interface ChatwootRequest {
  url: string;
  accountId: string;
  token: string;
  enabled: boolean;
}

// Response Types
export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  cursor?: string;
  total?: number;
}

export interface ContactCheckResponse {
  jid: string;
  exists: boolean;
  name?: string;
  picture?: string;
}

export interface QRCodeResponse {
  qrCode: string;
  qrBase64: string;
  pairingCode?: string;
}

export interface GroupInfoResponse {
  jid: string;
  name: string;
  subject: string;
  owner: string;
  participants: GroupParticipant[];
  createdAt: string;
  description?: string;
  picture?: string;
  isLocked?: boolean;
  isAnnounceOnly?: boolean;
  approvalMode?: boolean;
  memberAddMode?: string;
}

export interface MediaUploadResponse {
  messageId: string;
  url: string;
  key: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
}