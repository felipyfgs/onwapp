package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/integrations/chatwoot/core"
)

// ConfigRepository handles database operations for Chatwoot configuration
type ConfigRepository struct {
	pool *pgxpool.Pool
}

// NewConfigRepository creates a new Chatwoot config repository
func NewConfigRepository(pool *pgxpool.Pool) *ConfigRepository {
	return &ConfigRepository{pool: pool}
}

// Upsert creates or updates a Chatwoot configuration
func (r *ConfigRepository) Upsert(ctx context.Context, cfg *core.Config) (*core.Config, error) {
	query := `
		INSERT INTO "onZapChatwoot" (
			"sessionId", "enabled", "url", "token", "account",
			"inboxId", "inbox", "signAgent", "signSeparator",
			"autoReopen", "startPending", "mergeBrPhones",
			"syncContacts", "syncMessages", "syncDays",
			"ignoreChats", "autoCreate", "webhookUrl",
			"chatwootDbHost", "chatwootDbPort", "chatwootDbUser", "chatwootDbPass", "chatwootDbName",
			"updatedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())
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
			"autoCreate" = EXCLUDED."autoCreate",
			"webhookUrl" = EXCLUDED."webhookUrl",
			"chatwootDbHost" = EXCLUDED."chatwootDbHost",
			"chatwootDbPort" = EXCLUDED."chatwootDbPort",
			"chatwootDbUser" = EXCLUDED."chatwootDbUser",
			"chatwootDbPass" = EXCLUDED."chatwootDbPass",
			"chatwootDbName" = EXCLUDED."chatwootDbName",
			"updatedAt" = NOW()
		RETURNING "id", "createdAt", "updatedAt"
	`

	err := r.pool.QueryRow(ctx, query,
		cfg.SessionID, cfg.Enabled, cfg.URL, cfg.Token, cfg.Account,
		cfg.InboxID, cfg.Inbox, cfg.SignAgent, cfg.SignSeparator,
		cfg.AutoReopen, cfg.StartPending, cfg.MergeBrPhones,
		cfg.SyncContacts, cfg.SyncMessages, cfg.SyncDays,
		cfg.IgnoreChats, cfg.AutoCreate, cfg.WebhookURL,
		cfg.ChatwootDBHost, cfg.ChatwootDBPort, cfg.ChatwootDBUser, cfg.ChatwootDBPass, cfg.ChatwootDBName,
	).Scan(&cfg.ID, &cfg.CreatedAt, &cfg.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return cfg, nil
}

// GetBySessionID retrieves configuration by session ID
func (r *ConfigRepository) GetBySessionID(ctx context.Context, sessionID string) (*core.Config, error) {
	query := `
		SELECT "id", "sessionId", "enabled", "url", "token", "account",
			   "inboxId", "inbox", "signAgent", "signSeparator",
			   "autoReopen", "startPending", "mergeBrPhones",
			   "syncContacts", "syncMessages", "syncDays",
			   "ignoreChats", "autoCreate", "webhookUrl",
			   "chatwootDbHost", "chatwootDbPort", "chatwootDbUser", "chatwootDbPass", "chatwootDbName",
			   "createdAt", "updatedAt"
		FROM "onZapChatwoot"
		WHERE "sessionId" = $1
	`

	cfg := &core.Config{}
	err := r.pool.QueryRow(ctx, query, sessionID).Scan(
		&cfg.ID, &cfg.SessionID, &cfg.Enabled, &cfg.URL, &cfg.Token, &cfg.Account,
		&cfg.InboxID, &cfg.Inbox, &cfg.SignAgent, &cfg.SignSeparator,
		&cfg.AutoReopen, &cfg.StartPending, &cfg.MergeBrPhones,
		&cfg.SyncContacts, &cfg.SyncMessages, &cfg.SyncDays,
		&cfg.IgnoreChats, &cfg.AutoCreate, &cfg.WebhookURL,
		&cfg.ChatwootDBHost, &cfg.ChatwootDBPort, &cfg.ChatwootDBUser, &cfg.ChatwootDBPass, &cfg.ChatwootDBName,
		&cfg.CreatedAt, &cfg.UpdatedAt,
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
func (r *ConfigRepository) GetEnabledBySessionID(ctx context.Context, sessionID string) (*core.Config, error) {
	cfg, err := r.GetBySessionID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if cfg == nil || !cfg.Enabled {
		return nil, nil
	}
	return cfg, nil
}

// Delete removes a configuration by session ID
func (r *ConfigRepository) Delete(ctx context.Context, sessionID string) error {
	query := `DELETE FROM "onZapChatwoot" WHERE "sessionId" = $1`
	_, err := r.pool.Exec(ctx, query, sessionID)
	return err
}

// UpdateInboxID updates the inbox ID for a configuration
func (r *ConfigRepository) UpdateInboxID(ctx context.Context, sessionID string, inboxID int) error {
	query := `UPDATE "onZapChatwoot" SET "inboxId" = $1, "updatedAt" = $2 WHERE "sessionId" = $3`
	_, err := r.pool.Exec(ctx, query, inboxID, time.Now(), sessionID)
	return err
}
