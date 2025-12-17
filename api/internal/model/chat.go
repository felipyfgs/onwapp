package model

import "time"

type Chat struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`
	ChatJID   string `json:"chatJid"`

	Name string `json:"name,omitempty"`

	UnreadCount        int  `json:"unreadCount"`
	UnreadMentionCount int  `json:"unreadMentionCount"`
	MarkedAsUnread     bool `json:"markedAsUnread"`

	EphemeralExpiration       int   `json:"ephemeralExpiration,omitempty"`
	EphemeralSettingTimestamp int64 `json:"ephemeralSettingTimestamp,omitempty"`
	DisappearingModeInitiator int16 `json:"disappearingInitiator,omitempty"`

	ReadOnly  bool `json:"readOnly"`
	Suspended bool `json:"suspended"`
	Locked    bool `json:"locked"`

	LimitSharing              bool  `json:"limitSharing"`
	LimitSharingTimestamp     int64 `json:"limitSharingTimestamp,omitempty"`
	LimitSharingTrigger       int16 `json:"limitSharingTrigger,omitempty"`
	LimitSharingInitiatedByMe bool  `json:"limitSharingInitiatedByMe,omitempty"`

	IsDefaultSubgroup bool `json:"isDefaultSubgroup"`
	CommentsCount     int  `json:"commentsCount,omitempty"`

	ConversationTimestamp int64 `json:"conversationTimestamp,omitempty"`

	PHash string `json:"pHash,omitempty"`

	NotSpam *bool `json:"notSpam,omitempty"`

	SyncedAt  time.Time `json:"syncedAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	Archived bool   `json:"archived,omitempty"`
	Pinned   bool   `json:"pinned,omitempty"`
	Muted    string `json:"muted,omitempty"`
}

func (c *Chat) IsGroup() bool {
	return len(c.ChatJID) > 0 && c.ChatJID[len(c.ChatJID)-12:] == "@g.us"
}

func (c *Chat) HasUnread() bool {
	return c.UnreadCount > 0 || c.MarkedAsUnread
}

func (c *Chat) HasEphemeral() bool {
	return c.EphemeralExpiration > 0
}
