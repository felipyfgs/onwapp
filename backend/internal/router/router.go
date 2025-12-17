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

	// Middleware
	app.Use(recover.New())
	app.Use(middleware.LoggerMiddleware(logger))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders:  "Origin, Content-Type, Accept, Authorization",
		AllowMethods:  "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// API routes
	api := app.Group("/api/v1")
	
	// Initialize services
	conn, err := db.Pool.Acquire(context.Background())
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to acquire database connection")
	}
	defer conn.Release()
	
	tenantService := services.NewTenantService(conn.Conn())
	tenantHandler := handlers.NewTenantHandler(tenantService)
	authService := services.NewAuthService(conn.Conn(), config.JWTSecret, config.JWTExpiration)
	authHandler := handlers.NewAuthHandler(authService)

	// Initialize router
	r := &Router{
		app:    app,
		config: config,
		logger: logger,
		db:     db,
	}
	
	// Register routes
	r.registerRoutes(api, tenantHandler, authHandler, authService)
	
	return r
}

func (r *Router) registerRoutes(api fiber.Router, tenantHandler *handlers.TenantHandler, authHandler *handlers.AuthHandler, authService *services.AuthService) {
	// Public routes
	authHandler.RegisterRoutes(api)
	
	// Protected routes
	protected := api.Group("", middleware.AuthMiddleware(authService))
	
	// Register tenant routes
	tenantHandler.RegisterRoutes(protected)
	
	// Add other route groups here
	// r.registerWhatsAppRoutes(protected)
	// r.registerTicketRoutes(protected)
	// etc...
}

func (r *Router) Listen(port string) error {
	return r.app.Listen(port)
}

func errorHandler(c *fiber.Ctx, err error) error {
	// Custom error handling
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
