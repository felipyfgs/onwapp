package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type SessionRepository struct {
	pool *pgxpool.Pool
}

const sessionSelectFields = `"id", "sessionId", COALESCE("deviceJid", ''), COALESCE("phone", ''), COALESCE("status", 'disconnected'), "createdAt", "updatedAt"`

func NewSessionRepository(pool *pgxpool.Pool) *SessionRepository {
	return &SessionRepository{pool: pool}
}

func (r *SessionRepository) Create(ctx context.Context, sessionId string) (*model.SessionRecord, error) {
	var s model.SessionRecord
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpSessions" ("sessionId") 
		VALUES ($1) 
		ON CONFLICT ("sessionId") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP 
		RETURNING `+sessionSelectFields, sessionId).
		Scan(&s.ID, &s.SessionId, &s.DeviceJID, &s.Phone, &s.Status, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepository) GetByID(ctx context.Context, id string) (*model.SessionRecord, error) {
	var s model.SessionRecord
	err := r.pool.QueryRow(ctx, `SELECT `+sessionSelectFields+` FROM "zpSessions" WHERE "id" = $1`, id).
		Scan(&s.ID, &s.SessionId, &s.DeviceJID, &s.Phone, &s.Status, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepository) GetBySessionId(ctx context.Context, sessionId string) (*model.SessionRecord, error) {
	var s model.SessionRecord
	err := r.pool.QueryRow(ctx, `SELECT `+sessionSelectFields+` FROM "zpSessions" WHERE "sessionId" = $1`, sessionId).
		Scan(&s.ID, &s.SessionId, &s.DeviceJID, &s.Phone, &s.Status, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// GetByName is deprecated, use GetBySessionId instead
func (r *SessionRepository) GetByName(ctx context.Context, name string) (*model.SessionRecord, error) {
	return r.GetBySessionId(ctx, name)
}

func (r *SessionRepository) UpdateJID(ctx context.Context, sessionId, jid, phone string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpSessions" SET "deviceJid" = $1, "phone" = $2, "updatedAt" = CURRENT_TIMESTAMP 
		WHERE "sessionId" = $3`, jid, phone, sessionId)
	return err
}

func (r *SessionRepository) UpdateStatus(ctx context.Context, sessionId, status string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpSessions" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP 
		WHERE "sessionId" = $2`, status, sessionId)
	return err
}

func (r *SessionRepository) Delete(ctx context.Context, sessionId string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "zpSessions" WHERE "sessionId" = $1`, sessionId)
	return err
}

func (r *SessionRepository) GetAll(ctx context.Context) ([]model.SessionRecord, error) {
	return r.GetAllPaginated(ctx, 0, 0)
}

func (r *SessionRepository) GetAllPaginated(ctx context.Context, limit, offset int) ([]model.SessionRecord, error) {
	baseQuery := `SELECT ` + sessionSelectFields + ` FROM "zpSessions" ORDER BY "id"`

	if limit > 0 {
		rows, err := r.pool.Query(ctx, baseQuery+` LIMIT $1 OFFSET $2`, limit, offset)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanSessions(rows)
	}

	rows, err := r.pool.Query(ctx, baseQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSessions(rows)
}

func (r *SessionRepository) Count(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM "zpSessions"`).Scan(&count)
	return count, err
}

func scanSessions(rows interface {
	Next() bool
	Scan(...interface{}) error
}) ([]model.SessionRecord, error) {
	var sessions []model.SessionRecord
	for rows.Next() {
		var s model.SessionRecord
		if err := rows.Scan(&s.ID, &s.SessionId, &s.DeviceJID, &s.Phone, &s.Status, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}
