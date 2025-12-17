package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"onwapp/internal/models"
)

type MessagingSessionRepository struct {
	db *pgx.Conn
}

func NewMessagingSessionRepository(db *pgx.Conn) *MessagingSessionRepository {
	return &MessagingSessionRepository{db: db}
}

func (r *MessagingSessionRepository) Create(ctx context.Context, session *models.MessagingSession) error {
	query := `
		INSERT INTO messaging_sessions (id, tenant_id, name, channel_id, platform, status, session_data, last_seen, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	
	_, err := r.db.Exec(ctx, query,
		session.ID,
		session.TenantID,
		session.Name,
		session.ChannelID,
		session.Platform,
		session.Status,
		session.SessionData,
		session.LastSeen,
		time.Now(),
		time.Now(),
	)
	
	return err
}

func (r *MessagingSessionRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.MessagingSession, error) {
	query := `
		SELECT id, tenant_id, name, channel_id, platform, status, session_data, last_seen, created_at, updated_at
		FROM messaging_sessions
		WHERE id = $1
	`
	
	var session models.MessagingSession
	err := r.db.QueryRow(ctx, query, id).Scan(
		&session.ID,
		&session.TenantID,
		&session.Name,
		&session.ChannelID,
		&session.Platform,
		&session.Status,
		&session.SessionData,
		&session.LastSeen,
		&session.CreatedAt,
		&session.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &session, nil
}

func (r *MessagingSessionRepository) FindByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.MessagingSession, error) {
	query := `
		SELECT id, tenant_id, name, channel_id, platform, status, session_data, last_seen, created_at, updated_at
		FROM messaging_sessions
		WHERE tenant_id = $1
		ORDER BY name
	`
	
	rows, err := r.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var sessions []models.MessagingSession
	for rows.Next() {
		var session models.MessagingSession
		if err := rows.Scan(
			&session.ID,
			&session.TenantID,
			&session.Name,
			&session.ChannelID,
			&session.Platform,
			&session.Status,
			&session.SessionData,
			&session.LastSeen,
			&session.CreatedAt,
			&session.UpdatedAt,
		); err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}
	
	return sessions, nil
}

func (r *MessagingSessionRepository) Update(ctx context.Context, session *models.MessagingSession) error {
	query := `
		UPDATE messaging_sessions
		SET name = $1, channel_id = $2, platform = $3, status = $4, session_data = $5, last_seen = $6, updated_at = $7
		WHERE id = $8
	`
	
	_, err := r.db.Exec(ctx, query,
		session.Name,
		session.ChannelID,
		session.Platform,
		session.Status,
		session.SessionData,
		session.LastSeen,
		time.Now(),
		session.ID,
	)
	
	return err
}

func (r *MessagingSessionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM messaging_sessions WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
