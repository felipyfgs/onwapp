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
	Presence   *handler.PresenceHandler
	Contact    *handler.ContactHandler
	Group      *handler.GroupHandler
	Community  *handler.CommunityHandler
	Chat       *handler.ChatHandler
	Message    *handler.MessageHandler
	Media      *handler.MediaHandler
	Newsletter *handler.NewsletterHandler
	Status     *handler.StatusHandler
	Call       *handler.CallHandler
	History    *handler.HistoryHandler
	Settings   *handler.SettingsHandler
	Webhook    WebhookHandlerInterface
}

type Config struct {
	Handlers        *Handlers
	GlobalAPIKey    string
	SessionLookup   middleware.SessionKeyLookup
	Database        *db.Database
	RateLimitPerMin int
	AllowedOrigins  []string
}

func Setup(handlers *Handlers, globalAPIKey string) *gin.Engine {
	return SetupWithConfig(&Config{
		Handlers:        handlers,
		GlobalAPIKey:    globalAPIKey,
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

	h := cfg.Handlers

	// Health & Docs
	r.GET("/", func(c *gin.Context) {
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
	})
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
			"version":  version.Short(),
			"database": dbStatus,
			"time":     time.Now().UTC().Format(time.RFC3339),
		})
	})
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/events", middleware.Auth(cfg.GlobalAPIKey, cfg.SessionLookup), h.Webhook.GetEvents)

	// Sessions management routes
	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(cfg.GlobalAPIKey, cfg.SessionLookup))
	{
		sessions.GET("", h.Session.Fetch)
		sessions.POST("", h.Session.Create)
	}

	// Session routes (wuzapi style: /:session/...)
	session := r.Group("/:session")
	session.Use(middleware.Auth(cfg.GlobalAPIKey, cfg.SessionLookup))
	{
		// Session lifecycle
		session.GET("/status", h.Session.Info)
		session.DELETE("", h.Session.Delete)
		session.POST("/connect", h.Session.Connect)
		session.POST("/disconnect", h.Session.Disconnect)
		session.POST("/logout", h.Session.Logout)
		session.POST("/restart", h.Session.Restart)
		session.GET("/qr", h.Session.QR)
		session.POST("/pairphone", h.Session.PairPhone)

		// Profile
		session.GET("/profile", h.Profile.GetProfile)
		session.POST("/profile/status", h.Profile.SetStatus)
		session.POST("/profile/name", h.Profile.SetPushName)
		session.POST("/profile/picture", h.Profile.SetProfilePicture)
		session.POST("/profile/picture/remove", h.Profile.DeleteProfilePicture)

		// Contact
		session.GET("/contact/list", h.Contact.GetContacts)
		session.POST("/contact/check", h.Contact.CheckPhone)
		session.GET("/contact/blocklist", h.Contact.GetBlocklist)
		session.POST("/contact/blocklist", h.Contact.UpdateBlocklist)
		session.GET("/contact/info", h.Contact.GetContactInfo)
		session.GET("/contact/avatar", h.Contact.GetAvatar)
		session.GET("/contact/business", h.Contact.GetBusinessProfile)
		session.GET("/contact/lid", h.Contact.GetContactLID)
		session.GET("/contact/qrlink", h.Contact.GetContactQRLink)

		// Presence
		session.POST("/presence", h.Presence.SetPresence)
		session.POST("/presence/subscribe", h.Presence.SubscribePresence)

		// Message send (wuzapi style: /:session/message/send/*)
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

		// Message actions
		session.POST("/message/react", h.Message.SendReaction)
		session.POST("/message/delete", h.Chat.DeleteMessage)
		session.POST("/message/edit", h.Chat.EditMessage)
		session.POST("/message/poll/vote", h.Message.SendPollVote)
		session.POST("/message/request-unavailable", h.Chat.RequestUnavailableMessage)

		// Chat actions
		session.POST("/chat/presence", h.Presence.SetChatPresence)
		session.POST("/chat/markread", h.Presence.MarkRead)
		session.POST("/chat/unread", h.Chat.MarkChatUnread)
		session.POST("/chat/archive", h.Chat.ArchiveChat)
		session.POST("/chat/disappearing", h.Chat.SetDisappearingTimer)
		if h.History != nil {
			session.GET("/chat/list", h.History.GetAllChats)
			session.GET("/chat/messages", h.History.GetChatMessages)
		}

		// Group CRUD
		session.POST("/group/create", h.Group.CreateGroup)
		session.GET("/group/list", h.Group.GetJoinedGroups)
		session.GET("/group/info", h.Group.GetGroupInfo)
		session.POST("/group/leave", h.Group.LeaveGroup)
		session.POST("/group/name", h.Group.UpdateGroupName)
		session.POST("/group/topic", h.Group.UpdateGroupTopic)
		session.POST("/group/photo", h.Group.SetGroupPicture)
		session.POST("/group/photo/remove", h.Group.DeleteGroupPicture)

		// Group participants
		session.POST("/group/participants/add", h.Group.AddParticipants)
		session.POST("/group/participants/remove", h.Group.RemoveParticipants)
		session.POST("/group/participants/promote", h.Group.PromoteParticipants)
		session.POST("/group/participants/demote", h.Group.DemoteParticipants)

		// Group settings
		session.POST("/group/announce", h.Group.SetGroupAnnounce)
		session.POST("/group/locked", h.Group.SetGroupLocked)
		session.POST("/group/approval", h.Group.SetGroupApprovalMode)
		session.POST("/group/memberadd", h.Group.SetGroupMemberAddMode)

		// Group invites
		session.GET("/group/invitelink", h.Group.GetInviteLink)
		session.GET("/group/inviteinfo", h.Group.GetGroupInfoFromLink)
		session.POST("/group/join", h.Group.JoinGroup)
		session.GET("/group/requests", h.Group.GetGroupRequestParticipants)
		session.POST("/group/requests/action", h.Group.UpdateGroupRequestParticipants)

		// Group message (legacy compatibility)
		session.POST("/group/send/text", h.Group.SendGroupMessage)

		// Communities
		if h.Community != nil {
			session.GET("/community/groups", h.Community.GetSubGroups)
			session.POST("/community/link", h.Community.LinkGroup)
			session.POST("/community/unlink", h.Community.UnlinkGroup)
		}

		// Media
		if h.Media != nil {
			session.GET("/media/list", h.Media.ListMedia)
			session.GET("/media/pending", h.Media.ListPendingMedia)
			session.POST("/media/process", h.Media.ProcessPendingMedia)
			session.GET("/media/download", h.Media.GetMedia)
		}

		// Newsletters
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

		// Stories/Status
		if h.Status != nil {
			session.POST("/status/send", h.Status.SendStory)
			session.GET("/status/privacy", h.Status.GetStatusPrivacy)
		}

		// Calls
		if h.Call != nil {
			session.POST("/call/reject", h.Call.RejectCall)
		}

		// History
		if h.History != nil {
			session.POST("/history/sync", h.History.RequestHistorySync)
			session.GET("/history/chats/unread", h.History.GetUnreadChats)
			session.GET("/history/chat", h.History.GetChatInfo)
		}

		// Settings
		if h.Settings != nil {
			session.GET("/settings", h.Settings.GetSettings)
			session.POST("/settings", h.Settings.UpdateSettings)
		}

		// Webhooks
		session.GET("/webhook", h.Webhook.GetWebhook)
		session.POST("/webhook", h.Webhook.SetWebhook)
		session.PUT("/webhook", h.Webhook.UpdateWebhook)
		session.DELETE("/webhook", h.Webhook.DeleteWebhook)
	}

	return r
}
