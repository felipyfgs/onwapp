package chatwoot

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles database operations for Chatwoot integration
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a new Chatwoot repository
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}



// Upsert creates or updates a Chatwoot configuration
func (r *Repository) Upsert(ctx context.Context, cfg *Config) (*Config, error) {
	query := `
		INSERT INTO "zpChatwoot" (
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
func (r *Repository) GetBySessionID(ctx context.Context, sessionID string) (*Config, error) {
	query := `
		SELECT "id", "sessionId", "enabled", "url", "token", "account",
			   "inboxId", "inbox", "signAgent", "signSeparator",
			   "autoReopen", "startPending", "mergeBrPhones",
			   "syncContacts", "syncMessages", "syncDays",
			   "ignoreChats", "autoCreate", "webhookUrl",
			   "chatwootDbHost", "chatwootDbPort", "chatwootDbUser", "chatwootDbPass", "chatwootDbName",
			   "createdAt", "updatedAt"
		FROM "zpChatwoot"
		WHERE "sessionId" = $1
	`

	cfg := &Config{}
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
			   "ignoreChats", "autoCreate", "webhookUrl",
			   "chatwootDbHost", "chatwootDbPort", "chatwootDbUser", "chatwootDbPass", "chatwootDbName",
			   "createdAt", "updatedAt"
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
			&cfg.IgnoreChats, &cfg.AutoCreate, &cfg.WebhookURL,
			&cfg.ChatwootDBHost, &cfg.ChatwootDBPort, &cfg.ChatwootDBUser, &cfg.ChatwootDBPass, &cfg.ChatwootDBName,
			&cfg.CreatedAt, &cfg.UpdatedAt,
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
