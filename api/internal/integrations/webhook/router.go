package webhook

import (
	"github.com/gin-gonic/gin"

	"onwapp/internal/api/middleware"
)

func RegisterRoutes(r *gin.Engine, handler *Handler, apiKey string, sessionLookup middleware.SessionKeyLookup) {
	r.GET("/events", middleware.Auth(apiKey, sessionLookup), handler.GetEvents)
}

func RegisterRoutesOnGroup(sessionsGroup *gin.RouterGroup, handler *Handler) {
	sessionsGroup.GET("/:sessionId/webhooks", handler.GetWebhook)
	sessionsGroup.POST("/:sessionId/webhooks", handler.SetWebhook)
}
