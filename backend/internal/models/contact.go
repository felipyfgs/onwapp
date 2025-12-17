package models

import (
	"time"

	"github.com/google/uuid"
)

type Contact struct {
	ID             uuid.UUID `json:"id" db:"id"`
	TenantID       uuid.UUID `json:"tenant_id" db:"tenant_id"`
	WhatsAppID     string    `json:"whatsapp_id" db:"whatsapp_id"`
	Name           string    `json:"name" db:"name"`
	PhoneNumber    string    `json:"phone_number" db:"phone_number"`
	ProfilePicURL  string    `json:"profile_pic_url" db:"profile_pic_url"`
	IsGroup        bool      `json:"is_group" db:"is_group"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type CreateContactRequest struct {
	WhatsAppID    string `json:"whatsapp_id"`
	Name          string `json:"name" validate:"required,min=3,max=255"`
	PhoneNumber   string `json:"phone_number" validate:"required"`
	ProfilePicURL string `json:"profile_pic_url"`
	IsGroup       bool   `json:"is_group"`
}
