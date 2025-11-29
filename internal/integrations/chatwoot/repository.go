package chatwoot

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/logger"
)

// Repository handles database operations for Chatwoot integration
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a new Chatwoot repository
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Migrate creates the necessary table if it doesn't exist
func (r *Repository) Migrate(ctx context.Context) error {
	query := `
		CREATE TABLE IF NOT EXISTS "zpChatwoot" (
			"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			"sessionId" UUID NOT NULL UNIQUE REFERENCES "zpSessions"("id") ON DELETE CASCADE,
			"enabled" BOOLEAN NOT NULL DEFAULT false,
			"url" TEXT NOT NULL DEFAULT '',
			"token" TEXT NOT NULL DEFAULT '',
			"account" INTEGER NOT NULL DEFAULT 0,
			"inboxId" INTEGER,
			"inbox" TEXT,
			"signAgent" BOOLEAN NOT NULL DEFAULT false,
			"signSeparator" TEXT,
			"autoReopen" BOOLEAN NOT NULL DEFAULT false,
			"startPending" BOOLEAN NOT NULL DEFAULT false,
			"mergeBrPhones" BOOLEAN NOT NULL DEFAULT false,
			"syncContacts" BOOLEAN NOT NULL DEFAULT false,
			"syncMessages" BOOLEAN NOT NULL DEFAULT false,
			"syncDays" INTEGER DEFAULT 0,
			"ignoreChats" TEXT[],
			"autoInbox" BOOLEAN NOT NULL DEFAULT false,
			"webhookUrl" TEXT,
			"createdAt" TIMESTAMPTZ DEFAULT NOW(),
			"updatedAt" TIMESTAMPTZ DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS "idx_zpChatwoot_sessionId" ON "zpChatwoot"("sessionId");
		CREATE INDEX IF NOT EXISTS "idx_zpChatwoot_enabled" ON "zpChatwoot"("enabled");
	`

	_, err := r.pool.Exec(ctx, query)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to create zpChatwoot table")
		return err
	}

	logger.Info().Msg("Chatwoot configs table migrated successfully")
	return nil
}

