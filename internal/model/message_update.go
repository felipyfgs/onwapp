package model

import (
	"encoding/json"
	"time"
)

type UpdateType string

const (
	UpdateTypeEdit           UpdateType = "edit"
	UpdateTypeDelete         UpdateType = "delete"
	UpdateTypeReactionAdd    UpdateType = "reaction_add"
	UpdateTypeReactionRemove UpdateType = "reaction_remove"
	UpdateTypeStatusChange   UpdateType = "status_change"
)

type MessageUpdate struct {
	ID        string          `json:"id"`
	MsgID     string          `json:"msgId"` // WhatsApp message ID
	Type      UpdateType      `json:"type"`
	Actor     string          `json:"actor,omitempty"`
	Data      json.RawMessage `json:"data,omitempty"`
	EventAt   time.Time       `json:"eventAt"`
	CreatedAt time.Time       `json:"createdAt"`
}
