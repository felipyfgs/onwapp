package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type MessageRepository struct {
	pool *pgxpool.Pool
}

const messageSelectFields = `
	"id", "sessionId", "messageId", "chatJid", COALESCE("senderJid", ''), "timestamp",
	COALESCE("pushName", ''), COALESCE("senderAlt", ''), COALESCE("type", ''), COALESCE("mediaType", ''), COALESCE("category", ''), COALESCE("content", ''),
	COALESCE("isFromMe", false), COALESCE("isGroup", false), COALESCE("isEphemeral", false), COALESCE("isViewOnce", false), COALESCE("isEdit", false),
	COALESCE("editTargetId", ''), COALESCE("quotedId", ''), COALESCE("quotedSender", ''),
	COALESCE("status", ''), "deliveredAt", "readAt", COALESCE("reactions", '[]'::jsonb), "rawEvent", "createdAt"`

func NewMessageRepository(pool *pgxpool.Pool) *MessageRepository {
	return &MessageRepository{pool: pool}
}

func (r *MessageRepository) Save(ctx context.Context, msg *model.Message) (string, error) {
	var id string
	now := time.Now()
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpMessages" (
			"sessionId", "messageId", "chatJid", "senderJid", "timestamp",
			"pushName", "senderAlt", "type", "mediaType", "category", "content",
			"isFromMe", "isGroup", "isEphemeral", "isViewOnce", "isEdit",
			"editTargetId", "quotedId", "quotedSender",
			"status", "deliveredAt", "readAt", "rawEvent", "createdAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
		ON CONFLICT ("sessionId", "messageId") DO NOTHING
		RETURNING "id"`,
		msg.SessionID, msg.MessageID, msg.ChatJID, msg.SenderJID, msg.Timestamp,
		msg.PushName, msg.SenderAlt, msg.Type, msg.MediaType, msg.Category, msg.Content,
		msg.IsFromMe, msg.IsGroup, msg.IsEphemeral, msg.IsViewOnce, msg.IsEdit,
		msg.EditTargetID, msg.QuotedID, msg.QuotedSender,
		msg.Status, msg.DeliveredAt, msg.ReadAt, msg.RawEvent, now,
	).Scan(&id)

	// Handle ON CONFLICT DO NOTHING - no row returned
	if err != nil && err.Error() == "no rows in result set" {
		return "", nil
	}
	return id, err
}

func (r *MessageRepository) SaveBatch(ctx context.Context, msgs []*model.Message) (int, error) {
	if len(msgs) == 0 {
		return 0, nil
	}

	now := time.Now()
	saved := 0

	// Use batch for efficiency
	batch := &pgx.Batch{}
	for _, msg := range msgs {
		batch.Queue(`
			INSERT INTO "zpMessages" (
				"sessionId", "messageId", "chatJid", "senderJid", "timestamp",
				"pushName", "senderAlt", "type", "mediaType", "category", "content",
				"isFromMe", "isGroup", "isEphemeral", "isViewOnce", "isEdit",
				"editTargetId", "quotedId", "quotedSender",
				"status", "deliveredAt", "readAt", "reactions", "rawEvent", "createdAt"
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, COALESCE($23, '[]'::jsonb), $24, $25)
			ON CONFLICT ("sessionId", "messageId") DO NOTHING`,
			msg.SessionID, msg.MessageID, msg.ChatJID, msg.SenderJID, msg.Timestamp,
			msg.PushName, msg.SenderAlt, msg.Type, msg.MediaType, msg.Category, msg.Content,
			msg.IsFromMe, msg.IsGroup, msg.IsEphemeral, msg.IsViewOnce, msg.IsEdit,
			msg.EditTargetID, msg.QuotedID, msg.QuotedSender,
			msg.Status, msg.DeliveredAt, msg.ReadAt, msg.Reactions, msg.RawEvent, now,
		)
	}

	results := r.pool.SendBatch(ctx, batch)
	defer func() { _ = results.Close() }()

	for range msgs {
		tag, err := results.Exec()
		if err != nil {
			return saved, err
		}
		if tag.RowsAffected() > 0 {
			saved++
		}
	}

	return saved, nil
}

func (r *MessageRepository) ExistsByMessageID(ctx context.Context, sessionID, messageID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM "zpMessages" WHERE "sessionId" = $1 AND "messageId" = $2)`,
		sessionID, messageID).Scan(&exists)
	return exists, err
}

func (r *MessageRepository) GetBySession(ctx context.Context, sessionID string, limit, offset int) ([]model.Message, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+messageSelectFields+` FROM "zpMessages" WHERE "sessionId" = $1 ORDER BY "timestamp" DESC LIMIT $2 OFFSET $3`,
		sessionID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanMessages(rows)
}

