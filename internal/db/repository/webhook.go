package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type WebhookRepository struct {
	pool *pgxpool.Pool
}

func NewWebhookRepository(pool *pgxpool.Pool) *WebhookRepository {
	return &WebhookRepository{pool: pool}
}

func (r *WebhookRepository) Create(ctx context.Context, wh *model.Webhook) (int, error) {
	var id int
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpWebhooks" ("sessionId", "url", "events", "enabled", "secret")
		VALUES ($1, $2, $3, $4, $5)
		RETURNING "id"`,
		wh.SessionID, wh.URL, wh.Events, wh.Enabled, wh.Secret,
	).Scan(&id)
	return id, err
}

func (r *WebhookRepository) GetBySession(ctx context.Context, sessionID int) ([]model.Webhook, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "sessionId", "url", "events", "enabled", COALESCE("secret", '') as "secret"
		FROM "zpWebhooks" WHERE "sessionId" = $1`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var webhooks []model.Webhook
	for rows.Next() {
		var w model.Webhook
		if err := rows.Scan(&w.ID, &w.SessionID, &w.URL, &w.Events, &w.Enabled, &w.Secret); err != nil {
			return nil, err
		}
		webhooks = append(webhooks, w)
	}
	return webhooks, rows.Err()
}

func (r *WebhookRepository) GetEnabledBySession(ctx context.Context, sessionID int) ([]model.Webhook, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "sessionId", "url", "events", "enabled", COALESCE("secret", '') as "secret"
		FROM "zpWebhooks" WHERE "sessionId" = $1 AND "enabled" = true`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var webhooks []model.Webhook
	for rows.Next() {
		var w model.Webhook
		if err := rows.Scan(&w.ID, &w.SessionID, &w.URL, &w.Events, &w.Enabled, &w.Secret); err != nil {
			return nil, err
		}
		webhooks = append(webhooks, w)
	}
	return webhooks, rows.Err()
}

func (r *WebhookRepository) Update(ctx context.Context, id int, url string, events []string, enabled bool, secret string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpWebhooks" SET "url" = $1, "events" = $2, "enabled" = $3, "secret" = $4, "updatedAt" = CURRENT_TIMESTAMP 
		WHERE "id" = $5`, url, events, enabled, secret, id)
	return err
}

func (r *WebhookRepository) Delete(ctx context.Context, id int) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "zpWebhooks" WHERE "id" = $1`, id)
	return err
}
