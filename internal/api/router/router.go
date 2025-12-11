package router

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"onwapp/internal/api/handler"
	"onwapp/internal/api/middleware"
	"onwapp/internal/db"
	"onwapp/internal/logger"
	"onwapp/internal/version"
)

type WebhookHandlerInterface interface {
	GetWebhook(c *gin.Context)
	SetWebhook(c *gin.Context)
	UpdateWebhook(c *gin.Context)
	DeleteWebhook(c *gin.Context)
	GetEvents(c *gin.Context)
}

type Handlers struct {
	Session    *handler.SessionHandler
	Profile    *handler.ProfileHandler
	Contact    *handler.ContactHandler
	Group      *handler.GroupHandler
	Community  *handler.CommunityHandler
	Chat       *handler.ChatHandler
	Message    *handler.MessageHandler
	Media      *handler.MediaHandler
	Newsletter *handler.NewsletterHandler
	Status     *handler.StatusHandler
	Settings   *handler.SettingsHandler
	Webhook    WebhookHandlerInterface

}

type Config struct {
	Handlers           *Handlers
	GlobalAPIKey       string
	SessionLookup      middleware.SessionKeyLookup
	Database           *db.Database
	AllowedOrigins     []string
	RateLimitPerSecond float64
	RateLimitBurst     int
}

func Setup(handlers *Handlers, globalAPIKey string) *gin.Engine {
	return SetupWithConfig(&Config{
		Handlers:       handlers,
		GlobalAPIKey:   globalAPIKey,
		AllowedOrigins: []string{"*"},
	})
}

