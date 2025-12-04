package core

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
	SyncContacts     bool       `json:"syncContacts"`
	SyncMessages     bool       `json:"syncMessages"`
	SyncDays         int        `json:"syncDays,omitempty"`
	ImportAsResolved bool       `json:"importAsResolved"`
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
	FileName  string `json:"file_name,omitempty"`
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
	// Detailed breakdowns
	ContactDetails *ContactSyncDetails `json:"contactDetails,omitempty"`
	MessageDetails *MessageSyncDetails `json:"messageDetails,omitempty"`
}

// ContactSyncDetails provides detailed breakdown of contact sync
type ContactSyncDetails struct {
	// Imported breakdown
	SavedContacts    int `json:"savedContacts"`    // Contacts saved in agenda (with FullName/FirstName)
	BusinessContacts int `json:"businessContacts"` // Business/verified contacts

	// Skipped breakdown
	AlreadyExists      int `json:"alreadyExists"`      // Contact already in Chatwoot
	Groups             int `json:"groups"`             // Group JIDs (not synced as contacts)
	StatusBroadcast    int `json:"statusBroadcast"`    // Status broadcast
	Newsletters        int `json:"newsletters"`        // Newsletter channels
	NotInAgenda        int `json:"notInAgenda"`        // Contacts not saved (only PushName)
	LidContacts        int `json:"lidContacts"`        // LID contacts that couldn't be resolved
	InvalidPhone       int `json:"invalidPhone"`       // Invalid phone numbers

	// Source info
	TotalWhatsApp int `json:"totalWhatsApp"` // Total contacts from WhatsApp
}

// MessageSyncDetails provides detailed breakdown of message sync
type MessageSyncDetails struct {
	// Imported breakdown
	TextMessages  int `json:"textMessages"`  // Regular text messages
	MediaMessages int `json:"mediaMessages"` // Images, videos, audio, documents
	GroupMessages int `json:"groupMessages"` // Messages in groups

	// Skipped breakdown
	AlreadySynced   int `json:"alreadySynced"`   // Already in Chatwoot
	OldMessages     int `json:"oldMessages"`     // Before date limit
	StatusBroadcast int `json:"statusBroadcast"` // Status/stories
	Newsletters     int `json:"newsletters"`     // Newsletter messages
	Protocol        int `json:"protocol"`        // Protocol messages
	Reactions       int `json:"reactions"`       // Reaction messages
	System          int `json:"system"`          // System messages
	EmptyContent    int `json:"emptyContent"`    // No content
	NoMedia         int `json:"noMedia"`         // Media not found
	LidChats        int `json:"lidChats"`        // LID chats not resolved

	// Conversations breakdown
	PrivateChats int `json:"privateChats"` // 1:1 conversations
	GroupChats   int `json:"groupChats"`   // Group conversations
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

// ContactCacheEntry holds cached contact data with expiry
// Note: We cache ContactID instead of ConversationID to ensure autoReopen works
type ContactCacheEntry struct {
	ContactID int
	ExpiresAt time.Time
}

// ChatFKs holds foreign keys for a chat in sync operations
type ChatFKs struct {
	ContactID      int
	ConversationID int
}

// PhoneTimestamp holds timestamp range for a phone number
type PhoneTimestamp struct {
	Phone      string
	FirstTS    int64
	LastTS     int64
	Name       string
	Identifier string
	IsGroup    bool
}

// ContactNameInfo holds name information from various sources
type ContactNameInfo struct {
	FullName     string
	FirstName    string
	PushName     string
	BusinessName string
}
