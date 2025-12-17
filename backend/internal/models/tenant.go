package models

import (
	"time"

	"github.com/google/uuid"
)

type Tenant struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Slug      string    `json:"slug" db:"slug"`
	Active    bool      `json:"active" db:"active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type CreateTenantRequest struct {
	Name   string `json:"name" validate:"required,min=3,max=255"`
	Slug   string `json:"slug" validate:"required,min=3,max=255"`
	Active bool   `json:"active"`
}

type UpdateTenantRequest struct {
	Name   string `json:"name" validate:"required,min=3,max=255"`
	Slug   string `json:"slug" validate:"required,min=3,max=255"`
	Active bool   `json:"active"`
}
