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
	"zpwoot/internal/version"
)

// WebhookHandlerInterface defines the methods required for webhook handling
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

	// ─────────────────────────────────────────────────────────────────────────────
	// Health & Docs
	// ─────────────────────────────────────────────────────────────────────────────
	// Root endpoint - same as health
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

	// ─────────────────────────────────────────────────────────────────────────────
	// API Routes (organized by whatsmeow pattern)
	// ─────────────────────────────────────────────────────────────────────────────
	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(cfg.GlobalAPIKey, cfg.SessionLookup))
	{
		// ═══════════════════════════════════════════════════════════════════════
		// 1. CONNECTION - Session lifecycle
		// whatsmeow: Connect, Disconnect, Logout, IsConnected, GetQRChannel, PairPhone
		// ═══════════════════════════════════════════════════════════════════════
		sessions.GET("", h.Session.Fetch)
		sessions.POST("", h.Session.Create)
		sessions.GET("/:sessionId", h.Session.Info)
		sessions.DELETE("/:sessionId", h.Session.Delete)
		sessions.POST("/:sessionId/connect", h.Session.Connect)
		sessions.POST("/:sessionId/disconnect", h.Session.Disconnect)
		sessions.POST("/:sessionId/logout", h.Session.Logout)
		sessions.POST("/:sessionId/restart", h.Session.Restart)
		sessions.GET("/:sessionId/qr", h.Session.QR)
		sessions.POST("/:sessionId/pair/phone", h.Session.PairPhone)

		// ═══════════════════════════════════════════════════════════════════════
		// 2. PROFILE - Account identity & settings
		// whatsmeow: SetStatusMessage, GetPrivacySettings, SetPrivacySetting
		// ═══════════════════════════════════════════════════════════════════════
		sessions.GET("/:sessionId/profile", h.Profile.GetProfile)
		sessions.PATCH("/:sessionId/profile/status", h.Profile.SetStatus)
		sessions.PATCH("/:sessionId/profile/name", h.Profile.SetPushName)
		sessions.PUT("/:sessionId/profile/picture", h.Profile.SetProfilePicture)
		sessions.DELETE("/:sessionId/profile/picture", h.Profile.DeleteProfilePicture)
		sessions.GET("/:sessionId/profile/privacy", h.Profile.GetPrivacySettings)
		sessions.PUT("/:sessionId/profile/privacy", h.Profile.SetPrivacySettings)
		sessions.PATCH("/:sessionId/profile/disappearing", h.Profile.SetDefaultDisappearingTimer)

		// ═══════════════════════════════════════════════════════════════════════
		// 3. PRESENCE - Online status & typing
		// whatsmeow: SendPresence, SendChatPresence, SubscribePresence, MarkRead
		// ═══════════════════════════════════════════════════════════════════════
		sessions.PUT("/:sessionId/presence", h.Presence.SetPresence)
		sessions.POST("/:sessionId/presence/subscribe/:phone", h.Presence.SubscribePresence)
		sessions.POST("/:sessionId/chats/:chatId/presence", h.Presence.SetChatPresence)
		sessions.POST("/:sessionId/chats/:chatId/read", h.Presence.MarkRead)

		// ═══════════════════════════════════════════════════════════════════════
		// 4. CONTACTS - User management
		// whatsmeow: IsOnWhatsApp, GetUserInfo, GetBlocklist, GetBusinessProfile
		// ═══════════════════════════════════════════════════════════════════════
		sessions.GET("/:sessionId/contacts", h.Contact.GetContacts)
		sessions.POST("/:sessionId/contacts/check", h.Contact.CheckPhone)
		sessions.GET("/:sessionId/contacts/blocklist", h.Contact.GetBlocklist)
		sessions.PUT("/:sessionId/contacts/blocklist", h.Contact.UpdateBlocklist)
		sessions.GET("/:sessionId/contacts/:phone", h.Contact.GetContactInfo)
		sessions.GET("/:sessionId/contacts/:phone/avatar", h.Contact.GetAvatar)
		sessions.GET("/:sessionId/contacts/:phone/business", h.Contact.GetBusinessProfile)
		sessions.GET("/:sessionId/contacts/:phone/lid", h.Contact.GetContactLID)
		sessions.GET("/:sessionId/contacts/:phone/qrlink", h.Contact.GetContactQRLink)

		// ═══════════════════════════════════════════════════════════════════════
		// 5. GROUPS - Core CRUD
		// whatsmeow: CreateGroup, GetGroupInfo, GetJoinedGroups, LeaveGroup
		// ═══════════════════════════════════════════════════════════════════════
		sessions.POST("/:sessionId/groups", h.Group.CreateGroup)
		sessions.GET("/:sessionId/groups", h.Group.GetJoinedGroups)
		sessions.GET("/:sessionId/groups/:groupId", h.Group.GetGroupInfo)
		sessions.DELETE("/:sessionId/groups/:groupId", h.Group.LeaveGroup)
		sessions.PATCH("/:sessionId/groups/:groupId/name", h.Group.UpdateGroupName)
		sessions.PATCH("/:sessionId/groups/:groupId/topic", h.Group.UpdateGroupTopic)
		sessions.PUT("/:sessionId/groups/:groupId/picture", h.Group.SetGroupPicture)
		sessions.DELETE("/:sessionId/groups/:groupId/picture", h.Group.DeleteGroupPicture)

		// ═══════════════════════════════════════════════════════════════════════
		// 6. GROUPS - Participants
		// whatsmeow: UpdateGroupParticipants
		// ═══════════════════════════════════════════════════════════════════════
		sessions.POST("/:sessionId/groups/:groupId/participants", h.Group.AddParticipants)
		sessions.DELETE("/:sessionId/groups/:groupId/participants", h.Group.RemoveParticipants)
		sessions.PATCH("/:sessionId/groups/:groupId/participants/promote", h.Group.PromoteParticipants)
		sessions.PATCH("/:sessionId/groups/:groupId/participants/demote", h.Group.DemoteParticipants)

		// ═══════════════════════════════════════════════════════════════════════
		// 7. GROUPS - Settings
		// whatsmeow: SetGroupAnnounce, SetGroupLocked, SetGroupJoinApprovalMode
		// ═══════════════════════════════════════════════════════════════════════
		sessions.PATCH("/:sessionId/groups/:groupId/settings/announce", h.Group.SetGroupAnnounce)
		sessions.PATCH("/:sessionId/groups/:groupId/settings/locked", h.Group.SetGroupLocked)
		sessions.PATCH("/:sessionId/groups/:groupId/settings/approval", h.Group.SetGroupApprovalMode)
		sessions.PATCH("/:sessionId/groups/:groupId/settings/memberadd", h.Group.SetGroupMemberAddMode)

		// ═══════════════════════════════════════════════════════════════════════
		// 8. GROUPS - Invites & Requests
		// whatsmeow: GetGroupInviteLink, JoinGroupWithLink, GetGroupInfoFromLink
		// ═══════════════════════════════════════════════════════════════════════
		sessions.GET("/:sessionId/groups/invite/info", h.Group.GetGroupInfoFromLink)
		sessions.POST("/:sessionId/groups/join", h.Group.JoinGroup)
		sessions.GET("/:sessionId/groups/:groupId/invite", h.Group.GetInviteLink)
		sessions.GET("/:sessionId/groups/:groupId/requests", h.Group.GetGroupRequestParticipants)
		sessions.POST("/:sessionId/groups/:groupId/requests", h.Group.UpdateGroupRequestParticipants)
		sessions.POST("/:sessionId/groups/:groupId/messages", h.Group.SendGroupMessage)

		// ═══════════════════════════════════════════════════════════════════════
		// 9. COMMUNITIES - Group collections
		// whatsmeow: LinkGroup, UnlinkGroup, GetSubGroups
		// ═══════════════════════════════════════════════════════════════════════
		if h.Community != nil {
			sessions.GET("/:sessionId/communities/:communityId/groups", h.Community.GetSubGroups)
			sessions.POST("/:sessionId/communities/:communityId/groups", h.Community.LinkGroup)
			sessions.DELETE("/:sessionId/communities/:communityId/groups/:groupId", h.Community.UnlinkGroup)
		}

		// ═══════════════════════════════════════════════════════════════════════
		// 10. CHATS - Conversations
		// whatsmeow: SetDisappearingTimer, BuildEdit, BuildRevoke
		// ═══════════════════════════════════════════════════════════════════════
		sessions.PATCH("/:sessionId/chats/:chatId/archive", h.Chat.ArchiveChat)
		sessions.PATCH("/:sessionId/chats/:chatId/disappearing", h.Chat.SetDisappearingTimer)
		sessions.PATCH("/:sessionId/chats/:chatId/messages/:messageId", h.Chat.EditMessage)
		sessions.DELETE("/:sessionId/chats/:chatId/messages/:messageId", h.Chat.DeleteMessage)
		sessions.POST("/:sessionId/chats/:chatId/messages/:messageId/request", h.Chat.RequestUnavailableMessage)

		// ═══════════════════════════════════════════════════════════════════════
		// 11. MESSAGES - Text & Basic
		// whatsmeow: SendMessage
		// ═══════════════════════════════════════════════════════════════════════
		sessions.POST("/:sessionId/messages/text", h.Message.SendText)
		sessions.POST("/:sessionId/messages/location", h.Message.SendLocation)
		sessions.POST("/:sessionId/messages/contact", h.Message.SendContact)
		sessions.POST("/:sessionId/messages/reaction", h.Message.SendReaction)

		// ═══════════════════════════════════════════════════════════════════════
		// 12. MESSAGES - Media
		// whatsmeow: Upload + SendMessage
		// ═══════════════════════════════════════════════════════════════════════
		sessions.POST("/:sessionId/messages/image", h.Message.SendImage)
		sessions.POST("/:sessionId/messages/audio", h.Message.SendAudio)
		sessions.POST("/:sessionId/messages/video", h.Message.SendVideo)
		sessions.POST("/:sessionId/messages/document", h.Message.SendDocument)
		sessions.POST("/:sessionId/messages/sticker", h.Message.SendSticker)

		// ═══════════════════════════════════════════════════════════════════════
		// 13. MESSAGES - Interactive
		// whatsmeow: BuildPollCreation, BuildPollVote
		// ═══════════════════════════════════════════════════════════════════════
		sessions.POST("/:sessionId/messages/poll", h.Message.SendPoll)
		sessions.POST("/:sessionId/messages/poll/vote", h.Message.SendPollVote)
		sessions.POST("/:sessionId/messages/buttons", h.Message.SendButtons)
		sessions.POST("/:sessionId/messages/list", h.Message.SendList)
		sessions.POST("/:sessionId/messages/interactive", h.Message.SendInteractive)
		sessions.POST("/:sessionId/messages/template", h.Message.SendTemplate)
		sessions.POST("/:sessionId/messages/carousel", h.Message.SendCarousel)

		// ═══════════════════════════════════════════════════════════════════════
		// 14. MEDIA - File storage
		// whatsmeow: Download
		// ═══════════════════════════════════════════════════════════════════════
		if h.Media != nil {
			sessions.GET("/:sessionId/media", h.Media.ListMedia)
			sessions.GET("/:sessionId/media/pending", h.Media.ListPendingMedia)
			sessions.POST("/:sessionId/media/process", h.Media.ProcessPendingMedia)
			sessions.GET("/:sessionId/media/:messageId", h.Media.GetMedia)
		}

		// ═══════════════════════════════════════════════════════════════════════
		// 15. NEWSLETTERS - Channels
		// whatsmeow: CreateNewsletter, GetNewsletterInfo, Follow/Unfollow
		// ═══════════════════════════════════════════════════════════════════════
		if h.Newsletter != nil {
			sessions.POST("/:sessionId/newsletters", h.Newsletter.CreateNewsletter)
			sessions.GET("/:sessionId/newsletters", h.Newsletter.GetSubscribedNewsletters)
			sessions.GET("/:sessionId/newsletters/:newsletterId", h.Newsletter.GetNewsletterInfo)
			sessions.POST("/:sessionId/newsletters/:newsletterId/follow", h.Newsletter.FollowNewsletter)
			sessions.DELETE("/:sessionId/newsletters/:newsletterId/follow", h.Newsletter.UnfollowNewsletter)
			sessions.GET("/:sessionId/newsletters/:newsletterId/messages", h.Newsletter.GetNewsletterMessages)
			sessions.POST("/:sessionId/newsletters/:newsletterId/reactions", h.Newsletter.NewsletterSendReaction)
			sessions.PATCH("/:sessionId/newsletters/:newsletterId/mute", h.Newsletter.NewsletterToggleMute)
			sessions.POST("/:sessionId/newsletters/:newsletterId/viewed", h.Newsletter.NewsletterMarkViewed)
			sessions.POST("/:sessionId/newsletters/:newsletterId/subscribe-live", h.Newsletter.NewsletterSubscribeLiveUpdates)
		}

		// ═══════════════════════════════════════════════════════════════════════
		// 16. STORIES - Status updates
		// whatsmeow: GetStatusPrivacy
		// ═══════════════════════════════════════════════════════════════════════
		if h.Status != nil {
			sessions.POST("/:sessionId/stories", h.Status.SendStory)
			sessions.GET("/:sessionId/stories/privacy", h.Status.GetStatusPrivacy)
		}

		// ═══════════════════════════════════════════════════════════════════════
		// 17. CALLS - Voice/Video
		// whatsmeow: RejectCall
		// ═══════════════════════════════════════════════════════════════════════
		if h.Call != nil {
			sessions.POST("/:sessionId/calls/reject", h.Call.RejectCall)
		}

		// ═══════════════════════════════════════════════════════════════════════
		// 18. HISTORY - Sync data
		// whatsmeow: BuildHistorySyncRequest, DownloadHistorySync
		// ═══════════════════════════════════════════════════════════════════════
		if h.History != nil {
			sessions.POST("/:sessionId/history/sync", h.History.RequestHistorySync)
			sessions.GET("/:sessionId/history/progress", h.History.GetSyncProgress)
			sessions.GET("/:sessionId/history/chats/unread", h.History.GetUnreadChats)
			sessions.GET("/:sessionId/history/chats/:chatId", h.History.GetChatInfo)
			sessions.GET("/:sessionId/history/groups/:groupId/participants/past", h.History.GetGroupPastParticipants)
			sessions.GET("/:sessionId/history/stickers", h.History.GetTopStickers)
		}

		// ═══════════════════════════════════════════════════════════════════════
		// 19. WEBHOOKS - Integrations
		// ═══════════════════════════════════════════════════════════════════════
		sessions.GET("/:sessionId/webhooks", h.Webhook.GetWebhook)
		sessions.POST("/:sessionId/webhooks", h.Webhook.SetWebhook)
		sessions.PUT("/:sessionId/webhooks", h.Webhook.UpdateWebhook)
		sessions.DELETE("/:sessionId/webhooks", h.Webhook.DeleteWebhook)
	}

	return r
}
