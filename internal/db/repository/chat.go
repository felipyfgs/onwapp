package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"onwapp/internal/model"
)

type ChatRepository struct {
	pool *pgxpool.Pool
}

func NewChatRepository(pool *pgxpool.Pool) *ChatRepository {
	return &ChatRepository{pool: pool}
}

func (r *ChatRepository) Save(ctx context.Context, c *model.Chat) (string, error) {
	var id string
	now := time.Now()

	err := r.pool.QueryRow(ctx, `
		INSERT INTO "onWappChat" (
			"sessionId", "chatJid", "name",
			"unreadCount", "unreadMentionCount", "markedAsUnread",
			"ephemeralExpiration", "ephemeralSettingTimestamp", "disappearingInitiator",
			"readOnly", "suspended", "locked",
			"limitSharing", "limitSharingTimestamp", "limitSharingTrigger", "limitSharingInitiatedByMe",
			"isDefaultSubgroup", "commentsCount",
			"conversationTimestamp", "pHash", "notSpam",
			"syncedAt", "updatedAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
		ON CONFLICT ("sessionId", "chatJid") DO UPDATE SET
			"name" = COALESCE(EXCLUDED."name", "onWappChat"."name"),
			"unreadCount" = EXCLUDED."unreadCount",
			"unreadMentionCount" = EXCLUDED."unreadMentionCount",
			"markedAsUnread" = EXCLUDED."markedAsUnread",
			"ephemeralExpiration" = EXCLUDED."ephemeralExpiration",
			"ephemeralSettingTimestamp" = EXCLUDED."ephemeralSettingTimestamp",
			"disappearingInitiator" = EXCLUDED."disappearingInitiator",
			"readOnly" = EXCLUDED."readOnly",
			"suspended" = EXCLUDED."suspended",
			"locked" = EXCLUDED."locked",
			"limitSharing" = EXCLUDED."limitSharing",
			"limitSharingTimestamp" = EXCLUDED."limitSharingTimestamp",
			"limitSharingTrigger" = EXCLUDED."limitSharingTrigger",
			"limitSharingInitiatedByMe" = EXCLUDED."limitSharingInitiatedByMe",
			"isDefaultSubgroup" = EXCLUDED."isDefaultSubgroup",
			"commentsCount" = EXCLUDED."commentsCount",
			"conversationTimestamp" = GREATEST(EXCLUDED."conversationTimestamp", "onWappChat"."conversationTimestamp"),
			"pHash" = COALESCE(EXCLUDED."pHash", "onWappChat"."pHash"),
			"notSpam" = EXCLUDED."notSpam",
			"updatedAt" = $23
		RETURNING "id"`,
		c.SessionID, c.ChatJID, c.Name,
		c.UnreadCount, c.UnreadMentionCount, c.MarkedAsUnread,
		c.EphemeralExpiration, c.EphemeralSettingTimestamp, c.DisappearingModeInitiator,
		c.ReadOnly, c.Suspended, c.Locked,
		c.LimitSharing, c.LimitSharingTimestamp, c.LimitSharingTrigger, c.LimitSharingInitiatedByMe,
		c.IsDefaultSubgroup, c.CommentsCount,
		c.ConversationTimestamp, c.PHash, c.NotSpam,
		now, now,
	).Scan(&id)

	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	return id, err
}

