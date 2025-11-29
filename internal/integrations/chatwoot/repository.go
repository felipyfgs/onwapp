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
		CREATE TABLE IF NOT EXISTS "zpChatwootConfigs" (
			"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			"sessionId" UUID NOT NULL UNIQUE REFERENCES "zpSessions"("id") ON DELETE CASCADE,
			"enabled" BOOLEAN NOT NULL DEFAULT false,
			"url" TEXT NOT NULL DEFAULT '',
			"apiAccessToken" TEXT NOT NULL DEFAULT '',
			"accountId" INTEGER NOT NULL DEFAULT 0,
			"inboxId" INTEGER,
			"inboxName" TEXT,
			"signMsg" BOOLEAN NOT NULL DEFAULT false,
			"signDelimiter" TEXT,
			"reopenConversation" BOOLEAN NOT NULL DEFAULT false,
			"conversationPending" BOOLEAN NOT NULL DEFAULT false,
			"mergeBrazilContacts" BOOLEAN NOT NULL DEFAULT false,
			"importContacts" BOOLEAN NOT NULL DEFAULT false,
			"importMessages" BOOLEAN NOT NULL DEFAULT false,
			"daysLimitImport" INTEGER DEFAULT 0,
			"ignoreJids" TEXT[],
			"autoCreate" BOOLEAN NOT NULL DEFAULT false,
			"webhookUrl" TEXT,
			"createdAt" TIMESTAMPTZ DEFAULT NOW(),
			"updatedAt" TIMESTAMPTZ DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS "idx_zpChatwootConfigs_sessionId" ON "zpChatwootConfigs"("sessionId");
		CREATE INDEX IF NOT EXISTS "idx_zpChatwootConfigs_enabled" ON "zpChatwootConfigs"("enabled");
	`

	_, err := r.pool.Exec(ctx, query)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to create zpChatwootConfigs table")
		return err
	}

	logger.Info().Msg("Chatwoot configs table migrated successfully")
	return nil
}

// Upsert creates or updates a Chatwoot configuration
func (r *Repository) Upsert(ctx context.Context, cfg *Config) (*Config, error) {
	query := `
		INSERT INTO "zpChatwootConfigs" (
			"sessionId", "enabled", "url", "apiAccessToken", "accountId",
			"inboxId", "inboxName", "signMsg", "signDelimiter",
			"reopenConversation", "conversationPending", "mergeBrazilContacts",
			"importContacts", "importMessages", "daysLimitImport",
			"ignoreJids", "autoCreate", "webhookUrl", "updatedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
		ON CONFLICT ("sessionId") DO UPDATE SET
			"enabled" = EXCLUDED."enabled",
			"url" = EXCLUDED."url",
			"apiAccessToken" = EXCLUDED."apiAccessToken",
			"accountId" = EXCLUDED."accountId",
			"inboxId" = EXCLUDED."inboxId",
			"inboxName" = EXCLUDED."inboxName",
			"signMsg" = EXCLUDED."signMsg",
			"signDelimiter" = EXCLUDED."signDelimiter",
			"reopenConversation" = EXCLUDED."reopenConversation",
			"conversationPending" = EXCLUDED."conversationPending",
			"mergeBrazilContacts" = EXCLUDED."mergeBrazilContacts",
			"importContacts" = EXCLUDED."importContacts",
			"importMessages" = EXCLUDED."importMessages",
			"daysLimitImport" = EXCLUDED."daysLimitImport",
			"ignoreJids" = EXCLUDED."ignoreJids",
			"autoCreate" = EXCLUDED."autoCreate",
			"webhookUrl" = EXCLUDED."webhookUrl",
			"updatedAt" = NOW()
		RETURNING "id", "createdAt", "updatedAt"
	`

	err := r.pool.QueryRow(ctx, query,
		cfg.SessionID, cfg.Enabled, cfg.URL, cfg.APIAccessToken, cfg.AccountID,
		cfg.InboxID, cfg.InboxName, cfg.SignMsg, cfg.SignDelimiter,
		cfg.ReopenConversation, cfg.ConversationPending, cfg.MergeBrazilContacts,
		cfg.ImportContacts, cfg.ImportMessages, cfg.DaysLimitImport,
		cfg.IgnoreJids, cfg.AutoCreate, cfg.WebhookURL,
	).Scan(&cfg.ID, &cfg.CreatedAt, &cfg.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return cfg, nil
}

// GetBySessionID retrieves configuration by session ID
func (r *Repository) GetBySessionID(ctx context.Context, sessionID string) (*Config, error) {
	query := `
		SELECT "id", "sessionId", "enabled", "url", "apiAccessToken", "accountId",
			   "inboxId", "inboxName", "signMsg", "signDelimiter",
			   "reopenConversation", "conversationPending", "mergeBrazilContacts",
			   "importContacts", "importMessages", "daysLimitImport",
			   "ignoreJids", "autoCreate", "webhookUrl", "createdAt", "updatedAt"
		FROM "zpChatwootConfigs"
		WHERE "sessionId" = $1
	`

	cfg := &Config{}
	err := r.pool.QueryRow(ctx, query, sessionID).Scan(
		&cfg.ID, &cfg.SessionID, &cfg.Enabled, &cfg.URL, &cfg.APIAccessToken, &cfg.AccountID,
		&cfg.InboxID, &cfg.InboxName, &cfg.SignMsg, &cfg.SignDelimiter,
		&cfg.ReopenConversation, &cfg.ConversationPending, &cfg.MergeBrazilContacts,
		&cfg.ImportContacts, &cfg.ImportMessages, &cfg.DaysLimitImport,
		&cfg.IgnoreJids, &cfg.AutoCreate, &cfg.WebhookURL, &cfg.CreatedAt, &cfg.UpdatedAt,
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
		SELECT "id", "sessionId", "enabled", "url", "apiAccessToken", "accountId",
			   "inboxId", "inboxName", "signMsg", "signDelimiter",
			   "reopenConversation", "conversationPending", "mergeBrazilContacts",
			   "importContacts", "importMessages", "daysLimitImport",
			   "ignoreJids", "autoCreate", "webhookUrl", "createdAt", "updatedAt"
		FROM "zpChatwootConfigs"
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
			&cfg.ID, &cfg.SessionID, &cfg.Enabled, &cfg.URL, &cfg.APIAccessToken, &cfg.AccountID,
			&cfg.InboxID, &cfg.InboxName, &cfg.SignMsg, &cfg.SignDelimiter,
			&cfg.ReopenConversation, &cfg.ConversationPending, &cfg.MergeBrazilContacts,
			&cfg.ImportContacts, &cfg.ImportMessages, &cfg.DaysLimitImport,
			&cfg.IgnoreJids, &cfg.AutoCreate, &cfg.WebhookURL, &cfg.CreatedAt, &cfg.UpdatedAt,
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
	query := `DELETE FROM "zpChatwootConfigs" WHERE "sessionId" = $1`
	_, err := r.pool.Exec(ctx, query, sessionID)
	return err
}

// UpdateInboxID updates the inbox ID for a configuration
func (r *Repository) UpdateInboxID(ctx context.Context, sessionID string, inboxID int) error {
	query := `UPDATE "zpChatwootConfigs" SET "inboxId" = $1, "updatedAt" = $2 WHERE "sessionId" = $3`
	_, err := r.pool.Exec(ctx, query, inboxID, time.Now(), sessionID)
	return err
}
