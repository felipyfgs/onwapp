package model

import "time"

// Chat represents a conversation with extended metadata from History Sync
// Complements (not duplicates) whatsmeow_chat_settings
type Chat struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`
	ChatJID   string `json:"chatJid"`

	// Display name (group name or contact name)
	Name string `json:"name,omitempty"`

	// Unread tracking
	UnreadCount        int  `json:"unreadCount"`
	UnreadMentionCount int  `json:"unreadMentionCount"`
	MarkedAsUnread     bool `json:"markedAsUnread"`

	// Ephemeral/Disappearing messages settings
	EphemeralExpiration         int   `json:"ephemeralExpiration,omitempty"`
	EphemeralSettingTimestamp   int64 `json:"ephemeralSettingTimestamp,omitempty"`
	DisappearingModeInitiator   int16 `json:"disappearingInitiator,omitempty"`

	// Chat state flags
	ReadOnly  bool `json:"readOnly"`
	Suspended bool `json:"suspended"`
	Locked    bool `json:"locked"`

	// Limit sharing (privacy feature)
	LimitSharing            bool  `json:"limitSharing"`
	LimitSharingTimestamp   int64 `json:"limitSharingTimestamp,omitempty"`
	LimitSharingTrigger     int16 `json:"limitSharingTrigger,omitempty"`
	LimitSharingInitiatedByMe bool `json:"limitSharingInitiatedByMe,omitempty"`

	// Group specific
	IsDefaultSubgroup bool `json:"isDefaultSubgroup"`
	CommentsCount     int  `json:"commentsCount,omitempty"`

	// Activity tracking
	ConversationTimestamp int64 `json:"conversationTimestamp,omitempty"`

	// Participant hash (for detecting membership changes)
	PHash string `json:"pHash,omitempty"`

	// Spam flag
	NotSpam *bool `json:"notSpam,omitempty"`

	// Timestamps
	SyncedAt  time.Time `json:"syncedAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Denormalized fields from whatsmeow_chat_settings (populated via JOIN/view)
	Archived bool   `json:"archived,omitempty"`
	Pinned   bool   `json:"pinned,omitempty"`
	Muted    string `json:"muted,omitempty"`
}

// IsGroup returns true if this is a group chat
func (c *Chat) IsGroup() bool {
	return len(c.ChatJID) > 0 && c.ChatJID[len(c.ChatJID)-12:] == "@g.us"
}

// HasUnread returns true if there are unread messages
func (c *Chat) HasUnread() bool {
	return c.UnreadCount > 0 || c.MarkedAsUnread
}

// HasEphemeral returns true if ephemeral messages are enabled
func (c *Chat) HasEphemeral() bool {
	return c.EphemeralExpiration > 0
}
