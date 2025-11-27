package main

import (
	"context"
	"log"

	"zpwoot/internal/api"
	"zpwoot/internal/config"
	"zpwoot/internal/db"
	"zpwoot/internal/service"

	_ "zpwoot/docs"
)

// @title           ZPWoot WhatsApp API
// @version         1.0
// @description     WhatsApp API using whatsmeow library
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:3000
// @BasePath  /

func main() {
	ctx := context.Background()

	cfg := config.Load()

	database, err := db.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}
	defer database.Close()

	sessionService := service.NewSessionService(database.Container)
	handler := api.NewHandler(sessionService)
	router := api.SetupRouter(handler)

	log.Printf("Starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
