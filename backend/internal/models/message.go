package models

import (
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID            uuid.UUID `json:"id" db:"id"`
	TicketID      uuid.UUID `json:"ticket_id" db:"ticket_id"`
	WhatsAppMsgID string    `json:"whatsapp_msg_id" db:"whatsapp_msg_id"`
	Body          string    `json:"body" db:"body"`
	MediaURL      string    `json:"media_url" db:"media_url"`
	MediaType     string    `json:"media_type" db:"media_type"`
	FromMe        bool      `json:"from_me" db:"from_me"`
	IsRead        bool      `json:"is_read" db:"is_read"`
	Ack           int       `json:"ack" db:"ack"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

type CreateMessageRequest struct {
	TicketID      uuid.UUID `json:"ticket_id" validate:"required"`
	WhatsAppMsgID string    `json:"whatsapp_msg_id"`
	Body          string    `json:"body"`
	MediaURL      string    `json:"media_url"`
	MediaType     string    `json:"media_type"`
	FromMe        bool      `json:"from_me"`
}
