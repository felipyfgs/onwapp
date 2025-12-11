package handler

import (
	"github.com/gin-gonic/gin"

	"onwapp/internal/api/middleware"
)

type SessionKeyLookup = middleware.SessionKeyLookup

func RegisterRoutes(r *gin.Engine, handler *Handler, apiKey string, sessionLookup SessionKeyLookup) {
	r.POST("/chatwoot/webhook/:sessionId", handler.ReceiveWebhook)

	chatwoot := r.Group("/chatwoot")
	chatwoot.Use(middleware.Auth(apiKey, sessionLookup))
	{
		chatwoot.POST("/validate", handler.ValidateCredentials)
	}

	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(apiKey, sessionLookup))
	{
		sessions.POST("/:sessionId/chatwoot/set", handler.SetConfig)
		sessions.GET("/:sessionId/chatwoot/find", handler.GetConfig)
		sessions.DELETE("/:sessionId/chatwoot", handler.DeleteConfig)

		sessions.POST("/:sessionId/chatwoot/sync", handler.SyncAll)
		sessions.POST("/:sessionId/chatwoot/sync/contacts", handler.SyncContacts)
		sessions.POST("/:sessionId/chatwoot/sync/messages", handler.SyncMessages)
		sessions.GET("/:sessionId/chatwoot/sync/status", handler.GetSyncStatusHandler)

		sessions.GET("/:sessionId/chatwoot/overview", handler.GetSyncOverview)
		sessions.POST("/:sessionId/chatwoot/resolve-all", handler.ResolveAllConversations)
		sessions.GET("/:sessionId/chatwoot/conversations/stats", handler.GetConversationsStats)

		sessions.POST("/:sessionId/chatwoot/reset", handler.ResetChatwoot)
	}
}
