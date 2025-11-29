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
	Session    *handler.SessionHandler
	Message    *handler.MessageHandler
	Group      *handler.GroupHandler
	Contact    *handler.ContactHandler
	Chat       *handler.ChatHandler
	Profile    *handler.ProfileHandler
	Webhook    *handler.WebhookHandler
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
		sessions.GET("/:id", h.Session.Info)
		sessions.DELETE("/:id", h.Session.Delete)
		sessions.POST("/:id/connect", h.Session.Connect)
		sessions.POST("/:id/logout", h.Session.Logout)
		sessions.POST("/:id/restart", h.Session.Restart)
		sessions.GET("/:id/qr", h.Session.QR)
		sessions.POST("/:id/pair/phone", h.Session.PairPhone)
		sessions.GET("/:id/qrlink", h.Contact.GetContactQRLink)

		// ─────────────────────────────────────────────────────────────────────────
		// Messages
		// ─────────────────────────────────────────────────────────────────────────
		sessions.POST("/:id/messages/text", h.Message.SendText)
		sessions.POST("/:id/messages/image", h.Message.SendImage)
		sessions.POST("/:id/messages/audio", h.Message.SendAudio)
		sessions.POST("/:id/messages/video", h.Message.SendVideo)
		sessions.POST("/:id/messages/document", h.Message.SendDocument)
		sessions.POST("/:id/messages/sticker", h.Message.SendSticker)
		sessions.POST("/:id/messages/location", h.Message.SendLocation)
		sessions.POST("/:id/messages/contact", h.Message.SendContact)
		sessions.POST("/:id/messages/reaction", h.Message.SendReaction)
		sessions.POST("/:id/messages/poll", h.Message.SendPoll)
		sessions.POST("/:id/messages/poll/vote", h.Message.SendPollVote)
		sessions.POST("/:id/messages/buttons", h.Message.SendButtons)
		sessions.POST("/:id/messages/list", h.Message.SendList)
		sessions.POST("/:id/messages/interactive", h.Message.SendInteractive)
		sessions.POST("/:id/messages/template", h.Message.SendTemplate)
		sessions.POST("/:id/messages/carousel", h.Message.SendCarousel)

		// ─────────────────────────────────────────────────────────────────────────
		// Groups
		// ─────────────────────────────────────────────────────────────────────────
		sessions.POST("/:id/groups", h.Group.CreateGroup)
		sessions.GET("/:id/groups", h.Group.GetJoinedGroups)
		sessions.GET("/:id/groups/:groupId", h.Group.GetGroupInfo)
		sessions.DELETE("/:id/groups/:groupId/membership", h.Group.LeaveGroup)
		sessions.GET("/:id/groups/:groupId/invite", h.Group.GetInviteLink)
		sessions.PATCH("/:id/groups/:groupId/name", h.Group.UpdateGroupName)
		sessions.PATCH("/:id/groups/:groupId/description", h.Group.UpdateGroupTopic)
		sessions.POST("/:id/groups/:groupId/participants", h.Group.AddParticipants)
		sessions.DELETE("/:id/groups/:groupId/participants", h.Group.RemoveParticipants)
		sessions.PATCH("/:id/groups/:groupId/participants/promote", h.Group.PromoteParticipants)
		sessions.PATCH("/:id/groups/:groupId/participants/demote", h.Group.DemoteParticipants)
		sessions.POST("/:id/groups/join", h.Group.JoinGroup)
		sessions.POST("/:id/groups/:groupId/messages", h.Group.SendGroupMessage)
		sessions.PATCH("/:id/groups/:groupId/settings/announce", h.Group.SetGroupAnnounce)
		sessions.PATCH("/:id/groups/:groupId/settings/locked", h.Group.SetGroupLocked)
		sessions.PUT("/:id/groups/:groupId/picture", h.Group.SetGroupPicture)
		sessions.PATCH("/:id/groups/:groupId/settings/approval", h.Group.SetGroupApprovalMode)
		sessions.PATCH("/:id/groups/:groupId/settings/memberadd", h.Group.SetGroupMemberAddMode)
		sessions.GET("/:id/groups/:groupId/requests", h.Group.GetGroupRequestParticipants)
		sessions.POST("/:id/groups/:groupId/requests", h.Group.UpdateGroupRequestParticipants)
		sessions.GET("/:id/groups/info/link", h.Group.GetGroupInfoFromLink)

		// ─────────────────────────────────────────────────────────────────────────
		// Contacts
		// ─────────────────────────────────────────────────────────────────────────
		sessions.GET("/:id/contacts", h.Contact.GetContacts)
		sessions.POST("/:id/contacts/check", h.Contact.CheckPhone)
		sessions.GET("/:id/contacts/:phone", h.Contact.GetContactInfo)
		sessions.GET("/:id/contacts/:phone/avatar", h.Contact.GetAvatar)
		sessions.GET("/:id/contacts/:phone/business", h.Contact.GetBusinessProfile)
		sessions.GET("/:id/contacts/blocklist", h.Contact.GetBlocklist)
		sessions.PUT("/:id/contacts/blocklist", h.Contact.UpdateBlocklist)
		sessions.POST("/:id/contacts/:phone/presence/subscribe", h.Contact.SubscribePresence)

		// ─────────────────────────────────────────────────────────────────────────
		// Chats
		// ─────────────────────────────────────────────────────────────────────────
		sessions.PUT("/:id/presence", h.Contact.SetPresence)
		sessions.POST("/:id/chats/:chatId/typing", h.Contact.SetChatPresence)
		sessions.POST("/:id/chats/:chatId/read", h.Contact.MarkRead)
		sessions.PATCH("/:id/chats/:chatId/archive", h.Chat.ArchiveChat)
		sessions.DELETE("/:id/chats/:chatId/messages/:messageId", h.Chat.DeleteMessage)
		sessions.PATCH("/:id/chats/:chatId/messages/:messageId", h.Chat.EditMessage)
		sessions.PATCH("/:id/chats/:chatId/settings/disappearing", h.Chat.SetDisappearingTimer)

		// ─────────────────────────────────────────────────────────────────────────
		// Profile
		// ─────────────────────────────────────────────────────────────────────────
		sessions.GET("/:id/profile", h.Profile.GetProfile)
		sessions.PATCH("/:id/profile/status", h.Profile.SetStatus)
		sessions.PATCH("/:id/profile/name", h.Profile.SetPushName)
		sessions.PUT("/:id/profile/picture", h.Profile.SetProfilePicture)
		sessions.DELETE("/:id/profile/picture", h.Profile.DeleteProfilePicture)
		sessions.GET("/:id/profile/privacy", h.Profile.GetPrivacySettings)
		sessions.PUT("/:id/profile/privacy", h.Profile.SetPrivacySettings)
		sessions.PATCH("/:id/profile/disappearing", h.Profile.SetDefaultDisappearingTimer)

		// ─────────────────────────────────────────────────────────────────────────
		// Webhooks
		// ─────────────────────────────────────────────────────────────────────────
		sessions.GET("/:id/webhooks", h.Webhook.GetWebhook)
		sessions.POST("/:id/webhooks", h.Webhook.SetWebhook)

		// ─────────────────────────────────────────────────────────────────────────
		// Newsletters
		// ─────────────────────────────────────────────────────────────────────────
		if h.Newsletter != nil {
			sessions.POST("/:id/newsletters", h.Newsletter.CreateNewsletter)
			sessions.GET("/:id/newsletters", h.Newsletter.GetSubscribedNewsletters)
			sessions.GET("/:id/newsletters/:newsletterId", h.Newsletter.GetNewsletterInfo)
			sessions.POST("/:id/newsletters/:newsletterId/follow", h.Newsletter.FollowNewsletter)
			sessions.DELETE("/:id/newsletters/:newsletterId/follow", h.Newsletter.UnfollowNewsletter)
			sessions.GET("/:id/newsletters/:newsletterId/messages", h.Newsletter.GetNewsletterMessages)
			sessions.POST("/:id/newsletters/:newsletterId/reactions", h.Newsletter.NewsletterSendReaction)
			sessions.PATCH("/:id/newsletters/:newsletterId/mute", h.Newsletter.NewsletterToggleMute)
		}

		// ─────────────────────────────────────────────────────────────────────────
		// Stories
		// ─────────────────────────────────────────────────────────────────────────
		if h.Status != nil {
			sessions.POST("/:id/stories", h.Status.SendStory)
			sessions.GET("/:id/stories/privacy", h.Status.GetStatusPrivacy)
		}

		// ─────────────────────────────────────────────────────────────────────────
		// Calls
		// ─────────────────────────────────────────────────────────────────────────
		if h.Call != nil {
			sessions.POST("/:id/calls/reject", h.Call.RejectCall)
		}

		// ─────────────────────────────────────────────────────────────────────────
		// Communities
		// ─────────────────────────────────────────────────────────────────────────
		if h.Community != nil {
			sessions.POST("/:id/communities/:communityId/groups", h.Community.LinkGroup)
			sessions.DELETE("/:id/communities/:communityId/groups/:groupId", h.Community.UnlinkGroup)
			sessions.GET("/:id/communities/:communityId/groups", h.Community.GetSubGroups)
		}
	}

	return r
}
