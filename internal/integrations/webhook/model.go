package webhook

import "time"

// Webhook represents a webhook configuration for a session
type Webhook struct {
	ID        string
	SessionID string
	URL       string
	Events    []string
	Enabled   bool
	Secret    string
	CreatedAt *time.Time
	UpdatedAt *time.Time
}
