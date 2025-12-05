package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"onwapp/internal/model"
)

// sanitizeString removes null bytes and other problematic Unicode characters
// that PostgreSQL doesn't accept in TEXT fields
func sanitizeString(s string) string {
	// Remove null bytes (\u0000) which cause "unsupported Unicode escape sequence" error
	return strings.ReplaceAll(s, "\x00", "")
}

// sanitizeBytes removes null bytes from byte slices (for json.RawMessage)
func sanitizeBytes(b []byte) []byte {
	if b == nil {
		return nil
	}
	// Use strings.ReplaceAll via conversion for simplicity
	return []byte(strings.ReplaceAll(string(b), "\x00", ""))
}

type MessageRepository struct {
	pool *pgxpool.Pool
}

const messageSelectFields = `
	"id", "sessionId", "msgId", "chatJid", COALESCE("senderJid", ''), "timestamp",
	COALESCE("pushName", ''), COALESCE("senderAlt", ''), "serverId", "verifiedName",
	COALESCE("type", ''), COALESCE("mediaType", ''), COALESCE("category", ''), COALESCE("content", ''),
	COALESCE("fromMe", false), COALESCE("isGroup", false), COALESCE("ephemeral", false), COALESCE("viewOnce", false), COALESCE("isEdit", false),
	COALESCE("editTargetId", ''), COALESCE("quotedId", ''), COALESCE("quotedSender", ''),
	COALESCE("status", ''), "deliveredAt", "readAt", COALESCE("reactions", '[]'::jsonb), "rawEvent", "createdAt",
	"cwMsgId", "cwConvId", COALESCE("cwSourceId", '')`

func NewMessageRepository(pool *pgxpool.Pool) *MessageRepository {
	return &MessageRepository{pool: pool}
}

func (r *MessageRepository) Save(ctx context.Context, msg *model.Message) (string, error) {
	var id string
	now := time.Now()
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "onWappMessage" (
			"sessionId", "msgId", "chatJid", "senderJid", "timestamp",
			"pushName", "senderAlt", "serverId", "verifiedName",
			"type", "mediaType", "category", "content",
			"fromMe", "isGroup", "ephemeral", "viewOnce", "isEdit",
			"editTargetId", "quotedId", "quotedSender",
			"status", "deliveredAt", "readAt", "rawEvent", "createdAt",
			"cwMsgId", "cwConvId", "cwSourceId"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
		ON CONFLICT ("sessionId", "msgId") DO UPDATE SET
			"cwMsgId" = COALESCE(EXCLUDED."cwMsgId", "onWappMessage"."cwMsgId"),
			"cwConvId" = COALESCE(EXCLUDED."cwConvId", "onWappMessage"."cwConvId"),
			"cwSourceId" = COALESCE(EXCLUDED."cwSourceId", "onWappMessage"."cwSourceId")
		RETURNING "id"`,
		msg.SessionID, msg.MsgId, msg.ChatJID, msg.SenderJID, msg.Timestamp,
		msg.PushName, msg.SenderAlt, msg.ServerId, msg.VerifiedName,
		msg.Type, msg.MediaType, msg.Category, msg.Content,
		msg.FromMe, msg.IsGroup, msg.Ephemeral, msg.ViewOnce, msg.IsEdit,
		msg.EditTargetID, msg.QuotedID, msg.QuotedSender,
		msg.Status, msg.DeliveredAt, msg.ReadAt, msg.RawEvent, now,
		msg.CwMsgId, msg.CwConvId, msg.CwSourceId,
	).Scan(&id)

	// Handle case where ID already exists
	if err == pgx.ErrNoRows {
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
		// Sanitize string fields to remove null bytes that PostgreSQL doesn't accept
		content := sanitizeString(msg.Content)
		rawEvent := sanitizeBytes(msg.RawEvent)
		pushName := sanitizeString(msg.PushName)

		batch.Queue(`
			INSERT INTO "onWappMessage" (
				"sessionId", "msgId", "chatJid", "senderJid", "timestamp",
				"pushName", "senderAlt", "type", "mediaType", "category", "content",
				"fromMe", "isGroup", "ephemeral", "viewOnce", "isEdit",
				"editTargetId", "quotedId", "quotedSender",
				"status", "deliveredAt", "readAt", "reactions", "rawEvent", "createdAt",
				"msgOrderID", "stubType", "stubParams", "messageSecret", "broadcast"
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, COALESCE($23, '[]'::jsonb), $24, $25, $26, $27, $28, $29, $30)
			ON CONFLICT ("sessionId", "msgId") DO UPDATE SET
				"msgOrderID" = COALESCE(EXCLUDED."msgOrderID", "onWappMessage"."msgOrderID"),
				"stubType" = COALESCE(EXCLUDED."stubType", "onWappMessage"."stubType"),
				"stubParams" = COALESCE(EXCLUDED."stubParams", "onWappMessage"."stubParams"),
				"messageSecret" = COALESCE(EXCLUDED."messageSecret", "onWappMessage"."messageSecret")`,
			msg.SessionID, msg.MsgId, msg.ChatJID, msg.SenderJID, msg.Timestamp,
			pushName, msg.SenderAlt, msg.Type, msg.MediaType, msg.Category, content,
			msg.FromMe, msg.IsGroup, msg.Ephemeral, msg.ViewOnce, msg.IsEdit,
			msg.EditTargetID, msg.QuotedID, msg.QuotedSender,
			msg.Status, msg.DeliveredAt, msg.ReadAt, msg.Reactions, rawEvent, now,
			msg.MsgOrderID, msg.StubType, msg.StubParams, msg.MessageSecret, msg.Broadcast,
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

func (r *MessageRepository) ExistsByMsgId(ctx context.Context, sessionID, msgId string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM "onWappMessage" WHERE "sessionId" = $1 AND "msgId" = $2)`,
		sessionID, msgId).Scan(&exists)
	return exists, err
}

