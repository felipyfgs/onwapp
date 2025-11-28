package model

import (
	"encoding/json"
	"time"
)

// =============================================================================
// UPDATE TYPE
// =============================================================================

type UpdateType string

const (
	// Content Updates
	UpdateTypeEdit   UpdateType = "edit"   // Message edited
	UpdateTypeDelete UpdateType = "delete" // Message deleted/revoked

	// Reaction Updates
	UpdateTypeReaction UpdateType = "reaction" // Reaction added/removed

	// Delivery Status Updates
	UpdateTypeDelivered UpdateType = "delivered" // Message delivered to recipient
	UpdateTypeRead      UpdateType = "read"      // Message read by recipient
	UpdateTypePlayed    UpdateType = "played"    // Audio/video played by recipient
)

// =============================================================================
// MESSAGE UPDATE
// =============================================================================

// MessageUpdate tracks all changes to messages over time.
// This provides an audit trail and enables syncing reactions/status.
type MessageUpdate struct {
	ID        string          `json:"id"`
	SessionID string          `json:"sessionId"`
	MsgID     string          `json:"msgId"` // WhatsApp message ID (references zpMessages.messageId)
	Type      UpdateType      `json:"type"`
	Actor     string          `json:"actor,omitempty"` // Who performed the action (JID)
	Data      json.RawMessage `json:"data,omitempty"`  // Type-specific data (see below)
	EventAt   time.Time       `json:"eventAt"`         // When the event occurred (WhatsApp time)
	CreatedAt time.Time       `json:"createdAt"`       // When we recorded it
}

// =============================================================================
// UPDATE DATA STRUCTURES
// =============================================================================

// ReactionData is stored in MessageUpdate.Data for reaction updates
type ReactionData struct {
	Action    string `json:"action"`    // "add" or "remove"
	Emoji     string `json:"emoji"`     // The emoji
	Timestamp int64  `json:"timestamp"` // Reaction timestamp (ms)
}

// EditData is stored in MessageUpdate.Data for edit updates
type EditData struct {
	OldContent string `json:"oldContent,omitempty"` // Previous content
	NewContent string `json:"newContent"`           // New content
}

// DeleteData is stored in MessageUpdate.Data for delete updates
type DeleteData struct {
	DeletedBy string `json:"deletedBy"` // "sender" or "admin"
}

// ReceiptData is stored in MessageUpdate.Data for delivery/read/played updates
type ReceiptData struct {
	Chat      string `json:"chat"`      // Chat JID
	Timestamp int64  `json:"timestamp"` // Event timestamp (ms)
}
