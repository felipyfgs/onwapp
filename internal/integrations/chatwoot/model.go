package chatwoot

import "time"

// Config represents the Chatwoot integration configuration for a session
type Config struct {
	ID            string     `json:"id"`
	SessionID     string     `json:"sessionId"`
	Enabled       bool       `json:"enabled"`
	URL           string     `json:"url"`
	Token         string     `json:"token"`
	Account       int        `json:"account"`
	InboxID       int        `json:"inboxId,omitempty"`
	Inbox         string     `json:"inbox,omitempty"`
	SignAgent     bool       `json:"signAgent"`
	SignSeparator string     `json:"signSeparator,omitempty"`
	AutoReopen    bool       `json:"autoReopen"`
	StartPending  bool       `json:"startPending"`
	MergeBrPhones bool       `json:"mergeBrPhones"`
	SyncContacts  bool       `json:"syncContacts"`
	SyncMessages  bool       `json:"syncMessages"`
	SyncDays      int        `json:"syncDays,omitempty"`
	IgnoreChats   []string   `json:"ignoreChats,omitempty"`
	AutoInbox     bool       `json:"autoInbox"`
	WebhookURL    string     `json:"webhookUrl,omitempty"`
	CreatedAt     *time.Time `json:"createdAt,omitempty"`
	UpdatedAt     *time.Time `json:"updatedAt,omitempty"`
}

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
	InboxIdentifier string `json:"inbox_identifier,omitempty"` // For public API calls
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
	MessageType       interface{}            `json:"message_type"` // Can be string or int from API
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

// WebhookPayload represents incoming webhook from Chatwoot
type WebhookPayload struct {
	Event        string                 `json:"event"`
	ID           int                    `json:"id,omitempty"`
	Content      string                 `json:"content,omitempty"`
	MessageType  string                 `json:"message_type,omitempty"`
	ContentType  string                 `json:"content_type,omitempty"`
	ContentAttrs map[string]interface{} `json:"content_attributes,omitempty"`
	Private      bool                   `json:"private,omitempty"`
	Conversation *WebhookConversation   `json:"conversation,omitempty"`
	Sender       *Sender                `json:"sender,omitempty"`
	Inbox        *Inbox                 `json:"inbox,omitempty"`
	Account      *Account               `json:"account,omitempty"`
	Attachments  []Attachment           `json:"attachments,omitempty"`
}

// WebhookConversation represents conversation data in webhook payload
type WebhookConversation struct {
	ID           int               `json:"id"`
	InboxID      int               `json:"inbox_id,omitempty"`
	Status       string            `json:"status,omitempty"`
	Messages     []Message         `json:"messages,omitempty"`
	Meta         *ConversationMeta `json:"meta,omitempty"`
	ContactInbox *ContactInbox     `json:"contact_inbox,omitempty"`
}

// ConversationMeta represents metadata in conversation
type ConversationMeta struct {
	Sender *Contact `json:"sender,omitempty"`
}

// Account represents a Chatwoot account
type Account struct {
	ID   int    `json:"id"`
	Name string `json:"name,omitempty"`
}

// CreateContactRequest for API calls
type CreateContactRequest struct {
	InboxID     int               `json:"inbox_id"`
	Name        string            `json:"name,omitempty"`
	Email       string            `json:"email,omitempty"`
	PhoneNumber string            `json:"phone_number,omitempty"`
	Identifier  string            `json:"identifier,omitempty"`
	AvatarURL   string            `json:"avatar_url,omitempty"`
	CustomAttrs map[string]string `json:"custom_attributes,omitempty"`
}

// CreateConversationRequest for API calls
type CreateConversationRequest struct {
	SourceID   string `json:"source_id,omitempty"`
	InboxID    string `json:"inbox_id"`
	ContactID  string `json:"contact_id"`
	Status     string `json:"status,omitempty"`
	AssigneeID int    `json:"assignee_id,omitempty"`
}

// CreateMessageRequest for API calls
type CreateMessageRequest struct {
	Content           string                 `json:"content,omitempty"`
	MessageType       string                 `json:"message_type"`
	Private           bool                   `json:"private,omitempty"`
	ContentAttributes map[string]interface{} `json:"content_attributes,omitempty"`
	SourceID          string                 `json:"source_id,omitempty"`
}

// SetConfigRequest represents the request to set Chatwoot config
type SetConfigRequest struct {
	Enabled       bool     `json:"enabled"`
	URL           string   `json:"url" binding:"required_if=Enabled true"`
	Token         string   `json:"token" binding:"required_if=Enabled true"`
	Account       int      `json:"account" binding:"required_if=Enabled true"`
	Inbox         string   `json:"inbox,omitempty"`
	SignAgent     bool     `json:"signAgent"`
	SignSeparator string   `json:"signSeparator,omitempty"`
	AutoReopen    bool     `json:"autoReopen"`
	StartPending  bool     `json:"startPending"`
	MergeBrPhones bool     `json:"mergeBrPhones"`
	SyncContacts  bool     `json:"syncContacts"`
	SyncMessages  bool     `json:"syncMessages"`
	SyncDays      int      `json:"syncDays,omitempty"`
	IgnoreChats   []string `json:"ignoreChats,omitempty"`
	AutoInbox     bool     `json:"autoInbox"`
}
