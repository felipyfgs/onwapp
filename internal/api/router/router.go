package router

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"zpwoot/internal/api/handler"
	"zpwoot/internal/api/middleware"
	"zpwoot/internal/db"
	"zpwoot/internal/logger"
)

type Handlers struct {
	Session *handler.SessionHandler
	Message *handler.MessageHandler
	Group   *handler.GroupHandler
	Contact *handler.ContactHandler
	Chat    *handler.ChatHandler
	Profile *handler.ProfileHandler
	Webhook *handler.WebhookHandler
}

type Config struct {
	Handlers        *Handlers
	APIKey          string
	Database        *db.Database
	RateLimitPerMin int
	AllowedOrigins  []string
}

func Setup(handlers *Handlers, apiKey string) *gin.Engine {
	return SetupWithConfig(&Config{
		Handlers:        handlers,
		APIKey:          apiKey,
		RateLimitPerMin: 100,
		AllowedOrigins:  []string{"*"},
	})
}

func SetupWithConfig(cfg *Config) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(logger.GinMiddleware())
	r.Use(middleware.CORS(cfg.AllowedOrigins))
	r.Use(middleware.RateLimit(cfg.RateLimitPerMin))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		status := "healthy"
		dbStatus := "connected"

		if cfg.Database != nil {
			if err := cfg.Database.Pool.Ping(c.Request.Context()); err != nil {
				dbStatus = "disconnected"
				status = "degraded"
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   status,
			"database": dbStatus,
			"time":     time.Now().UTC().Format(time.RFC3339),
		})
	})

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(cfg.APIKey))
	{
		handlers := cfg.Handlers
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

		// Contact management
		sessions.POST("/:name/contact/check", handlers.Contact.CheckPhone)
		sessions.POST("/:name/contact/info", handlers.Contact.GetContactInfo)
		sessions.GET("/:name/contact/list", handlers.Contact.GetContacts)
		sessions.GET("/:name/contact/:phone/avatar", handlers.Contact.GetAvatar)
		sessions.POST("/:name/contact/presence", handlers.Contact.SetPresence)
		sessions.POST("/:name/contact/typing", handlers.Contact.SetChatPresence)
		sessions.POST("/:name/contact/markread", handlers.Contact.MarkRead)

		// Chat management
		sessions.POST("/:name/chat/archive", handlers.Chat.ArchiveChat)
		sessions.POST("/:name/chat/delete", handlers.Chat.DeleteMessage)
		sessions.POST("/:name/chat/edit", handlers.Chat.EditMessage)

		// Profile management
		sessions.GET("/:name/profile", handlers.Profile.GetProfile)
		sessions.PUT("/:name/profile/status", handlers.Profile.SetStatus)
		sessions.PUT("/:name/profile/name", handlers.Profile.SetPushName)
		sessions.PUT("/:name/profile/picture", handlers.Profile.SetProfilePicture)
		sessions.DELETE("/:name/profile/picture", handlers.Profile.DeleteProfilePicture)
		sessions.GET("/:name/profile/privacy", handlers.Profile.GetPrivacySettings)
		sessions.PUT("/:name/profile/privacy", handlers.Profile.SetPrivacySettings)

		// Webhook management
		sessions.GET("/:name/webhook", handlers.Webhook.ListWebhooks)
		sessions.POST("/:name/webhook", handlers.Webhook.CreateWebhook)
		sessions.PUT("/:name/webhook/:id", handlers.Webhook.UpdateWebhook)
		sessions.DELETE("/:name/webhook/:id", handlers.Webhook.DeleteWebhook)
	}

	return r
}
