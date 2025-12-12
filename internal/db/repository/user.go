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

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) Create(ctx context.Context, u *model.User) error {
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now

	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO "onWappUser" ("id", "name", "email", "passwordHash", "profile", "online", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		u.ID, u.Name, u.Email, u.PasswordHash, u.Profile, u.Online, u.CreatedAt, u.UpdatedAt,
	)
	return err
}

func (r *UserRepository) Update(ctx context.Context, u *model.User) error {
	u.UpdatedAt = time.Now()

	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappUser" SET "name" = $2, "email" = $3, "profile" = $4, "online" = $5, "updatedAt" = $6
		WHERE "id" = $1`,
		u.ID, u.Name, u.Email, u.Profile, u.Online, u.UpdatedAt,
	)
	return err
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappUser" SET "passwordHash" = $2, "updatedAt" = $3
		WHERE "id" = $1`,
		id, passwordHash, now,
	)
	return err
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	u := &model.User{}
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "name", "email", "passwordHash", "profile", "online", "createdAt", "updatedAt"
		FROM "onWappUser" WHERE "id" = $1`,
		id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Profile, &u.Online, &u.CreatedAt, &u.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return u, err
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	u := &model.User{}
	err := r.pool.QueryRow(ctx, `
		SELECT "id", "name", "email", "passwordHash", "profile", "online", "createdAt", "updatedAt"
		FROM "onWappUser" WHERE "email" = $1`,
		email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Profile, &u.Online, &u.CreatedAt, &u.UpdatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return u, err
}

func (r *UserRepository) List(ctx context.Context) ([]*model.User, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT "id", "name", "email", "passwordHash", "profile", "online", "createdAt", "updatedAt"
		FROM "onWappUser"
		ORDER BY "name"`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]*model.User, 0)
	for rows.Next() {
		u := &model.User{}
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Profile, &u.Online, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, rows.Err()
}

func (r *UserRepository) ListWithQueues(ctx context.Context) ([]*model.User, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT u."id", u."name", u."email", u."passwordHash", u."profile", u."online", u."createdAt", u."updatedAt"
		FROM "onWappUser" u
		ORDER BY u."name"`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]*model.User, 0)
	for rows.Next() {
		u := &model.User{}
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Profile, &u.Online, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	queueRows, err := r.pool.Query(ctx, `
		SELECT uq."userId", q."id", q."name", q."color"
		FROM "onWappUserQueue" uq
		INNER JOIN "onWappQueue" q ON q."id" = uq."queueId"
		ORDER BY q."name"`)
	if err != nil {
		return nil, err
	}
	defer queueRows.Close()

	userQueues := make(map[uuid.UUID][]model.Queue)
	for queueRows.Next() {
		var userID, queueID uuid.UUID
		var name, color string
		if err := queueRows.Scan(&userID, &queueID, &name, &color); err != nil {
			return nil, err
		}
		userQueues[userID] = append(userQueues[userID], model.Queue{ID: queueID, Name: name, Color: color})
	}

	for _, u := range users {
		if queues, ok := userQueues[u.ID]; ok {
			u.Queues = queues
		}
	}

	return users, nil
}

func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "onWappUser" WHERE "id" = $1`, id)
	return err
}

func (r *UserRepository) SetOnline(ctx context.Context, id uuid.UUID, online bool) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onWappUser" SET "online" = $2, "updatedAt" = $3
		WHERE "id" = $1`,
		id, online, now,
	)
	return err
}

func (r *UserRepository) CountByProfile(ctx context.Context, profile model.UserProfile) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM "onWappUser" WHERE "profile" = $1`, profile).Scan(&count)
	return count, err
}
