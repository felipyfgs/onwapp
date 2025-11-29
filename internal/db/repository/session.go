package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type SessionRepository struct {
	pool *pgxpool.Pool
}

const sessionSelectFields = `"id", "name", COALESCE("deviceJid", ''), COALESCE("phone", ''), COALESCE("status", 'disconnected'), "createdAt", "updatedAt"`

func NewSessionRepository(pool *pgxpool.Pool) *SessionRepository {
	return &SessionRepository{pool: pool}
}

func (r *SessionRepository) Create(ctx context.Context, name string) (*model.SessionRecord, error) {
	var s model.SessionRecord
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpSessions" ("name") 
		VALUES ($1) 
		ON CONFLICT ("name") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP 
		RETURNING `+sessionSelectFields, name).
		Scan(&s.ID, &s.Name, &s.DeviceJID, &s.Phone, &s.Status, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepository) GetByID(ctx context.Context, id string) (*model.SessionRecord, error) {
	var s model.SessionRecord
	err := r.pool.QueryRow(ctx, `SELECT `+sessionSelectFields+` FROM "zpSessions" WHERE "id" = $1`, id).
		Scan(&s.ID, &s.Name, &s.DeviceJID, &s.Phone, &s.Status, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepository) GetByName(ctx context.Context, name string) (*model.SessionRecord, error) {
	var s model.SessionRecord
	err := r.pool.QueryRow(ctx, `SELECT `+sessionSelectFields+` FROM "zpSessions" WHERE "name" = $1`, name).
		Scan(&s.ID, &s.Name, &s.DeviceJID, &s.Phone, &s.Status, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepository) UpdateJID(ctx context.Context, name, jid, phone string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpSessions" SET "deviceJid" = $1, "phone" = $2, "updatedAt" = CURRENT_TIMESTAMP 
		WHERE "name" = $3`, jid, phone, name)
	return err
}

func (r *SessionRepository) UpdateStatus(ctx context.Context, name, status string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpSessions" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP 
		WHERE "name" = $2`, status, name)
	return err
}

func (r *SessionRepository) Delete(ctx context.Context, name string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "zpSessions" WHERE "name" = $1`, name)
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
		if err := rows.Scan(&s.ID, &s.Name, &s.DeviceJID, &s.Phone, &s.Status, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}
