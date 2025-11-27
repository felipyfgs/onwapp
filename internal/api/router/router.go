package router

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"zpwoot/internal/api/handler"
	"zpwoot/internal/logger"
)

type Handlers struct {
	Session *handler.SessionHandler
	Message *handler.MessageHandler
	Group   *handler.GroupHandler
}

func Setup(handlers *Handlers, apiKey string) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(logger.GinMiddleware())

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	sessions := r.Group("/sessions")
	sessions.Use(authMiddleware(apiKey))
	{
		// Session management
		sessions.GET("/fetch", handlers.Session.Fetch)
		sessions.POST("/:name/create", handlers.Session.Create)
		sessions.DELETE("/:name/delete", handlers.Session.Delete)
		sessions.GET("/:name/info", handlers.Session.Info)
		sessions.POST("/:name/connect", handlers.Session.Connect)
		sessions.POST("/:name/logout", handlers.Session.Logout)
		sessions.POST("/:name/restart", handlers.Session.Restart)
		sessions.GET("/:name/qr", handlers.Session.QR)

		// Message sending
		sessions.POST("/:name/send/text", handlers.Message.SendText)
		sessions.POST("/:name/send/image", handlers.Message.SendImage)
		sessions.POST("/:name/send/audio", handlers.Message.SendAudio)
		sessions.POST("/:name/send/video", handlers.Message.SendVideo)
		sessions.POST("/:name/send/document", handlers.Message.SendDocument)
		sessions.POST("/:name/send/sticker", handlers.Message.SendSticker)
		sessions.POST("/:name/send/location", handlers.Message.SendLocation)
		sessions.POST("/:name/send/contact", handlers.Message.SendContact)
		sessions.POST("/:name/send/reaction", handlers.Message.SendReaction)

		// Group management
		sessions.POST("/:name/group/create", handlers.Group.CreateGroup)
		sessions.GET("/:name/group/list", handlers.Group.GetJoinedGroups)
		sessions.GET("/:name/group/:groupId/info", handlers.Group.GetGroupInfo)
		sessions.POST("/:name/group/:groupId/leave", handlers.Group.LeaveGroup)
		sessions.GET("/:name/group/:groupId/invite", handlers.Group.GetInviteLink)
		sessions.PUT("/:name/group/name", handlers.Group.UpdateGroupName)
		sessions.PUT("/:name/group/description", handlers.Group.UpdateGroupTopic)
		sessions.POST("/:name/group/participants/add", handlers.Group.AddParticipants)
		sessions.POST("/:name/group/participants/remove", handlers.Group.RemoveParticipants)
		sessions.POST("/:name/group/participants/promote", handlers.Group.PromoteParticipants)
		sessions.POST("/:name/group/participants/demote", handlers.Group.DemoteParticipants)
		sessions.POST("/:name/group/join", handlers.Group.JoinGroup)
		sessions.POST("/:name/group/send/text", handlers.Group.SendGroupMessage)
	}

	return r
}

func authMiddleware(apiKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if apiKey == "" {
			c.Next()
			return
		}

		key := c.GetHeader("apikey")
		if key == "" {
			key = c.Query("apikey")
		}

		if key != apiKey {
			c.AbortWithStatusJSON(401, gin.H{
				"error": "invalid or missing apikey",
			})
			return
		}

		c.Next()
	}
}
