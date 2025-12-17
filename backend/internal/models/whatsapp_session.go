package models

import (
	"time"

	"github.com/google/uuid"
)

type WhatsAppSession struct {
	ID           uuid.UUID `json:"id" db:"id"`
	TenantID     uuid.UUID `json:"tenant_id" db:"tenant_id"`
	Name         string    `json:"name" db:"name"`
	PhoneNumber  string    `json:"phone_number" db:"phone_number"`
	Status       string    `json:"status" db:"status"`
	SessionData  []byte    `json:"-" db:"session_data"`
	LastSeen     *time.Time `json:"last_seen" db:"last_seen"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type CreateWhatsAppSessionRequest struct {
	Name        string `json:"name" validate:"required,min=3,max=255"`
	PhoneNumber string `json:"phone_number" validate:"required"`
}

type UpdateWhatsAppSessionRequest struct {
	Name        string `json:"name" validate:"required,min=3,max=255"`
	PhoneNumber string `json:"phone_number" validate:"required"`
}