func (r *ChatRepository) SaveBatch(ctx context.Context, chats []*model.Chat) (int, error) {
	if len(chats) == 0 {
		return 0, nil
	}

	now := time.Now()
	saved := 0

	batch := &pgx.Batch{}
	for _, c := range chats {
		batch.Queue(`
			INSERT INTO "onWappChat" (
				"sessionId", "chatJid", "name",
				"unreadCount", "unreadMentionCount", "markedAsUnread",
				"ephemeralExpiration", "ephemeralSettingTimestamp", "disappearingInitiator",
				"readOnly", "suspended", "locked",
				"limitSharing", "limitSharingTimestamp", "limitSharingTrigger", "limitSharingInitiatedByMe",
				"isDefaultSubgroup", "commentsCount",
				"conversationTimestamp", "pHash", "notSpam",
				"syncedAt", "updatedAt"
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
			ON CONFLICT ("sessionId", "chatJid") DO UPDATE SET
				"name" = COALESCE(EXCLUDED."name", "onWappChat"."name"),
				"unreadCount" = EXCLUDED."unreadCount",
				"unreadMentionCount" = EXCLUDED."unreadMentionCount",
				"conversationTimestamp" = GREATEST(EXCLUDED."conversationTimestamp", "onWappChat"."conversationTimestamp"),
				"updatedAt" = $23`,
			c.SessionID, c.ChatJID, c.Name,
			c.UnreadCount, c.UnreadMentionCount, c.MarkedAsUnread,
			c.EphemeralExpiration, c.EphemeralSettingTimestamp, c.DisappearingModeInitiator,
			c.ReadOnly, c.Suspended, c.Locked,
			c.LimitSharing, c.LimitSharingTimestamp, c.LimitSharingTrigger, c.LimitSharingInitiatedByMe,
			c.IsDefaultSubgroup, c.CommentsCount,
			c.ConversationTimestamp, c.PHash, c.NotSpam,
			now, now,
		)
	}

	results := r.pool.SendBatch(ctx, batch)
	defer func() { _ = results.Close() }()

	for range chats {
		tag, err := results.Exec()
		if err != nil {
			continue
		}
		if tag.RowsAffected() > 0 {
			saved++
		}
	}

	return saved, nil
}

func (r *ChatRepository) GetByJID(ctx context.Context, sessionID, chatJID string) (*model.Chat, error) {
	c := &model.Chat{}
	err := r.pool.QueryRow(ctx, `
		SELECT 
			"id", "sessionId", "chatJid", COALESCE("name", ''),
			"unreadCount", "unreadMentionCount", "markedAsUnread",
			COALESCE("ephemeralExpiration", 0), COALESCE("ephemeralSettingTimestamp", 0), COALESCE("disappearingInitiator", 0),
			"readOnly", "suspended", "locked",
			"limitSharing", COALESCE("limitSharingTimestamp", 0), COALESCE("limitSharingTrigger", 0), COALESCE("limitSharingInitiatedByMe", false),
			"isDefaultSubgroup", COALESCE("commentsCount", 0),
			"conversationTimestamp", COALESCE("pHash", ''), "notSpam",
			"syncedAt", "updatedAt"
		FROM "onWappChat"
		WHERE "sessionId" = $1 AND "chatJid" = $2`,
		sessionID, chatJID,
	).Scan(
		&c.ID, &c.SessionID, &c.ChatJID, &c.Name,
		&c.UnreadCount, &c.UnreadMentionCount, &c.MarkedAsUnread,
		&c.EphemeralExpiration, &c.EphemeralSettingTimestamp, &c.DisappearingModeInitiator,
		&c.ReadOnly, &c.Suspended, &c.Locked,
		&c.LimitSharing, &c.LimitSharingTimestamp, &c.LimitSharingTrigger, &c.LimitSharingInitiatedByMe,
		&c.IsDefaultSubgroup, &c.CommentsCount,
		&c.ConversationTimestamp, &c.PHash, &c.NotSpam,
		&c.SyncedAt, &c.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return c, err
}

func (r *ChatRepository) GetBySession(ctx context.Context, sessionID string, limit, offset int, unreadOnly bool) ([]*model.Chat, error) {
	query := `
		SELECT 
			"id", "sessionId", "chatJid", COALESCE("name", ''),
			"unreadCount", "unreadMentionCount", "markedAsUnread",
			COALESCE("ephemeralExpiration", 0), COALESCE("ephemeralSettingTimestamp", 0), COALESCE("disappearingInitiator", 0),
			"readOnly", "suspended", "locked",
			"limitSharing", COALESCE("limitSharingTimestamp", 0), COALESCE("limitSharingTrigger", 0), COALESCE("limitSharingInitiatedByMe", false),
			"isDefaultSubgroup", COALESCE("commentsCount", 0),
			"conversationTimestamp", COALESCE("pHash", ''), "notSpam",
			"syncedAt", "updatedAt"
		FROM "onWappChat"
		WHERE "sessionId" = $1`

	if unreadOnly {
		query += ` AND ("unreadCount" > 0 OR "markedAsUnread" = true)`
	}

	query += ` ORDER BY "conversationTimestamp" DESC NULLS LAST LIMIT $2 OFFSET $3`

	rows, err := r.pool.Query(ctx, query, sessionID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanChats(rows)
}

func (r *ChatRepository) UpdateUnreadCount(ctx context.Context, sessionID, chatJID string, unreadCount, unreadMentionCount int) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappChat"
		SET "unreadCount" = $3, "unreadMentionCount" = $4, "updatedAt" = $5
		WHERE "sessionId" = $1 AND "chatJid" = $2`,
		sessionID, chatJID, unreadCount, unreadMentionCount, now,
	)
	return err
}

func (r *ChatRepository) MarkAsRead(ctx context.Context, sessionID, chatJID string) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappChat"
		SET "unreadCount" = 0, "unreadMentionCount" = 0, "markedAsUnread" = false, "updatedAt" = $3
		WHERE "sessionId" = $1 AND "chatJid" = $2`,
		sessionID, chatJID, now,
	)
	return err
}

