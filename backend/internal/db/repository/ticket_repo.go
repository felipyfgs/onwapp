package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"onwapp/internal/models"
)

type TicketRepository struct {
	db *pgx.Conn
}

func NewTicketRepository(db *pgx.Conn) *TicketRepository {
	return &TicketRepository{db: db}
}

func (r *TicketRepository) Create(ctx context.Context, ticket *models.Ticket) error {
	query := `
		INSERT INTO tickets (id, tenant_id, contact_id, queue_id, user_id, session_id, status, unread_messages, last_message_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	
	_, err := r.db.Exec(ctx, query,
		ticket.ID,
		ticket.TenantID,
		ticket.ContactID,
		ticket.QueueID,
		ticket.UserID,
		ticket.SessionID,
		ticket.Status,
		ticket.UnreadMessages,
		ticket.LastMessageAt,
		time.Now(),
		time.Now(),
	)
	
	return err
}

func (r *TicketRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Ticket, error) {
	query := `
		SELECT id, tenant_id, contact_id, queue_id, user_id, session_id, status, unread_messages, last_message_at, created_at, updated_at
		FROM tickets
		WHERE id = $1
	`
	
	var ticket models.Ticket
	err := r.db.QueryRow(ctx, query, id).Scan(
		&ticket.ID,
		&ticket.TenantID,
		&ticket.ContactID,
		&ticket.QueueID,
		&ticket.UserID,
		&ticket.SessionID,
		&ticket.Status,
		&ticket.UnreadMessages,
		&ticket.LastMessageAt,
		&ticket.CreatedAt,
		&ticket.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &ticket, nil
}

func (r *TicketRepository) FindByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.Ticket, error) {
	query := `
		SELECT id, tenant_id, contact_id, queue_id, user_id, session_id, status, unread_messages, last_message_at, created_at, updated_at
		FROM tickets
		WHERE tenant_id = $1
		ORDER BY last_message_at DESC NULLS LAST, created_at DESC
	`
	
	rows, err := r.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var tickets []models.Ticket
	for rows.Next() {
		var ticket models.Ticket
		if err := rows.Scan(
			&ticket.ID,
			&ticket.TenantID,
			&ticket.ContactID,
			&ticket.QueueID,
			&ticket.UserID,
			&ticket.SessionID,
			&ticket.Status,
			&ticket.UnreadMessages,
			&ticket.LastMessageAt,
			&ticket.CreatedAt,
			&ticket.UpdatedAt,
		); err != nil {
			return nil, err
		}
		tickets = append(tickets, ticket)
	}
	
	return tickets, nil
}

func (r *TicketRepository) Update(ctx context.Context, ticket *models.Ticket) error {
	query := `
		UPDATE tickets
		SET contact_id = $1, queue_id = $2, user_id = $3, status = $4, unread_messages = $5, last_message_at = $6, updated_at = $7
		WHERE id = $8
	`
	
	_, err := r.db.Exec(ctx, query,
		ticket.ContactID,
		ticket.QueueID,
		ticket.UserID,
		ticket.Status,
		ticket.UnreadMessages,
		ticket.LastMessageAt,
		time.Now(),
		ticket.ID,
	)
	
	return err
}

func (r *TicketRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM tickets WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
