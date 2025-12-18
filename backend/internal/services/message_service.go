package services

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"onwapp/internal/db/repository"
	"onwapp/internal/models"
)

type MessageService struct {
	repo       *repository.MessageRepository
	ticketRepo *repository.TicketRepository
	db         *pgx.Conn
}

func NewMessageService(db *pgx.Conn) *MessageService {
	return &MessageService{
		repo:       repository.NewMessageRepository(db),
		ticketRepo: repository.NewTicketRepository(db),
		db:         db,
	}
}

func (s *MessageService) SendMessage(ctx context.Context, req *models.CreateMessageRequest, tenantID uuid.UUID) (*models.Message, error) {
	// Validate ticket belongs to tenant
	ticket, err := s.ticketRepo.FindByID(ctx, req.TicketID)
	if err != nil {
		return nil, errors.New("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return nil, errors.New("access denied")
	}

	msg := &models.Message{
		ID:            uuid.New(),
		TicketID:      req.TicketID,
		WhatsAppMsgID: req.WhatsAppMsgID,
		Body:          req.Body,
		MediaURL:      req.MediaURL,
		MediaType:     req.MediaType,
		FromMe:        req.FromMe,
		IsRead:        false,
		Ack:           0,
		CreatedAt:     time.Now(),
	}

	if err := s.repo.Create(ctx, msg); err != nil {
		return nil, err
	}

	// Update ticket last_message_at and unread_messages
	ticket.LastMessageAt = &msg.CreatedAt
	ticket.UnreadMessages = !msg.FromMe // Se não for de mim, tem mensagem não lida
	s.ticketRepo.Update(ctx, ticket)

	return msg, nil
}

func (s *MessageService) GetTicketMessages(ctx context.Context, ticketID uuid.UUID, tenantID uuid.UUID) ([]models.Message, error) {
	// Validate tenant access
	ticket, err := s.ticketRepo.FindByID(ctx, ticketID)
	if err != nil {
		return nil, errors.New("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return nil, errors.New("access denied")
	}

	return s.repo.FindByTicket(ctx, ticketID)
}

func (s *MessageService) ListMessages(ctx context.Context, tenantID uuid.UUID, limit int) ([]models.Message, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	return s.repo.ListByTenant(ctx, tenantID, limit)
}

func (s *MessageService) MarkAsRead(ctx context.Context, msgID uuid.UUID, tenantID uuid.UUID) error {
	// For now, just mark as read
	// In future, validate message belongs to tenant
	return s.repo.MarkAsRead(ctx, msgID)
}
