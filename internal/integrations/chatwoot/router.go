package chatwoot

import (
	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/middleware"
)

// RegisterRoutes registers Chatwoot routes
func RegisterRoutes(r *gin.Engine, handler *Handler, apiKey string) {
	// Chatwoot webhook endpoint (no auth - Chatwoot sends webhooks)
	r.POST("/chatwoot/webhook/:id", handler.ReceiveWebhook)

	// Protected routes under /sessions/:id/chatwoot
	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(apiKey))
	{
		sessions.POST("/:id/chatwoot/set", handler.SetConfig)
		sessions.GET("/:id/chatwoot/find", handler.GetConfig)
		sessions.DELETE("/:id/chatwoot", handler.DeleteConfig)
	}
}

// RegisterRoutesOnGroup registers Chatwoot routes on an existing sessions group
func RegisterRoutesOnGroup(sessionsGroup *gin.RouterGroup, handler *Handler) {
	sessionsGroup.POST("/:id/chatwoot/set", handler.SetConfig)
	sessionsGroup.GET("/:id/chatwoot/find", handler.GetConfig)
	sessionsGroup.DELETE("/:id/chatwoot", handler.DeleteConfig)
}

// RegisterWebhookRoute registers the webhook route on the root engine
func RegisterWebhookRoute(r *gin.Engine, handler *Handler) {
	r.POST("/chatwoot/webhook/:id", handler.ReceiveWebhook)
}
