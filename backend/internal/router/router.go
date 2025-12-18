package router

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog"
	"onwapp/internal/configs"
	"onwapp/internal/db"
	"onwapp/internal/handlers"
	"onwapp/internal/middleware"
	"onwapp/internal/services"
)

type Router struct {
	app     *fiber.App
	config  *configs.Config
	logger  *zerolog.Logger
	db      *db.PostgresDB
}

func NewRouter(db *db.PostgresDB, logger *zerolog.Logger, config *configs.Config) *Router {
	app := fiber.New(fiber.Config{
		AppName:      "Onwapp API",
		BodyLimit:    10 * 1024 * 1024, // 10MB
		ErrorHandler: errorHandler,
	})

	// Middleware Global
	app.Use(recover.New())
	app.Use(middleware.LoggerMiddleware(logger))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "onwapp-api"})
	})

	// API Group
	api := app.Group("/api/v1")
	
	// Initialize all services
	conn, err := db.Pool.Acquire(context.Background())
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to acquire database connection")
	}
	defer conn.Release()
	
	// Services
	authService := services.NewAuthService(conn.Conn(), config.JWTSecret, config.JWTExpiration)
	tenantService := services.NewTenantService(conn.Conn())
	sessionService := services.NewMessagingSessionService(conn.Conn())
	ticketService := services.NewTicketService(conn.Conn())
	contactService := services.NewContactService(conn.Conn())
	queueService := services.NewQueueService(conn.Conn())
	messageService := services.NewMessageService(conn.Conn())
	
	// Handlers
	authHandler := handlers.NewAuthHandler(authService, conn.Conn())
	tenantHandler := handlers.NewTenantHandler(tenantService)
	sessionHandler := handlers.NewMessagingSessionHandler(sessionService)
	ticketHandler := handlers.NewTicketHandler(ticketService)
	contactHandler := handlers.NewContactHandler(contactService)
	queueHandler := handlers.NewQueueHandler(queueService)
	messageHandler := handlers.NewMessageHandler(messageService)

	// Initialize Router
	r := &Router{
		app:    app,
		config: config,
		logger: logger,
		db:     db,
	}

	// Register ALL routes here (Centralizado!)
	r.registerRoutes(api, authService, 
		tenantHandler, authHandler, 
		sessionHandler, ticketHandler, 
		contactHandler, queueHandler, 
		messageHandler,
	)
	
	return r
}

func (r *Router) registerRoutes(
	api fiber.Router,
	authService *services.AuthService,
	tenantHandler *handlers.TenantHandler,
	authHandler *handlers.AuthHandler,
	sessionHandler *handlers.MessagingSessionHandler,
	ticketHandler *handlers.TicketHandler,
	contactHandler *handlers.ContactHandler,
	queueHandler *handlers.QueueHandler,
	messageHandler *handlers.MessageHandler,
) {
	// ==================== PUBLIC ROUTES ====================
	public := api.Group("/auth")
	{
		public.Post("/register", authHandler.Register)
		public.Post("/login", authHandler.Login)
		public.Post("/validate", authHandler.ValidateToken)
	}

	// ==================== PROTECTED ROUTES ====================
	protected := api.Group("", middleware.AuthMiddleware(authService))
	
	// --- TENANT ROUTES ---
	tenantRoutes := protected.Group("/tenants")
	{
		tenantRoutes.Get("", tenantHandler.ListTenants)
		tenantRoutes.Post("", tenantHandler.CreateTenant)
		tenantRoutes.Get("/:id", tenantHandler.GetTenant)
		tenantRoutes.Put("/:id", tenantHandler.UpdateTenant)
		tenantRoutes.Delete("/:id", tenantHandler.DeleteTenant)
	}

	// --- MESSAGING SESSION ROUTES ---
	sessionRoutes := protected.Group("/sessions")
	{
		sessionRoutes.Get("", sessionHandler.ListSessions)
		sessionRoutes.Post("", sessionHandler.CreateSession)
		sessionRoutes.Get("/:id", sessionHandler.GetSession)
		sessionRoutes.Put("/:id", sessionHandler.UpdateSession)
		sessionRoutes.Delete("/:id", sessionHandler.DeleteSession)
		sessionRoutes.Post("/:id/connect", sessionHandler.ConnectSession)
		sessionRoutes.Post("/:id/disconnect", sessionHandler.DisconnectSession)
	}

	// --- CONTACT ROUTES ---
	contactRoutes := protected.Group("/contacts")
	{
		contactRoutes.Get("", contactHandler.ListContacts)
		contactRoutes.Post("", contactHandler.CreateContact)
		contactRoutes.Get("/:id", contactHandler.GetContact)
		contactRoutes.Put("/:id", contactHandler.UpdateContact)
		contactRoutes.Delete("/:id", contactHandler.DeleteContact)
		contactRoutes.Get("/search/q", contactHandler.SearchContacts)
		contactRoutes.Get("/by-waid/:waid", contactHandler.GetByWhatsAppID)
	}

	// --- QUEUE ROUTES ---
	queueRoutes := protected.Group("/queues")
	{
		queueRoutes.Get("", queueHandler.ListQueues)
		queueRoutes.Post("", queueHandler.CreateQueue)
		queueRoutes.Get("/:id", queueHandler.GetQueue)
		queueRoutes.Put("/:id", queueHandler.UpdateQueue)
		queueRoutes.Delete("/:id", queueHandler.DeleteQueue)
	}

	// --- TICKET ROUTES ---
	ticketRoutes := protected.Group("/tickets")
	{
		ticketRoutes.Get("", ticketHandler.ListTickets)
		ticketRoutes.Post("", ticketHandler.CreateTicket)
		ticketRoutes.Get("/:id", ticketHandler.GetTicket)
		ticketRoutes.Put("/:id", ticketHandler.UpdateTicket)
		ticketRoutes.Delete("/:id", ticketHandler.DeleteTicket)
		ticketRoutes.Post("/:id/close", ticketHandler.CloseTicket)
		ticketRoutes.Get("/:id/messages", ticketHandler.GetTicketWithMessages)
		ticketRoutes.Post("/:id/assign", ticketHandler.AssignTicket)
		ticketRoutes.Post("/:id/transfer", ticketHandler.TransferTicket)
	}

	// --- MESSAGE ROUTES ---
	messageRoutes := protected.Group("/messages")
	{
		messageRoutes.Get("", messageHandler.ListMessages)
		messageRoutes.Post("", messageHandler.SendMessage)
		messageRoutes.Get("/ticket/:id", messageHandler.GetTicketMessages)
		messageRoutes.Post("/:id/read", messageHandler.MarkAsRead)
	}
}

func (r *Router) Listen(port string) error {
	return r.app.Listen(port)
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"
	
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}
	
	return c.Status(code).JSON(fiber.Map{
		"error": message,
	})
}
