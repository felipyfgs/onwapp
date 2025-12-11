package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"onwapp/internal/admin"
	"onwapp/internal/api/handler"
	"onwapp/internal/api/router"
	"onwapp/internal/config"
	"onwapp/internal/db"
	"onwapp/internal/integrations/chatwoot"
	"onwapp/internal/integrations/webhook"
	"onwapp/internal/logger"
	"onwapp/internal/queue"
	"onwapp/internal/service"
	"onwapp/internal/service/wpp"
	"onwapp/internal/version"

	_ "onwapp/docs"
)

// @title           OnWapp WhatsApp API
// @version         0.1.0
// @description     WhatsApp API with Chatwoot Integration. Supports two authentication levels: Global API key (full access) and Session API key (session-specific access).

// @BasePath  /

// @securityDefinitions.apikey Authorization
// @in header
// @name Authorization
// @description API key for authentication. Use global key for full access or session-specific key for restricted access.

// @tag.name sessions
// @tag.description Session lifecycle & connection management
// @tag.name profile
// @tag.description Account identity & settings
// @tag.name settings
// @tag.description Session settings & privacy configuration
// @tag.name presence
// @tag.description Online status & typing indicators
// @tag.name contact
// @tag.description Contacts & user management
// @tag.name group
// @tag.description Group management & participants
// @tag.name community
// @tag.description Community & linked groups
// @tag.name chat
// @tag.description Conversations & message operations
// @tag.name message
// @tag.description Send text, media & interactive messages
// @tag.name media
// @tag.description File storage & downloads
// @tag.name newsletter
// @tag.description Channels & broadcasts
// @tag.name status
// @tag.description Stories & status updates
// @tag.name call
// @tag.description Voice & video calls
// @tag.name webhook
// @tag.description Webhook integrations
// @tag.name chatwoot
// @tag.description Chatwoot integration

// @x-extension-openapi {"disableSwaggerDefaultValue": true}

