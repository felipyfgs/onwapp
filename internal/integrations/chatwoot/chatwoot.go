package chatwoot

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"onwapp/internal/db"
	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/integrations/chatwoot/handler"
	"onwapp/internal/integrations/chatwoot/repository"
	"onwapp/internal/integrations/chatwoot/service"
	"onwapp/internal/integrations/chatwoot/sync"
	"onwapp/internal/queue"
	zpservice "onwapp/internal/service"
	"onwapp/internal/service/wpp"
)

type Config = core.Config

type SyncStatus = core.SyncStatus

type SyncStats = core.SyncStats

type Repository = repository.ConfigRepository

type Service = service.Service

type EventHandler = service.EventHandler

type Handler = handler.Handler

type ChatwootDBSync = sync.ChatwootDBSync

func NewRepository(pool *pgxpool.Pool) *Repository {
	return repository.NewConfigRepository(pool)
}

func NewService(repo *Repository, database *db.Database, baseURL string) *Service {
	return service.NewService(repo, database, baseURL)
}

func NewEventHandler(svc *Service) *EventHandler {
	return service.NewEventHandler(svc)
}

func NewHandler(svc *Service, sessionSvc *zpservice.SessionService, wppSvc *wpp.Service, database *db.Database) *Handler {
	return handler.NewHandler(svc, sessionSvc, wppSvc, database)
}

func RegisterRoutes(r *gin.Engine, h *Handler, apiKey string, sessionLookup handler.SessionKeyLookup) {
	handler.RegisterRoutes(r, h, apiKey, sessionLookup)
}

func GetSyncStatus(sessionID string) *SyncStatus {
	return sync.GetSyncStatus(sessionID)
}

func RegisterQueueHandlers(queueSvc *queue.Service, chatwootSvc *Service) {
	service.RegisterQueueHandlers(queueSvc, chatwootSvc)
}

func RegisterCWToWAQueueHandlers(queueSvc *queue.Service, h *Handler) {
	service.RegisterCWToWAQueueHandlers(queueSvc, h)
}
