package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type MessageRepository struct {
	pool *pgxpool.Pool
}

func NewMessageRepository(pool *pgxpool.Pool) *MessageRepository {
	return &MessageRepository{pool: pool}
}

func (r *MessageRepository) Save(ctx context.Context, msg *model.Message) (int, error) {
	var id int
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpMessages" ("sessionId", "messageId", "chatJid", "senderJid", "type", "content", "mediaUrl", "mediaMimetype", "mediaSize", "timestamp", "direction", "status")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING "id"`,
		msg.SessionID, msg.MessageID, msg.ChatJID, msg.SenderJID, msg.Type, msg.Content, msg.MediaURL, msg.MediaMimetype, msg.MediaSize, msg.Timestamp, msg.Direction, msg.Status,
	).Scan(&id)
	return id, err
}

func (r *MessageRepository) GetBySession(ctx context.Context, sessionID int, limit, offset int) ([]model.Message, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "sessionId", "messageId", "chatJid", COALESCE("senderJid", '') as "senderJid", "type", COALESCE("content", '') as "content", 
		       COALESCE("mediaUrl", '') as "mediaUrl", COALESCE("mediaMimetype", '') as "mediaMimetype", COALESCE("mediaSize", 0) as "mediaSize",
		       "timestamp", "direction", "status"
		FROM "zpMessages" WHERE "sessionId" = $1 ORDER BY "timestamp" DESC LIMIT $2 OFFSET $3`,
		sessionID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []model.Message
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.ID, &m.SessionID, &m.MessageID, &m.ChatJID, &m.SenderJID, &m.Type, &m.Content, &m.MediaURL, &m.MediaMimetype, &m.MediaSize, &m.Timestamp, &m.Direction, &m.Status); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, rows.Err()
}

func (r *MessageRepository) GetByChat(ctx context.Context, sessionID int, chatJID string, limit, offset int) ([]model.Message, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "sessionId", "messageId", "chatJid", COALESCE("senderJid", '') as "senderJid", "type", COALESCE("content", '') as "content", 
		       COALESCE("mediaUrl", '') as "mediaUrl", COALESCE("mediaMimetype", '') as "mediaMimetype", COALESCE("mediaSize", 0) as "mediaSize",
		       "timestamp", "direction", "status"
		FROM "zpMessages" WHERE "sessionId" = $1 AND "chatJid" = $2 ORDER BY "timestamp" DESC LIMIT $3 OFFSET $4`,
		sessionID, chatJID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []model.Message
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.ID, &m.SessionID, &m.MessageID, &m.ChatJID, &m.SenderJID, &m.Type, &m.Content, &m.MediaURL, &m.MediaMimetype, &m.MediaSize, &m.Timestamp, &m.Direction, &m.Status); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, rows.Err()
}

func (r *MessageRepository) UpdateStatus(ctx context.Context, sessionID int, messageID string, status model.MessageStatus) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpMessages" SET "status" = $1 
		WHERE "sessionId" = $2 AND "messageId" = $3`, status, sessionID, messageID)
	return err
}
