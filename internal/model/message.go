package model

import (
	"encoding/json"
	"time"
)

// MessageStatus maps to whatsmeow receipt types
type MessageStatus string

const (
	MessageStatusPending   MessageStatus = "pending"   // Message sent, waiting for server
	MessageStatusSent      MessageStatus = "sent"      // Server received (single check)
	MessageStatusDelivered MessageStatus = "delivered" // Delivered to recipient (double check)
	MessageStatusRead      MessageStatus = "read"      // Read by recipient (blue checks)
	MessageStatusPlayed    MessageStatus = "played"    // Audio/video played
	MessageStatusFailed    MessageStatus = "failed"    // Failed to send
)

// Message represents a WhatsApp message, closely following whatsmeow structure
type Message struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`

	// Core identifiers (from whatsmeow MessageInfo)
	MessageID string    `json:"messageId"` // Info.ID
	ChatJID   string    `json:"chat"`      // Info.Chat
	SenderJID string    `json:"sender"`    // Info.Sender
	Timestamp time.Time `json:"timestamp"` // Info.Timestamp

	// Sender info
	PushName  string `json:"pushName"`  // Info.PushName
	SenderAlt string `json:"senderAlt"` // Info.SenderAlt (LID)

	// Message type (from Info.Type)
	Type      string `json:"type"`      // text, image, video, audio, document, sticker, etc.
	MediaType string `json:"mediaType"` // Info.MediaType
	Category  string `json:"category"`  // Info.Category

	// Content
	Content string `json:"content"` // Text content or caption

	// Flags from whatsmeow
	IsFromMe    bool `json:"isFromMe"`    // Info.IsFromMe
	IsGroup     bool `json:"isGroup"`     // Info.IsGroup
	IsEphemeral bool `json:"isEphemeral"` // IsEphemeral
	IsViewOnce  bool `json:"isViewOnce"`  // IsViewOnce || IsViewOnceV2
	IsEdit      bool `json:"isEdit"`      // IsEdit

	// Edit info (from MsgBotInfo)
	EditTargetID string `json:"editTargetId,omitempty"` // MsgBotInfo.EditTargetID

	// Reply/Quote info (from MsgMetaInfo)
	QuotedID     string `json:"quotedId,omitempty"`     // MsgMetaInfo.TargetID
	QuotedSender string `json:"quotedSender,omitempty"` // MsgMetaInfo.TargetSender

	// Status tracking (updated via receipts)
	Status      MessageStatus `json:"status"`
	DeliveredAt *time.Time    `json:"deliveredAt,omitempty"`
	ReadAt      *time.Time    `json:"readAt,omitempty"`

	// Reactions - stored as JSONB array
	Reactions json.RawMessage `json:"reactions,omitempty"`

	// Raw event JSON for full fidelity
	RawEvent json.RawMessage `json:"rawEvent,omitempty"`

	CreatedAt time.Time `json:"createdAt"`
}

// Reaction represents a single reaction on a message
type Reaction struct {
	Emoji     string `json:"emoji"`
	SenderJid string `json:"senderJid"`
	Timestamp int64  `json:"timestamp"`
}
