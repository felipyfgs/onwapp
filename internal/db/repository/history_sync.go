package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type HistorySyncRepository struct {
	pool *pgxpool.Pool
}

func NewHistorySyncRepository(pool *pgxpool.Pool) *HistorySyncRepository {
	return &HistorySyncRepository{pool: pool}
}

// =============================================================================
// PAST PARTICIPANTS
// =============================================================================

func (r *HistorySyncRepository) SavePastParticipant(ctx context.Context, p *model.GroupPastParticipant) (string, error) {
	var id string
	now := time.Now()

	// Include leaveTimestamp in ON CONFLICT to match the unique constraint
	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpGroupPastParticipants" (
			"sessionId", "groupJid", "userJid",
			"leaveReason", "leaveTimestamp",
			"phone", "pushName", "syncedAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT ("sessionId", "groupJid", "userJid", "leaveTimestamp") DO UPDATE SET
			"leaveReason" = EXCLUDED."leaveReason",
			"phone" = COALESCE(EXCLUDED."phone", "zpGroupPastParticipants"."phone"),
			"pushName" = COALESCE(EXCLUDED."pushName", "zpGroupPastParticipants"."pushName")
		RETURNING "id"`,
		p.SessionID, p.GroupJID, p.UserJID,
		p.LeaveReason, p.LeaveTimestamp,
		p.Phone, p.PushName, now,
	).Scan(&id)

	if err == pgx.ErrNoRows {
		return "", nil
	}
	return id, err
}

func (r *HistorySyncRepository) SavePastParticipantsBatch(ctx context.Context, participants []*model.GroupPastParticipant) (int, error) {
	if len(participants) == 0 {
		return 0, nil
	}

	now := time.Now()
	saved := 0

	batch := &pgx.Batch{}
	for _, p := range participants {
		// Extract phone from userJid if it's a phone number
		phone := ""
		if len(p.UserJID) > 0 && p.UserJID[0] >= '0' && p.UserJID[0] <= '9' {
			// Extract phone from JID like "5511999999999@s.whatsapp.net"
			for i, c := range p.UserJID {
				if c == '@' {
					phone = p.UserJID[:i]
					break
				}
			}
		}

		batch.Queue(`
			INSERT INTO "zpGroupPastParticipants" (
				"sessionId", "groupJid", "userJid",
				"leaveReason", "leaveTimestamp",
				"phone", "pushName", "syncedAt"
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT ("sessionId", "groupJid", "userJid", "leaveTimestamp") DO UPDATE SET
				"leaveReason" = EXCLUDED."leaveReason"`,
			p.SessionID, p.GroupJID, p.UserJID,
			p.LeaveReason, p.LeaveTimestamp,
			phone, p.PushName, now,
		)
	}

	results := r.pool.SendBatch(ctx, batch)
	defer func() { _ = results.Close() }()

	for range participants {
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

func (r *HistorySyncRepository) GetGroupPastParticipants(ctx context.Context, sessionID, groupJID string) ([]*model.GroupPastParticipant, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId", "groupJid", "userJid",
			"leaveReason", "leaveTimestamp",
			COALESCE("phone", ''), COALESCE("pushName", ''),
			"syncedAt"
		FROM "zpGroupPastParticipants"
		WHERE "sessionId" = $1 AND "groupJid" = $2
		ORDER BY "leaveTimestamp" DESC`,
		sessionID, groupJID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanPastParticipants(rows)
}

func (r *HistorySyncRepository) GetUserGroupHistory(ctx context.Context, sessionID, userJID string) ([]*model.GroupPastParticipant, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId", "groupJid", "userJid",
			"leaveReason", "leaveTimestamp",
			COALESCE("phone", ''), COALESCE("pushName", ''),
			"syncedAt"
		FROM "zpGroupPastParticipants"
		WHERE "sessionId" = $1 AND "userJid" = $2
		ORDER BY "leaveTimestamp" DESC`,
		sessionID, userJID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanPastParticipants(rows)
}

func (r *HistorySyncRepository) GetGroupHistoryWithNames(ctx context.Context, sessionID, groupJID string) ([]*model.GroupPastParticipant, error) {
	return r.GetGroupPastParticipants(ctx, sessionID, groupJID)
}

func (r *HistorySyncRepository) GetRecentlyRemoved(ctx context.Context, sessionID string, since time.Time) ([]*model.GroupPastParticipant, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId", "groupJid", "userJid",
			"leaveReason", "leaveTimestamp",
			COALESCE("phone", ''), COALESCE("pushName", ''),
			"syncedAt"
		FROM "zpGroupPastParticipants"
		WHERE "sessionId" = $1 AND "leaveReason" = 1 AND "leaveTimestamp" >= $2
		ORDER BY "leaveTimestamp" DESC`,
		sessionID, since,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanPastParticipants(rows)
}

func (r *HistorySyncRepository) scanPastParticipants(rows pgx.Rows) ([]*model.GroupPastParticipant, error) {
	var participants []*model.GroupPastParticipant
	for rows.Next() {
		p := &model.GroupPastParticipant{}
		err := rows.Scan(
			&p.ID, &p.SessionID, &p.GroupJID, &p.UserJID,
			&p.LeaveReason, &p.LeaveTimestamp,
			&p.Phone, &p.PushName,
			&p.SyncedAt,
		)
		if err != nil {
			return nil, err
		}
		participants = append(participants, p)
	}
	return participants, rows.Err()
}

// =============================================================================
// SYNC PROGRESS
// =============================================================================

func (r *HistorySyncRepository) SaveSyncProgress(ctx context.Context, p *model.HistorySyncProgress) (string, error) {
	var id string
	now := time.Now()

	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpHistorySyncProgress" (
			"sessionId", "syncType",
			"lastChunkIndex", "lastMsgOrderID", "lastTimestamp",
			"status", "progress",
			"totalChunks", "processedChunks",
			"totalMessages", "processedMessages",
			"totalChats", "processedChats",
			"errors",
			"startedAt", "completedAt", "updatedAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		ON CONFLICT ("sessionId", "syncType") DO UPDATE SET
			"lastChunkIndex" = GREATEST(EXCLUDED."lastChunkIndex", "zpHistorySyncProgress"."lastChunkIndex"),
			"lastMsgOrderID" = COALESCE(EXCLUDED."lastMsgOrderID", "zpHistorySyncProgress"."lastMsgOrderID"),
			"lastTimestamp" = COALESCE(EXCLUDED."lastTimestamp", "zpHistorySyncProgress"."lastTimestamp"),
			"status" = EXCLUDED."status",
			"progress" = GREATEST(EXCLUDED."progress", "zpHistorySyncProgress"."progress"),
			"totalChunks" = COALESCE(EXCLUDED."totalChunks", "zpHistorySyncProgress"."totalChunks"),
			"processedChunks" = "zpHistorySyncProgress"."processedChunks" + 1,
			"totalMessages" = "zpHistorySyncProgress"."totalMessages" + EXCLUDED."totalMessages",
			"processedMessages" = "zpHistorySyncProgress"."processedMessages" + EXCLUDED."processedMessages",
			"totalChats" = "zpHistorySyncProgress"."totalChats" + EXCLUDED."totalChats",
			"processedChats" = "zpHistorySyncProgress"."processedChats" + EXCLUDED."processedChats",
			"errors" = "zpHistorySyncProgress"."errors" + EXCLUDED."errors",
			"completedAt" = EXCLUDED."completedAt",
			"updatedAt" = $17
		RETURNING "id"`,
		p.SessionID, p.SyncType,
		p.LastChunkIndex, p.LastMsgOrderID, p.LastTimestamp,
		p.Status, p.Progress,
		p.TotalChunks, p.ProcessedChunks,
		p.TotalMessages, p.ProcessedMessages,
		p.TotalChats, p.ProcessedChats,
		p.Errors,
		p.StartedAt, p.CompletedAt, now,
	).Scan(&id)

	if err == pgx.ErrNoRows {
		return "", nil
	}
	return id, err
}

func (r *HistorySyncRepository) UpdateSyncProgress(ctx context.Context, sessionID string, syncType model.SyncType, processedMessages, processedChats, errors int) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpHistorySyncProgress"
		SET "processedMessages" = "processedMessages" + $3,
			"processedChats" = "processedChats" + $4,
			"errors" = "errors" + $5,
			"updatedAt" = $6
		WHERE "sessionId" = $1 AND "syncType" = $2`,
		sessionID, syncType, processedMessages, processedChats, errors, now,
	)
	return err
}

