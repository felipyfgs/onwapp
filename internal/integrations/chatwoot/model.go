package chatwoot

import "time"

// =============================================================================
// CONFIGURATION
// =============================================================================

// Config represents the Chatwoot integration configuration for a session
type Config struct {
	ID             string     `json:"id"`
	SessionID      string     `json:"sessionId"`
	Enabled        bool       `json:"enabled"`
	URL            string     `json:"url"`
	Token          string     `json:"token"`
	Account        int        `json:"account"`
	InboxID        int        `json:"inboxId,omitempty"`
	Inbox          string     `json:"inbox,omitempty"`
	SignAgent      bool       `json:"signAgent"`
	SignSeparator  string     `json:"signSeparator,omitempty"`
	AutoReopen     bool       `json:"autoReopen"`
	StartPending   bool       `json:"startPending"`
	MergeBrPhones  bool       `json:"mergeBrPhones"`
	SyncContacts   bool       `json:"syncContacts"`
	SyncMessages   bool       `json:"syncMessages"`
	SyncDays       int        `json:"syncDays,omitempty"`
	IgnoreChats    []string   `json:"ignoreChats,omitempty"`
	AutoCreate     bool       `json:"autoCreate"`
	WebhookURL     string     `json:"webhookUrl,omitempty"`
	ChatwootDBHost string     `json:"chatwootDbHost,omitempty"`
	ChatwootDBPort int        `json:"chatwootDbPort,omitempty"`
	ChatwootDBUser string     `json:"chatwootDbUser,omitempty"`
	ChatwootDBPass string     `json:"chatwootDbPass,omitempty"`
	ChatwootDBName string     `json:"chatwootDbName,omitempty"`
	CreatedAt      *time.Time `json:"createdAt,omitempty"`
	UpdatedAt      *time.Time `json:"updatedAt,omitempty"`
}

// =============================================================================
// CHATWOOT API MODELS
// =============================================================================

// Contact represents a Chatwoot contact
type Contact struct {
	ID                 int            `json:"id"`
	Name               string         `json:"name"`
	Email              string         `json:"email,omitempty"`
	PhoneNumber        string         `json:"phone_number,omitempty"`
	Identifier         string         `json:"identifier,omitempty"`
	Thumbnail          string         `json:"thumbnail,omitempty"`
	AdditionalAttrs    map[string]any `json:"additional_attributes,omitempty"`
	CustomAttrs        map[string]any `json:"custom_attributes,omitempty"`
	ContactInboxes     []ContactInbox `json:"contact_inboxes,omitempty"`
	AvailabilityStatus string         `json:"availability_status,omitempty"`
}

// ContactInbox represents a contact's inbox association
type ContactInbox struct {
	SourceID string `json:"source_id"`
	Inbox    *Inbox `json:"inbox,omitempty"`
}

// Inbox represents a Chatwoot inbox
type Inbox struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	ChannelID       int    `json:"channel_id,omitempty"`
	ChannelType     string `json:"channel_type,omitempty"`
	WebsiteURL      string `json:"website_url,omitempty"`
	WebhookURL      string `json:"webhook_url,omitempty"`
	GreetingEnabled bool   `json:"greeting_enabled,omitempty"`
	GreetingMessage string `json:"greeting_message,omitempty"`
	InboxIdentifier string `json:"inbox_identifier,omitempty"`
}

// Conversation represents a Chatwoot conversation
type Conversation struct {
	ID               int                    `json:"id"`
	InboxID          int                    `json:"inbox_id"`
	Status           string                 `json:"status"`
	AssigneeID       *int                   `json:"assignee_id,omitempty"`
	TeamID           *int                   `json:"team_id,omitempty"`
	ContactID        int                    `json:"contact_id,omitempty"`
	DisplayID        int                    `json:"display_id,omitempty"`
	Meta             map[string]interface{} `json:"meta,omitempty"`
	CustomAttributes map[string]interface{} `json:"custom_attributes,omitempty"`
}

// Message represents a Chatwoot message
type Message struct {
	ID                int                    `json:"id"`
	Content           string                 `json:"content,omitempty"`
	ContentType       string                 `json:"content_type,omitempty"`
	ContentAttributes map[string]interface{} `json:"content_attributes,omitempty"`
	MessageType       interface{}            `json:"message_type"`
	Private           bool                   `json:"private,omitempty"`
	Attachments       []Attachment           `json:"attachments,omitempty"`
	Sender            *Sender                `json:"sender,omitempty"`
	ConversationID    int                    `json:"conversation_id,omitempty"`
	SourceID          string                 `json:"source_id,omitempty"`
}

