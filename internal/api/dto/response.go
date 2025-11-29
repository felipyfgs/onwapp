package dto

// Common responses

type ErrorResponse struct {
	Error string `json:"error" example:"session not found"`
}

type MessageResponse struct {
	Message string `json:"message" example:"operation completed"`
	Status  string `json:"status,omitempty" example:"connected"`
}

type SuccessResponse struct {
	Success bool   `json:"success" example:"true"`
	Message string `json:"message,omitempty" example:"operation completed"`
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

type SessionListResponse struct {
	Success  bool              `json:"success" example:"true"`
	Sessions []SessionResponse `json:"sessions"`
}

type QRResponse struct {
	QR     string `json:"qr,omitempty" example:"2@ABC123..."`
	Status string `json:"status" example:"connecting"`
}

// Message responses

type SendResponse struct {
	Success   bool   `json:"success" example:"true"`
	MessageID string `json:"messageId,omitempty" example:"ABCD1234"`
	Timestamp int64  `json:"timestamp,omitempty" example:"1699999999"`
}

// Webhook responses

type WebhookResponse struct {
	ID        string   `json:"id,omitempty"`
	SessionID string   `json:"sessionId"`
	URL       string   `json:"url,omitempty"`
	Events    []string `json:"events,omitempty"`
	Enabled   bool     `json:"enabled"`
}

type EventsResponse struct {
	Categories map[string][]string `json:"categories"`
	All        []string            `json:"all"`
}

// Contact responses

type CheckPhoneResponse struct {
	Phone      string `json:"phone"`
	IsWhatsApp bool   `json:"isWhatsApp"`
	JID        string `json:"jid,omitempty"`
}

// Group responses

type GroupResponse struct {
	JID          string   `json:"jid"`
	Name         string   `json:"name"`
	Topic        string   `json:"topic,omitempty"`
	Participants []string `json:"participants,omitempty"`
}

// Profile responses

type ProfileResponse struct {
	JID      string `json:"jid"`
	PushName string `json:"pushName"`
}

type PrivacyResponse struct {
	GroupAdd     string `json:"groupAdd"`
	LastSeen     string `json:"lastSeen"`
	Status       string `json:"status"`
	Profile      string `json:"profile"`
	ReadReceipts string `json:"readReceipts"`
	CallAdd      string `json:"callAdd"`
	Online       string `json:"online"`
}

// Chat responses

type ChatActionResponse struct {
	Success bool   `json:"success" example:"true"`
	Status  string `json:"status,omitempty" example:"archived"`
}

// Contact responses (extended)

type CheckPhoneResult struct {
	Phone        string `json:"phone"`
	IsRegistered bool   `json:"isRegistered"`
	JID          string `json:"jid,omitempty"`
}

type CheckPhoneResultsResponse struct {
	Success bool               `json:"success"`
	Results []CheckPhoneResult `json:"results"`
}

type ContactInfoResponse struct {
	Success bool                   `json:"success"`
	Users   map[string]interface{} `json:"users"`
}

type AvatarResponse struct {
	Success bool   `json:"success"`
	URL     string `json:"url"`
	ID      string `json:"id,omitempty"`
}

type ContactsListResponse struct {
	Success  bool        `json:"success"`
	Contacts interface{} `json:"contacts"`
}

type PresenceResponse struct {
	Success bool   `json:"success"`
	Status  string `json:"status"`
}

type ChatPresenceResponse struct {
	Success bool   `json:"success"`
	State   string `json:"state"`
}

// Group responses (extended)

type GroupActionResponse struct {
	Success bool        `json:"success" example:"true"`
	GroupID string      `json:"groupId,omitempty" example:"123456789@g.us"`
	Data    interface{} `json:"data,omitempty"`
}

type GroupInviteLinkResponse struct {
	Success bool   `json:"success"`
	GroupID string `json:"groupId"`
	Link    string `json:"link"`
}

// Profile responses (extended)

type ProfileInfoResponse struct {
	Success bool        `json:"success"`
	Profile interface{} `json:"profile"`
}

type SetStatusResponse struct {
	Success bool   `json:"success"`
	Status  string `json:"status"`
}

type SetNameResponse struct {
	Success bool   `json:"success"`
	Name    string `json:"name"`
}

type SetPictureResponse struct {
	Success   bool   `json:"success"`
	PictureID string `json:"pictureId"`
}

type PrivacySettingsResponse struct {
	Success  bool        `json:"success"`
	Settings interface{} `json:"settings"`
}

// Blocklist responses

type BlocklistResponse struct {
	Success bool     `json:"success"`
	JIDs    []string `json:"jids"`
}

type BlocklistActionResponse struct {
	Success bool   `json:"success"`
	Action  string `json:"action"`
	Phone   string `json:"phone"`
}

// Newsletter responses

type NewsletterResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}

type NewsletterListResponse struct {
	Success     bool        `json:"success"`
	Newsletters interface{} `json:"newsletters"`
}

// Status responses

type StatusPrivacyResponse struct {
	Success bool        `json:"success"`
	Privacy interface{} `json:"privacy"`
}

// Group request participants response

type GroupRequestParticipantsResponse struct {
	Success      bool        `json:"success"`
	GroupID      string      `json:"groupId"`
	Participants interface{} `json:"participants"`
}

// QR Link response

type QRLinkResponse struct {
	Success bool   `json:"success"`
	Link    string `json:"link"`
}

// Business profile response

type BusinessProfileResponse struct {
	Success bool        `json:"success"`
	Profile interface{} `json:"profile"`
}

// Pair phone response

type PairPhoneResponse struct {
	Success bool   `json:"success"`
	Code    string `json:"code"`
}

// Community response

type CommunityResponse struct {
	Success bool        `json:"success"`
	Groups  interface{} `json:"groups,omitempty"`
}
