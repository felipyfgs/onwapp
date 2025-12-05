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

	"zpwoot/internal/api/handler"
	"zpwoot/internal/api/router"
	"zpwoot/internal/config"
	"zpwoot/internal/db"
	"zpwoot/internal/integrations/chatwoot"
	"zpwoot/internal/integrations/webhook"
	"zpwoot/internal/logger"
	"zpwoot/internal/queue"
	"zpwoot/internal/service"
	"zpwoot/internal/service/wpp"
	"zpwoot/internal/version"

	_ "zpwoot/docs"
)

// @title           ZPWoot WhatsApp API
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
// @tag.name presence
// @tag.description Online status & typing indicators
// @tag.name contact
// @tag.description Contacts & user management
// @tag.name groups
// @tag.description Group management & participants
// @tag.name community
// @tag.description Community & linked groups
// @tag.name chat
// @tag.description Conversations & message operations
// @tag.name messages
// @tag.description Send text, media & interactive messages
// @tag.name media
// @tag.description File storage & downloads
// @tag.name newsletter
// @tag.description Channels & broadcasts
// @tag.name status
// @tag.description Stories & status updates
// @tag.name call
// @tag.description Voice & video calls
// @tag.name history
// @tag.description History sync & offline data
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

	logger.Info().Str("version", version.Short()).Msg("Starting ZPWoot API")

	database, err := db.New(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to initialize database")
	}

	// Initialize Storage service (MinIO)
	storageService, err := service.NewStorageService(cfg)
	if err != nil {
		logger.Warn().Err(err).Msg("Failed to initialize storage service, media storage disabled")
	} else {
		if err := storageService.EnsureBucket(ctx); err != nil {
			logger.Warn().Err(err).Msg("Failed to ensure storage bucket, media storage disabled")
			storageService = nil
		} else {
			logger.Info().Str("bucket", cfg.MinioBucket).Msg("Storage service initialized")
		}
	}

	// Initialize Media service
	var mediaService *service.MediaService
	if storageService != nil {
		mediaService = service.NewMediaService(database, storageService)
	}

	// Initialize Webhook integration
	webhookRepo := webhook.NewRepository(database.Pool)
	webhookService := webhook.NewService(webhookRepo)
	sessionService := service.NewSessionService(database.Container, database, webhookService)
	wppService := wpp.New(sessionService)

	// Set media service for automatic media download to storage
	if mediaService != nil {
		sessionService.SetMediaService(mediaService)
		logger.Info().Msg("Media service configured for automatic downloads")
	}

	// Initialize History Sync service
	historySyncService := service.NewHistorySyncService(database.Chats)
	sessionService.SetHistorySyncService(historySyncService)

	// Initialize Queue service (NATS JetStream)
	var queueService *queue.Service
	if cfg.NatsEnabled {
		var err error
		queueService, err = queue.NewService(cfg)
		if err != nil {
			logger.Warn().Err(err).Msg("Failed to initialize queue service, messages will be processed directly")
		} else {
			if err := queueService.Initialize(ctx); err != nil {
				logger.Warn().Err(err).Msg("Failed to initialize queue streams")
				queueService.Close()
				queueService = nil
			} else {
				logger.Info().Msg("Queue service initialized with NATS JetStream")
			}
		}
	}

	// Initialize Chatwoot integration
	chatwootRepo := chatwoot.NewRepository(database.Pool)
	chatwootService := chatwoot.NewService(chatwootRepo, database, cfg.ServerURL)

	// Connect Chatwoot provider to webhook service (with database for message IDs)
	webhookService.SetChatwootProvider(chatwoot.NewWebhookProvider(chatwootRepo, database))
	// Connect webhook sender to Chatwoot service (for dispatching webhooks with CW IDs after message processing)
	chatwootService.SetWebhookSender(chatwoot.NewWebhookSenderAdapter(webhookService))
	chatwootService.SetMediaDownloader(wppService.DownloadMedia) // Enable media upload to Chatwoot

	// Configure webhook skip checker: skip message webhooks from EventService when Chatwoot is enabled
	// (Chatwoot service will send its own webhook with enriched data including CW IDs)
	sessionService.SetWebhookSkipChecker(func(sessionID string, event string) bool {
		// Only skip message events - other events (session, presence, etc.) should still be sent by EventService
		if event != "message.received" && event != "message.sent" {
			return false
		}
		// Check if Chatwoot is enabled for this session
		cfg, err := chatwootRepo.GetEnabledBySessionID(ctx, sessionID)
		if err != nil || cfg == nil {
			return false // Chatwoot not enabled, don't skip
		}
		return true // Chatwoot is enabled, skip (Chatwoot service will send the webhook)
	})
	// Set profile picture fetcher for contact management
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
	// Set group info fetcher for getting real group names
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

	// Set queue producer on Chatwoot handlers if queue is enabled
	if queueService != nil && queueService.IsEnabled() {
		chatwootEventHandler.SetQueueProducer(queueService.Producer())
		chatwootHandler.SetQueueProducer(queueService.Producer())

		// Register queue handlers
		chatwoot.RegisterQueueHandlers(queueService, chatwootService)
		chatwoot.RegisterCWToWAQueueHandlers(queueService, chatwootHandler)

		// Start queue consumers
		if err := queueService.Start(ctx); err != nil {
			logger.Warn().Err(err).Msg("Failed to start queue consumers")
		} else {
			logger.Info().Msg("Queue consumers started")
		}
	}

	// Register Chatwoot event handler
	sessionService.AddEventHandler(chatwootEventHandler.HandleEvent)

	// Load existing sessions from database
	if err := sessionService.LoadFromDatabase(ctx); err != nil {
		logger.Warn().Err(err).Msg("Failed to load sessions from database")
	}

	// Initialize Webhook handler
	webhookHandler := webhook.NewHandler(webhookService, sessionService)

	// Initialize Media handler
	var mediaHandler *handler.MediaHandler
	if mediaService != nil {
		mediaHandler = handler.NewMediaHandler(database, mediaService, sessionService)
	}

	// Initialize History handler
	historyHandler := handler.NewHistoryHandler(sessionService, wppService, historySyncService)

	handlers := &router.Handlers{
		Session:    handler.NewSessionHandler(sessionService, wppService, database),
		Profile:    handler.NewProfileHandler(wppService),
		Presence:   handler.NewPresenceHandler(wppService),
		Contact:    handler.NewContactHandler(wppService),
		Group:      handler.NewGroupHandler(wppService),
		Community:  handler.NewCommunityHandler(wppService),
		Chat:       handler.NewChatHandler(wppService),
		Message:    handler.NewMessageHandler(wppService),
		Media:      mediaHandler,
		Newsletter: handler.NewNewsletterHandler(wppService),
		Status:     handler.NewStatusHandler(wppService),
		Call:       handler.NewCallHandler(wppService),
		History:    historyHandler,
		Webhook:    webhookHandler,
	}

	// Create session lookup function for session-level API keys
	sessionLookup := func(ctx context.Context, apiKey string) (string, bool) {
		session, err := database.Sessions.GetByApiKey(ctx, apiKey)
		if err != nil || session == nil {
			return "", false
		}
		return session.Session, true
	}

	r := router.SetupWithConfig(&router.Config{
		Handlers:        handlers,
		GlobalAPIKey:    cfg.GlobalAPIKey,
		SessionLookup:   sessionLookup,
		Database:        database,
		RateLimitPerMin: 100,
		AllowedOrigins:  []string{"*"},
	})

	// Register Chatwoot routes
	chatwoot.RegisterRoutes(r, chatwootHandler, cfg.GlobalAPIKey, sessionLookup)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Start server in goroutine
	go func() {
		logger.Info().Str("port", cfg.Port).Msg("Server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("failed to start server")
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info().Msg("Shutting down server...")

	// Give outstanding requests 10 seconds to complete
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error().Err(err).Msg("Server forced to shutdown")
	}

	// Close queue service
	if queueService != nil {
		queueService.Close()
		logger.Info().Msg("Queue service closed")
	}

	database.Close()
	logger.Info().Msg("Server exited gracefully")
}
