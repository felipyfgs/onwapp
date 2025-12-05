package model

import "time"

type Settings struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`

	// Local Settings (managed by onwapp only)
	AlwaysOnline    bool `json:"alwaysOnline"`
	AutoRejectCalls bool `json:"autoRejectCalls"`
	SyncHistory     bool `json:"syncHistory"`

	// Privacy Settings (synced from WhatsApp on connect, applied to WhatsApp on update)
	LastSeen     string `json:"lastSeen"`
	Online       string `json:"online"`
	ProfilePhoto string `json:"profilePhoto"`
	Status       string `json:"status"`
	ReadReceipts string `json:"readReceipts"`
	GroupAdd     string `json:"groupAdd"`
	CallAdd      string `json:"callAdd"`

	// Chat Settings (synced from WhatsApp on connect, applied to WhatsApp on update)
	DefaultDisappearingTimer string `json:"defaultDisappearingTimer"`

	// Sync status
	PrivacySyncedAt *time.Time `json:"privacySyncedAt,omitempty"`

	CreatedAt *time.Time `json:"createdAt,omitempty"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
}

// DefaultLocalSettings returns settings with only local defaults
// Privacy settings will be synced from WhatsApp on connect
func DefaultLocalSettings(sessionID string) *Settings {
	return &Settings{
		SessionID:       sessionID,
		AlwaysOnline:    false,
		AutoRejectCalls: false,
		SyncHistory:     false,
		// Privacy fields left empty - will be filled on sync from WhatsApp
		LastSeen:                 "",
		Online:                   "",
		ProfilePhoto:             "",
		Status:                   "",
		ReadReceipts:             "",
		GroupAdd:                 "",
		CallAdd:                  "",
		DefaultDisappearingTimer: "",
	}
}