// Attachment represents a Chatwoot message attachment
type Attachment struct {
	ID        int    `json:"id,omitempty"`
	MessageID int    `json:"message_id,omitempty"`
	FileType  string `json:"file_type"`
	AccountID int    `json:"account_id,omitempty"`
	Extension string `json:"extension,omitempty"`
	DataURL   string `json:"data_url,omitempty"`
	ThumbURL  string `json:"thumb_url,omitempty"`
	FileSize  int    `json:"file_size,omitempty"`
	Width     int    `json:"width,omitempty"`
	Height    int    `json:"height,omitempty"`
}

// Sender represents a Chatwoot message sender
type Sender struct {
	ID            int    `json:"id,omitempty"`
	Name          string `json:"name,omitempty"`
	Email         string `json:"email,omitempty"`
	Type          string `json:"type,omitempty"`
	AvailableName string `json:"available_name,omitempty"`
	AvatarURL     string `json:"avatar_url,omitempty"`
}

// Account represents a Chatwoot account
type Account struct {
	ID   int    `json:"id"`
	Name string `json:"name,omitempty"`
}

// =============================================================================
// MEDIA INFO
// =============================================================================

// MediaInfo holds information about media in a message
type MediaInfo struct {
	IsMedia  bool
	MimeType string
	Filename string
	Caption  string
}

// =============================================================================
// SYNC MODELS
// =============================================================================

// SyncStats tracks synchronization statistics
type SyncStats struct {
	ContactsImported  int `json:"contactsImported"`
	ContactsSkipped   int `json:"contactsSkipped"`
	ContactsErrors    int `json:"contactsErrors"`
	MessagesImported  int `json:"messagesImported"`
	MessagesSkipped   int `json:"messagesSkipped"`
	MessagesErrors    int `json:"messagesErrors"`
	ConversationsUsed int `json:"conversationsUsed"`
	Errors            int `json:"errors"`
}

// ResetStats tracks reset operation statistics
type ResetStats struct {
	ContactsDeleted      int `json:"contactsDeleted"`
	ConversationsDeleted int `json:"conversationsDeleted"`
	MessagesDeleted      int `json:"messagesDeleted"`
	ContactInboxDeleted  int `json:"contactInboxDeleted"`
}

// SyncStatus represents the current sync status
type SyncStatus struct {
	SessionID string     `json:"sessionId"`
	Status    string     `json:"status"` // idle, running, completed, failed
	Type      string     `json:"type"`   // contacts, messages, all
	StartedAt *time.Time `json:"startedAt,omitempty"`
	EndedAt   *time.Time `json:"endedAt,omitempty"`
	Stats     SyncStats  `json:"stats"`
	Error     string     `json:"error,omitempty"`
}

// WhatsAppContact represents a contact from WhatsApp
type WhatsAppContact struct {
	JID          string
	PushName     string
	BusinessName string
	FullName     string
	FirstName    string
}

// =============================================================================
// INTERNAL MODELS
// =============================================================================

// ReplyInfo holds information about a reply reference for Chatwoot
type ReplyInfo struct {
	CwMsgId           int
	WhatsAppMessageID string
}

// QuotedMessageInfo holds information about a quoted message for WhatsApp
type QuotedMessageInfo struct {
	MsgId     string `json:"msgId"`
	ChatJID   string `json:"chatJid"`
	SenderJID string `json:"senderJid"`
	Content   string `json:"content"`
	FromMe    bool   `json:"fromMe"`
}

// contactCacheEntry holds cached conversation data with expiry
type contactCacheEntry struct {
	conversationID int
	expiresAt      time.Time
}

// chatFKs holds foreign keys for a chat in sync operations
type chatFKs struct {
	contactID      int
	conversationID int
}

// phoneTimestamp holds timestamp range for a phone number
type phoneTimestamp struct {
	phone      string
	firstTS    int64
	lastTS     int64
	name       string
	identifier string
}

// contactNameInfo holds name information from various sources
type contactNameInfo struct {
	FullName     string
	FirstName    string
	PushName     string
	BusinessName string
}
