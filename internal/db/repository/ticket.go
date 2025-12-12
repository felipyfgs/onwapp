package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"onwapp/internal/model"
)

type TicketRepository struct {
	pool *pgxpool.Pool
}

func NewTicketRepository(pool *pgxpool.Pool) *TicketRepository {
	return &TicketRepository{pool: pool}
}

func (r *TicketRepository) Create(ctx context.Context, t *model.Ticket) error {
	now := time.Now()
	t.CreatedAt = now
	t.UpdatedAt = now

	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO "onWappTicket" (
			"id", "sessionId", "contactJid", "contactName", "contactPicUrl",
			"queueId", "userId", "status", "lastMessage", "unreadCount",
			"isGroup", "closedAt", "createdAt", "updatedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		t.ID, t.SessionID, t.ContactJid, t.ContactName, t.ContactPicUrl,
		t.QueueID, t.UserID, t.Status, t.LastMessage, t.UnreadCount,
		t.IsGroup, t.ClosedAt, t.CreatedAt, t.UpdatedAt,
	)
	return err
}

func (r *TicketRepository) Update(ctx context.Context, t *model.Ticket) error {
	t.UpdatedAt = time.Now()

	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappTicket" SET
			"contactName" = $3, "contactPicUrl" = $4,
			"queueId" = $5, "userId" = $6, "status" = $7,
			"lastMessage" = $8, "unreadCount" = $9, "closedAt" = $10, "updatedAt" = $11
		WHERE "id" = $1 AND "sessionId" = $2`,
		t.ID, t.SessionID, t.ContactName, t.ContactPicUrl,
		t.QueueID, t.UserID, t.Status,
		t.LastMessage, t.UnreadCount, t.ClosedAt, t.UpdatedAt,
	)
	return err
}

func (r *TicketRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Ticket, error) {
	t := &model.Ticket{}
	err := r.pool.QueryRow(ctx, `
		SELECT 
			t."id", t."sessionId", t."contactJid", t."contactName", t."contactPicUrl",
			t."queueId", t."userId", t."status", t."lastMessage", t."unreadCount",
			t."isGroup", t."closedAt", t."createdAt", t."updatedAt",
			q."id", q."name", q."color",
			u."id", u."name", u."email", u."profile"
		FROM "onWappTicket" t
		LEFT JOIN "onWappQueue" q ON q."id" = t."queueId"
		LEFT JOIN "onWappUser" u ON u."id" = t."userId"
		WHERE t."id" = $1`,
		id,
	).Scan(
		&t.ID, &t.SessionID, &t.ContactJid, &t.ContactName, &t.ContactPicUrl,
		&t.QueueID, &t.UserID, &t.Status, &t.LastMessage, &t.UnreadCount,
		&t.IsGroup, &t.ClosedAt, &t.CreatedAt, &t.UpdatedAt,
		&queueID, &queueName, &queueColor,
		&userID, &userName, &userEmail, &userProfile,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return t, err
}

var (
	queueID, userID                       *uuid.UUID
	queueName, queueColor                 *string
	userName, userEmail                   *string
	userProfile                           *model.UserProfile
)

func (r *TicketRepository) GetByIDWithRelations(ctx context.Context, id uuid.UUID) (*model.Ticket, error) {
	t := &model.Ticket{}
	var qID, uID *uuid.UUID
	var qName, qColor *string
	var uName, uEmail *string
	var uProfile *model.UserProfile

	err := r.pool.QueryRow(ctx, `
		SELECT 
			t."id", t."sessionId", t."contactJid", t."contactName", t."contactPicUrl",
			t."queueId", t."userId", t."status", t."lastMessage", t."unreadCount",
			t."isGroup", t."closedAt", t."createdAt", t."updatedAt",
			q."id", q."name", q."color",
			u."id", u."name", u."email", u."profile"
		FROM "onWappTicket" t
		LEFT JOIN "onWappQueue" q ON q."id" = t."queueId"
		LEFT JOIN "onWappUser" u ON u."id" = t."userId"
		WHERE t."id" = $1`,
		id,
	).Scan(
		&t.ID, &t.SessionID, &t.ContactJid, &t.ContactName, &t.ContactPicUrl,
		&t.QueueID, &t.UserID, &t.Status, &t.LastMessage, &t.UnreadCount,
		&t.IsGroup, &t.ClosedAt, &t.CreatedAt, &t.UpdatedAt,
		&qID, &qName, &qColor,
		&uID, &uName, &uEmail, &uProfile,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if qID != nil {
		t.Queue = &model.Queue{ID: *qID, Name: *qName, Color: *qColor}
	}
	if uID != nil {
		t.User = &model.User{ID: *uID, Name: *uName, Email: *uEmail, Profile: *uProfile}
	}

	return t, nil
}

func (r *TicketRepository) GetByContact(ctx context.Context, sessionID uuid.UUID, contactJid string) (*model.Ticket, error) {
	t := &model.Ticket{}
	err := r.pool.QueryRow(ctx, `
		SELECT 
			"id", "sessionId", "contactJid", "contactName", "contactPicUrl",
			"queueId", "userId", "status", "lastMessage", "unreadCount",
			"isGroup", "closedAt", "createdAt", "updatedAt"
		FROM "onWappTicket"
		WHERE "sessionId" = $1 AND "contactJid" = $2`,
		sessionID, contactJid,
	).Scan(
		&t.ID, &t.SessionID, &t.ContactJid, &t.ContactName, &t.ContactPicUrl,
		&t.QueueID, &t.UserID, &t.Status, &t.LastMessage, &t.UnreadCount,
		&t.IsGroup, &t.ClosedAt, &t.CreatedAt, &t.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return t, err
}

func (r *TicketRepository) List(ctx context.Context, filter *model.TicketFilter) ([]*model.Ticket, int, error) {
	if filter.Limit == 0 {
		filter.Limit = 50
	}

	baseQuery := `
		FROM "onWappTicket" t
		LEFT JOIN "onWappQueue" q ON q."id" = t."queueId"
		LEFT JOIN "onWappUser" u ON u."id" = t."userId"
		WHERE 1=1`

	args := []any{}
	argIdx := 1

	if filter.SessionID != nil {
		baseQuery += ` AND t."sessionId" = $` + string(rune('0'+argIdx))
		args = append(args, *filter.SessionID)
		argIdx++
	}
	if filter.Status != nil {
		baseQuery += ` AND t."status" = $` + string(rune('0'+argIdx))
		args = append(args, *filter.Status)
		argIdx++
	}
	if filter.QueueID != nil {
		baseQuery += ` AND t."queueId" = $` + string(rune('0'+argIdx))
		args = append(args, *filter.QueueID)
		argIdx++
	}
	if filter.UserID != nil {
		baseQuery += ` AND t."userId" = $` + string(rune('0'+argIdx))
		args = append(args, *filter.UserID)
		argIdx++
	}
	if filter.IsGroup != nil {
		baseQuery += ` AND t."isGroup" = $` + string(rune('0'+argIdx))
		args = append(args, *filter.IsGroup)
		argIdx++
	}
	if filter.Search != nil && *filter.Search != "" {
		baseQuery += ` AND (t."contactName" ILIKE $` + string(rune('0'+argIdx)) + ` OR t."contactJid" ILIKE $` + string(rune('0'+argIdx)) + `)`
		args = append(args, "%"+*filter.Search+"%")
		argIdx++
	}

	var total int
	countQuery := `SELECT COUNT(*) ` + baseQuery
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	selectQuery := `
		SELECT 
			t."id", t."sessionId", t."contactJid", t."contactName", t."contactPicUrl",
			t."queueId", t."userId", t."status", t."lastMessage", t."unreadCount",
			t."isGroup", t."closedAt", t."createdAt", t."updatedAt",
			q."id", q."name", q."color",
			u."id", u."name", u."email", u."profile"
		` + baseQuery + `
		ORDER BY t."updatedAt" DESC
		LIMIT $` + string(rune('0'+argIdx)) + ` OFFSET $` + string(rune('0'+argIdx+1))

	args = append(args, filter.Limit, filter.Offset)

	rows, err := r.pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	tickets := make([]*model.Ticket, 0)
	for rows.Next() {
		t := &model.Ticket{}
		var qID, uID *uuid.UUID
		var qName, qColor *string
		var uName, uEmail *string
		var uProfile *model.UserProfile

		if err := rows.Scan(
			&t.ID, &t.SessionID, &t.ContactJid, &t.ContactName, &t.ContactPicUrl,
			&t.QueueID, &t.UserID, &t.Status, &t.LastMessage, &t.UnreadCount,
			&t.IsGroup, &t.ClosedAt, &t.CreatedAt, &t.UpdatedAt,
			&qID, &qName, &qColor,
			&uID, &uName, &uEmail, &uProfile,
		); err != nil {
			return nil, 0, err
		}

		if qID != nil {
			t.Queue = &model.Queue{ID: *qID, Name: *qName, Color: *qColor}
		}
		if uID != nil {
			t.User = &model.User{ID: *uID, Name: *uName, Email: *uEmail, Profile: *uProfile}
		}

		tickets = append(tickets, t)
	}

	return tickets, total, rows.Err()
}

func (r *TicketRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status model.TicketStatus) error {
	now := time.Now()
	var closedAt *time.Time
	if status == model.TicketStatusClosed {
		closedAt = &now
	}

	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappTicket" SET "status" = $2, "closedAt" = $3, "updatedAt" = $4
		WHERE "id" = $1`,
		id, status, closedAt, now,
	)
	return err
}

