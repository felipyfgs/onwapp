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
	Name   string `json:"name" example:"default"`
	JID    string `json:"jid,omitempty" example:"5511999999999@s.whatsapp.net"`
	Status string `json:"status" example:"connected"`
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
	ID        int      `json:"id"`
	SessionID int      `json:"sessionId"`
	URL       string   `json:"url"`
	Events    []string `json:"events"`
	Enabled   bool     `json:"enabled"`
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