func (r *ChatRepository) UpdateEphemeralSettings(ctx context.Context, sessionID, chatJID string, expiration int, timestamp int64) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappChat"
		SET "ephemeralExpiration" = $3, "ephemeralSettingTimestamp" = $4, "updatedAt" = $5
		WHERE "sessionId" = $1 AND "chatJid" = $2`,
		sessionID, chatJID, expiration, timestamp, now,
	)
	return err
}

func (r *ChatRepository) scanChats(rows pgx.Rows) ([]*model.Chat, error) {
	chats := make([]*model.Chat, 0, 50)
	for rows.Next() {
		c := &model.Chat{}
		err := rows.Scan(
			&c.ID, &c.SessionID, &c.ChatJID, &c.Name,
			&c.UnreadCount, &c.UnreadMentionCount, &c.MarkedAsUnread,
			&c.EphemeralExpiration, &c.EphemeralSettingTimestamp, &c.DisappearingModeInitiator,
			&c.ReadOnly, &c.Suspended, &c.Locked,
			&c.LimitSharing, &c.LimitSharingTimestamp, &c.LimitSharingTrigger, &c.LimitSharingInitiatedByMe,
			&c.IsDefaultSubgroup, &c.CommentsCount,
			&c.ConversationTimestamp, &c.PHash, &c.NotSpam,
			&c.SyncedAt, &c.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		chats = append(chats, c)
	}
	return chats, rows.Err()
}

// GetWithContext returns chat with full metadata (same as GetByJID for now)
func (r *ChatRepository) GetWithContext(ctx context.Context, sessionID, chatJID string) (*model.Chat, error) {
	return r.GetByJID(ctx, sessionID, chatJID)
}

func (r *ChatRepository) Delete(ctx context.Context, sessionID, chatJID string) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM "onWappChat"
		WHERE "sessionId" = $1 AND "chatJid" = $2`,
		sessionID, chatJID,
	)
	return err
}

