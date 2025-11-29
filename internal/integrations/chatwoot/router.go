package chatwoot

import (
	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/middleware"
)

// RegisterRoutes registers Chatwoot routes
func RegisterRoutes(r *gin.Engine, handler *Handler, apiKey string) {
	// Chatwoot webhook endpoint (no auth - Chatwoot sends webhooks)
	r.POST("/chatwoot/webhook/:name", handler.ReceiveWebhook)

	// Protected routes under /sessions/:name/chatwoot
	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(apiKey))
	{
		sessions.POST("/:name/chatwoot/set", handler.SetConfig)
		sessions.GET("/:name/chatwoot/find", handler.GetConfig)
		sessions.DELETE("/:name/chatwoot", handler.DeleteConfig)
		
		// Sync routes
		sessions.POST("/:name/chatwoot/sync", handler.SyncAll)
		sessions.POST("/:name/chatwoot/sync/contacts", handler.SyncContacts)
		sessions.POST("/:name/chatwoot/sync/messages", handler.SyncMessages)
	}
}

// RegisterRoutesOnGroup registers Chatwoot routes on an existing sessions group
func RegisterRoutesOnGroup(sessionsGroup *gin.RouterGroup, handler *Handler) {
	sessionsGroup.POST("/:name/chatwoot/set", handler.SetConfig)
	sessionsGroup.GET("/:name/chatwoot/find", handler.GetConfig)
	sessionsGroup.DELETE("/:name/chatwoot", handler.DeleteConfig)
	
	// Sync routes
	sessionsGroup.POST("/:name/chatwoot/sync", handler.SyncAll)
	sessionsGroup.POST("/:name/chatwoot/sync/contacts", handler.SyncContacts)
	sessionsGroup.POST("/:name/chatwoot/sync/messages", handler.SyncMessages)
}

// RegisterWebhookRoute registers the webhook route on the root engine
func RegisterWebhookRoute(r *gin.Engine, handler *Handler) {
	r.POST("/chatwoot/webhook/:name", handler.ReceiveWebhook)
}
