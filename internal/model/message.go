package model

import (
	"encoding/json"
	"time"
)

// =============================================================================
// MESSAGE STATUS
// =============================================================================

type MessageStatus string

const (
	MessageStatusPending   MessageStatus = "pending"   // Waiting for server
	MessageStatusSent      MessageStatus = "sent"      // Server received (single check)
	MessageStatusDelivered MessageStatus = "delivered" // Delivered to recipient (double check)
	MessageStatusRead      MessageStatus = "read"      // Read by recipient (blue checks)
	MessageStatusPlayed    MessageStatus = "played"    // Audio/video played
	MessageStatusFailed    MessageStatus = "failed"    // Failed to send
)

// =============================================================================
// MESSAGE TYPE
// =============================================================================

type MessageType string

const (
	MessageTypeText         MessageType = "text"
	MessageTypeImage        MessageType = "image"
	MessageTypeVideo        MessageType = "video"
	MessageTypeAudio        MessageType = "audio"
	MessageTypeDocument     MessageType = "document"
	MessageTypeSticker      MessageType = "sticker"
	MessageTypeLocation     MessageType = "location"
	MessageTypeLiveLocation MessageType = "live_location"
	MessageTypeContact      MessageType = "contact"
	MessageTypePoll         MessageType = "poll"
	MessageTypeReaction     MessageType = "reaction"
	MessageTypeInteractive  MessageType = "interactive"
	MessageTypeProtocol     MessageType = "protocol"
	MessageTypeUnknown      MessageType = "unknown"
)

// =============================================================================
// MESSAGE DIRECTION
// =============================================================================

type MessageDirection string

const (
	DirectionIncoming MessageDirection = "incoming" // Received from others
	DirectionOutgoing MessageDirection = "outgoing" // Sent by us
)

// =============================================================================
// MESSAGE
// =============================================================================

type Message struct {
	// Primary Key
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`

	// WhatsApp Identifiers
	MsgId     string    `json:"msgId"`     // WhatsApp message ID
	ChatJID   string    `json:"chatJid"`   // Chat JID
	SenderJID string    `json:"senderJid"` // Sender JID
	Timestamp time.Time `json:"timestamp"` // Message timestamp

	// Sender Info
	PushName     string  `json:"pushName,omitempty"`     // Display name
	SenderAlt    string  `json:"senderAlt,omitempty"`    // LID (alternative ID)
	ServerId     *int64  `json:"serverId,omitempty"`     // WhatsApp server ID
	VerifiedName *string `json:"verifiedName,omitempty"` // Business verified name

	// Message Classification
	Type      string `json:"type"`                // text, image, video, audio, etc.
	MediaType string `json:"mediaType,omitempty"` // ptt, image, video, document, etc.
	Category  string `json:"category,omitempty"`  // Message category

	// Content
	Content string `json:"content,omitempty"` // Text or caption

	// Direction & Context Flags
	FromMe    bool `json:"fromMe"`    // true = outgoing
	IsGroup   bool `json:"isGroup"`   // true = group message
	Ephemeral bool `json:"ephemeral"` // Disappearing message
	ViewOnce  bool `json:"viewOnce"`  // View once media
	IsEdit    bool `json:"isEdit"`    // Edited message

	// Edit Context
	EditTargetID string `json:"editTargetId,omitempty"` // Original message ID if edit

	// Reply/Quote Context
	QuotedID     string `json:"quotedId,omitempty"`     // Replied message ID
	QuotedSender string `json:"quotedSender,omitempty"` // Replied message sender

	// Chatwoot Integration
	CwMsgId    *int   `json:"cwMsgId,omitempty"`    // Chatwoot message ID
	CwConvId   *int   `json:"cwConvId,omitempty"`   // Chatwoot conversation ID
	CwSourceId string `json:"cwSourceId,omitempty"` // Source ID (WAID:xxx)

	// Delivery Status (for outgoing messages)
	Status      MessageStatus `json:"status"`
	DeliveredAt *time.Time    `json:"deliveredAt,omitempty"`
	ReadAt      *time.Time    `json:"readAt,omitempty"`

	// Reactions Array
	Reactions json.RawMessage `json:"reactions,omitempty"`

	// Full Event Data
	RawEvent json.RawMessage `json:"rawEvent,omitempty"`

	// Metadata
	CreatedAt time.Time `json:"createdAt"`
}

// =============================================================================
// REACTION
// =============================================================================

type Reaction struct {
	Emoji     string `json:"emoji"`
	SenderJID string `json:"senderJid"`
	Timestamp int64  `json:"timestamp"`
}

// =============================================================================
// HELPER METHODS
// =============================================================================

func (m *Message) Direction() MessageDirection {
	if m.FromMe {
		return DirectionOutgoing
	}
	return DirectionIncoming
}

func (m *Message) IsMedia() bool {
	switch m.Type {
	case "image", "video", "audio", "document", "sticker":
		return true
	}
	return false
}
