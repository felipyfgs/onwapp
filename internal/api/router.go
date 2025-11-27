package api

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"zpwoot/internal/logger"
)

func SetupRouter(handler *Handler, messageHandler *MessageHandler, apiKey string) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(logger.GinMiddleware())

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	sessions := r.Group("/sessions")
	sessions.Use(AuthMiddleware(apiKey))
	{
		// Session management
		sessions.GET("/fetch", handler.Fetch)
		sessions.POST("/:name/create", handler.Create)
		sessions.DELETE("/:name/delete", handler.Delete)
		sessions.GET("/:name/info", handler.Info)
		sessions.POST("/:name/connect", handler.Connect)
		sessions.POST("/:name/logout", handler.Logout)
		sessions.POST("/:name/restart", handler.Restart)
		sessions.GET("/:name/qr", handler.QR)

		// Message sending
		sessions.POST("/:name/send/text", messageHandler.SendText)
		sessions.POST("/:name/send/image", messageHandler.SendImage)
		sessions.POST("/:name/send/audio", messageHandler.SendAudio)
		sessions.POST("/:name/send/video", messageHandler.SendVideo)
		sessions.POST("/:name/send/document", messageHandler.SendDocument)
		sessions.POST("/:name/send/sticker", messageHandler.SendSticker)
		sessions.POST("/:name/send/location", messageHandler.SendLocation)
		sessions.POST("/:name/send/contact", messageHandler.SendContact)
		sessions.POST("/:name/send/reaction", messageHandler.SendReaction)
	}

	return r
}
