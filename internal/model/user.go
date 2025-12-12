package model

import (
	"time"

	"github.com/google/uuid"
)

type UserProfile string

const (
	UserProfileAdmin UserProfile = "admin"
	UserProfileUser  UserProfile = "user"
)

type User struct {
	ID           uuid.UUID   `json:"id"`
	Name         string      `json:"name"`
	Email        string      `json:"email"`
	PasswordHash string      `json:"-"`
	Profile      UserProfile `json:"profile"`
	Online       bool        `json:"online"`
	CreatedAt    time.Time   `json:"createdAt"`
	UpdatedAt    time.Time   `json:"updatedAt"`

	// Joined fields
	Queues []Queue `json:"queues,omitempty"`
}

type QuickReply struct {
	ID        uuid.UUID `json:"id"`
	Shortcut  string    `json:"shortcut"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
