package dto

// ErrorResponse is the only envelope - used for errors
type ErrorResponse struct {
	Error string `json:"error" example:"session not found"`
}

// MessageOnlyResponse for operations that return just a message
type MessageOnlyResponse struct {
	Message string `json:"message" example:"operation completed"`
}

// Session responses

// SessionStats contains counters for session data
type SessionStats struct {
	// Total number of messages
	Messages int `json:"messages" example:"1234"`
	// Total number of chats
	Chats int `json:"chats" example:"42"`
	// Total number of contacts
	Contacts int `json:"contacts" example:"156"`
	// Total number of groups
	Groups int `json:"groups" example:"12"`
}

// SessionResponse represents a WhatsApp session with connection info and authentication
type SessionResponse struct {
	// Unique session UUID (database primary key)
	ID string `json:"id" example:"ce270f0c-c3d6-41ad-b481-1587f813c3b1"`
	// Session name/identifier (used in API routes)
	Session string `json:"session" example:"my-session"`
	// WhatsApp device JID after connection
	DeviceJID *string `json:"deviceJid,omitempty" example:"5511999999999@s.whatsapp.net"`
	// Phone number associated with the session
	Phone *string `json:"phone,omitempty" example:"5511999999999"`
	// Connection status: disconnected, connecting, connected
	Status string `json:"status" example:"connected"`
	// Session-specific API key for authentication (use in Authorization header)
	ApiKey *string `json:"apiKey,omitempty" example:"a1b2c3d4e5f6..."`
	// WhatsApp push name (display name)
	PushName *string `json:"pushName,omitempty" example:"John Doe"`
	// Profile picture URL
	ProfilePicture *string `json:"profilePicture,omitempty" example:"https://pps.whatsapp.net/..."`
	// Session statistics (only for connected sessions)
	Stats *SessionStats `json:"stats,omitempty"`
	// Session creation timestamp
	CreatedAt string `json:"createdAt" example:"2025-11-29T14:18:15.324706Z"`
	// Last update timestamp
	UpdatedAt string `json:"updatedAt" example:"2025-11-29T14:18:15.324706Z"`
}

type QRResponse struct {
	QR     string `json:"qr,omitempty" example:"data:image/png;base64,..."`
	Status string `json:"status" example:"connecting"`
}

type PairPhoneResponse struct {
	Code string `json:"code" example:"ABCD-EFGH"`
}

type MessageResponse struct {
	Message string  `json:"message" example:"operation completed"`
	Status  string  `json:"status,omitempty" example:"connected"`
	ID      *string `json:"id,omitempty" example:"ABCD1234"`
}

// Send message response

type SendResponse struct {
	MessageID string `json:"messageId" example:"ABCD1234"`
	Timestamp int64  `json:"timestamp" example:"1699999999"`
}

// Webhook responses

type WebhookResponse struct {
	ID        string   `json:"id,omitempty" example:"uuid"`
	SessionID string   `json:"sessionId" example:"uuid"`
	URL       string   `json:"url,omitempty" example:"https://example.com/webhook"`
	Events    []string `json:"events,omitempty" example:"message.received,message.sent"`
	Enabled   bool     `json:"enabled" example:"true"`
}

type EventsResponse struct {
	Categories map[string][]string `json:"categories"`
	All        []string            `json:"all"`
}

// Contact responses

type CheckPhoneResult struct {
	Phone        string `json:"phone" example:"5511999999999"`
	IsRegistered bool   `json:"isRegistered" example:"true"`
	JID          string `json:"jid,omitempty" example:"5511999999999@s.whatsapp.net"`
}

// CheckPhoneResultsResponse is array of CheckPhoneResult
type CheckPhoneResultsResponse = []CheckPhoneResult

type ContactInfoResponse struct {
	Users map[string]interface{} `json:"users"`
}

type AvatarResponse struct {
	URL string `json:"url" example:"https://..."`
	ID  string `json:"id,omitempty" example:"abc123"`
}

