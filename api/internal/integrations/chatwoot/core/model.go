package core

import "time"

type Config struct {
	ID               string     `json:"id"`
	SessionID        string     `json:"sessionId"`
	Enabled          bool       `json:"enabled"`
	URL              string     `json:"url"`
	Token            string     `json:"token"`
	Account          int        `json:"account"`
	InboxID          int        `json:"inboxId,omitempty"`
	Inbox            string     `json:"inbox,omitempty"`
	SignAgent        bool       `json:"signAgent"`
	SignSeparator    string     `json:"signSeparator,omitempty"`
	AutoReopen       bool       `json:"autoReopen"`
	StartPending     bool       `json:"startPending"`
	MergeBrPhones    bool       `json:"mergeBrPhones"`
	SyncContacts     bool       `json:"syncContacts"`
	SyncMessages     bool       `json:"syncMessages"`
	SyncDays         int        `json:"syncDays,omitempty"`
	ImportAsResolved bool       `json:"importAsResolved"`
	IgnoreChats      []string   `json:"ignoreChats,omitempty"`
	AutoCreate       bool       `json:"autoCreate"`
	WebhookURL       string     `json:"webhookUrl,omitempty"`
	ChatwootDBHost   string     `json:"chatwootDbHost,omitempty"`
	ChatwootDBPort   int        `json:"chatwootDbPort,omitempty"`
	ChatwootDBUser   string     `json:"chatwootDbUser,omitempty"`
	ChatwootDBPass   string     `json:"chatwootDbPass,omitempty"`
	ChatwootDBName   string     `json:"chatwootDbName,omitempty"`
	CreatedAt        *time.Time `json:"createdAt,omitempty"`
	UpdatedAt        *time.Time `json:"updatedAt,omitempty"`
}

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

type ContactInbox struct {
	SourceID string `json:"source_id"`
	Inbox    *Inbox `json:"inbox,omitempty"`
}

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

type Sender struct {
	ID            int    `json:"id,omitempty"`
	Name          string `json:"name,omitempty"`
	Email         string `json:"email,omitempty"`
	Type          string `json:"type,omitempty"`
	AvailableName string `json:"available_name,omitempty"`
	AvatarURL     string `json:"avatar_url,omitempty"`
}

type Account struct {
	ID   int    `json:"id"`
	Name string `json:"name,omitempty"`
}

type MediaInfo struct {
	IsMedia  bool
	MimeType string
	Filename string
	Caption  string
}

type SyncStats struct {
	ContactsImported  int                 `json:"contactsImported"`
	ContactsSkipped   int                 `json:"contactsSkipped"`
	ContactsErrors    int                 `json:"contactsErrors"`
	MessagesImported  int                 `json:"messagesImported"`
	MessagesSkipped   int                 `json:"messagesSkipped"`
	MessagesErrors    int                 `json:"messagesErrors"`
	ConversationsUsed int                 `json:"conversationsUsed"`
	Errors            int                 `json:"errors"`
	ContactDetails    *ContactSyncDetails `json:"contactDetails,omitempty"`
	MessageDetails    *MessageSyncDetails `json:"messageDetails,omitempty"`
}

type ContactSyncDetails struct {
	SavedContacts    int `json:"savedContacts"`
	BusinessContacts int `json:"businessContacts"`

	AlreadyExists   int `json:"alreadyExists"`
	Groups          int `json:"groups"`
	StatusBroadcast int `json:"statusBroadcast"`
	Newsletters     int `json:"newsletters"`
	NotInAgenda     int `json:"notInAgenda"`
	LidContacts     int `json:"lidContacts"`
	InvalidPhone    int `json:"invalidPhone"`

	TotalWhatsApp int `json:"totalWhatsApp"`
}

type MessageSyncDetails struct {
	TextMessages  int `json:"textMessages"`
	MediaMessages int `json:"mediaMessages"`
	GroupMessages int `json:"groupMessages"`

	AlreadySynced   int `json:"alreadySynced"`
	OldMessages     int `json:"oldMessages"`
	StatusBroadcast int `json:"statusBroadcast"`
	Newsletters     int `json:"newsletters"`
	Protocol        int `json:"protocol"`
	Reactions       int `json:"reactions"`
	System          int `json:"system"`
	EmptyContent    int `json:"emptyContent"`
	NoMedia         int `json:"noMedia"`
	LidChats        int `json:"lidChats"`

	PrivateChats int `json:"privateChats"`
	GroupChats   int `json:"groupChats"`
}

type ResetStats struct {
	ContactsDeleted      int `json:"contactsDeleted"`
	ConversationsDeleted int `json:"conversationsDeleted"`
	MessagesDeleted      int `json:"messagesDeleted"`
	ContactInboxDeleted  int `json:"contactInboxDeleted"`
}

type SyncStatus struct {
	SessionID string     `json:"sessionId"`
	Status    string     `json:"status"`
	Type      string     `json:"type"`
	StartedAt *time.Time `json:"startedAt,omitempty"`
	EndedAt   *time.Time `json:"endedAt,omitempty"`
	Stats     SyncStats  `json:"stats"`
	Error     string     `json:"error,omitempty"`
}

type WhatsAppContact struct {
	JID          string
	PushName     string
	BusinessName string
	FullName     string
	FirstName    string
}

type ReplyInfo struct {
	CwMsgId           int
	WhatsAppMessageID string
}

type QuotedMessageInfo struct {
	MsgId     string `json:"msgId"`
	ChatJID   string `json:"chatJid"`
	SenderJID string `json:"senderJid"`
	Content   string `json:"content"`
	FromMe    bool   `json:"fromMe"`
}

type ContactCacheEntry struct {
	ContactID int
	ExpiresAt time.Time
}

type ChatFKs struct {
	ContactID      int
	ConversationID int
}

type PhoneTimestamp struct {
	Phone      string
	FirstTS    int64
	LastTS     int64
	Name       string
	Identifier string
	IsGroup    bool
}

type ContactNameInfo struct {
	FullName     string
	FirstName    string
	PushName     string
	BusinessName string
}
