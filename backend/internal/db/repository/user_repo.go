package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/seu-usuario/onwapp/internal/models"
)

type UserRepository struct {
	db *pgx.Conn
}

func NewUserRepository(db *pgx.Conn) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, tenant_id, name, email, password_hash, role, online, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	
	_, err := r.db.Exec(ctx, query,
		user.ID,
		user.TenantID,
		user.Name,
		user.Email,
		user.PasswordHash,
		user.Role,
		user.Online,
		time.Now(),
		time.Now(),
	)
	
	return err
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, tenant_id, name, email, password_hash, role, online, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	
	var user models.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.TenantID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.Online,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, tenant_id, name, email, password_hash, role, online, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	
	var user models.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.TenantID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.Online,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}

func (r *UserRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.User, error) {
	query := `
		SELECT id, tenant_id, name, email, password_hash, role, online, created_at, updated_at
		FROM users
		WHERE tenant_id = $1
		ORDER BY name
	`
	
	rows, err := r.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(
			&user.ID,
			&user.TenantID,
			&user.Name,
			&user.Email,
			&user.PasswordHash,
			&user.Role,
			&user.Online,
			&user.CreatedAt,
			&user.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	
	return users, nil
}

func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users
		SET name = $1, email = $2, password_hash = $3, role = $4, online = $5, updated_at = $6
		WHERE id = $7
	`
	
	_, err := r.db.Exec(ctx, query,
		user.Name,
		user.Email,
		user.PasswordHash,
		user.Role,
		user.Online,
		time.Now(),
		user.ID,
	)
	
	return err
}

func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
