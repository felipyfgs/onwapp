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

// WebhookHandlerInterface defines the methods required for webhook handling
type WebhookHandlerInterface interface {
	GetWebhook(c *gin.Context)
	SetWebhook(c *gin.Context)
	GetEvents(c *gin.Context)
}

type Handlers struct {
	Session    *handler.SessionHandler
	Message    *handler.MessageHandler
	Group      *handler.GroupHandler
	Contact    *handler.ContactHandler
	Chat       *handler.ChatHandler
	Profile    *handler.ProfileHandler
	Webhook    WebhookHandlerInterface
	Newsletter *handler.NewsletterHandler
	Status     *handler.StatusHandler
	Call       *handler.CallHandler
	Community  *handler.CommunityHandler
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

	h := cfg.Handlers

	// ─────────────────────────────────────────────────────────────────────────────
	// Health & Docs
	// ─────────────────────────────────────────────────────────────────────────────
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
	r.GET("/events", middleware.Auth(cfg.APIKey), h.Webhook.GetEvents)

	// ─────────────────────────────────────────────────────────────────────────────
	// Sessions
	// ─────────────────────────────────────────────────────────────────────────────
	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(cfg.APIKey))
	{
		sessions.GET("", h.Session.Fetch)
		sessions.POST("", h.Session.Create)
		sessions.GET("/:name", h.Session.Info)
		sessions.DELETE("/:name", h.Session.Delete)
		sessions.POST("/:name/connect", h.Session.Connect)
		sessions.POST("/:name/logout", h.Session.Logout)
		sessions.POST("/:name/restart", h.Session.Restart)
		sessions.GET("/:name/qr", h.Session.QR)
		sessions.POST("/:name/pair/phone", h.Session.PairPhone)
		sessions.GET("/:name/qrlink", h.Contact.GetContactQRLink)

		// ─────────────────────────────────────────────────────────────────────────
		// Messages
		// ─────────────────────────────────────────────────────────────────────────
		sessions.POST("/:name/messages/text", h.Message.SendText)
		sessions.POST("/:name/messages/image", h.Message.SendImage)
		sessions.POST("/:name/messages/audio", h.Message.SendAudio)
		sessions.POST("/:name/messages/video", h.Message.SendVideo)
		sessions.POST("/:name/messages/document", h.Message.SendDocument)
		sessions.POST("/:name/messages/sticker", h.Message.SendSticker)
		sessions.POST("/:name/messages/location", h.Message.SendLocation)
		sessions.POST("/:name/messages/contact", h.Message.SendContact)
		sessions.POST("/:name/messages/reaction", h.Message.SendReaction)
		sessions.POST("/:name/messages/poll", h.Message.SendPoll)
		sessions.POST("/:name/messages/poll/vote", h.Message.SendPollVote)
		sessions.POST("/:name/messages/buttons", h.Message.SendButtons)
		sessions.POST("/:name/messages/list", h.Message.SendList)
		sessions.POST("/:name/messages/interactive", h.Message.SendInteractive)
		sessions.POST("/:name/messages/template", h.Message.SendTemplate)
		sessions.POST("/:name/messages/carousel", h.Message.SendCarousel)

		// ─────────────────────────────────────────────────────────────────────────
		// Groups
		// ─────────────────────────────────────────────────────────────────────────
		sessions.POST("/:name/groups", h.Group.CreateGroup)
		sessions.GET("/:name/groups", h.Group.GetJoinedGroups)
		sessions.GET("/:name/groups/:groupId", h.Group.GetGroupInfo)
		sessions.DELETE("/:name/groups/:groupId/membership", h.Group.LeaveGroup)
		sessions.GET("/:name/groups/:groupId/invite", h.Group.GetInviteLink)
		sessions.PATCH("/:name/groups/:groupId/name", h.Group.UpdateGroupName)
		sessions.PATCH("/:name/groups/:groupId/description", h.Group.UpdateGroupTopic)
		sessions.POST("/:name/groups/:groupId/participants", h.Group.AddParticipants)
		sessions.DELETE("/:name/groups/:groupId/participants", h.Group.RemoveParticipants)
		sessions.PATCH("/:name/groups/:groupId/participants/promote", h.Group.PromoteParticipants)
		sessions.PATCH("/:name/groups/:groupId/participants/demote", h.Group.DemoteParticipants)
		sessions.POST("/:name/groups/join", h.Group.JoinGroup)
		sessions.POST("/:name/groups/:groupId/messages", h.Group.SendGroupMessage)
		sessions.PATCH("/:name/groups/:groupId/settings/announce", h.Group.SetGroupAnnounce)
		sessions.PATCH("/:name/groups/:groupId/settings/locked", h.Group.SetGroupLocked)
		sessions.PUT("/:name/groups/:groupId/picture", h.Group.SetGroupPicture)
		sessions.PATCH("/:name/groups/:groupId/settings/approval", h.Group.SetGroupApprovalMode)
		sessions.PATCH("/:name/groups/:groupId/settings/memberadd", h.Group.SetGroupMemberAddMode)
		sessions.GET("/:name/groups/:groupId/requests", h.Group.GetGroupRequestParticipants)
		sessions.POST("/:name/groups/:groupId/requests", h.Group.UpdateGroupRequestParticipants)
		sessions.GET("/:name/groups/info/link", h.Group.GetGroupInfoFromLink)

		// ─────────────────────────────────────────────────────────────────────────
		// Contacts
		// ─────────────────────────────────────────────────────────────────────────
		sessions.GET("/:name/contacts", h.Contact.GetContacts)
		sessions.POST("/:name/contacts/check", h.Contact.CheckPhone)
		sessions.GET("/:name/contacts/:phone", h.Contact.GetContactInfo)
		sessions.GET("/:name/contacts/:phone/avatar", h.Contact.GetAvatar)
		sessions.GET("/:name/contacts/:phone/business", h.Contact.GetBusinessProfile)
		sessions.GET("/:name/contacts/blocklist", h.Contact.GetBlocklist)
		sessions.PUT("/:name/contacts/blocklist", h.Contact.UpdateBlocklist)
		sessions.POST("/:name/contacts/:phone/presence/subscribe", h.Contact.SubscribePresence)

		// ─────────────────────────────────────────────────────────────────────────
		// Chats
		// ─────────────────────────────────────────────────────────────────────────
		sessions.PUT("/:name/presence", h.Contact.SetPresence)
		sessions.POST("/:name/chats/:chatId/typing", h.Contact.SetChatPresence)
		sessions.POST("/:name/chats/:chatId/read", h.Contact.MarkRead)
		sessions.PATCH("/:name/chats/:chatId/archive", h.Chat.ArchiveChat)
		sessions.DELETE("/:name/chats/:chatId/messages/:messageId", h.Chat.DeleteMessage)
		sessions.PATCH("/:name/chats/:chatId/messages/:messageId", h.Chat.EditMessage)
		sessions.PATCH("/:name/chats/:chatId/settings/disappearing", h.Chat.SetDisappearingTimer)

		// ─────────────────────────────────────────────────────────────────────────
		// Profile
		// ─────────────────────────────────────────────────────────────────────────
		sessions.GET("/:name/profile", h.Profile.GetProfile)
		sessions.PATCH("/:name/profile/status", h.Profile.SetStatus)
		sessions.PATCH("/:name/profile/name", h.Profile.SetPushName)
		sessions.PUT("/:name/profile/picture", h.Profile.SetProfilePicture)
		sessions.DELETE("/:name/profile/picture", h.Profile.DeleteProfilePicture)
		sessions.GET("/:name/profile/privacy", h.Profile.GetPrivacySettings)
		sessions.PUT("/:name/profile/privacy", h.Profile.SetPrivacySettings)
		sessions.PATCH("/:name/profile/disappearing", h.Profile.SetDefaultDisappearingTimer)

		// ─────────────────────────────────────────────────────────────────────────
		// Webhooks
		// ─────────────────────────────────────────────────────────────────────────
		sessions.GET("/:name/webhooks", h.Webhook.GetWebhook)
		sessions.POST("/:name/webhooks", h.Webhook.SetWebhook)

		// ─────────────────────────────────────────────────────────────────────────
		// Newsletters
		// ─────────────────────────────────────────────────────────────────────────
		if h.Newsletter != nil {
			sessions.POST("/:name/newsletters", h.Newsletter.CreateNewsletter)
			sessions.GET("/:name/newsletters", h.Newsletter.GetSubscribedNewsletters)
			sessions.GET("/:name/newsletters/:newsletterId", h.Newsletter.GetNewsletterInfo)
			sessions.POST("/:name/newsletters/:newsletterId/follow", h.Newsletter.FollowNewsletter)
			sessions.DELETE("/:name/newsletters/:newsletterId/follow", h.Newsletter.UnfollowNewsletter)
			sessions.GET("/:name/newsletters/:newsletterId/messages", h.Newsletter.GetNewsletterMessages)
			sessions.POST("/:name/newsletters/:newsletterId/reactions", h.Newsletter.NewsletterSendReaction)
			sessions.PATCH("/:name/newsletters/:newsletterId/mute", h.Newsletter.NewsletterToggleMute)
		}

		// ─────────────────────────────────────────────────────────────────────────
		// Stories
		// ─────────────────────────────────────────────────────────────────────────
		if h.Status != nil {
			sessions.POST("/:name/stories", h.Status.SendStory)
			sessions.GET("/:name/stories/privacy", h.Status.GetStatusPrivacy)
		}

		// ─────────────────────────────────────────────────────────────────────────
		// Calls
		// ─────────────────────────────────────────────────────────────────────────
		if h.Call != nil {
			sessions.POST("/:name/calls/reject", h.Call.RejectCall)
		}

		// ─────────────────────────────────────────────────────────────────────────
		// Communities
		// ─────────────────────────────────────────────────────────────────────────
		if h.Community != nil {
			sessions.POST("/:name/communities/:communityId/groups", h.Community.LinkGroup)
			sessions.DELETE("/:name/communities/:communityId/groups/:groupId", h.Community.UnlinkGroup)
			sessions.GET("/:name/communities/:communityId/groups", h.Community.GetSubGroups)
		}
	}

	return r
}
