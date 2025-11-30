// Package chatwoot provides integration with Chatwoot CRM.
// This file re-exports the main types and functions for backward compatibility.
package chatwoot

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/db"
	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/integrations/chatwoot/handler"
	"zpwoot/internal/integrations/chatwoot/repository"
	"zpwoot/internal/integrations/chatwoot/service"
	"zpwoot/internal/integrations/chatwoot/sync"
	zpservice "zpwoot/internal/service"
)

// =============================================================================
// TYPE ALIASES FOR BACKWARD COMPATIBILITY
// =============================================================================

// Config is an alias for core.Config
type Config = core.Config

// SyncStatus is an alias for core.SyncStatus
type SyncStatus = core.SyncStatus

// SyncStats is an alias for core.SyncStats
type SyncStats = core.SyncStats

// Repository is an alias for repository.ConfigRepository
type Repository = repository.ConfigRepository

// Service is an alias for service.Service
type Service = service.Service

// EventHandler is an alias for service.EventHandler
type EventHandler = service.EventHandler

// Handler is an alias for handler.Handler
type Handler = handler.Handler

// ChatwootDBSync is an alias for sync.ChatwootDBSync
type ChatwootDBSync = sync.ChatwootDBSync

// =============================================================================
// CONSTRUCTOR ALIASES
// =============================================================================

// NewRepository creates a new Chatwoot repository
func NewRepository(pool *pgxpool.Pool) *Repository {
	return repository.NewConfigRepository(pool)
}

// NewService creates a new Chatwoot service
func NewService(repo *Repository, database *db.Database, baseURL string) *Service {
	return service.NewService(repo, database, baseURL)
}

// NewEventHandler creates a new Chatwoot event handler
func NewEventHandler(svc *Service) *EventHandler {
	return service.NewEventHandler(svc)
}

// NewHandler creates a new Chatwoot HTTP handler
func NewHandler(svc *Service, sessionSvc *zpservice.SessionService, whatsappSvc *zpservice.WhatsAppService, database *db.Database) *Handler {
	return handler.NewHandler(svc, sessionSvc, whatsappSvc, database)
}

// RegisterRoutes registers Chatwoot HTTP routes
func RegisterRoutes(r *gin.Engine, h *Handler, apiKey string) {
	handler.RegisterRoutes(r, h, apiKey)
}

// GetSyncStatus returns the current sync status for a session
func GetSyncStatus(sessionID string) *SyncStatus {
	return sync.GetSyncStatus(sessionID)
}
