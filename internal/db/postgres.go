package db

import (
	"context"
	"embed"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"

	"onwapp/internal/db/repository"
	"onwapp/internal/logger"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

type Database struct {
	Pool           *pgxpool.Pool
	Container      *sqlstore.Container
	Sessions       *repository.SessionRepository
	Messages       *repository.MessageRepository
	MessageUpdates *repository.MessageUpdateRepository
	Media          *repository.MediaRepository
	Chats          *repository.ChatRepository
	Settings       *repository.SettingsRepository
}

func New(ctx context.Context, databaseURL string) (*Database, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if pingErr := pool.Ping(ctx); pingErr != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", pingErr)
	}

	dbLog := waLog.Zerolog(logger.FilteredDBLogger())
	container, err := sqlstore.New(ctx, "pgx", databaseURL, dbLog)
	if err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to create sqlstore: %w", err)
	}

	if err := runMigrations(ctx, pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	if err := ensureWhatsmeowFKs(ctx, pool); err != nil {
		logger.DB().Warn().Err(err).Msg("Failed to ensure whatsmeow FK constraints")
	}

	return &Database{
		Pool:           pool,
		Container:      container,
		Sessions:       repository.NewSessionRepository(pool),
		Messages:       repository.NewMessageRepository(pool),
		MessageUpdates: repository.NewMessageUpdateRepository(pool),
		Media:          repository.NewMediaRepository(pool),
		Chats:          repository.NewChatRepository(pool),
		Settings:       repository.NewSettingsRepository(pool),
	}, nil
}

func (d *Database) Close() {
	d.Pool.Close()
}

func ensureWhatsmeowFKs(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `SELECT zp_ensure_whatsmeow_fks()`)
	return err
}

func runMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	logger.DB().Info().Msg("Running database migrations...")

	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS "schemaMigrations" (
			"version" INTEGER PRIMARY KEY,
			"appliedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	var currentVersion int
	err = pool.QueryRow(ctx, `SELECT COALESCE(MAX("version"), 0) FROM "schemaMigrations"`).Scan(&currentVersion)
	if err != nil {
		return fmt.Errorf("failed to get current migration version: %w", err)
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			files = append(files, entry.Name())
		}
	}
	sort.Strings(files)

	for _, file := range files {
		version, err := strconv.Atoi(file[:3])
		if err != nil {
			continue
		}

		if version > currentVersion {
			logger.DB().Info().Int("version", version).Str("file", file).Msg("Applying migration")

			content, err := migrationsFS.ReadFile("migrations/" + file)
			if err != nil {
				return fmt.Errorf("failed to read migration file %s: %w", file, err)
			}

			tx, err := pool.Begin(ctx)
			if err != nil {
				return fmt.Errorf("failed to begin transaction: %w", err)
			}

			_, err = tx.Exec(ctx, string(content))
			if err != nil {
				_ = tx.Rollback(ctx)
				return fmt.Errorf("failed to apply migration %d: %w", version, err)
			}

			_, err = tx.Exec(ctx, `INSERT INTO "schemaMigrations" ("version") VALUES ($1)`, version)
			if err != nil {
				_ = tx.Rollback(ctx)
				return fmt.Errorf("failed to record migration %d: %w", version, err)
			}

			if err := tx.Commit(ctx); err != nil {
				return fmt.Errorf("failed to commit migration %d: %w", version, err)
			}

			logger.DB().Info().Int("version", version).Msg("Migration applied successfully")
		}
	}

	logger.DB().Info().Msg("Database migrations completed")
	return nil
}
