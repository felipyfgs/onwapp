package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

type Database struct {
	Pool      *pgxpool.Pool
	Container *sqlstore.Container
}

func New(ctx context.Context, databaseURL string) (*Database, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Run custom migrations
	if err := runMigrations(ctx, pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	// whatsmeow sqlstore creates its own tables automatically
	dbLog := waLog.Stdout("Database", "INFO", true)
	container, err := sqlstore.New(ctx, "pgx", databaseURL, dbLog)
	if err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to create sqlstore: %w", err)
	}

	return &Database{
		Pool:      pool,
		Container: container,
	}, nil
}

func (d *Database) Close() {
	d.Pool.Close()
}

func runMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	log.Println("Running database migrations...")

	// Create migrations table if not exists
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get current version
	var currentVersion int
	err = pool.QueryRow(ctx, "SELECT COALESCE(MAX(version), 0) FROM schema_migrations").Scan(&currentVersion)
	if err != nil {
		return fmt.Errorf("failed to get current migration version: %w", err)
	}

	// Run pending migrations in order
	for _, m := range migrations {
		if m.version > currentVersion {
			log.Printf("Applying migration %d: %s", m.version, m.name)

			tx, err := pool.Begin(ctx)
			if err != nil {
				return fmt.Errorf("failed to begin transaction: %w", err)
			}

			_, err = tx.Exec(ctx, m.sql)
			if err != nil {
				tx.Rollback(ctx)
				return fmt.Errorf("failed to apply migration %d: %w", m.version, err)
			}

			_, err = tx.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", m.version)
			if err != nil {
				tx.Rollback(ctx)
				return fmt.Errorf("failed to record migration %d: %w", m.version, err)
			}

			if err := tx.Commit(ctx); err != nil {
				return fmt.Errorf("failed to commit migration %d: %w", m.version, err)
			}

			log.Printf("Migration %d applied successfully", m.version)
		}
	}

	log.Println("Database migrations completed")
	return nil
}

type migration struct {
	version int
	name    string
	sql     string
}

var migrations = []migration{
	{
		version: 1,
		name:    "create_sessions_table",
		sql: `
			CREATE TABLE IF NOT EXISTS sessions (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) UNIQUE NOT NULL,
				jid VARCHAR(255),
				status VARCHAR(50) DEFAULT 'disconnected',
				webhook_url TEXT,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS idx_sessions_name ON sessions(name);
			CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
		`,
	},
	{
		version: 2,
		name:    "create_webhooks_table",
		sql: `
			CREATE TABLE IF NOT EXISTS webhooks (
				id SERIAL PRIMARY KEY,
				session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
				url TEXT NOT NULL,
				events TEXT[] DEFAULT '{}',
				enabled BOOLEAN DEFAULT true,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS idx_webhooks_session_id ON webhooks(session_id);
		`,
	},
	{
		version: 3,
		name:    "create_message_logs_table",
		sql: `
			CREATE TABLE IF NOT EXISTS message_logs (
				id SERIAL PRIMARY KEY,
				session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
				message_id VARCHAR(255) NOT NULL,
				jid VARCHAR(255) NOT NULL,
				direction VARCHAR(10) NOT NULL,
				message_type VARCHAR(50),
				content TEXT,
				status VARCHAR(50),
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS idx_message_logs_session_id ON message_logs(session_id);
			CREATE INDEX IF NOT EXISTS idx_message_logs_message_id ON message_logs(message_id);
			CREATE INDEX IF NOT EXISTS idx_message_logs_jid ON message_logs(jid);
			CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at);
		`,
	},
}