type PresenceResponse struct {
	Status string `json:"status" example:"available"`
}

type ChatPresenceResponse struct {
	State string `json:"state" example:"composing"`
}

type BlocklistResponse struct {
	JIDs []string `json:"jids"`
}

type BlocklistActionResponse struct {
	Action string `json:"action" example:"block"`
	Phone  string `json:"phone" example:"5511999999999"`
}

type QRLinkResponse struct {
	Link string `json:"link" example:"https://wa.me/qr/..."`
}

type BusinessProfileResponse struct {
	Profile interface{} `json:"profile"`
}

// Group responses

type GroupActionResponse struct {
	GroupID string      `json:"groupId,omitempty" example:"123456789@g.us"`
	Data    interface{} `json:"data,omitempty"`
}

type GroupInviteLinkResponse struct {
	GroupID string `json:"groupId" example:"123456789@g.us"`
	Link    string `json:"link" example:"https://chat.whatsapp.com/..."`
}

type GroupRequestParticipantsResponse struct {
	GroupID      string      `json:"groupId" example:"123456789@g.us"`
	Participants interface{} `json:"participants"`
}

// Profile responses

type ProfileInfoResponse struct {
	Profile interface{} `json:"profile"`
}

type SetStatusResponse struct {
	Status string `json:"status" example:"My new status"`
}

type SetNameResponse struct {
	Name string `json:"name" example:"John Doe"`
}

type SetPictureResponse struct {
	PictureID string `json:"pictureId" example:"abc123"`
}

// Settings responses

type SettingsResponse struct {
	ID                       int64  `json:"id"`
	SessionID                int64  `json:"sessionId"`
	AlwaysOnline             bool   `json:"alwaysOnline" example:"false"`
	AutoRejectCalls          bool   `json:"autoRejectCalls" example:"false"`
	SyncHistory              bool   `json:"syncHistory" example:"true"`
	LastSeen                 string `json:"lastSeen" example:"all"`
	Online                   string `json:"online" example:"all"`
	ProfilePhoto             string `json:"profilePhoto" example:"all"`
	Status                   string `json:"status" example:"all"`
	ReadReceipts             string `json:"readReceipts" example:"all"`
	GroupAdd                 string `json:"groupAdd" example:"all"`
	CallAdd                  string `json:"callAdd" example:"all"`
	DefaultDisappearingTimer string `json:"defaultDisappearingTimer" example:"off"`
	PrivacySyncedAt          string `json:"privacySyncedAt,omitempty"`
	CreatedAt                string `json:"createdAt"`
	UpdatedAt                string `json:"updatedAt"`
}

// Chat responses

type ChatActionResponse struct {
	Status string `json:"status,omitempty" example:"archived"`
}

type ChatMessageResponse struct {
	MsgId        string `json:"msgId" example:"3EB0ABC123"`
	ChatJID      string `json:"chatJid" example:"5511999999999@s.whatsapp.net"`
	SenderJID    string `json:"senderJid,omitempty" example:"5511999999999@s.whatsapp.net"`
	PushName     string `json:"pushName,omitempty" example:"John Doe"`
	Timestamp    int64  `json:"timestamp" example:"1701619200"`
	Type         string `json:"type" example:"text"`
	MediaType    string `json:"mediaType,omitempty" example:"image"`
	Content      string `json:"content,omitempty" example:"Hello!"`
	FromMe       bool   `json:"fromMe" example:"false"`
	IsGroup      bool   `json:"isGroup" example:"false"`
	QuotedID     string `json:"quotedId,omitempty" example:"3EB0DEF456"`
	QuotedSender string `json:"quotedSender,omitempty" example:"5511999999999@s.whatsapp.net"`
	Status       string `json:"status,omitempty" example:"sent"`
	Deleted      bool   `json:"deleted,omitempty" example:"false"`
}

// Newsletter responses

