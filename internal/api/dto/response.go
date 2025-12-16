package dto

type ErrorResponse struct {
	Error string `json:"error" example:"session not found"`
}

type MessageOnlyResponse struct {
	Message string `json:"message" example:"operation completed"`
}

type SessionStats struct {
	Messages int `json:"messages" example:"1234"`
	Chats    int `json:"chats" example:"42"`
	Contacts int `json:"contacts" example:"156"`
	Groups   int `json:"groups" example:"12"`
}

type SessionResponse struct {
	ID             string        `json:"id" example:"ce270f0c-c3d6-41ad-b481-1587f813c3b1"`
	Session        string        `json:"session" example:"my-session"`
	DeviceJID      *string       `json:"deviceJid,omitempty" example:"5511999999999@s.whatsapp.net"`
	Phone          *string       `json:"phone,omitempty" example:"5511999999999"`
	Status         string        `json:"status" example:"connected"`
	ApiKey         *string       `json:"apiKey,omitempty" example:"a1b2c3d4e5f6..."`
	PushName       *string       `json:"pushName,omitempty" example:"John Doe"`
	ProfilePicture *string       `json:"profilePicture,omitempty" example:"https://pps.whatsapp.net/..."`
	Stats          *SessionStats `json:"stats,omitempty"`
	CreatedAt      string        `json:"createdAt" example:"2025-11-29T14:18:15.324706Z"`
	UpdatedAt      string        `json:"updatedAt" example:"2025-11-29T14:18:15.324706Z"`
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

type SendResponse struct {
	MessageID string `json:"messageId" example:"ABCD1234"`
	Timestamp int64  `json:"timestamp" example:"1699999999"`
}

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

type CheckPhoneResult struct {
	Phone        string `json:"phone" example:"5511999999999"`
	IsRegistered bool   `json:"isRegistered" example:"true"`
	JID          string `json:"jid,omitempty" example:"5511999999999@s.whatsapp.net"`
}

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

// NewsletterResponse represents newsletter information
type NewsletterResponse struct {
	JID           string `json:"jid" example:"123456789@newsletter"`
	Name          string `json:"name" example:"My Channel"`
	Description   string `json:"description" example:"Channel description"`
	PictureURL    string `json:"pictureUrl,omitempty" example:"https://..."`
	Subscribers   int    `json:"subscribers" example:"100"`
	Privacy       string `json:"privacy" example:"public"`
	Status        string `json:"status" example:"active"`
	CreatedAt     string `json:"createdAt" example:"2025-01-01T00:00:00Z"`
}

// NewsletterListResponse represents list of newsletters
type NewsletterListResponse struct {
	Count      int                `json:"count" example:"3"`
	Newsletters []NewsletterInfo  `json:"newsletters"`
}

type NewsletterInfo struct {
	JID         string `json:"jid" example:"123456789@newsletter"`
	Name        string `json:"name" example:"My Channel"`
	Description string `json:"description" example:"Channel description"`
	Privacy     string `json:"privacy" example:"public"`
}

// NewsletterMessagesResponse represents newsletter messages
type NewsletterMessagesResponse struct {
	Count    int            `json:"count" example:"50"`
	Messages []MessageItem  `json:"messages"`
}

type MessageItem struct {
	ID        string `json:"id" example:"ABCD1234"`
	Timestamp int64  `json:"timestamp" example:"1701619200"`
	Type      string `json:"type" example:"text"`
	Content   string `json:"content,omitempty" example:"Hello subscribers!"`
	MediaURL  string `json:"mediaUrl,omitempty" example:"https://..."`
	Reactions int    `json:"reactions" example:"5"`
	Views     int    `json:"views" example:"100"`
}

// StatusPrivacyResponse represents status privacy settings
type StatusPrivacyResponse struct {
	Privacy map[string]string `json:"privacy" example:"{\"last_seen\":\"contacts\",\"online\":\"contacts\"}"`
}

// CommunityResponse represents community subgroups
type CommunityResponse struct {
	Groups []CommunityGroup `json:"groups"`
}

type CommunityGroup struct {
	ID      string `json:"id" example:"123456789@g.us"`
	Name    string `json:"name" example:"Subgroup Name"`
	Members int    `json:"members" example:"50"`
}

// NewsletterActionResponse represents result of newsletter action
type NewsletterActionResponse struct {
	Success bool   `json:"success" example:"true"`
	Message string `json:"message" example:"Newsletter followed successfully"`
	JID     string `json:"jid,omitempty" example:"123456789@newsletter"`
}

// NewsletterLiveResponse represents live subscription result
type NewsletterLiveResponse struct {
	Duration string `json:"duration" example:"24h0m0s"`
	Message  string `json:"message" example:"Live updates subscribed"`
}

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
	ID                  string           `json:"id" example:"ce270f0c-c3d6-41ad-b481-1587f813c3b1"`
	JID                 string           `json:"jid" example:"5511999999999@s.whatsapp.net"`
	Name                string           `json:"name,omitempty" example:"John Doe"`
	ContactName         string           `json:"contactName,omitempty" example:"John Doe"`
	ProfilePicture      string           `json:"profilePicture,omitempty" example:"https://..."`
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

type LIDResponse struct {
	Phone string `json:"phone" example:"5511999999999"`
	LID   string `json:"lid" example:"123456789:0@lid"`
}
