package db

import (
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
)

func RunMigrations() error {
	// Load .env file
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	// Get database URL from environment
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return logAndError("DATABASE_URL environment variable not set")
	}

	// Create migrate instance
	m, err := migrate.New(
		"file://internal/db/migrations",
		databaseURL,
	)
	if err != nil {
		return logAndErrorf("Failed to create migrate instance: %v", err)
	}

	// Run migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return logAndErrorf("Failed to run migrations: %v", err)
	}

	log.Println("✅ Database migrations completed successfully")
	return nil
}

func logAndError(msg string) error {
	log.Println("❌ Migration error:", msg)
	return migrate.ErrMigrationFailed
}

func logAndErrorf(format string, args ...interface{}) error {
	log.Printf("❌ Migration error: "+format, args...)
	return migrate.ErrMigrationFailed
}