func SetupWithConfig(cfg *Config) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(logger.GinMiddleware())

	// Security middleware chain
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.CORS(cfg.AllowedOrigins))

	// Rate limiting (configurable, default 200 req/s for high-volume usage)
	rlConfig := middleware.DefaultRateLimiterConfig()
	if cfg.RateLimitPerSecond > 0 {
		rlConfig.RequestsPerSecond = cfg.RateLimitPerSecond
	}
	if cfg.RateLimitBurst > 0 {
		rlConfig.Burst = cfg.RateLimitBurst
	}
	rateLimiter := middleware.NewRateLimiter(rlConfig)
	r.Use(rateLimiter.Middleware())

	h := cfg.Handlers

	// ============================================================
	// HEALTH & DOCS
	// ============================================================
	r.GET("/", healthHandler(cfg))
	r.GET("/health", healthHandler(cfg))
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})
	r.GET("/events", middleware.Auth(cfg.GlobalAPIKey, cfg.SessionLookup), h.Webhook.GetEvents)

	// Public media streaming endpoint (no auth required for audio/video playback in browser)
	if h.Media != nil {
		r.GET("/public/:session/media/stream", h.Media.StreamMediaPublic)
	}



	// ============================================================
	// SESSIONS MANAGEMENT
	// ============================================================
	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(cfg.GlobalAPIKey, cfg.SessionLookup))
	{
		sessions.GET("", h.Session.Fetch)
		sessions.POST("", h.Session.Create)
	}

	// ============================================================
	// SESSION ROUTES (/:session/...)
	// ============================================================
	session := r.Group("/:session")
	session.Use(middleware.Auth(cfg.GlobalAPIKey, cfg.SessionLookup))
	{
		// ----------------------------------------------------------
		// SESSION LIFECYCLE
		// ----------------------------------------------------------
		session.GET("/status", h.Session.Info)
		session.DELETE("", h.Session.Delete)
		session.POST("/connect", h.Session.Connect)
		session.POST("/disconnect", h.Session.Disconnect)
		session.POST("/logout", h.Session.Logout)
		session.POST("/restart", h.Session.Restart)
		session.GET("/qr", h.Session.QR)
		session.POST("/pairphone", h.Session.PairPhone)

		// ----------------------------------------------------------
		// PROFILE
		// ----------------------------------------------------------
		session.GET("/profile", h.Profile.GetProfile)
		session.POST("/profile/status", h.Profile.SetStatus)
		session.POST("/profile/name", h.Profile.SetPushName)
		session.POST("/profile/picture", h.Profile.SetProfilePicture)
		session.POST("/profile/picture/remove", h.Profile.DeleteProfilePicture)

		// ----------------------------------------------------------
		// SETTINGS
		// ----------------------------------------------------------
		if h.Settings != nil {
			session.GET("/settings", h.Settings.GetSettings)
			session.POST("/settings", h.Settings.UpdateSettings)
		}

		// ----------------------------------------------------------
		// CONTACT
		// ----------------------------------------------------------
		session.GET("/contact/list", h.Contact.GetContacts)
		session.POST("/contact/check", h.Contact.CheckPhone)
		session.GET("/contact/blocklist", h.Contact.GetBlocklist)
		session.POST("/contact/blocklist", h.Contact.UpdateBlocklist)
		session.GET("/contact/info", h.Contact.GetContactInfo)
		session.GET("/contact/avatar", h.Contact.GetAvatar)
		session.GET("/contact/business", h.Contact.GetBusinessProfile)
		session.GET("/contact/lid", h.Contact.GetContactLID)
		session.GET("/contact/qrlink", h.Contact.GetContactQRLink)

		// ----------------------------------------------------------
		// PRESENCE
		// ----------------------------------------------------------
		session.POST("/presence", h.Chat.SetPresence)
		session.POST("/presence/subscribe", h.Chat.SubscribePresence)

		// ----------------------------------------------------------
		// CHAT
		// ----------------------------------------------------------
		session.POST("/chat/presence", h.Chat.SetChatPresence)
		session.POST("/chat/markread", h.Chat.MarkRead)
		session.POST("/chat/unread", h.Chat.MarkChatUnread)
		session.POST("/chat/archive", h.Chat.ArchiveChat)
		session.POST("/chat/disappearing", h.Chat.SetDisappearingTimer)
		session.GET("/chat/list", h.Chat.GetAllChats)
		session.GET("/chat/messages", h.Chat.GetChatMessages)
		session.GET("/chat/info", h.Chat.GetChatInfo)

		// ----------------------------------------------------------
		// MESSAGE - SEND
		// ----------------------------------------------------------
		session.POST("/message/send/text", h.Message.SendText)
		session.POST("/message/send/image", h.Message.SendImage)
		session.POST("/message/send/audio", h.Message.SendAudio)
		session.POST("/message/send/video", h.Message.SendVideo)
		session.POST("/message/send/document", h.Message.SendDocument)
		session.POST("/message/send/sticker", h.Message.SendSticker)
		session.POST("/message/send/location", h.Message.SendLocation)
		session.POST("/message/send/contact", h.Message.SendContact)
		session.POST("/message/send/poll", h.Message.SendPoll)
		session.POST("/message/send/buttons", h.Message.SendButtons)
		session.POST("/message/send/list", h.Message.SendList)
		session.POST("/message/send/interactive", h.Message.SendInteractive)
		session.POST("/message/send/template", h.Message.SendTemplate)
		session.POST("/message/send/carousel", h.Message.SendCarousel)

		// ----------------------------------------------------------
		// MESSAGE - ACTIONS
		// ----------------------------------------------------------
		session.POST("/message/react", h.Message.SendReaction)
		session.POST("/message/delete", h.Chat.DeleteMessage)
		session.POST("/message/edit", h.Chat.EditMessage)
		session.POST("/message/poll/vote", h.Message.SendPollVote)
		session.POST("/message/request-unavailable", h.Chat.RequestUnavailableMessage)

		// ----------------------------------------------------------
		// GROUP - CRUD
		// ----------------------------------------------------------
		session.POST("/group/create", h.Group.CreateGroup)
		session.GET("/group/list", h.Group.GetJoinedGroups)
		session.GET("/group/info", h.Group.GetGroupInfo)
		session.POST("/group/leave", h.Group.LeaveGroup)
		session.POST("/group/name", h.Group.UpdateGroupName)
		session.POST("/group/topic", h.Group.UpdateGroupTopic)
		session.POST("/group/photo", h.Group.SetGroupPicture)
		session.POST("/group/photo/remove", h.Group.DeleteGroupPicture)
		session.GET("/group/avatar", h.Group.GetGroupPicture)

		// ----------------------------------------------------------
		// GROUP - PARTICIPANTS
		// ----------------------------------------------------------
		session.POST("/group/participants/add", h.Group.AddParticipants)
		session.POST("/group/participants/remove", h.Group.RemoveParticipants)
		session.POST("/group/participants/promote", h.Group.PromoteParticipants)
		session.POST("/group/participants/demote", h.Group.DemoteParticipants)

		// ----------------------------------------------------------
		// GROUP - SETTINGS
		// ----------------------------------------------------------
		session.POST("/group/announce", h.Group.SetGroupAnnounce)
		session.POST("/group/locked", h.Group.SetGroupLocked)
		session.POST("/group/approval", h.Group.SetGroupApprovalMode)
		session.POST("/group/memberadd", h.Group.SetGroupMemberAddMode)

		// ----------------------------------------------------------
		// GROUP - INVITES
		// ----------------------------------------------------------
		session.GET("/group/invitelink", h.Group.GetInviteLink)
		session.GET("/group/inviteinfo", h.Group.GetGroupInfoFromLink)
		session.POST("/group/join", h.Group.JoinGroup)
		session.GET("/group/requests", h.Group.GetGroupRequestParticipants)
		session.POST("/group/requests/action", h.Group.UpdateGroupRequestParticipants)
		session.POST("/group/send/text", h.Group.SendGroupMessage) // legacy

		// ----------------------------------------------------------
		// COMMUNITY
		// ----------------------------------------------------------
		if h.Community != nil {
			session.GET("/community/groups", h.Community.GetSubGroups)
			session.POST("/community/link", h.Community.LinkGroup)
			session.POST("/community/unlink", h.Community.UnlinkGroup)
		}

		// ----------------------------------------------------------
		// MEDIA
		// ----------------------------------------------------------
		if h.Media != nil {
			session.GET("/media/list", h.Media.ListMedia)
			session.GET("/media/pending", h.Media.ListPendingMedia)
			session.POST("/media/process", h.Media.ProcessPendingMedia)
			session.POST("/media/retry", h.Media.RetryMediaDownload)
			session.GET("/media/download", h.Media.GetMedia)
			session.GET("/media/stream", h.Media.StreamMedia)
		}

		// ----------------------------------------------------------
		// NEWSLETTER (Channels)
		// ----------------------------------------------------------
		if h.Newsletter != nil {
			session.POST("/newsletter/create", h.Newsletter.CreateNewsletter)
			session.GET("/newsletter/list", h.Newsletter.GetSubscribedNewsletters)
			session.GET("/newsletter/info", h.Newsletter.GetNewsletterInfo)
			session.POST("/newsletter/follow", h.Newsletter.FollowNewsletter)
			session.POST("/newsletter/unfollow", h.Newsletter.UnfollowNewsletter)
			session.GET("/newsletter/messages", h.Newsletter.GetNewsletterMessages)
			session.POST("/newsletter/react", h.Newsletter.NewsletterSendReaction)
			session.POST("/newsletter/mute", h.Newsletter.NewsletterToggleMute)
			session.POST("/newsletter/viewed", h.Newsletter.NewsletterMarkViewed)
			session.POST("/newsletter/subscribe-live", h.Newsletter.NewsletterSubscribeLiveUpdates)
		}

		// ----------------------------------------------------------
		// STATUS (Stories)
		// ----------------------------------------------------------
		if h.Status != nil {
			session.POST("/status/send", h.Status.SendStory)
			session.GET("/status/privacy", h.Status.GetStatusPrivacy)
		}

		// ----------------------------------------------------------
		// CALL
		// ----------------------------------------------------------
		session.POST("/call/reject", h.Chat.RejectCall)

		// ----------------------------------------------------------
		// WEBHOOK
		// ----------------------------------------------------------
		session.GET("/webhook", h.Webhook.GetWebhook)
		session.POST("/webhook", h.Webhook.SetWebhook)
		session.PUT("/webhook", h.Webhook.UpdateWebhook)
		session.DELETE("/webhook", h.Webhook.DeleteWebhook)
	}

	return r
}

func healthHandler(cfg *Config) gin.HandlerFunc {
	return func(c *gin.Context) {
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
			"version":  version.Short(),
			"database": dbStatus,
			"time":     time.Now().UTC().Format(time.RFC3339),
		})
	}
}
