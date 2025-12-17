package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/seu-usuario/onwapp/internal/models"
	"github.com/seu-usuario/onwapp/internal/db/repository"
)

type TenantService struct {
	repo *repository.TenantRepository
}

func NewTenantService(db *pgx.Conn) *TenantService {
	return &TenantService{
		repo: repository.NewTenantRepository(db),
	}
}

func (s *TenantService) CreateTenant(ctx context.Context, req *models.CreateTenantRequest) (*models.Tenant, error) {
	tenant := &models.Tenant{
		ID:     uuid.New(),
		Name:   req.Name,
		Slug:   req.Slug,
		Active: req.Active,
	}

	if err := s.repo.Create(ctx, tenant); err != nil {
		return nil, err
	}

	return tenant, nil
}

func (s *TenantService) GetTenantByID(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *TenantService) GetTenantBySlug(ctx context.Context, slug string) (*models.Tenant, error) {
	return s.repo.FindBySlug(ctx, slug)
}

func (s *TenantService) ListTenants(ctx context.Context) ([]models.Tenant, error) {
	return s.repo.List(ctx)
}

func (s *TenantService) UpdateTenant(ctx context.Context, id uuid.UUID, req *models.UpdateTenantRequest) (*models.Tenant, error) {
	tenant, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	tenant.Name = req.Name
	tenant.Slug = req.Slug
	tenant.Active = req.Active

	if err := s.repo.Update(ctx, tenant); err != nil {
		return nil, err
	}

	return tenant, nil
}

func (s *TenantService) DeleteTenant(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
