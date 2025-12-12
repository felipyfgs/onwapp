package model

import (
	"time"

	"github.com/google/uuid"
)

type TicketStatus string

const (
	TicketStatusPending TicketStatus = "pending"
	TicketStatusOpen    TicketStatus = "open"
	TicketStatusClosed  TicketStatus = "closed"
)

type Ticket struct {
	ID            uuid.UUID     `json:"id"`
	SessionID     uuid.UUID     `json:"sessionId"`
	ContactJid    string        `json:"contactJid"`
	ContactName   *string       `json:"contactName,omitempty"`
	ContactPicUrl *string       `json:"contactPicUrl,omitempty"`
	QueueID       *uuid.UUID    `json:"queueId,omitempty"`
	UserID        *uuid.UUID    `json:"userId,omitempty"`
	Status        TicketStatus  `json:"status"`
	LastMessage   *string       `json:"lastMessage,omitempty"`
	UnreadCount   int           `json:"unreadCount"`
	IsGroup       bool          `json:"isGroup"`
	ClosedAt      *time.Time    `json:"closedAt,omitempty"`
	CreatedAt     time.Time     `json:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt"`

	// Joined fields
	Queue *Queue `json:"queue,omitempty"`
	User  *User  `json:"user,omitempty"`
}

type TicketFilter struct {
	SessionID *uuid.UUID
	Status    *TicketStatus
	QueueID   *uuid.UUID
	UserID    *uuid.UUID
	IsGroup   *bool
	Search    *string
	Limit     int
	Offset    int
}