func (r *TicketRepository) UpdateAssignment(ctx context.Context, id uuid.UUID, userID *uuid.UUID, queueID *uuid.UUID) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappTicket" SET "userId" = $2, "queueId" = $3, "updatedAt" = $4
		WHERE "id" = $1`,
		id, userID, queueID, now,
	)
	return err
}

func (r *TicketRepository) UpdateLastMessage(ctx context.Context, id uuid.UUID, lastMessage string, incrementUnread bool) error {
	now := time.Now()
	query := `UPDATE "onWappTicket" SET "lastMessage" = $2, "updatedAt" = $3`
	if incrementUnread {
		query += `, "unreadCount" = "unreadCount" + 1`
	}
	query += ` WHERE "id" = $1`

	_, err := r.pool.Exec(ctx, query, id, lastMessage, now)
	return err
}

func (r *TicketRepository) ResetUnreadCount(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappTicket" SET "unreadCount" = 0, "updatedAt" = $2
		WHERE "id" = $1`,
		id, now,
	)
	return err
}

func (r *TicketRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "onWappTicket" WHERE "id" = $1`, id)
	return err
}

func (r *TicketRepository) GetStats(ctx context.Context, sessionID *uuid.UUID) (map[string]int, error) {
	query := `
		SELECT 
			COUNT(*) FILTER (WHERE "status" = 'pending') as pending,
			COUNT(*) FILTER (WHERE "status" = 'open') as open,
			COUNT(*) FILTER (WHERE "status" = 'closed') as closed,
			COUNT(*) as total
		FROM "onWappTicket"`

	args := []any{}
	if sessionID != nil {
		query += ` WHERE "sessionId" = $1`
		args = append(args, *sessionID)
	}

	var pending, open, closed, total int
	err := r.pool.QueryRow(ctx, query, args...).Scan(&pending, &open, &closed, &total)
	if err != nil {
		return nil, err
	}

	return map[string]int{
		"pending": pending,
		"open":    open,
		"closed":  closed,
		"total":   total,
	}, nil
}
