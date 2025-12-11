package model

import (
	"encoding/json"
	"time"
)

type UpdateType string

const (
	UpdateTypeEdit   UpdateType = "edit"
	UpdateTypeDelete UpdateType = "delete"

	UpdateTypeReaction UpdateType = "reaction"

	UpdateTypeDelivered UpdateType = "delivered"
	UpdateTypeRead      UpdateType = "read"
	UpdateTypePlayed    UpdateType = "played"
)

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

type ReactionData struct {
	Action    string `json:"action"`
	Emoji     string `json:"emoji"`
	Timestamp int64  `json:"timestamp"`
}

type EditData struct {
	OldContent string `json:"oldContent,omitempty"`
	NewContent string `json:"newContent"`
}

type DeleteData struct {
	DeletedBy string `json:"deletedBy"`
}

type ReceiptData struct {
	Chat      string `json:"chat"`
	Timestamp int64  `json:"timestamp"`
}
