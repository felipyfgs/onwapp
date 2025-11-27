package model

import (
	"encoding/json"
	"time"
)

type UpdateType string

const (
	UpdateTypeEdit         UpdateType = "edit"
	UpdateTypeDelete       UpdateType = "delete"
	UpdateTypeReaction     UpdateType = "reaction"
	UpdateTypeStatusChange UpdateType = "status"
)

type MessageUpdate struct {
	ID        string          `json:"id"`
	SessionID string          `json:"sessionId"`
	MsgID     string          `json:"msgId"` // WhatsApp message ID
	Type      UpdateType      `json:"type"`
	Actor     string          `json:"actor,omitempty"`
	Data      json.RawMessage `json:"data,omitempty"`
	EventAt   time.Time       `json:"eventAt"`
	CreatedAt time.Time       `json:"createdAt"`
}
