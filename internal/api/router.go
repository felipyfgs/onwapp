package api

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"zpwoot/internal/logger"
)

func SetupRouter(handler *Handler, apiKey string) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(logger.GinMiddleware())

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	sessions := r.Group("/sessions")
	sessions.Use(AuthMiddleware(apiKey))
	{
		sessions.POST("/:name/create", handler.Create)
		sessions.DELETE("/:name/delete", handler.Delete)
		sessions.GET("/:name/info", handler.Info)
		sessions.POST("/:name/connect", handler.Connect)
		sessions.POST("/:name/logout", handler.Logout)
		sessions.POST("/:name/restart", handler.Restart)
		sessions.GET("/:name/qr", handler.QR)
	}

	return r
}
