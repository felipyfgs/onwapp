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
	MessageStatusPending   MessageStatus = "pending"
	MessageStatusSent      MessageStatus = "sent"
	MessageStatusDelivered MessageStatus = "delivered"
	MessageStatusRead      MessageStatus = "read"
	MessageStatusPlayed    MessageStatus = "played"
	MessageStatusFailed    MessageStatus = "failed"
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
	MessageTypeSystem       MessageType = "system"
	MessageTypeUnknown      MessageType = "unknown"
)

// =============================================================================
// MESSAGE DIRECTION
// =============================================================================

type MessageDirection string

const (
	DirectionIncoming MessageDirection = "incoming"
	DirectionOutgoing MessageDirection = "outgoing"
)

// =============================================================================
// MESSAGE STUB TYPES (System Messages)
// =============================================================================

type MessageStubType int

const (
	StubTypeRevoke                  MessageStubType = 1
	StubTypeGroupCreate             MessageStubType = 4
	StubTypeGroupSubjectChange      MessageStubType = 7
	StubTypeGroupIconChange         MessageStubType = 9
	StubTypeGroupDescChange         MessageStubType = 12
	StubTypeGroupParticipantAdd     MessageStubType = 28
	StubTypeGroupParticipantRemove  MessageStubType = 31
	StubTypeGroupParticipantLeave   MessageStubType = 32
	StubTypeGroupParticipantPromote MessageStubType = 29
	StubTypeGroupParticipantDemote  MessageStubType = 30
	StubTypeCrypt                   MessageStubType = 39
	StubTypeIdentityChange          MessageStubType = 40
	StubTypeGroupInviteLink         MessageStubType = 46
	StubTypeEphemeralSetting        MessageStubType = 64
	StubTypeEphemeralSync           MessageStubType = 65
	StubTypeBlockContact            MessageStubType = 73
	StubTypeEphemeralNotification   MessageStubType = 74
	StubTypeCommunityCreate         MessageStubType = 130
	StubTypeCommunitySubgroupAdd    MessageStubType = 131
	StubTypeMessageDeleted          MessageStubType = 132
)

// =============================================================================
// MESSAGE
// =============================================================================

type Message struct {
	// Primary Key
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`

	// WhatsApp Identifiers
	MsgId     string    `json:"msgId"`
	ChatJID   string    `json:"chatJid"`
	SenderJID string    `json:"senderJid"`
	Timestamp time.Time `json:"timestamp"`

	// Sender Info
	PushName     string  `json:"pushName,omitempty"`
	SenderAlt    string  `json:"senderAlt,omitempty"`
	ServerId     *int64  `json:"serverId,omitempty"`
	VerifiedName *string `json:"verifiedName,omitempty"`

	// Message Classification
	Type      string `json:"type"`
	MediaType string `json:"mediaType,omitempty"`
	Category  string `json:"category,omitempty"`

	// Content
	Content string `json:"content,omitempty"`

	// Direction & Context Flags
	FromMe    bool `json:"fromMe"`
	IsGroup   bool `json:"isGroup"`
	Ephemeral bool `json:"ephemeral"`
	ViewOnce  bool `json:"viewOnce"`
	IsEdit    bool `json:"isEdit"`

	// Edit Context
	EditTargetID string `json:"editTargetId,omitempty"`

	// Reply/Quote Context
	QuotedID     string `json:"quotedId,omitempty"`
	QuotedSender string `json:"quotedSender,omitempty"`

	// Chatwoot Integration
	CwMsgId    *int   `json:"cwMsgId,omitempty"`
	CwConvId   *int   `json:"cwConvId,omitempty"`
	CwSourceId string `json:"cwSourceId,omitempty"`

	// Delivery Status (for outgoing messages)
	Status      MessageStatus `json:"status"`
	DeliveredAt *time.Time    `json:"deliveredAt,omitempty"`
	ReadAt      *time.Time    `json:"readAt,omitempty"`

	// Reactions Array
	Reactions json.RawMessage `json:"reactions,omitempty"`

	// Full Event Data
	RawEvent json.RawMessage `json:"rawEvent,omitempty"`

	// History Sync Fields
	MsgOrderID    *int64   `json:"msgOrderId,omitempty"`
	StubType      *int     `json:"stubType,omitempty"`
	StubParams    []string `json:"stubParams,omitempty"`
	MessageSecret []byte   `json:"messageSecret,omitempty"`
	Broadcast     bool     `json:"broadcast,omitempty"`

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

// IsSystemMessage returns true if this is a system/stub message
func (m *Message) IsSystemMessage() bool {
	return m.StubType != nil && *m.StubType > 0
}

// IsParticipantEvent returns true if this is a participant add/remove/leave event
func (m *Message) IsParticipantEvent() bool {
	if m.StubType == nil {
		return false
	}
	switch MessageStubType(*m.StubType) {
	case StubTypeGroupParticipantAdd, StubTypeGroupParticipantRemove,
		StubTypeGroupParticipantLeave, StubTypeGroupParticipantPromote,
		StubTypeGroupParticipantDemote:
		return true
	}
	return false
}

// IsValid checks if the MessageStatus is a valid status
func (s MessageStatus) IsValid() bool {
	switch s {
	case MessageStatusPending, MessageStatusSent, MessageStatusDelivered,
		MessageStatusRead, MessageStatusPlayed, MessageStatusFailed:
		return true
	}
	return false
}

// IsValid checks if the MessageType is a valid type
func (t MessageType) IsValid() bool {
	switch t {
	case MessageTypeText, MessageTypeImage, MessageTypeVideo, MessageTypeAudio,
		MessageTypeDocument, MessageTypeSticker, MessageTypeLocation,
		MessageTypeLiveLocation, MessageTypeContact, MessageTypePoll,
		MessageTypeReaction, MessageTypeInteractive, MessageTypeProtocol,
		MessageTypeSystem, MessageTypeUnknown:
		return true
	}
	return false
}
