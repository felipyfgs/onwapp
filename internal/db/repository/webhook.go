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

func (r *WebhookRepository) Create(ctx context.Context, wh *model.Webhook) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpWebhooks" ("sessionId", "url", "events", "enabled", "secret")
		VALUES ($1, $2, $3, $4, $5)
		RETURNING "id"`,
		wh.SessionID, wh.URL, wh.Events, wh.Enabled, wh.Secret,
	).Scan(&id)
	return id, err
}

func (r *WebhookRepository) GetBySession(ctx context.Context, sessionID string) ([]model.Webhook, error) {
	return r.GetBySessionPaginated(ctx, sessionID, 0, 0)
}

func (r *WebhookRepository) GetBySessionPaginated(ctx context.Context, sessionID string, limit, offset int) ([]model.Webhook, error) {
	query := `
		SELECT "id", "sessionId", "url", "events", "enabled", COALESCE("secret", '') as "secret"
		FROM "zpWebhooks" WHERE "sessionId" = $1
		ORDER BY "id"`

	if limit > 0 {
		query += ` LIMIT $2 OFFSET $3`
		rows, err := r.pool.Query(ctx, query, sessionID, limit, offset)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanWebhooks(rows)
	}

	rows, err := r.pool.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanWebhooks(rows)
}

func scanWebhooks(rows interface {
	Next() bool
	Scan(...interface{}) error
}) ([]model.Webhook, error) {
	var webhooks []model.Webhook
	for rows.Next() {
		var w model.Webhook
		if err := rows.Scan(&w.ID, &w.SessionID, &w.URL, &w.Events, &w.Enabled, &w.Secret); err != nil {
			return nil, err
		}
		webhooks = append(webhooks, w)
	}
	return webhooks, nil
}

func (r *WebhookRepository) GetEnabledBySession(ctx context.Context, sessionID string) ([]model.Webhook, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "sessionId", "url", "events", "enabled", COALESCE("secret", '') as "secret"
		FROM "zpWebhooks" WHERE "sessionId" = $1 AND "enabled" = true`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanWebhooks(rows)
}

func (r *WebhookRepository) Update(ctx context.Context, id string, url string, events []string, enabled bool, secret string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpWebhooks" SET "url" = $1, "events" = $2, "enabled" = $3, "secret" = $4, "updatedAt" = CURRENT_TIMESTAMP 
		WHERE "id" = $5`, url, events, enabled, secret, id)
	return err
}

func (r *WebhookRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "zpWebhooks" WHERE "id" = $1`, id)
	return err
}
