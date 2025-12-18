package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"onwapp/internal/models"
)

type MessageRepository struct {
	db *pgx.Conn
}

func NewMessageRepository(db *pgx.Conn) *MessageRepository {
	return &MessageRepository{db: db}
}

func (r *MessageRepository) Create(ctx context.Context, msg *models.Message) error {
	query := `
		INSERT INTO messages (id, ticket_id, whatsapp_msg_id, body, media_url, media_type, from_me, is_read, ack, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	
	_, err := r.db.Exec(ctx, query,
		msg.ID,
		msg.TicketID,
		msg.WhatsAppMsgID,
		msg.Body,
		msg.MediaURL,
		msg.MediaType,
		msg.FromMe,
		msg.IsRead,
		msg.Ack,
		time.Now(),
	)
	
	return err
}

func (r *MessageRepository) FindByTicket(ctx context.Context, ticketID uuid.UUID) ([]models.Message, error) {
	query := `
		SELECT id, ticket_id, whatsapp_msg_id, body, media_url, media_type, from_me, is_read, ack, created_at
		FROM messages
		WHERE ticket_id = $1
		ORDER BY created_at ASC
	`
	
	rows, err := r.db.Query(ctx, query, ticketID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		if err := rows.Scan(
			&msg.ID,
			&msg.TicketID,
			&msg.WhatsAppMsgID,
			&msg.Body,
			&msg.MediaURL,
			&msg.MediaType,
			&msg.FromMe,
			&msg.IsRead,
			&msg.Ack,
			&msg.CreatedAt,
		); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	
	return messages, nil
}

func (r *MessageRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]models.Message, error) {
	query := `
		SELECT m.id, m.ticket_id, m.whatsapp_msg_id, m.body, m.media_url, m.media_type, m.from_me, m.is_read, m.ack, m.created_at
		FROM messages m
		INNER JOIN tickets t ON m.ticket_id = t.id
		WHERE t.tenant_id = $1
		ORDER BY m.created_at DESC
		LIMIT $2
	`
	
	rows, err := r.db.Query(ctx, query, tenantID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		if err := rows.Scan(
			&msg.ID,
			&msg.TicketID,
			&msg.WhatsAppMsgID,
			&msg.Body,
			&msg.MediaURL,
			&msg.MediaType,
			&msg.FromMe,
			&msg.IsRead,
			&msg.Ack,
			&msg.CreatedAt,
		); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	
	return messages, nil
}

func (r *MessageRepository) MarkAsRead(ctx context.Context, msgID uuid.UUID) error {
	query := `UPDATE messages SET is_read = true, ack = 1 WHERE id = $1`
	_, err := r.db.Exec(ctx, query, msgID)
	return err
}