func (r *MessageRepository) GetByChat(ctx context.Context, sessionID string, chatJID string, limit, offset int) ([]model.Message, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+messageSelectFields+` FROM "zpMessages" WHERE "sessionId" = $1 AND "chatJid" = $2 ORDER BY "timestamp" DESC LIMIT $3 OFFSET $4`,
		sessionID, chatJID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanMessages(rows)
}

func (r *MessageRepository) UpdateStatus(ctx context.Context, sessionID string, messageID string, status model.MessageStatus) error {
	now := time.Now()
	var updateQuery string
	var args []interface{}

	switch status {
	case model.MessageStatusDelivered:
		updateQuery = `UPDATE "zpMessages" SET "status" = $1, "deliveredAt" = $2 WHERE "sessionId" = $3::uuid AND "messageId" = $4`
		args = []interface{}{status, now, sessionID, messageID}
	case model.MessageStatusRead:
		updateQuery = `UPDATE "zpMessages" SET "status" = $1, "readAt" = $2 WHERE "sessionId" = $3::uuid AND "messageId" = $4`
		args = []interface{}{status, now, sessionID, messageID}
	case model.MessageStatusPlayed:
		updateQuery = `UPDATE "zpMessages" SET "status" = $1, "readAt" = $2 WHERE "sessionId" = $3::uuid AND "messageId" = $4`
		args = []interface{}{status, now, sessionID, messageID}
	default:
		updateQuery = `UPDATE "zpMessages" SET "status" = $1 WHERE "sessionId" = $2::uuid AND "messageId" = $3`
		args = []interface{}{status, sessionID, messageID}
	}

	_, err := r.pool.Exec(ctx, updateQuery, args...)
	return err
}

func (r *MessageRepository) GetByMessageID(ctx context.Context, sessionID string, messageID string) (*model.Message, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+messageSelectFields+` FROM "zpMessages" WHERE "sessionId" = $1 AND "messageId" = $2`,
		sessionID, messageID)

	var m model.Message
	err := row.Scan(
		&m.ID, &m.SessionID, &m.MessageID, &m.ChatJID, &m.SenderJID, &m.Timestamp,
		&m.PushName, &m.SenderAlt, &m.Type, &m.MediaType, &m.Category, &m.Content,
		&m.IsFromMe, &m.IsGroup, &m.IsEphemeral, &m.IsViewOnce, &m.IsEdit,
		&m.EditTargetID, &m.QuotedID, &m.QuotedSender,
		&m.Status, &m.DeliveredAt, &m.ReadAt, &m.Reactions, &m.RawEvent, &m.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MessageRepository) scanMessages(rows interface {
	Next() bool
	Scan(...interface{}) error
	Err() error
}) ([]model.Message, error) {
	var messages []model.Message
	for rows.Next() {
		var m model.Message
		err := rows.Scan(
			&m.ID, &m.SessionID, &m.MessageID, &m.ChatJID, &m.SenderJID, &m.Timestamp,
			&m.PushName, &m.SenderAlt, &m.Type, &m.MediaType, &m.Category, &m.Content,
			&m.IsFromMe, &m.IsGroup, &m.IsEphemeral, &m.IsViewOnce, &m.IsEdit,
			&m.EditTargetID, &m.QuotedID, &m.QuotedSender,
			&m.Status, &m.DeliveredAt, &m.ReadAt, &m.Reactions, &m.RawEvent, &m.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, rows.Err()
}

// AddReaction adds a reaction to a message (upsert by senderJid)
func (r *MessageRepository) AddReaction(ctx context.Context, sessionID, messageID, emoji, senderJid string, timestamp int64) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpMessages" 
		SET "reactions" = (
			SELECT jsonb_agg(r) FROM (
				SELECT elem FROM jsonb_array_elements(COALESCE("reactions", '[]'::jsonb)) elem
				WHERE elem->>'senderJid' != $4::text
				UNION ALL
				SELECT jsonb_build_object('emoji', $3::text, 'senderJid', $4::text, 'timestamp', $5::bigint)
			) sub(r)
		)
		WHERE "sessionId" = $1::uuid AND "messageId" = $2`,
		sessionID, messageID, emoji, senderJid, timestamp)
	return err
}

// RemoveReaction removes a reaction from a message by senderJid
func (r *MessageRepository) RemoveReaction(ctx context.Context, sessionID, messageID, senderJid string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpMessages" 
		SET "reactions" = (
			SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM jsonb_array_elements(COALESCE("reactions", '[]'::jsonb)) r
			WHERE r->>'senderJid' != $3
		)
		WHERE "sessionId" = $1::uuid AND "messageId" = $2`,
		sessionID, messageID, senderJid)
	return err
}
