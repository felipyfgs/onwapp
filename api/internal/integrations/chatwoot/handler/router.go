package handler

import (
	"github.com/gin-gonic/gin"

	"onwapp/internal/api/middleware"
)

type SessionKeyLookup = middleware.SessionKeyLookup

func RegisterRoutes(r *gin.Engine, handler *Handler, apiKey string, sessionLookup SessionKeyLookup) {
	r.POST("/chatwoot/webhook/:session", handler.ReceiveWebhook)

	chatwoot := r.Group("/chatwoot")
	chatwoot.Use(middleware.Auth(apiKey, sessionLookup))
	{
		chatwoot.POST("/validate", handler.ValidateCredentials)
	}

	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(apiKey, sessionLookup))
	{
		sessions.POST("/:session/chatwoot/set", handler.SetConfig)
		sessions.GET("/:session/chatwoot/find", handler.GetConfig)
		sessions.DELETE("/:session/chatwoot", handler.DeleteConfig)

		sessions.POST("/:session/chatwoot/sync", handler.SyncAll)
		sessions.POST("/:session/chatwoot/sync/contacts", handler.SyncContacts)
		sessions.POST("/:session/chatwoot/sync/messages", handler.SyncMessages)
		sessions.GET("/:session/chatwoot/sync/status", handler.GetSyncStatusHandler)

		sessions.GET("/:session/chatwoot/overview", handler.GetSyncOverview)
		sessions.POST("/:session/chatwoot/resolve-all", handler.ResolveAllConversations)
		sessions.GET("/:session/chatwoot/conversations/stats", handler.GetConversationsStats)

		sessions.POST("/:session/chatwoot/reset", handler.ResetChatwoot)
	}
}
