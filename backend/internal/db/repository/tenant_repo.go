package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/seu-usuario/onwapp/internal/models"
)

type TenantRepository struct {
	db *pgx.Conn
}

func NewTenantRepository(db *pgx.Conn) *TenantRepository {
	return &TenantRepository{db: db}
}

func (r *TenantRepository) Create(ctx context.Context, tenant *models.Tenant) error {
	query := `
		INSERT INTO tenants (id, name, slug, active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	
	_, err := r.db.Exec(ctx, query,
		tenant.ID,
		tenant.Name,
		tenant.Slug,
		tenant.Active,
		time.Now(),
		time.Now(),
	)
	
	return err
}

func (r *TenantRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	query := `
		SELECT id, name, slug, active, created_at, updated_at
		FROM tenants
		WHERE id = $1
	`
	
	var tenant models.Tenant
	err := r.db.QueryRow(ctx, query, id).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Active,
		&tenant.CreatedAt,
		&tenant.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &tenant, nil
}

func (r *TenantRepository) FindBySlug(ctx context.Context, slug string) (*models.Tenant, error) {
	query := `
		SELECT id, name, slug, active, created_at, updated_at
		FROM tenants
		WHERE slug = $1
	`
	
	var tenant models.Tenant
	err := r.db.QueryRow(ctx, query, slug).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Active,
		&tenant.CreatedAt,
		&tenant.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &tenant, nil
}

func (r *TenantRepository) List(ctx context.Context) ([]models.Tenant, error) {
	query := `
		SELECT id, name, slug, active, created_at, updated_at
		FROM tenants
		ORDER BY name
	`
	
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var tenants []models.Tenant
	for rows.Next() {
		var tenant models.Tenant
		if err := rows.Scan(
			&tenant.ID,
			&tenant.Name,
			&tenant.Slug,
			&tenant.Active,
			&tenant.CreatedAt,
			&tenant.UpdatedAt,
		); err != nil {
			return nil, err
		}
		tenants = append(tenants, tenant)
	}
	
	return tenants, nil
}

func (r *TenantRepository) Update(ctx context.Context, tenant *models.Tenant) error {
	query := `
		UPDATE tenants
		SET name = $1, slug = $2, active = $3, updated_at = $4
		WHERE id = $5
	`
	
	_, err := r.db.Exec(ctx, query,
		tenant.Name,
		tenant.Slug,
		tenant.Active,
		time.Now(),
		tenant.ID,
	)
	
	return err
}

func (r *TenantRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM tenants WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