func (r *HistorySyncRepository) MarkSyncComplete(ctx context.Context, sessionID string, syncType model.SyncType) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpHistorySyncProgress"
		SET "status" = 'completed', "progress" = 100, "completedAt" = $3, "updatedAt" = $3
		WHERE "sessionId" = $1 AND "syncType" = $2`,
		sessionID, syncType, now,
	)
	return err
}

func (r *HistorySyncRepository) GetSyncProgress(ctx context.Context, sessionID string, syncType model.SyncType) (*model.HistorySyncProgress, error) {
	p := &model.HistorySyncProgress{}
	err := r.pool.QueryRow(ctx, `
		SELECT 
			"id", "sessionId", "syncType",
			COALESCE("lastChunkIndex", 0), "lastMsgOrderID", "lastTimestamp",
			"status", COALESCE("progress", 0),
			"totalChunks", COALESCE("processedChunks", 0),
			COALESCE("totalMessages", 0), COALESCE("processedMessages", 0),
			COALESCE("totalChats", 0), COALESCE("processedChats", 0),
			COALESCE("errors", 0),
			"startedAt", "completedAt", "updatedAt"
		FROM "zpHistorySyncProgress"
		WHERE "sessionId" = $1 AND "syncType" = $2`,
		sessionID, syncType,
	).Scan(
		&p.ID, &p.SessionID, &p.SyncType,
		&p.LastChunkIndex, &p.LastMsgOrderID, &p.LastTimestamp,
		&p.Status, &p.Progress,
		&p.TotalChunks, &p.ProcessedChunks,
		&p.TotalMessages, &p.ProcessedMessages,
		&p.TotalChats, &p.ProcessedChats,
		&p.Errors,
		&p.StartedAt, &p.CompletedAt, &p.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return p, err
}

func (r *HistorySyncRepository) GetAllSyncProgress(ctx context.Context, sessionID string) ([]*model.HistorySyncProgress, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId", "syncType",
			COALESCE("lastChunkIndex", 0), "lastMsgOrderID", "lastTimestamp",
			"status", COALESCE("progress", 0),
			"totalChunks", COALESCE("processedChunks", 0),
			COALESCE("totalMessages", 0), COALESCE("processedMessages", 0),
			COALESCE("totalChats", 0), COALESCE("processedChats", 0),
			COALESCE("errors", 0),
			"startedAt", "completedAt", "updatedAt"
		FROM "zpHistorySyncProgress"
		WHERE "sessionId" = $1
		ORDER BY "startedAt" DESC`,
		sessionID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var progress []*model.HistorySyncProgress
	for rows.Next() {
		p := &model.HistorySyncProgress{}
		err := rows.Scan(
			&p.ID, &p.SessionID, &p.SyncType,
			&p.LastChunkIndex, &p.LastMsgOrderID, &p.LastTimestamp,
			&p.Status, &p.Progress,
			&p.TotalChunks, &p.ProcessedChunks,
			&p.TotalMessages, &p.ProcessedMessages,
			&p.TotalChats, &p.ProcessedChats,
			&p.Errors,
			&p.StartedAt, &p.CompletedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		progress = append(progress, p)
	}

	return progress, rows.Err()
}

func (r *HistorySyncRepository) DeleteOldProgress(ctx context.Context, sessionID string, olderThan time.Time) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM "zpHistorySyncProgress"
		WHERE "sessionId" = $1 AND "completedAt" < $2`,
		sessionID, olderThan,
	)
	return err
}
