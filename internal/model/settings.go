package model

import "time"

type Settings struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`

	AlwaysOnline    bool `json:"alwaysOnline"`
	AutoRejectCalls bool `json:"autoRejectCalls"`
	SyncHistory     bool `json:"syncHistory"`

	LastSeen     string `json:"lastSeen"`
	Online       string `json:"online"`
	ProfilePhoto string `json:"profilePhoto"`
	Status       string `json:"status"`
	ReadReceipts string `json:"readReceipts"`
	GroupAdd     string `json:"groupAdd"`
	CallAdd      string `json:"callAdd"`

	DefaultDisappearingTimer string `json:"defaultDisappearingTimer"`

	PrivacySyncedAt *time.Time `json:"privacySyncedAt,omitempty"`

	CreatedAt *time.Time `json:"createdAt,omitempty"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
}

func DefaultLocalSettings(sessionID string) *Settings {
	return &Settings{
		SessionID:                sessionID,
		AlwaysOnline:             false,
		AutoRejectCalls:          false,
		SyncHistory:              false,
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
