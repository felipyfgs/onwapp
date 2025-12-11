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
	UpdateTypeEdit   UpdateType = "edit"
	UpdateTypeDelete UpdateType = "delete"

	// Reaction Updates
	UpdateTypeReaction UpdateType = "reaction"

	// Delivery Status Updates
	UpdateTypeDelivered UpdateType = "delivered"
	UpdateTypeRead      UpdateType = "read"
	UpdateTypePlayed    UpdateType = "played"
)

// =============================================================================
// MESSAGE UPDATE
// =============================================================================

// MessageUpdate tracks all changes to messages over time.
// This provides an audit trail and enables syncing reactions/status.
type MessageUpdate struct {
	ID        string          `json:"id"`
	SessionID string          `json:"sessionId"`
	MsgID     string          `json:"msgId"`
	Type      UpdateType      `json:"type"`
	Actor     string          `json:"actor,omitempty"`
	Data      json.RawMessage `json:"data,omitempty"`
	EventAt   time.Time       `json:"eventAt"`
	CreatedAt time.Time       `json:"createdAt"`
}

// =============================================================================
// UPDATE DATA STRUCTURES
// =============================================================================

// ReactionData is stored in MessageUpdate.Data for reaction updates
type ReactionData struct {
	Action    string `json:"action"`
	Emoji     string `json:"emoji"`
	Timestamp int64  `json:"timestamp"`
}

// EditData is stored in MessageUpdate.Data for edit updates
type EditData struct {
	OldContent string `json:"oldContent,omitempty"`
	NewContent string `json:"newContent"`
}

// DeleteData is stored in MessageUpdate.Data for delete updates
type DeleteData struct {
	DeletedBy string `json:"deletedBy"`
}

// ReceiptData is stored in MessageUpdate.Data for delivery/read/played updates
type ReceiptData struct {
	Chat      string `json:"chat"`
	Timestamp int64  `json:"timestamp"`
}
