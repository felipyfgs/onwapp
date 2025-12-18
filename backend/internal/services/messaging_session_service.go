package services

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"onwapp/internal/db/repository"
	"onwapp/internal/models"
)

type MessagingSessionService struct {
	repo *repository.MessagingSessionRepository
	db   *pgx.Conn
}

func NewMessagingSessionService(db *pgx.Conn) *MessagingSessionService {
	return &MessagingSessionService{
		repo: repository.NewMessagingSessionRepository(db),
		db:   db,
	}
}

func (s *MessagingSessionService) CreateSession(ctx context.Context, req *models.CreateMessagingSessionRequest, tenantID uuid.UUID) (*models.MessagingSession, error) {
	session := &models.MessagingSession{
		ID:          uuid.New(),
		TenantID:    tenantID,
		Name:        req.Name,
		ChannelID:   req.ChannelID,
		Platform:    req.Platform,
		Status:      "disconnected",
		SessionData: []byte("{}"),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.repo.Create(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

func (s *MessagingSessionService) GetSessionsByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.MessagingSession, error) {
	return s.repo.FindByTenant(ctx, tenantID)
}

func (s *MessagingSessionService) GetSessionByID(ctx context.Context, id uuid.UUID) (*models.MessagingSession, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *MessagingSessionService) UpdateSession(ctx context.Context, id uuid.UUID, req *models.UpdateMessagingSessionRequest) (*models.MessagingSession, error) {
	session, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	session.Name = req.Name
	session.ChannelID = req.ChannelID
	session.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

func (s *MessagingSessionService) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *MessagingSessionService) ConnectSession(ctx context.Context, id uuid.UUID) error {
	session, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	session.Status = "connecting"
	session.LastSeen = &[]time.Time{time.Now()}[0]
	session.UpdatedAt = time.Now()

	return s.repo.Update(ctx, session)
}

func (s *MessagingSessionService) DisconnectSession(ctx context.Context, id uuid.UUID) error {
	session, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	session.Status = "disconnected"
	session.UpdatedAt = time.Now()

	return s.repo.Update(ctx, session)
}
