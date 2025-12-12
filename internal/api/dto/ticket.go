package dto

import (
	"time"

	"github.com/google/uuid"
)

// Ticket DTOs
type CreateTicketReq struct {
	ContactJid    string  `json:"contactJid" binding:"required" example:"5511999999999@s.whatsapp.net"`
	ContactName   *string `json:"contactName,omitempty" example:"John Doe"`
	ContactPicUrl *string `json:"contactPicUrl,omitempty" example:"https://example.com/pic.jpg"`
	QueueID       *string `json:"queueId,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	IsGroup       bool    `json:"isGroup" example:"false"`
}

type UpdateTicketReq struct {
	ContactName   *string `json:"contactName,omitempty" example:"John Doe"`
	ContactPicUrl *string `json:"contactPicUrl,omitempty" example:"https://example.com/pic.jpg"`
	QueueID       *string `json:"queueId,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	UserID        *string `json:"userId,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	Status        *string `json:"status,omitempty" example:"open"`
}

type AcceptTicketReq struct {
	UserID string `json:"userId" example:"550e8400-e29b-41d4-a716-446655440001"`
}

type TransferTicketReq struct {
	QueueID *string `json:"queueId,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	UserID  *string `json:"userId,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
}

type TicketData struct {
	ID            uuid.UUID   `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	SessionID     uuid.UUID   `json:"sessionId" example:"550e8400-e29b-41d4-a716-446655440000"`
	ContactJid    string      `json:"contactJid" example:"5511999999999@s.whatsapp.net"`
	ContactName   *string     `json:"contactName,omitempty" example:"John Doe"`
	ContactPicUrl *string     `json:"contactPicUrl,omitempty" example:"https://example.com/pic.jpg"`
	QueueID       *uuid.UUID  `json:"queueId,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	UserID        *uuid.UUID  `json:"userId,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	Status        string      `json:"status" example:"pending"`
	LastMessage   *string     `json:"lastMessage,omitempty" example:"Hello, how can I help?"`
	UnreadCount   int         `json:"unreadCount" example:"5"`
	IsGroup       bool        `json:"isGroup" example:"false"`
	ClosedAt      *time.Time  `json:"closedAt,omitempty"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
	Queue         *QueueData  `json:"queue,omitempty"`
	User          *UserData   `json:"user,omitempty"`
}

type TicketStatsData struct {
	Pending int `json:"pending" example:"10"`
	Open    int `json:"open" example:"25"`
	Closed  int `json:"closed" example:"100"`
	Total   int `json:"total" example:"135"`
}

// Queue DTOs
type CreateQueueReq struct {
	Name            string  `json:"name" binding:"required" example:"Sales"`
	Color           string  `json:"color" binding:"required" example:"#4CAF50"`
	GreetingMessage *string `json:"greetingMessage,omitempty" example:"Welcome to Sales department!"`
}

type UpdateQueueReq struct {
	Name            *string `json:"name,omitempty" example:"Sales"`
	Color           *string `json:"color,omitempty" example:"#4CAF50"`
	GreetingMessage *string `json:"greetingMessage,omitempty" example:"Welcome to Sales department!"`
}

type QueueData struct {
	ID              uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name            string    `json:"name" example:"Sales"`
	Color           string    `json:"color" example:"#4CAF50"`
	GreetingMessage *string   `json:"greetingMessage,omitempty" example:"Welcome to Sales department!"`
	TicketCount     int       `json:"ticketCount,omitempty" example:"10"`
	UserCount       int       `json:"userCount,omitempty" example:"5"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// User DTOs
type CreateUserReq struct {
	Name     string   `json:"name" binding:"required" example:"John Doe"`
	Email    string   `json:"email" binding:"required,email" example:"john@example.com"`
	Password string   `json:"password" binding:"required,min=6" example:"secret123"`
	Profile  string   `json:"profile" binding:"required,oneof=admin user" example:"user"`
	QueueIDs []string `json:"queueIds,omitempty"`
}

type UpdateUserReq struct {
	Name     *string  `json:"name,omitempty" example:"John Doe"`
	Email    *string  `json:"email,omitempty" example:"john@example.com"`
	Profile  *string  `json:"profile,omitempty" example:"user"`
	QueueIDs []string `json:"queueIds,omitempty"`
}

type UpdateUserPasswordReq struct {
	Password string `json:"password" binding:"required,min=6" example:"newsecret123"`
}

type SetUserQueuesReq struct {
	QueueIDs []string `json:"queueIds" binding:"required" example:"['550e8400-e29b-41d4-a716-446655440000']"`
}

type UserData struct {
	ID        uuid.UUID   `json:"id" example:"550e8400-e29b-41d4-a716-446655440001"`
	Name      string      `json:"name" example:"John Doe"`
	Email     string      `json:"email" example:"john@example.com"`
	Profile   string      `json:"profile" example:"user"`
	Online    bool        `json:"online" example:"true"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
	Queues    []QueueData `json:"queues,omitempty"`
}

// Quick Reply DTOs
type CreateQuickReplyReq struct {
	Shortcut string `json:"shortcut" binding:"required" example:"/hello"`
	Message  string `json:"message" binding:"required" example:"Hello! How can I help you today?"`
}

type UpdateQuickReplyReq struct {
	Shortcut *string `json:"shortcut,omitempty" example:"/hello"`
	Message  *string `json:"message,omitempty" example:"Hello! How can I help you today?"`
}

type QuickReplyData struct {
	ID        uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Shortcut  string    `json:"shortcut" example:"/hello"`
	Message   string    `json:"message" example:"Hello! How can I help you today?"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
