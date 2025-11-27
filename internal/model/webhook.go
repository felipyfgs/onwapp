package model

import "time"

type Webhook struct {
	ID        int
	SessionID int
	URL       string
	Events    []string
	Enabled   bool
	Secret    string
	CreatedAt *time.Time
	UpdatedAt *time.Time
}

type WebhookEvent string

const (
	WebhookEventMessageReceived     WebhookEvent = "message.received"
	WebhookEventMessageSent         WebhookEvent = "message.sent"
	WebhookEventSessionConnected    WebhookEvent = "session.connected"
	WebhookEventSessionDisconnected WebhookEvent = "session.disconnected"
	WebhookEventSessionLoggedOut    WebhookEvent = "session.logged_out"
	WebhookEventAll                 WebhookEvent = "*"
)
