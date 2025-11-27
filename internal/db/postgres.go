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

	"zpwoot/internal/logger"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

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

	if err := runMigrations(ctx, pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

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

// Session management

type SessionRecord struct {
	ID        int    `db:"id"`
	Name      string `db:"name"`
	DeviceJID string `db:"deviceJid"`
	Status    string `db:"status"`
}

func (d *Database) CreateSession(ctx context.Context, name string) error {
	_, err := d.Pool.Exec(ctx, `INSERT INTO "zpSessions" ("name") VALUES ($1) ON CONFLICT ("name") DO NOTHING`, name)
	return err
}

func (d *Database) UpdateSessionJID(ctx context.Context, name, jid string) error {
	_, err := d.Pool.Exec(ctx, `UPDATE "zpSessions" SET "deviceJid" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "name" = $2`, jid, name)
	return err
}

func (d *Database) UpdateSessionStatus(ctx context.Context, name, status string) error {
	_, err := d.Pool.Exec(ctx, `UPDATE "zpSessions" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "name" = $2`, status, name)
	return err
}

func (d *Database) DeleteSession(ctx context.Context, name string) error {
	_, err := d.Pool.Exec(ctx, `DELETE FROM "zpSessions" WHERE "name" = $1`, name)
	return err
}

func (d *Database) GetAllSessions(ctx context.Context) ([]SessionRecord, error) {
	rows, err := d.Pool.Query(ctx, `SELECT "id", "name", COALESCE("deviceJid", '') as "deviceJid", COALESCE("status", 'disconnected') as "status" FROM "zpSessions"`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []SessionRecord
	for rows.Next() {
		var s SessionRecord
		if err := rows.Scan(&s.ID, &s.Name, &s.DeviceJID, &s.Status); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

func runMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	logger.Info().Msg("Running database migrations...")

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
			logger.Info().Int("version", version).Str("file", file).Msg("Applying migration")

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
				tx.Rollback(ctx)
				return fmt.Errorf("failed to apply migration %d: %w", version, err)
			}

			_, err = tx.Exec(ctx, `INSERT INTO "schemaMigrations" ("version") VALUES ($1)`, version)
			if err != nil {
				tx.Rollback(ctx)
				return fmt.Errorf("failed to record migration %d: %w", version, err)
			}

			if err := tx.Commit(ctx); err != nil {
				return fmt.Errorf("failed to commit migration %d: %w", version, err)
			}

			logger.Info().Int("version", version).Msg("Migration applied successfully")
		}
	}

	logger.Info().Msg("Database migrations completed")
	return nil
}
