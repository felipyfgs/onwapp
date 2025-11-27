package api

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func SetupRouter(handler *Handler) *gin.Engine {
	r := gin.Default()

	// Swagger docs
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	sessions := r.Group("/sessions")
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