func (r *MessageRepository) GetBySession(ctx context.Context, sessionID string, limit, offset int) ([]model.Message, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+messageSelectFields+` FROM "onWappMessage" WHERE "sessionId" = $1 ORDER BY "timestamp" DESC LIMIT $2 OFFSET $3`,
		sessionID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanMessages(rows)
}

func (r *MessageRepository) GetByChat(ctx context.Context, sessionID string, chatJID string, limit, offset int) ([]model.Message, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+messageSelectFields+` FROM "onWappMessage" WHERE "sessionId" = $1 AND "chatJid" = $2 ORDER BY "timestamp" DESC LIMIT $3 OFFSET $4`,
		sessionID, chatJID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanMessages(rows)
}

func (r *MessageRepository) UpdateStatus(ctx context.Context, sessionID string, msgId string, status model.MessageStatus) error {
	now := time.Now()
	var updateQuery string
	var args []interface{}

	switch status {
	case model.MessageStatusDelivered:
		updateQuery = `UPDATE "onWappMessage" SET "status" = $1, "deliveredAt" = $2 WHERE "sessionId" = $3::uuid AND "msgId" = $4`
		args = []interface{}{status, now, sessionID, msgId}
	case model.MessageStatusRead:
		updateQuery = `UPDATE "onWappMessage" SET "status" = $1, "readAt" = $2 WHERE "sessionId" = $3::uuid AND "msgId" = $4`
		args = []interface{}{status, now, sessionID, msgId}
	case model.MessageStatusPlayed:
		updateQuery = `UPDATE "onWappMessage" SET "status" = $1, "readAt" = $2 WHERE "sessionId" = $3::uuid AND "msgId" = $4`
		args = []interface{}{status, now, sessionID, msgId}
	default:
		updateQuery = `UPDATE "onWappMessage" SET "status" = $1 WHERE "sessionId" = $2::uuid AND "msgId" = $3`
		args = []interface{}{status, sessionID, msgId}
	}

	_, err := r.pool.Exec(ctx, updateQuery, args...)
	return err
}

func (r *MessageRepository) GetByMsgId(ctx context.Context, sessionID string, msgId string) (*model.Message, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+messageSelectFields+` FROM "onWappMessage" WHERE "sessionId" = $1 AND "msgId" = $2`,
		sessionID, msgId)

	var m model.Message
	err := row.Scan(
		&m.ID, &m.SessionID, &m.MsgId, &m.ChatJID, &m.SenderJID, &m.Timestamp,
		&m.PushName, &m.SenderAlt, &m.ServerId, &m.VerifiedName,
		&m.Type, &m.MediaType, &m.Category, &m.Content,
		&m.FromMe, &m.IsGroup, &m.Ephemeral, &m.ViewOnce, &m.IsEdit,
		&m.EditTargetID, &m.QuotedID, &m.QuotedSender,
		&m.Status, &m.DeliveredAt, &m.ReadAt, &m.Reactions, &m.RawEvent, &m.CreatedAt,
		&m.CwMsgId, &m.CwConvId, &m.CwSourceId,
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
			&m.ID, &m.SessionID, &m.MsgId, &m.ChatJID, &m.SenderJID, &m.Timestamp,
			&m.PushName, &m.SenderAlt, &m.ServerId, &m.VerifiedName,
			&m.Type, &m.MediaType, &m.Category, &m.Content,
			&m.FromMe, &m.IsGroup, &m.Ephemeral, &m.ViewOnce, &m.IsEdit,
			&m.EditTargetID, &m.QuotedID, &m.QuotedSender,
			&m.Status, &m.DeliveredAt, &m.ReadAt, &m.Reactions, &m.RawEvent, &m.CreatedAt,
			&m.CwMsgId, &m.CwConvId, &m.CwSourceId,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, rows.Err()
}

