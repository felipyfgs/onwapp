package webhook

import "time"

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
