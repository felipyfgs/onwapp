package dto

import "time"

// ErrorResponse is the only envelope - used for errors
type ErrorResponse struct {
	Error string `json:"error" example:"session not found"`
}

// MessageOnlyResponse for operations that return just a message
type MessageOnlyResponse struct {
	Message string `json:"message" example:"operation completed"`
}

// Session responses

type SessionResponse struct {
	ID        string  `json:"id" example:"ce270f0c-c3d6-41ad-b481-1587f813c3b1"`
	Name      string  `json:"name" example:"my-session"`
	DeviceJID *string `json:"deviceJid,omitempty" example:"5511999999999@s.whatsapp.net"`
	Phone     *string `json:"phone,omitempty" example:"5511999999999"`
	Status    string  `json:"status" example:"connected"`
	CreatedAt string  `json:"createdAt" example:"2025-11-29T14:18:15.324706Z"`
	UpdatedAt string  `json:"updatedAt" example:"2025-11-29T14:18:15.324706Z"`
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

type GroupResponse struct {
	JID          string   `json:"jid" example:"123456789@g.us"`
	Name         string   `json:"name" example:"My Group"`
	Topic        string   `json:"topic,omitempty" example:"Group description"`
	Participants []string `json:"participants,omitempty"`
}

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

type PrivacySettingsResponse struct {
	Settings interface{} `json:"settings"`
}

// Chat responses

type ChatActionResponse struct {
	Status string `json:"status,omitempty" example:"archived"`
}

// Newsletter responses

type NewsletterResponse struct {
	Data interface{} `json:"data"`
}

type NewsletterListResponse struct {
	Newsletters interface{} `json:"newsletters"`
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

// History sync responses

type SyncProgressResponse struct {
	SyncType          string     `json:"syncType" example:"INITIAL_BOOTSTRAP"`
	Status            string     `json:"status" example:"in_progress"`
	Progress          int        `json:"progress" example:"75"`
	TotalChunks       int        `json:"totalChunks,omitempty" example:"10"`
	ProcessedChunks   int        `json:"processedChunks,omitempty" example:"7"`
	TotalMessages     int        `json:"totalMessages,omitempty" example:"1000"`
	ProcessedMessages int        `json:"processedMessages,omitempty" example:"750"`
	TotalChats        int        `json:"totalChats,omitempty" example:"50"`
	ProcessedChats    int        `json:"processedChats,omitempty" example:"35"`
	Errors            int        `json:"errors,omitempty" example:"0"`
	StartedAt         *time.Time `json:"startedAt,omitempty"`
	CompletedAt       *time.Time `json:"completedAt,omitempty"`
}

type ChatResponse struct {
	JID                 string `json:"jid" example:"5511999999999@s.whatsapp.net"`
	Name                string `json:"name,omitempty" example:"John Doe"`
	UnreadCount         int    `json:"unreadCount,omitempty" example:"5"`
	MarkedAsUnread      bool   `json:"markedAsUnread,omitempty" example:"false"`
	EphemeralExpiration int    `json:"ephemeralExpiration,omitempty" example:"86400"`
	ConversationTS      int64  `json:"conversationTimestamp,omitempty" example:"1699999999"`
	ReadOnly            bool   `json:"readOnly,omitempty" example:"false"`
	Suspended           bool   `json:"suspended,omitempty" example:"false"`
	Locked              bool   `json:"locked,omitempty" example:"false"`
}

type PastParticipantResponse struct {
	UserJID        string    `json:"userJid" example:"5511999999999@s.whatsapp.net"`
	LeaveReason    string    `json:"leaveReason" example:"LEFT"`
	LeaveTimestamp time.Time `json:"leaveTimestamp"`
}

type StickerResponse struct {
	DirectPath string     `json:"directPath,omitempty"`
	MimeType   string     `json:"mimeType,omitempty" example:"image/webp"`
	FileSize   int        `json:"fileSize,omitempty" example:"12345"`
	Width      int        `json:"width,omitempty" example:"512"`
	Height     int        `json:"height,omitempty" example:"512"`
	IsLottie   bool       `json:"isLottie,omitempty" example:"false"`
	IsAvatar   bool       `json:"isAvatar,omitempty" example:"false"`
	Weight     float32    `json:"weight,omitempty" example:"1.5"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
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