// AddReaction adds a reaction to a message (upsert by senderJid)
func (r *MessageRepository) AddReaction(ctx context.Context, sessionID, msgId, emoji, senderJid string, timestamp int64) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappMessage" 
		SET "reactions" = (
			SELECT jsonb_agg(r) FROM (
				SELECT elem FROM jsonb_array_elements(COALESCE("reactions", '[]'::jsonb)) elem
				WHERE elem->>'senderJid' != $4::text
				UNION ALL
				SELECT jsonb_build_object('emoji', $3::text, 'senderJid', $4::text, 'timestamp', $5::bigint)
			) sub(r)
		)
		WHERE "sessionId" = $1::uuid AND "msgId" = $2`,
		sessionID, msgId, emoji, senderJid, timestamp)
	return err
}

// RemoveReaction removes a reaction from a message by senderJid
func (r *MessageRepository) RemoveReaction(ctx context.Context, sessionID, msgId, senderJid string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappMessage" 
		SET "reactions" = (
			SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM jsonb_array_elements(COALESCE("reactions", '[]'::jsonb)) r
			WHERE r->>'senderJid' != $3
		)
		WHERE "sessionId" = $1::uuid AND "msgId" = $2`,
		sessionID, msgId, senderJid)
	return err
}

// UpdateCwFields updates Chatwoot-related fields for a message
func (r *MessageRepository) UpdateCwFields(ctx context.Context, sessionID, msgId string, cwMsgId, cwConvId int, cwSourceId string) error {
	result, err := r.pool.Exec(ctx, `
		UPDATE "onWappMessage" 
		SET "cwMsgId" = $3, "cwConvId" = $4, "cwSourceId" = $5
		WHERE "sessionId" = $1::uuid AND "msgId" = $2`,
		sessionID, msgId, cwMsgId, cwConvId, cwSourceId)
	if err != nil {
		return err
	}

	// Log if no rows were affected (message not found in DB)
	if result.RowsAffected() == 0 {
		return fmt.Errorf("message not found in database: sessionID=%s, msgId=%s", sessionID, msgId)
	}

	return nil
}

