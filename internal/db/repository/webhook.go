package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type WebhookRepository struct {
	pool *pgxpool.Pool
}

func NewWebhookRepository(pool *pgxpool.Pool) *WebhookRepository {
	return &WebhookRepository{pool: pool}
}

// Upsert creates or updates the webhook for a session (one webhook per session)
func (r *WebhookRepository) Upsert(ctx context.Context, wh *model.Webhook) (*model.Webhook, error) {
	var w model.Webhook
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpWebhooks" ("sessionId", "url", "events", "enabled", "secret")
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
func (r *WebhookRepository) GetBySession(ctx context.Context, sessionID string) (*model.Webhook, error) {
	var w model.Webhook
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "sessionId", "url", "events", "enabled", COALESCE("secret", '') as "secret"
		FROM "zpWebhooks" WHERE "sessionId" = $1`,
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
func (r *WebhookRepository) GetEnabledBySession(ctx context.Context, sessionID string) (*model.Webhook, error) {
	var w model.Webhook
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "sessionId", "url", "events", "enabled", COALESCE("secret", '') as "secret"
		FROM "zpWebhooks" WHERE "sessionId" = $1 AND "enabled" = true`,
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
func (r *WebhookRepository) Delete(ctx context.Context, sessionID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "zpWebhooks" WHERE "sessionId" = $1`, sessionID)
	return err
}
