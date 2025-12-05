package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type MessageUpdateRepository struct {
	pool *pgxpool.Pool
}

func NewMessageUpdateRepository(pool *pgxpool.Pool) *MessageUpdateRepository {
	return &MessageUpdateRepository{pool: pool}
}

func (r *MessageUpdateRepository) Save(ctx context.Context, u *model.MessageUpdate) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "onZapMessageUpdate" ("sessionId", "msgId", "type", "actor", "data", "eventAt", "createdAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING "id"`,
		u.SessionID, u.MsgID, u.Type, u.Actor, u.Data, u.EventAt, time.Now(),
	).Scan(&id)
	return id, err
}

func (r *MessageUpdateRepository) GetByMsgID(ctx context.Context, sessionID, msgID string) ([]model.MessageUpdate, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "sessionId", "msgId", "type", COALESCE("actor", ''), "data", "eventAt", "createdAt"
		FROM "onZapMessageUpdate" WHERE "sessionId" = $1 AND "msgId" = $2 ORDER BY "eventAt" DESC`,
		sessionID, msgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var updates []model.MessageUpdate
	for rows.Next() {
		var u model.MessageUpdate
		if err := rows.Scan(&u.ID, &u.SessionID, &u.MsgID, &u.Type, &u.Actor, &u.Data, &u.EventAt, &u.CreatedAt); err != nil {
			return nil, err
		}
		updates = append(updates, u)
	}
	return updates, rows.Err()
}
