package models

import (
	"time"

	"github.com/google/uuid"
)

type MessagingSession struct {
	ID           uuid.UUID `json:"id" db:"id"`
	TenantID     uuid.UUID `json:"tenant_id" db:"tenant_id"`
	Name         string    `json:"name" db:"name"`
	ChannelID    string    `json:"channel_id" db:"channel_id"`
	Platform     string    `json:"platform" db:"platform"`
	Status       string    `json:"status" db:"status"`
	SessionData  []byte    `json:"-" db:"session_data"`
	LastSeen     *time.Time `json:"last_seen" db:"last_seen"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type CreateMessagingSessionRequest struct {
	Name      string `json:"name" validate:"required,min=3,max=255"`
	ChannelID string `json:"channel_id" validate:"required"`
	Platform  string `json:"platform" validate:"required,oneof=whatsapp telegram instagram"`
}

type UpdateMessagingSessionRequest struct {
	Name      string `json:"name" validate:"required,min=3,max=255"`
	ChannelID string `json:"channel_id" validate:"required"`
}
