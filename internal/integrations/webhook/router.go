package webhook

import (
	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/middleware"
)

// RegisterRoutes registers Webhook routes on the main engine
func RegisterRoutes(r *gin.Engine, handler *Handler, apiKey string) {
	r.GET("/events", middleware.Auth(apiKey), handler.GetEvents)
}

// RegisterRoutesOnGroup registers Webhook routes on an existing sessions group
func RegisterRoutesOnGroup(sessionsGroup *gin.RouterGroup, handler *Handler) {
	sessionsGroup.GET("/:sessionId/webhooks", handler.GetWebhook)
	sessionsGroup.POST("/:sessionId/webhooks", handler.SetWebhook)
}
