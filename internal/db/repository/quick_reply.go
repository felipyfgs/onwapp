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

type QuickReplyRepository struct {
	pool *pgxpool.Pool
}

func NewQuickReplyRepository(pool *pgxpool.Pool) *QuickReplyRepository {
	return &QuickReplyRepository{pool: pool}
}

func (r *QuickReplyRepository) Create(ctx context.Context, qr *model.QuickReply) error {
	now := time.Now()
	qr.CreatedAt = now
	qr.UpdatedAt = now

	if qr.ID == uuid.Nil {
		qr.ID = uuid.New()
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO "onWappQuickReply" ("id", "shortcut", "message", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5)`,
		qr.ID, qr.Shortcut, qr.Message, qr.CreatedAt, qr.UpdatedAt,
	)
	return err
}

func (r *QuickReplyRepository) Update(ctx context.Context, qr *model.QuickReply) error {
	qr.UpdatedAt = time.Now()

	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappQuickReply" SET "shortcut" = $2, "message" = $3, "updatedAt" = $4
		WHERE "id" = $1`,
		qr.ID, qr.Shortcut, qr.Message, qr.UpdatedAt,
	)
	return err
}

func (r *QuickReplyRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.QuickReply, error) {
	qr := &model.QuickReply{}
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "shortcut", "message", "createdAt", "updatedAt"
		FROM "onWappQuickReply" WHERE "id" = $1`,
		id,
	).Scan(&qr.ID, &qr.Shortcut, &qr.Message, &qr.CreatedAt, &qr.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return qr, err
}

func (r *QuickReplyRepository) GetByShortcut(ctx context.Context, shortcut string) (*model.QuickReply, error) {
	qr := &model.QuickReply{}
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "shortcut", "message", "createdAt", "updatedAt"
		FROM "onWappQuickReply" WHERE "shortcut" = $1`,
		shortcut,
	).Scan(&qr.ID, &qr.Shortcut, &qr.Message, &qr.CreatedAt, &qr.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return qr, err
}

func (r *QuickReplyRepository) List(ctx context.Context) ([]*model.QuickReply, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "shortcut", "message", "createdAt", "updatedAt"
		FROM "onWappQuickReply"
		ORDER BY "shortcut"`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	quickReplies := make([]*model.QuickReply, 0)
	for rows.Next() {
		qr := &model.QuickReply{}
		if err := rows.Scan(&qr.ID, &qr.Shortcut, &qr.Message, &qr.CreatedAt, &qr.UpdatedAt); err != nil {
			return nil, err
		}
		quickReplies = append(quickReplies, qr)
	}

	return quickReplies, rows.Err()
}

func (r *QuickReplyRepository) Search(ctx context.Context, query string) ([]*model.QuickReply, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "shortcut", "message", "createdAt", "updatedAt"
		FROM "onWappQuickReply"
		WHERE "shortcut" ILIKE $1 OR "message" ILIKE $1
		ORDER BY "shortcut"`,
		"%"+query+"%",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	quickReplies := make([]*model.QuickReply, 0)
	for rows.Next() {
		qr := &model.QuickReply{}
		if err := rows.Scan(&qr.ID, &qr.Shortcut, &qr.Message, &qr.CreatedAt, &qr.UpdatedAt); err != nil {
			return nil, err
		}
		quickReplies = append(quickReplies, qr)
	}

	return quickReplies, rows.Err()
}

func (r *QuickReplyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "onWappQuickReply" WHERE "id" = $1`, id)
	return err
}
