package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"onwapp/internal/model"
)

type QueueRepository struct {
	pool *pgxpool.Pool
}

func NewQueueRepository(pool *pgxpool.Pool) *QueueRepository {
	return &QueueRepository{pool: pool}
}

func (r *QueueRepository) Create(ctx context.Context, q *model.Queue) error {
	now := time.Now()
	q.CreatedAt = now
	q.UpdatedAt = now

	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO "onWappQueue" ("id", "name", "color", "greetingMessage", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6)`,
		q.ID, q.Name, q.Color, q.GreetingMessage, q.CreatedAt, q.UpdatedAt,
	)
	return err
}

func (r *QueueRepository) Update(ctx context.Context, q *model.Queue) error {
	q.UpdatedAt = time.Now()

	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappQueue" SET "name" = $2, "color" = $3, "greetingMessage" = $4, "updatedAt" = $5
		WHERE "id" = $1`,
		q.ID, q.Name, q.Color, q.GreetingMessage, q.UpdatedAt,
	)
	return err
}

func (r *QueueRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Queue, error) {
	q := &model.Queue{}
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "name", "color", "greetingMessage", "createdAt", "updatedAt"
		FROM "onWappQueue" WHERE "id" = $1`,
		id,
	).Scan(&q.ID, &q.Name, &q.Color, &q.GreetingMessage, &q.CreatedAt, &q.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return q, err
}

func (r *QueueRepository) GetByName(ctx context.Context, name string) (*model.Queue, error) {
	q := &model.Queue{}
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "name", "color", "greetingMessage", "createdAt", "updatedAt"
		FROM "onWappQueue" WHERE "name" = $1`,
		name,
	).Scan(&q.ID, &q.Name, &q.Color, &q.GreetingMessage, &q.CreatedAt, &q.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return q, err
}

func (r *QueueRepository) List(ctx context.Context) ([]*model.Queue, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			q."id", q."name", q."color", q."greetingMessage", q."createdAt", q."updatedAt",
			(SELECT COUNT(*) FROM "onWappTicket" WHERE "queueId" = q."id") as ticket_count,
			(SELECT COUNT(*) FROM "onWappUserQueue" WHERE "queueId" = q."id") as user_count
		FROM "onWappQueue" q
		ORDER BY q."name"`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	queues := make([]*model.Queue, 0)
	for rows.Next() {
		q := &model.Queue{}
		if err := rows.Scan(
			&q.ID, &q.Name, &q.Color, &q.GreetingMessage, &q.CreatedAt, &q.UpdatedAt,
			&q.TicketCount, &q.UserCount,
		); err != nil {
			return nil, err
		}
		queues = append(queues, q)
	}

	return queues, rows.Err()
}

func (r *QueueRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "onWappQueue" WHERE "id" = $1`, id)
	return err
}

func (r *QueueRepository) AddUserToQueue(ctx context.Context, userID, queueID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO "onWappUserQueue" ("userId", "queueId", "createdAt")
		VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING`,
		userID, queueID, time.Now(),
	)
	return err
}

func (r *QueueRepository) RemoveUserFromQueue(ctx context.Context, userID, queueID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM "onWappUserQueue" WHERE "userId" = $1 AND "queueId" = $2`,
		userID, queueID,
	)
	return err
}

func (r *QueueRepository) GetUserQueues(ctx context.Context, userID uuid.UUID) ([]*model.Queue, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT q."id", q."name", q."color", q."greetingMessage", q."createdAt", q."updatedAt"
		FROM "onWappQueue" q
		INNER JOIN "onWappUserQueue" uq ON uq."queueId" = q."id"
		WHERE uq."userId" = $1
		ORDER BY q."name"`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	queues := make([]*model.Queue, 0)
	for rows.Next() {
		q := &model.Queue{}
		if err := rows.Scan(&q.ID, &q.Name, &q.Color, &q.GreetingMessage, &q.CreatedAt, &q.UpdatedAt); err != nil {
			return nil, err
		}
		queues = append(queues, q)
	}

	return queues, rows.Err()
}

func (r *QueueRepository) SetUserQueues(ctx context.Context, userID uuid.UUID, queueIDs []uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `DELETE FROM "onWappUserQueue" WHERE "userId" = $1`, userID); err != nil {
		return err
	}

	now := time.Now()
	for _, queueID := range queueIDs {
		if _, err := tx.Exec(ctx, `
			INSERT INTO "onWappUserQueue" ("userId", "queueId", "createdAt")
			VALUES ($1, $2, $3)`,
			userID, queueID, now,
		); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *QueueRepository) AddSessionToQueue(ctx context.Context, sessionID, queueID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO "onWappSessionQueue" ("sessionId", "queueId", "createdAt")
		VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING`,
		sessionID, queueID, time.Now(),
	)
	return err
}

func (r *QueueRepository) RemoveSessionFromQueue(ctx context.Context, sessionID, queueID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM "onWappSessionQueue" WHERE "sessionId" = $1 AND "queueId" = $2`,
		sessionID, queueID,
	)
	return err
}

func (r *QueueRepository) GetSessionQueues(ctx context.Context, sessionID uuid.UUID) ([]*model.Queue, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT q."id", q."name", q."color", q."greetingMessage", q."createdAt", q."updatedAt"
		FROM "onWappQueue" q
		INNER JOIN "onWappSessionQueue" sq ON sq."queueId" = q."id"
		WHERE sq."sessionId" = $1
		ORDER BY q."name"`,
		sessionID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	queues := make([]*model.Queue, 0)
	for rows.Next() {
		q := &model.Queue{}
		if err := rows.Scan(&q.ID, &q.Name, &q.Color, &q.GreetingMessage, &q.CreatedAt, &q.UpdatedAt); err != nil {
			return nil, err
		}
		queues = append(queues, q)
	}

	return queues, rows.Err()
}
