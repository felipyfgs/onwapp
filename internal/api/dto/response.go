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
