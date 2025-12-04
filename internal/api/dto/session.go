package dto

// Session Request DTOs

// CreateSessionReq is the request to create a new session
type CreateSessionReq struct {
	Session string `json:"session" binding:"required" example:"my-session"`
}

// PairPhoneReq is the request to pair via phone number
type PairPhoneReq struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
}

// Session Response Data DTOs

// SessionData represents session information
type SessionData struct {
	Session string `json:"session" example:"my-session"`
	JID     string `json:"jid,omitempty" example:"5511999999999@s.whatsapp.net"`
	Phone   string `json:"phone,omitempty" example:"5511999999999"`
	Status  string `json:"status" example:"connected"`
}

// QRData represents QR code information
type QRData struct {
	Code   string `json:"code,omitempty" example:"2@ABC123..."`
	Base64 string `json:"base64,omitempty" example:"data:image/png;base64,..."`
	Status string `json:"status" example:"pending"`
}

// PairPhoneData represents pairing code information
type PairPhoneData struct {
	Code string `json:"code" example:"ABCD-EFGH"`
}

// MessageData represents a simple message response
type MessageData struct {
	Message string `json:"message" example:"operation completed successfully"`
}

// NOTE: SessionResponse, SessionListResponse, QRResponse, PairPhoneResponse, MessageResponse
// are defined in response.go
