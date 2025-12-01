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
	"zpwoot/internal/version"

	_ "zpwoot/docs"
)

// @title           ZPWoot WhatsApp API
// @version         0.1.0
// @description     WhatsApp API with Chatwoot Integration

// @BasePath  /

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name apikey

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
	whatsappService := service.NewWhatsAppService(sessionService)

	// Set media service for automatic media download to storage
	if mediaService != nil {
		sessionService.SetMediaService(mediaService)
		logger.Info().Msg("Media service configured for automatic downloads")
	}

	// Initialize History Sync service
	historySyncService := service.NewHistorySyncService(
		database.Chats,
		database.Stickers,
		database.HistorySync,
	)
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
	chatwootService.SetMediaDownloader(whatsappService.DownloadMedia) // Enable media upload to Chatwoot
	// Set profile picture fetcher for contact management
	chatwootService.SetProfilePictureFetcher(func(ctx context.Context, sessionName string, jid string) (string, error) {
		pic, err := whatsappService.GetProfilePicture(ctx, sessionName, jid)
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
		info, err := whatsappService.GetGroupInfo(ctx, sessionName, groupJid)
		if err != nil {
			return "", err
		}
		if info != nil {
			return info.Name, nil // GroupInfo.GroupName.Name is the group subject/name
		}
		return "", nil
	})
	chatwootEventHandler := chatwoot.NewEventHandler(chatwootService)
	chatwootHandler := chatwoot.NewHandler(chatwootService, sessionService, whatsappService, database)

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

	handlers := &router.Handlers{
		Session:    handler.NewSessionHandler(sessionService, whatsappService),
		Message:    handler.NewMessageHandler(whatsappService),
		Group:      handler.NewGroupHandler(whatsappService),
		Contact:    handler.NewContactHandler(whatsappService),
		Chat:       handler.NewChatHandler(whatsappService),
		Profile:    handler.NewProfileHandler(whatsappService),
		Webhook:    webhookHandler,
		Newsletter: handler.NewNewsletterHandler(whatsappService),
		Status:     handler.NewStatusHandler(whatsappService),
		Call:       handler.NewCallHandler(whatsappService),
		Community:  handler.NewCommunityHandler(whatsappService),
		Media:      mediaHandler,
	}

	r := router.SetupWithConfig(&router.Config{
		Handlers:        handlers,
		APIKey:          cfg.APIKey,
		Database:        database,
		RateLimitPerMin: 100,
		AllowedOrigins:  []string{"*"},
	})

	// Register Chatwoot routes
	chatwoot.RegisterRoutes(r, chatwootHandler, cfg.APIKey)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
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
