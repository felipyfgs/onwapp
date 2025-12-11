package admin

import (
	"github.com/gin-gonic/gin"

	"onwapp/internal/admin/core"
	"onwapp/internal/admin/handler"
	"onwapp/internal/admin/service"
	"onwapp/internal/db"
	"onwapp/internal/queue"
)

type SessionStatus = core.SessionStatus
type EventType = core.EventType
type SessionEvent = core.SessionEvent
type SessionInfo = core.SessionInfo

type Service = service.Service
type EventHandler = service.EventHandler
type Handler = handler.Handler

const (
	StatusDisconnected = core.StatusDisconnected
	StatusConnecting   = core.StatusConnecting
	StatusConnected    = core.StatusConnected
)

func NewService(sessionSvc service.SessionService, database *db.Database, queueClient *queue.Client) *Service {
	return service.NewService(sessionSvc, database, queueClient)
}

func NewEventHandler(svc *Service) *EventHandler {
	return service.NewEventHandler(svc)
}

func NewHandler(svc *Service) *Handler {
	return handler.NewHandler(svc)
}

func RegisterRoutes(r *gin.Engine, h *Handler, apiKey string, sessionLookup handler.SessionKeyLookup) {
	handler.RegisterRoutes(r, h, apiKey, sessionLookup)
}