// GetByCwMsgId finds a message by its Chatwoot message ID
func (r *MessageRepository) GetByCwMsgId(ctx context.Context, sessionID string, cwMsgId int) (*model.Message, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+messageSelectFields+` FROM "onWappMessage" WHERE "sessionId" = $1::uuid AND "cwMsgId" = $2`,
		sessionID, cwMsgId)

	var m model.Message
	err := row.Scan(
		&m.ID, &m.SessionID, &m.MsgId, &m.ChatJID, &m.SenderJID, &m.Timestamp,
		&m.PushName, &m.SenderAlt, &m.ServerId, &m.VerifiedName,
		&m.Type, &m.MediaType, &m.Category, &m.Content,
		&m.FromMe, &m.IsGroup, &m.Ephemeral, &m.ViewOnce, &m.IsEdit,
		&m.EditTargetID, &m.QuotedID, &m.QuotedSender,
		&m.Status, &m.DeliveredAt, &m.ReadAt, &m.Reactions, &m.RawEvent, &m.CreatedAt,
		&m.CwMsgId, &m.CwConvId, &m.CwSourceId,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

// GetAllByCwMsgId finds ALL messages with the same Chatwoot message ID
// This is needed because multiple attachments in Chatwoot become multiple WhatsApp messages
func (r *MessageRepository) GetAllByCwMsgId(ctx context.Context, sessionID string, cwMsgId int) ([]*model.Message, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+messageSelectFields+` FROM "onWappMessage" WHERE "sessionId" = $1::uuid AND "cwMsgId" = $2`,
		sessionID, cwMsgId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*model.Message
	for rows.Next() {
		var m model.Message
		err := rows.Scan(
			&m.ID, &m.SessionID, &m.MsgId, &m.ChatJID, &m.SenderJID, &m.Timestamp,
			&m.PushName, &m.SenderAlt, &m.ServerId, &m.VerifiedName,
			&m.Type, &m.MediaType, &m.Category, &m.Content,
			&m.FromMe, &m.IsGroup, &m.Ephemeral, &m.ViewOnce, &m.IsEdit,
			&m.EditTargetID, &m.QuotedID, &m.QuotedSender,
			&m.Status, &m.DeliveredAt, &m.ReadAt, &m.Reactions, &m.RawEvent, &m.CreatedAt,
			&m.CwMsgId, &m.CwConvId, &m.CwSourceId,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, &m)
	}
	return messages, rows.Err()
}

// Delete removes a message from the database
func (r *MessageRepository) Delete(ctx context.Context, sessionID, msgId string) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM "onWappMessage" 
		WHERE "sessionId" = $1::uuid AND "msgId" = $2`,
		sessionID, msgId)
	return err
}

// ClearCwConversation clears Chatwoot conversation reference for all messages in a conversation
// This is used when a conversation is deleted in Chatwoot (404 error)
func (r *MessageRepository) ClearCwConversation(ctx context.Context, sessionID string, cwConvId int) (int64, error) {
	result, err := r.pool.Exec(ctx, `
		UPDATE "onWappMessage" 
		SET "cwConvId" = NULL, "cwMsgId" = NULL, "cwSourceId" = NULL
		WHERE "sessionId" = $1::uuid AND "cwConvId" = $2`,
		sessionID, cwConvId)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}

// UpdatePushNameByJID updates pushName for messages with specific senderJid
// Only updates messages that have empty pushName
func (r *MessageRepository) UpdatePushNameByJID(ctx context.Context, sessionID, senderJID, pushName string) (int64, error) {
	result, err := r.pool.Exec(ctx, `
		UPDATE "onWappMessage" 
		SET "pushName" = $1 
		WHERE "sessionId" = $2 
		AND "senderJid" = $3 
		AND ("pushName" IS NULL OR "pushName" = '')`,
		pushName, sessionID, senderJID)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}

// UpdatePushNameByLIDPattern updates pushName for messages where senderJid matches LID pattern
// Uses LIKE pattern to match LID JIDs with device suffix variations
func (r *MessageRepository) UpdatePushNameByLIDPattern(ctx context.Context, sessionID, lidPattern, pushName string) (int64, error) {
	result, err := r.pool.Exec(ctx, `
		UPDATE "onWappMessage" 
		SET "pushName" = $1 
		WHERE "sessionId" = $2 
		AND "senderJid" LIKE $3 
		AND ("pushName" IS NULL OR "pushName" = '')`,
		pushName, sessionID, lidPattern)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}

// UpdatePushNamesBatch updates pushName for multiple JIDs efficiently
// Returns total number of rows affected
func (r *MessageRepository) UpdatePushNamesBatch(ctx context.Context, sessionID string, jidToName map[string]string) (int64, error) {
	if len(jidToName) == 0 {
		return 0, nil
	}

	var total int64
	for jid, name := range jidToName {
		affected, err := r.UpdatePushNameByJID(ctx, sessionID, jid, name)
		if err != nil {
			return total, err
		}
		total += affected
	}
	return total, nil
}

// GetUnreadIncomingByChat returns incoming messages (fromMe=false) that haven't been marked as read yet
// This is used to send read receipts to WhatsApp when agent responds in Chatwoot
func (r *MessageRepository) GetUnreadIncomingByChat(ctx context.Context, sessionID, chatJID string, limit int) ([]model.Message, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+messageSelectFields+` FROM "onWappMessage" 
		WHERE "sessionId" = $1 AND "chatJid" = $2 AND "fromMe" = false AND "readAt" IS NULL
		ORDER BY "timestamp" DESC LIMIT $3`,
		sessionID, chatJID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanMessages(rows)
}

// MarkAsReadByAgent marks incoming messages as read (sets readAt timestamp)
// This is called when we send read receipts to WhatsApp
func (r *MessageRepository) MarkAsReadByAgent(ctx context.Context, sessionID string, msgIds []string) (int64, error) {
	if len(msgIds) == 0 {
		return 0, nil
	}

	now := time.Now()
	result, err := r.pool.Exec(ctx, `
		UPDATE "onWappMessage" 
		SET "readAt" = $1
		WHERE "sessionId" = $2::uuid AND "msgId" = ANY($3) AND "fromMe" = false AND "readAt" IS NULL`,
		now, sessionID, msgIds)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}

func (r *MessageRepository) CountBySession(ctx context.Context, sessionID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM "onWappMessage" WHERE "sessionId" = $1::uuid`, sessionID).Scan(&count)
	return count, err
}
