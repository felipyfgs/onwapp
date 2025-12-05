package webhook

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles database operations for Webhook integration
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a new Webhook repository
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Upsert creates or updates the webhook for a session (one webhook per session)
func (r *Repository) Upsert(ctx context.Context, wh *Webhook) (*Webhook, error) {
	var w Webhook
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "onZapWebhook" ("sessionId", "url", "events", "enabled", "secret")
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT ("sessionId") DO UPDATE SET 
			"url" = EXCLUDED."url",
			"events" = EXCLUDED."events",
			"enabled" = EXCLUDED."enabled",
			"secret" = EXCLUDED."secret",
			"updatedAt" = CURRENT_TIMESTAMP
		RETURNING "id", "sessionId", "url", "events", "enabled", COALESCE("secret", '')`,
		wh.SessionID, wh.URL, wh.Events, wh.Enabled, wh.Secret,
	).Scan(&w.ID, &w.SessionID, &w.URL, &w.Events, &w.Enabled, &w.Secret)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

// GetBySession returns the single webhook for a session (or nil if none)
func (r *Repository) GetBySession(ctx context.Context, sessionID string) (*Webhook, error) {
	var w Webhook
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "sessionId", "url", "events", "enabled", COALESCE("secret", '') as "secret"
		FROM "onZapWebhook" WHERE "sessionId" = $1`,
		sessionID).Scan(&w.ID, &w.SessionID, &w.URL, &w.Events, &w.Enabled, &w.Secret)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &w, nil
}

// GetEnabledBySession returns the webhook if enabled (for sending)
func (r *Repository) GetEnabledBySession(ctx context.Context, sessionID string) (*Webhook, error) {
	var w Webhook
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "sessionId", "url", "events", "enabled", COALESCE("secret", '') as "secret"
		FROM "onZapWebhook" WHERE "sessionId" = $1 AND "enabled" = true`,
		sessionID).Scan(&w.ID, &w.SessionID, &w.URL, &w.Events, &w.Enabled, &w.Secret)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &w, nil
}

// Delete removes the webhook for a session
func (r *Repository) Delete(ctx context.Context, sessionID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "onZapWebhook" WHERE "sessionId" = $1`, sessionID)
	return err
}
