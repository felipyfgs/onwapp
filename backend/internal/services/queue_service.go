package services

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"onwapp/internal/db/repository"
	"onwapp/internal/models"
)

type QueueService struct {
	repo *repository.QueueRepository
	db   *pgx.Conn
}

func NewQueueService(db *pgx.Conn) *QueueService {
	return &QueueService{
		repo: repository.NewQueueRepository(db),
		db:   db,
	}
}

func (s *QueueService) CreateQueue(ctx context.Context, req *models.CreateQueueRequest, tenantID uuid.UUID) (*models.Queue, error) {
	queue := &models.Queue{
		ID:             uuid.New(),
		TenantID:       tenantID,
		Name:           req.Name,
		Color:          req.Color,
		GreetingMessage: req.GreetingMessage,
		OrderNum:       req.OrderNum,
		CreatedAt:      time.Now(),
	}

	if err := s.repo.Create(ctx, queue); err != nil {
		return nil, err
	}

	return queue, nil
}

func (s *QueueService) GetQueuesByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.Queue, error) {
	return s.repo.ListByTenant(ctx, tenantID)
}

func (s *QueueService) GetQueueByID(ctx context.Context, id uuid.UUID) (*models.Queue, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *QueueService) UpdateQueue(ctx context.Context, id uuid.UUID, req *models.CreateQueueRequest) (*models.Queue, error) {
	queue, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	queue.Name = req.Name
	queue.Color = req.Color
	queue.GreetingMessage = req.GreetingMessage
	queue.OrderNum = req.OrderNum

	if err := s.repo.Update(ctx, queue); err != nil {
		return nil, err
	}

	return queue, nil
}

func (s *QueueService) DeleteQueue(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