// Upsert creates or updates a Chatwoot configuration
func (r *Repository) Upsert(ctx context.Context, cfg *Config) (*Config, error) {
	query := `
		INSERT INTO "zpChatwoot" (
			"sessionId", "enabled", "url", "token", "account",
			"inboxId", "inbox", "signAgent", "signSeparator",
			"autoReopen", "startPending", "mergeBrPhones",
			"syncContacts", "syncMessages", "syncDays",
			"ignoreChats", "autoInbox", "webhookUrl", "updatedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
		ON CONFLICT ("sessionId") DO UPDATE SET
			"enabled" = EXCLUDED."enabled",
			"url" = EXCLUDED."url",
			"token" = EXCLUDED."token",
			"account" = EXCLUDED."account",
			"inboxId" = EXCLUDED."inboxId",
			"inbox" = EXCLUDED."inbox",
			"signAgent" = EXCLUDED."signAgent",
			"signSeparator" = EXCLUDED."signSeparator",
			"autoReopen" = EXCLUDED."autoReopen",
			"startPending" = EXCLUDED."startPending",
			"mergeBrPhones" = EXCLUDED."mergeBrPhones",
			"syncContacts" = EXCLUDED."syncContacts",
			"syncMessages" = EXCLUDED."syncMessages",
			"syncDays" = EXCLUDED."syncDays",
			"ignoreChats" = EXCLUDED."ignoreChats",
			"autoInbox" = EXCLUDED."autoInbox",
			"webhookUrl" = EXCLUDED."webhookUrl",
			"updatedAt" = NOW()
		RETURNING "id", "createdAt", "updatedAt"
	`

	err := r.pool.QueryRow(ctx, query,
		cfg.SessionID, cfg.Enabled, cfg.URL, cfg.Token, cfg.Account,
		cfg.InboxID, cfg.Inbox, cfg.SignAgent, cfg.SignSeparator,
		cfg.AutoReopen, cfg.StartPending, cfg.MergeBrPhones,
		cfg.SyncContacts, cfg.SyncMessages, cfg.SyncDays,
		cfg.IgnoreChats, cfg.AutoInbox, cfg.WebhookURL,
	).Scan(&cfg.ID, &cfg.CreatedAt, &cfg.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return cfg, nil
}

// GetBySessionID retrieves configuration by session ID
func (r *Repository) GetBySessionID(ctx context.Context, sessionID string) (*Config, error) {
	query := `
		SELECT "id", "sessionId", "enabled", "url", "token", "account",
			   "inboxId", "inbox", "signAgent", "signSeparator",
			   "autoReopen", "startPending", "mergeBrPhones",
			   "syncContacts", "syncMessages", "syncDays",
			   "ignoreChats", "autoInbox", "webhookUrl", "createdAt", "updatedAt"
		FROM "zpChatwoot"
		WHERE "sessionId" = $1
	`

	cfg := &Config{}
	err := r.pool.QueryRow(ctx, query, sessionID).Scan(
		&cfg.ID, &cfg.SessionID, &cfg.Enabled, &cfg.URL, &cfg.Token, &cfg.Account,
		&cfg.InboxID, &cfg.Inbox, &cfg.SignAgent, &cfg.SignSeparator,
		&cfg.AutoReopen, &cfg.StartPending, &cfg.MergeBrPhones,
		&cfg.SyncContacts, &cfg.SyncMessages, &cfg.SyncDays,
		&cfg.IgnoreChats, &cfg.AutoInbox, &cfg.WebhookURL, &cfg.CreatedAt, &cfg.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return cfg, nil
}

// GetEnabledBySessionID retrieves enabled configuration by session ID
func (r *Repository) GetEnabledBySessionID(ctx context.Context, sessionID string) (*Config, error) {
	cfg, err := r.GetBySessionID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if cfg == nil || !cfg.Enabled {
		return nil, nil
	}
	return cfg, nil
}

// GetAllEnabled retrieves all enabled configurations
func (r *Repository) GetAllEnabled(ctx context.Context) ([]*Config, error) {
	query := `
		SELECT "id", "sessionId", "enabled", "url", "token", "account",
			   "inboxId", "inbox", "signAgent", "signSeparator",
			   "autoReopen", "startPending", "mergeBrPhones",
			   "syncContacts", "syncMessages", "syncDays",
			   "ignoreChats", "autoInbox", "webhookUrl", "createdAt", "updatedAt"
		FROM "zpChatwoot"
		WHERE "enabled" = true
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []*Config
	for rows.Next() {
		cfg := &Config{}
		err := rows.Scan(
			&cfg.ID, &cfg.SessionID, &cfg.Enabled, &cfg.URL, &cfg.Token, &cfg.Account,
			&cfg.InboxID, &cfg.Inbox, &cfg.SignAgent, &cfg.SignSeparator,
			&cfg.AutoReopen, &cfg.StartPending, &cfg.MergeBrPhones,
			&cfg.SyncContacts, &cfg.SyncMessages, &cfg.SyncDays,
			&cfg.IgnoreChats, &cfg.AutoInbox, &cfg.WebhookURL, &cfg.CreatedAt, &cfg.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		configs = append(configs, cfg)
	}

	return configs, rows.Err()
}

// Delete removes a configuration by session ID
func (r *Repository) Delete(ctx context.Context, sessionID string) error {
	query := `DELETE FROM "zpChatwoot" WHERE "sessionId" = $1`
	_, err := r.pool.Exec(ctx, query, sessionID)
	return err
}

// UpdateInboxID updates the inbox ID for a configuration
func (r *Repository) UpdateInboxID(ctx context.Context, sessionID string, inboxID int) error {
	query := `UPDATE "zpChatwoot" SET "inboxId" = $1, "updatedAt" = $2 WHERE "sessionId" = $3`
	_, err := r.pool.Exec(ctx, query, inboxID, time.Now(), sessionID)
	return err
}