func (r *ChatRepository) CountBySession(ctx context.Context, sessionID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM "onWappChat" WHERE "sessionId" = $1::uuid`, sessionID).Scan(&count)
	return count, err
}

// ChatWithLastMessage represents a chat with its last message and settings
type ChatWithLastMessage struct {
	Chat        *model.Chat
	LastMessage *LastMessageData
	Archived    bool
	Pinned      bool
	Muted       string
}

// LastMessageData represents the last message of a chat
type LastMessageData struct {
	Content   string
	Timestamp int64
	FromMe    bool
	Type      string
	MediaType string
	Status    string
	SenderJID string
	PushName  string
}

// GetBySessionWithLastMessage returns chats with last message from own tables
func (r *ChatRepository) GetBySessionWithLastMessage(ctx context.Context, sessionID string, limit, offset int, unreadOnly bool) ([]*ChatWithLastMessage, error) {
	query := `
		WITH last_messages AS (
			SELECT DISTINCT ON ("chatJid") 
				"chatJid",
				"content",
				EXTRACT(EPOCH FROM "timestamp")::bigint as timestamp,
				"fromMe",
				"type",
				COALESCE("mediaType", '') as "mediaType",
				COALESCE("status", '') as "status",
				COALESCE("senderJid", '') as "senderJid",
				COALESCE("pushName", '') as "pushName"
			FROM "onWappMessage"
			WHERE "sessionId" = $1
			ORDER BY "chatJid", "timestamp" DESC
		)
		SELECT 
			c."id", c."sessionId", c."chatJid", COALESCE(c."name", ''),
			c."unreadCount", c."unreadMentionCount", c."markedAsUnread",
			COALESCE(c."ephemeralExpiration", 0), COALESCE(c."ephemeralSettingTimestamp", 0), COALESCE(c."disappearingInitiator", 0),
			c."readOnly", c."suspended", c."locked",
			c."limitSharing", COALESCE(c."limitSharingTimestamp", 0), COALESCE(c."limitSharingTrigger", 0), COALESCE(c."limitSharingInitiatedByMe", false),
			c."isDefaultSubgroup", COALESCE(c."commentsCount", 0),
			c."conversationTimestamp", COALESCE(c."pHash", ''), c."notSpam",
			c."syncedAt", c."updatedAt",
			lm."content", lm."timestamp", lm."fromMe", lm."type", lm."mediaType", lm."status", lm."senderJid", lm."pushName",
			COALESCE(c."archived", false), COALESCE(c."pinned", false), CASE WHEN c."muted" > NOW() THEN 'muted' ELSE '' END
		FROM "onWappChat" c
		LEFT JOIN last_messages lm ON lm."chatJid" = c."chatJid"
		WHERE c."sessionId" = $1`

	if unreadOnly {
		query += ` AND (c."unreadCount" > 0 OR c."markedAsUnread" = true)`
	}

	query += ` ORDER BY c."pinned" DESC, c."conversationTimestamp" DESC NULLS LAST LIMIT $2 OFFSET $3`

	rows, err := r.pool.Query(ctx, query, sessionID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]*ChatWithLastMessage, 0, 50)
	for rows.Next() {
		c := &model.Chat{}
		lm := &LastMessageData{}
		var archived, pinned bool
		var muted string
		var lmContent, lmType, lmMediaType, lmStatus, lmSenderJID, lmPushName *string
		var lmTimestamp *int64
		var lmFromMe *bool

		err := rows.Scan(
			&c.ID, &c.SessionID, &c.ChatJID, &c.Name,
			&c.UnreadCount, &c.UnreadMentionCount, &c.MarkedAsUnread,
			&c.EphemeralExpiration, &c.EphemeralSettingTimestamp, &c.DisappearingModeInitiator,
			&c.ReadOnly, &c.Suspended, &c.Locked,
			&c.LimitSharing, &c.LimitSharingTimestamp, &c.LimitSharingTrigger, &c.LimitSharingInitiatedByMe,
			&c.IsDefaultSubgroup, &c.CommentsCount,
			&c.ConversationTimestamp, &c.PHash, &c.NotSpam,
			&c.SyncedAt, &c.UpdatedAt,
			&lmContent, &lmTimestamp, &lmFromMe, &lmType, &lmMediaType, &lmStatus, &lmSenderJID, &lmPushName,
			&archived, &pinned, &muted,
		)
		if err != nil {
			return nil, err
		}

		result := &ChatWithLastMessage{
			Chat:     c,
			Archived: archived,
			Pinned:   pinned,
			Muted:    muted,
		}

		// Populate last message if exists
		if lmTimestamp != nil {
			lm.Timestamp = *lmTimestamp
			if lmContent != nil {
				lm.Content = *lmContent
			}
			if lmFromMe != nil {
				lm.FromMe = *lmFromMe
			}
			if lmType != nil {
				lm.Type = *lmType
			}
			if lmMediaType != nil {
				lm.MediaType = *lmMediaType
			}
			if lmStatus != nil {
				lm.Status = *lmStatus
			}
			if lmSenderJID != nil {
				lm.SenderJID = *lmSenderJID
			}
			if lmPushName != nil {
				lm.PushName = *lmPushName
			}
			result.LastMessage = lm
		}

		results = append(results, result)
	}

	return results, rows.Err()
}
