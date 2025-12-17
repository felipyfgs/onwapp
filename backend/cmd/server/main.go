package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/seu-usuario/onwapp/internal/configs"
	"github.com/seu-usuario/onwapp/internal/db"
	"github.com/seu-usuario/onwapp/internal/router"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		log.Fatal("Error loading .env file")
	}

	// Initialize logger
	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()

	// Load configuration
	config, err := configs.LoadConfig()
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Initialize database
	dbConn, err := db.NewPostgresConnection(config.DatabaseURL)
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer dbConn.Close()

	// Run migrations
	if err := migrations.RunMigrations(); err != nil {
		logger.Fatal().Err(err).Msg("Failed to run database migrations")
	}

	// Initialize router
	r := router.NewRouter(dbConn, &logger, config)

	// Start server
	logger.Info().Msgf("Starting server on %s", config.Port)
	if err := r.Listen(config.Port); err != nil {
		logger.Fatal().Err(err).Msg("Server failed to start")
	}
}
