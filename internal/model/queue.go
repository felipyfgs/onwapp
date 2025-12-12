package model

import (
	"time"

	"github.com/google/uuid"
)

type Queue struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	Color           string    `json:"color"`
	GreetingMessage *string   `json:"greetingMessage,omitempty"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`

	// Counts
	TicketCount int `json:"ticketCount,omitempty"`
	UserCount   int `json:"userCount,omitempty"`
}

type UserQueue struct {
	UserID    uuid.UUID `json:"userId"`
	QueueID   uuid.UUID `json:"queueId"`
	CreatedAt time.Time `json:"createdAt"`
}

type SessionQueue struct {
	SessionID uuid.UUID `json:"sessionId"`
	QueueID   uuid.UUID `json:"queueId"`
	CreatedAt time.Time `json:"createdAt"`
}