type NewsletterResponse struct {
	Data interface{} `json:"data"`
}

// Status responses

type StatusPrivacyResponse struct {
	Privacy interface{} `json:"privacy"`
}

// Community response

type CommunityResponse struct {
	Groups interface{} `json:"groups,omitempty"`
}

// Media responses

type MediaResponse struct {
	ID         string `json:"id" example:"uuid"`
	SessionID  string `json:"sessionId" example:"uuid"`
	MsgID      string `json:"msgId" example:"ABCD1234"`
	MediaType  string `json:"mediaType" example:"image"`
	MimeType   string `json:"mimeType,omitempty" example:"image/jpeg"`
	FileSize   int64  `json:"fileSize,omitempty" example:"12345"`
	FileName   string `json:"fileName,omitempty" example:"photo.jpg"`
	StorageURL string `json:"storageUrl,omitempty" example:"https://s3.example.com/media/photo.jpg"`
	Downloaded bool   `json:"downloaded" example:"true"`
	ChatJID    string `json:"chatJid,omitempty" example:"5511999999999@s.whatsapp.net"`
	FromMe     bool   `json:"fromMe,omitempty" example:"false"`
	Caption    string `json:"caption,omitempty" example:"Check this out!"`
	Width      int    `json:"width,omitempty" example:"1920"`
	Height     int    `json:"height,omitempty" example:"1080"`
	Duration   int    `json:"duration,omitempty" example:"30"`
	CreatedAt  string `json:"createdAt" example:"2025-01-01T00:00:00Z"`
}

// Chat responses

// LastMessageInfo represents the last message in a chat
type LastMessageInfo struct {
	Content   string `json:"content,omitempty" example:"Hello!"`
	Timestamp int64  `json:"timestamp" example:"1699999999"`
	FromMe    bool   `json:"fromMe" example:"false"`
	Type      string `json:"type" example:"text"`
	MediaType string `json:"mediaType,omitempty" example:"image"`
	Status    string `json:"status,omitempty" example:"sent"`
	SenderJID string `json:"senderJid,omitempty" example:"5511999999999@s.whatsapp.net"`
	PushName  string `json:"pushName,omitempty" example:"John"`
}

type ChatResponse struct {
	JID                 string           `json:"jid" example:"5511999999999@s.whatsapp.net"`
	Name                string           `json:"name,omitempty" example:"John Doe"`
	ContactName         string           `json:"contactName,omitempty" example:"John Doe"`       // From WhatsApp contacts (FullName > FirstName > PushName > BusinessName)
	ProfilePicture      string           `json:"profilePicture,omitempty" example:"https://..."` // Avatar URL from WhatsApp
	UnreadCount         int              `json:"unreadCount,omitempty" example:"5"`
	MarkedAsUnread      bool             `json:"markedAsUnread,omitempty" example:"false"`
	EphemeralExpiration int              `json:"ephemeralExpiration,omitempty" example:"86400"`
	ConversationTS      int64            `json:"conversationTimestamp,omitempty" example:"1699999999"`
	ReadOnly            bool             `json:"readOnly,omitempty" example:"false"`
	Suspended           bool             `json:"suspended,omitempty" example:"false"`
	Locked              bool             `json:"locked,omitempty" example:"false"`
	IsGroup             bool             `json:"isGroup" example:"false"`
	Archived            bool             `json:"archived,omitempty" example:"false"`
	Pinned              bool             `json:"pinned,omitempty" example:"false"`
	Muted               string           `json:"muted,omitempty" example:""`
	LastMessage         *LastMessageInfo `json:"lastMessage,omitempty"`
}

// Newsletter extra responses

type NewsletterLiveResponse struct {
	Duration string `json:"duration" example:"24h0m0s"`
}

// Contact extra responses

type LIDResponse struct {
	Phone string `json:"phone" example:"5511999999999"`
	LID   string `json:"lid" example:"123456789:0@lid"`
}