func main() {
	versionFlag := flag.Bool("version", false, "Print version information")
	flag.BoolVar(versionFlag, "v", false, "Print version information (shorthand)")
	flag.Parse()

	if *versionFlag {
		fmt.Println(version.Info())
		os.Exit(0)
	}

	ctx := context.Background()

	cfg := config.Load()

	if err := cfg.Validate(); err != nil {
		panic(err)
	}

	logger.Init(cfg.LogLevel.String(), cfg.LogFormat.String())

	logger.Core().Info().Str("version", version.Short()).Msg("Starting OnWapp API")

	database, err := db.New(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.DB().Fatal().Err(err).Msg("Failed to initialize database")
	}

	storageService, err := service.NewStorageService(cfg)
	if err != nil {
		logger.Storage().Warn().Err(err).Msg("Failed to initialize storage service, media storage disabled")
	} else {
		if err := storageService.EnsureBucket(ctx); err != nil {
			logger.Storage().Warn().Err(err).Msg("Failed to ensure storage bucket, media storage disabled")
			storageService = nil
		} else {
			logger.Storage().Info().Str("bucket", cfg.MinioBucket).Msg("Storage service initialized")
		}
	}

	var mediaService *service.MediaService
	if storageService != nil {
		mediaService = service.NewMediaService(database, storageService)
	}

	webhookRepo := webhook.NewRepository(database.Pool)
	webhookService := webhook.NewService(webhookRepo)
	sessionService := service.NewSessionService(database.Container, database, webhookService)
	wppService := wpp.New(sessionService)

	if mediaService != nil {
		sessionService.SetMediaService(mediaService)
		logger.Storage().Info().Msg("Media service configured for automatic downloads")
	}

	historySyncService := service.NewHistorySyncService(database.Chats)
	historySyncService.SetMessageRepository(database.Messages)
	sessionService.SetHistorySyncService(historySyncService)

	settingsAdapter := service.NewSettingsAdapter(database.Settings)
	sessionService.SetSettingsProvider(settingsAdapter)
	sessionService.SetCallRejecter(wppService)
	sessionService.SetPrivacyGetter(wppService)
	sessionService.SetPresenceSender(wppService)

	var queueService *queue.Service
	var adminPublisher *admin.Publisher
	if cfg.NatsEnabled {
		var err error
		queueService, err = queue.NewService(cfg)
		if err != nil {
			logger.Nats().Warn().Err(err).Msg("Failed to initialize queue service, messages will be processed directly")
		} else {
			if err := queueService.Initialize(ctx); err != nil {
				logger.Nats().Warn().Err(err).Msg("Failed to initialize queue streams")
				queueService.Close()
				queueService = nil
			} else {
				logger.Nats().Info().Msg("Queue service initialized with NATS JetStream")

				adminPublisher = admin.New(queueService.Client())
				if adminPublisher != nil {
					if err := adminPublisher.EnsureStream(ctx); err != nil {
						logger.Nats().Warn().Err(err).Msg("Failed to initialize admin stream")
					}
				}
			}
		}
	}

	chatwootRepo := chatwoot.NewRepository(database.Pool)
	chatwootService := chatwoot.NewService(chatwootRepo, database, cfg.ServerURL)

	webhookService.SetChatwootProvider(chatwoot.NewWebhookProvider(chatwootRepo, database))
	chatwootService.SetWebhookSender(chatwoot.NewWebhookSenderAdapter(webhookService))
	chatwootService.SetMediaDownloader(wppService.DownloadMedia) // Enable media upload to Chatwoot

	sessionService.SetWebhookSkipChecker(func(sessionID string, event string) bool {
		if event != "message.received" && event != "message.sent" {
			return false
		}
		cfg, err := chatwootRepo.GetEnabledBySessionID(ctx, sessionID)
		if err != nil || cfg == nil {
			return false // Chatwoot not enabled, don't skip
		}
		return true // Chatwoot is enabled, skip (Chatwoot service will send the webhook)
	})
	chatwootService.SetProfilePictureFetcher(func(ctx context.Context, sessionName string, jid string) (string, error) {
		pic, err := wppService.GetProfilePicture(ctx, sessionName, jid)
		if err != nil {
			return "", err
		}
		if pic != nil {
			return pic.URL, nil
		}
		return "", nil
	})
	chatwootService.SetGroupInfoFetcher(func(ctx context.Context, sessionName string, groupJid string) (string, error) {
		info, err := wppService.GetGroupInfo(ctx, sessionName, groupJid)
		if err != nil {
			return "", err
		}
		if info != nil {
			return info.Name, nil // GroupInfo.GroupName.Name is the group subject/name
		}
		return "", nil
	})
	chatwootEventHandler := chatwoot.NewEventHandler(chatwootService)
	chatwootHandler := chatwoot.NewHandler(chatwootService, sessionService, wppService, database)

	if queueService != nil && queueService.IsEnabled() {
		chatwootEventHandler.SetQueueProducer(queueService.Producer())
		chatwootHandler.SetQueueProducer(queueService.Producer())

		chatwoot.RegisterQueueHandlers(queueService, chatwootService)
		chatwoot.RegisterCWToWAQueueHandlers(queueService, chatwootHandler)

		if err := queueService.Start(ctx); err != nil {
			logger.Nats().Warn().Err(err).Msg("Failed to start queue consumers")
		} else {
			logger.Nats().Info().Msg("Queue consumers started")
		}
	}

	sessionService.AddEventHandler(chatwootEventHandler.HandleEvent)

	if adminPublisher != nil {
		sessionService.AddEventHandler(adminPublisher.HandleEvent)
		logger.Admin().Info().Msg("Admin event handler registered")
	}

	if err := sessionService.LoadFromDatabase(ctx); err != nil {
		logger.Session().Warn().Err(err).Msg("Failed to load sessions from database")
	}

	webhookHandler := webhook.NewHandler(webhookService, sessionService)

	var mediaHandler *handler.MediaHandler
	if mediaService != nil {
		mediaHandler = handler.NewMediaHandler(database, mediaService, sessionService, storageService)
	}

	chatHandler := handler.NewChatHandler(wppService, database)
	chatHandler.SetSessionService(sessionService)
	chatHandler.SetHistorySyncService(historySyncService)

	handlers := &router.Handlers{
		Session:    handler.NewSessionHandler(sessionService, wppService, database),
		Profile:    handler.NewProfileHandler(wppService),
		Contact:    handler.NewContactHandler(wppService),
		Group:      handler.NewGroupHandler(wppService),
		Community:  handler.NewCommunityHandler(wppService),
		Chat:       chatHandler,
		Message:    handler.NewMessageHandler(wppService),
		Media:      mediaHandler,
		Newsletter: handler.NewNewsletterHandler(wppService),
		Status:     handler.NewStatusHandler(wppService),
		Settings:   handler.NewSettingsHandler(database.Settings, wppService),
		Webhook:    webhookHandler,
	}

	sessionLookup := func(ctx context.Context, apiKey string) (string, bool) {
		session, err := database.Sessions.GetByApiKey(ctx, apiKey)
		if err != nil || session == nil {
			return "", false
		}
		return session.Session, true
	}

	r := router.SetupWithConfig(&router.Config{
		Handlers:       handlers,
		GlobalAPIKey:   cfg.GlobalAPIKey,
		SessionLookup:  sessionLookup,
		Database:       database,
		AllowedOrigins: []string{"*"},
	})

	chatwoot.RegisterRoutes(r, chatwootHandler, cfg.GlobalAPIKey, sessionLookup)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.API().Info().Str("port", cfg.Port).Msg("Server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.API().Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Core().Info().Msg("Shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.API().Error().Err(err).Msg("Server forced to shutdown")
	}

	if queueService != nil {
		queueService.Close()
		logger.Nats().Info().Msg("Queue service closed")
	}

	database.Close()
	logger.Core().Info().Msg("Server exited gracefully")
}
