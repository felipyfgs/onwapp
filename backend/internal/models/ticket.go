package models

import (
	"time"

	"github.com/google/uuid"
)

type Ticket struct {
	ID              uuid.UUID `json:"id" db:"id"`
	TenantID        uuid.UUID `json:"tenant_id" db:"tenant_id"`
	ContactID       uuid.UUID `json:"contact_id" db:"contact_id"`
	QueueID         *uuid.UUID `json:"queue_id" db:"queue_id"`
	UserID          *uuid.UUID `json:"user_id" db:"user_id"`
	SessionID       uuid.UUID `json:"session_id" db:"session_id"`
	Status          string    `json:"status" db:"status"`
	UnreadMessages  bool      `json:"unread_messages" db:"unread_messages"`
	LastMessageAt   *time.Time `json:"last_message_at" db:"last_message_at"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

type CreateTicketRequest struct {
	ContactID uuid.UUID `json:"contact_id" validate:"required"`
	QueueID   uuid.UUID `json:"queue_id"`
	SessionID uuid.UUID `json:"session_id" validate:"required"`
}

type TicketWithMessages struct {
	Ticket   *Ticket  `json:"ticket"`
	Messages []Message `json:"messages"`
	Contact  *Contact `json:"contact"`
}

type AssignTicketRequest struct {
	UserID uuid.UUID `json:"user_id" validate:"required"`
}

type TransferTicketRequest struct {
	QueueID uuid.UUID `json:"queue_id" validate:"required"`
}
