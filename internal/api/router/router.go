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

	registerHealthRoutes(r, cfg.Database)
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	sessions := r.Group("/sessions")
	sessions.Use(middleware.Auth(cfg.APIKey))

	registerSessionRoutes(sessions, cfg.Handlers.Session)
	registerMessageRoutes(sessions, cfg.Handlers.Message)
	registerGroupRoutes(sessions, cfg.Handlers.Group)
	registerContactRoutes(sessions, cfg.Handlers.Contact)
	registerChatRoutes(sessions, cfg.Handlers.Chat)
	registerProfileRoutes(sessions, cfg.Handlers.Profile)
	registerWebhookRoutes(sessions, cfg.Handlers.Webhook)
	registerNewsletterRoutes(sessions, cfg.Handlers.Newsletter)
	registerStatusRoutes(sessions, cfg.Handlers.Status)
	registerCallRoutes(sessions, cfg.Handlers.Call)
	registerCommunityRoutes(sessions, cfg.Handlers.Community)

	registerEventRoutes(r, cfg.APIKey, cfg.Handlers.Webhook)

	return r
}

func registerHealthRoutes(r *gin.Engine, database *db.Database) {
	r.GET("/health", func(c *gin.Context) {
		status := "healthy"
		dbStatus := "connected"

		if database != nil {
			if err := database.Pool.Ping(c.Request.Context()); err != nil {
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
}

func registerSessionRoutes(rg *gin.RouterGroup, h *handler.SessionHandler) {
	rg.GET("/fetch", h.Fetch)
	rg.POST("/:name/create", h.Create)
	rg.DELETE("/:name/delete", h.Delete)
	rg.GET("/:name/info", h.Info)
	rg.POST("/:name/connect", h.Connect)
	rg.POST("/:name/logout", h.Logout)
	rg.POST("/:name/restart", h.Restart)
	rg.GET("/:name/qr", h.QR)
	rg.POST("/:name/pair/phone", h.PairPhone)
}

func registerMessageRoutes(rg *gin.RouterGroup, h *handler.MessageHandler) {
	rg.POST("/:name/send/text", h.SendText)
	rg.POST("/:name/send/image", h.SendImage)
	rg.POST("/:name/send/audio", h.SendAudio)
	rg.POST("/:name/send/video", h.SendVideo)
	rg.POST("/:name/send/document", h.SendDocument)
	rg.POST("/:name/send/sticker", h.SendSticker)
	rg.POST("/:name/send/location", h.SendLocation)
	rg.POST("/:name/send/contact", h.SendContact)
	rg.POST("/:name/send/reaction", h.SendReaction)
	rg.POST("/:name/send/poll", h.SendPoll)
	rg.POST("/:name/send/poll/vote", h.SendPollVote)
}

func registerGroupRoutes(rg *gin.RouterGroup, h *handler.GroupHandler) {
	rg.POST("/:name/group/create", h.CreateGroup)
	rg.GET("/:name/group/list", h.GetJoinedGroups)
	rg.GET("/:name/group/:groupId/info", h.GetGroupInfo)
	rg.POST("/:name/group/:groupId/leave", h.LeaveGroup)
	rg.GET("/:name/group/:groupId/invite", h.GetInviteLink)
	rg.PUT("/:name/group/name", h.UpdateGroupName)
	rg.PUT("/:name/group/description", h.UpdateGroupTopic)
	rg.POST("/:name/group/participants/add", h.AddParticipants)
	rg.POST("/:name/group/participants/remove", h.RemoveParticipants)
	rg.POST("/:name/group/participants/promote", h.PromoteParticipants)
	rg.POST("/:name/group/participants/demote", h.DemoteParticipants)
	rg.POST("/:name/group/join", h.JoinGroup)
	rg.POST("/:name/group/send/text", h.SendGroupMessage)
	rg.PUT("/:name/group/announce", h.SetGroupAnnounce)
	rg.PUT("/:name/group/locked", h.SetGroupLocked)
	rg.PUT("/:name/group/picture", h.SetGroupPicture)
	rg.PUT("/:name/group/approval", h.SetGroupApprovalMode)
	rg.PUT("/:name/group/memberadd", h.SetGroupMemberAddMode)
	rg.GET("/:name/group/:groupId/requests", h.GetGroupRequestParticipants)
	rg.POST("/:name/group/:groupId/requests", h.UpdateGroupRequestParticipants)
	rg.GET("/:name/group/info/link", h.GetGroupInfoFromLink)
}

func registerContactRoutes(rg *gin.RouterGroup, h *handler.ContactHandler) {
	rg.POST("/:name/contact/check", h.CheckPhone)
	rg.POST("/:name/contact/info", h.GetContactInfo)
	rg.GET("/:name/contact/list", h.GetContacts)
	rg.GET("/:name/contact/:phone/avatar", h.GetAvatar)
	rg.POST("/:name/contact/presence", h.SetPresence)
	rg.POST("/:name/contact/typing", h.SetChatPresence)
	rg.POST("/:name/contact/markread", h.MarkRead)
	rg.GET("/:name/contact/blocklist", h.GetBlocklist)
	rg.POST("/:name/contact/blocklist", h.UpdateBlocklist)
	rg.POST("/:name/contact/subscribe", h.SubscribePresence)
	rg.GET("/:name/contact/qrlink", h.GetContactQRLink)
	rg.GET("/:name/contact/:phone/business", h.GetBusinessProfile)
}

func registerChatRoutes(rg *gin.RouterGroup, h *handler.ChatHandler) {
	rg.POST("/:name/chat/archive", h.ArchiveChat)
	rg.POST("/:name/chat/delete", h.DeleteMessage)
	rg.POST("/:name/chat/edit", h.EditMessage)
	rg.PUT("/:name/chat/disappearing", h.SetDisappearingTimer)
}

func registerProfileRoutes(rg *gin.RouterGroup, h *handler.ProfileHandler) {
	rg.GET("/:name/profile", h.GetProfile)
	rg.PUT("/:name/profile/status", h.SetStatus)
	rg.PUT("/:name/profile/name", h.SetPushName)
	rg.PUT("/:name/profile/picture", h.SetProfilePicture)
	rg.DELETE("/:name/profile/picture", h.DeleteProfilePicture)
	rg.GET("/:name/profile/privacy", h.GetPrivacySettings)
	rg.PUT("/:name/profile/privacy", h.SetPrivacySettings)
	rg.PUT("/:name/profile/disappearing", h.SetDefaultDisappearingTimer)
}

func registerWebhookRoutes(rg *gin.RouterGroup, h *handler.WebhookHandler) {
	rg.GET("/:name/webhook", h.GetWebhook)
	rg.POST("/:name/webhook", h.SetWebhook)
}

func registerEventRoutes(r *gin.Engine, apiKey string, h *handler.WebhookHandler) {
	r.GET("/events", middleware.Auth(apiKey), h.GetEvents)
}

func registerNewsletterRoutes(rg *gin.RouterGroup, h *handler.NewsletterHandler) {
	if h == nil {
		return
	}
	rg.POST("/:name/newsletter/create", h.CreateNewsletter)
	rg.POST("/:name/newsletter/follow", h.FollowNewsletter)
	rg.POST("/:name/newsletter/unfollow", h.UnfollowNewsletter)
	rg.GET("/:name/newsletter/:newsletterId/info", h.GetNewsletterInfo)
	rg.GET("/:name/newsletter/list", h.GetSubscribedNewsletters)
	rg.GET("/:name/newsletter/:newsletterId/messages", h.GetNewsletterMessages)
	rg.POST("/:name/newsletter/reaction", h.NewsletterSendReaction)
	rg.POST("/:name/newsletter/mute", h.NewsletterToggleMute)
}

func registerStatusRoutes(rg *gin.RouterGroup, h *handler.StatusHandler) {
	if h == nil {
		return
	}
	rg.POST("/:name/story", h.SendStory)
	rg.GET("/:name/status/privacy", h.GetStatusPrivacy)
}

func registerCallRoutes(rg *gin.RouterGroup, h *handler.CallHandler) {
	if h == nil {
		return
	}
	rg.POST("/:name/call/reject", h.RejectCall)
}

func registerCommunityRoutes(rg *gin.RouterGroup, h *handler.CommunityHandler) {
	if h == nil {
		return
	}
	rg.POST("/:name/community/link", h.LinkGroup)
	rg.POST("/:name/community/unlink", h.UnlinkGroup)
	rg.GET("/:name/community/:communityId/subgroups", h.GetSubGroups)
}
