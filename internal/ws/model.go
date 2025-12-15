package ws

import "time"

type SessionEvent struct {
	Event     string      `json:"event"`
	SessionID string      `json:"sessionId"`
	Session   string      `json:"session"`
	Status    string      `json:"status"`
	Timestamp time.Time   `json:"timestamp"`
	Data      interface{} `json:"data,omitempty"`
}

type QRData struct {
	QRCode      string `json:"qrCode,omitempty"`
	QRBase64    string `json:"qrBase64,omitempty"`
	PairingCode string `json:"pairingCode,omitempty"`
}

const (
	StreamAdmin   = "admin"
	SubjectPrefix = "admin.session"
)
