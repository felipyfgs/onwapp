package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"onwapp/internal/model"
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
		INSERT INTO "onWappMessageUpdate" ("sessionId", "msgId", "type", "actor", "data", "eventAt", "createdAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING "id"`,
		u.SessionID, u.MsgID, u.Type, u.Actor, u.Data, u.EventAt, time.Now(),
	).Scan(&id)
	return id, err
}

func (r *MessageUpdateRepository) GetByMsgID(ctx context.Context, sessionID, msgID string) ([]model.MessageUpdate, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "sessionId", "msgId", "type", COALESCE("actor", ''), "data", "eventAt", "createdAt"
		FROM "onWappMessageUpdate" WHERE "sessionId" = $1 AND "msgId" = $2 ORDER BY "eventAt" DESC`,
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

func (r *MessageUpdateRepository) GetDeletedMsgIDs(ctx context.Context, sessionID string, msgIDs []string) (map[string]bool, error) {
	if len(msgIDs) == 0 {
		return make(map[string]bool), nil
	}

	rows, err := r.pool.Query(ctx, `
		SELECT DISTINCT "msgId"
		FROM "onWappMessageUpdate" 
		WHERE "sessionId" = $1 AND "msgId" = ANY($2) AND "type" = 'delete'`,
		sessionID, msgIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	deleted := make(map[string]bool)
	for rows.Next() {
		var msgID string
		if err := rows.Scan(&msgID); err != nil {
			return nil, err
		}
		deleted[msgID] = true
	}
	return deleted, rows.Err()
}
