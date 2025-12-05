package handler

import (
	"github.com/gin-gonic/gin"

	"onwapp/internal/api/middleware"
)

// SessionKeyLookup is re-exported from middleware
type SessionKeyLookup = middleware.SessionKeyLookup

// RegisterRoutes registers Chatwoot routes
func RegisterRoutes(r *gin.Engine, handler *Handler, apiKey string, sessionLookup SessionKeyLookup) {
	// Chatwoot webhook endpoint (no auth - Chatwoot sends webhooks)
	r.POST("/chatwoot/webhook/:sessionId", handler.ReceiveWebhook)

	// Protected routes under /sessions/:sessionId/chatwoot
	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(apiKey, sessionLookup))
	{
		sessions.POST("/:sessionId/chatwoot/set", handler.SetConfig)
		sessions.GET("/:sessionId/chatwoot/find", handler.GetConfig)
		sessions.DELETE("/:sessionId/chatwoot", handler.DeleteConfig)

		// Sync routes
		sessions.POST("/:sessionId/chatwoot/sync", handler.SyncAll)
		sessions.POST("/:sessionId/chatwoot/sync/contacts", handler.SyncContacts)
		sessions.POST("/:sessionId/chatwoot/sync/messages", handler.SyncMessages)
		sessions.GET("/:sessionId/chatwoot/sync/status", handler.GetSyncStatusHandler)

		// Overview and conversations routes
		sessions.GET("/:sessionId/chatwoot/overview", handler.GetSyncOverview)
		sessions.POST("/:sessionId/chatwoot/resolve-all", handler.ResolveAllConversations)
		sessions.GET("/:sessionId/chatwoot/conversations/stats", handler.GetConversationsStats)

		// Reset route (for testing)
		sessions.POST("/:sessionId/chatwoot/reset", handler.ResetChatwoot)
	}
}
