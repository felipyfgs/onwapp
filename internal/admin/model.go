package admin

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

type TicketEvent struct {
	Event       string      `json:"event"`
	SessionID   string      `json:"sessionId"`
	Session     string      `json:"session"`
	TicketID    string      `json:"ticketId"`
	ContactJid  string      `json:"contactJid"`
	ContactName string      `json:"contactName,omitempty"`
	Status      string      `json:"status"`
	Timestamp   time.Time   `json:"timestamp"`
	Data        interface{} `json:"data,omitempty"`
}

type MessageEvent struct {
	Event      string      `json:"event"`
	SessionID  string      `json:"sessionId"`
	Session    string      `json:"session"`
	TicketID   string      `json:"ticketId,omitempty"`
	ContactJid string      `json:"contactJid"`
	MessageID  string      `json:"messageId"`
	IsFromMe   bool        `json:"isFromMe"`
	Timestamp  time.Time   `json:"timestamp"`
	Data       interface{} `json:"data,omitempty"`
}

const (
	StreamAdmin   = "admin"
	SubjectPrefix = "admin.session"
)
