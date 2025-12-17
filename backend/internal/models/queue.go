package models

import (
	"time"

	"github.com/google/uuid"
)

type Queue struct {
	ID              uuid.UUID `json:"id" db:"id"`
	TenantID        uuid.UUID `json:"tenant_id" db:"tenant_id"`
	Name            string    `json:"name" db:"name"`
	Color           string    `json:"color" db:"color"`
	GreetingMessage string    `json:"greeting_message" db:"greeting_message"`
	OrderNum        int       `json:"order_num" db:"order_num"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

type CreateQueueRequest struct {
	Name            string `json:"name" validate:"required,min=3,max=255"`
	Color           string `json:"color" validate:"required"`
	GreetingMessage string `json:"greeting_message"`
	OrderNum        int    `json:"order_num"`
}
