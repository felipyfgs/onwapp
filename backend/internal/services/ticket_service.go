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

type TicketService struct {
	repo      *repository.TicketRepository
	contactRepo *repository.ContactRepository
	db        *pgx.Conn
}

func NewTicketService(db *pgx.Conn) *TicketService {
	return &TicketService{
		repo:        repository.NewTicketRepository(db),
		contactRepo: repository.NewContactRepository(db),
		db:          db,
	}
}

func (s *TicketService) CreateTicket(ctx context.Context, req *models.CreateTicketRequest, tenantID uuid.UUID) (*models.Ticket, error) {
	ticket := &models.Ticket{
		ID:             uuid.New(),
		TenantID:       tenantID,
		ContactID:      req.ContactID,
		QueueID:        &req.QueueID,
		UserID:         nil,
		SessionID:      req.SessionID,
		Status:         "open",
		UnreadMessages: false,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.repo.Create(ctx, ticket); err != nil {
		return nil, err
	}

	return ticket, nil
}

func (s *TicketService) GetTicketsByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.Ticket, error) {
	return s.repo.FindByTenant(ctx, tenantID)
}

func (s *TicketService) GetTicketByID(ctx context.Context, id uuid.UUID) (*models.Ticket, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *TicketService) UpdateTicket(ctx context.Context, id uuid.UUID, req *models.Ticket) (*models.Ticket, error) {
	ticket, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Update fields
	ticket.Status = req.Status
	ticket.UnreadMessages = req.UnreadMessages
	ticket.LastMessageAt = req.LastMessageAt
	ticket.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, ticket); err != nil {
		return nil, err
	}

	return ticket, nil
}

func (s *TicketService) DeleteTicket(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *TicketService) CloseTicket(ctx context.Context, id uuid.UUID) (*models.Ticket, error) {
	ticket, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	ticket.Status = "closed"
	ticket.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, ticket); err != nil {
		return nil, err
	}

	return ticket, nil
}

func (s *TicketService) GetTicketWithMessages(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*models.TicketWithMessages, error) {
	ticket, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return nil, errors.New("access denied")
	}

	// Get messages
	msgRepo := repository.NewMessageRepository(s.db)
	messages, err := msgRepo.FindByTicket(ctx, id)
	if err != nil {
		return nil, err
	}

	// Get contact
	contact, err := s.contactRepo.FindByID(ctx, ticket.ContactID)
	if err != nil {
		return nil, err
	}

	return &models.TicketWithMessages{
		Ticket:   ticket,
		Messages: messages,
		Contact:  contact,
	}, nil
}

func (s *TicketService) AssignToUser(ctx context.Context, ticketID uuid.UUID, userID uuid.UUID, tenantID uuid.UUID) (*models.Ticket, error) {
	ticket, err := s.repo.FindByID(ctx, ticketID)
	if err != nil {
		return nil, errors.New("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return nil, errors.New("access denied")
	}

	ticket.UserID = &userID
	ticket.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, ticket); err != nil {
		return nil, err
	}

	return ticket, nil
}

func (s *TicketService) TransferToQueue(ctx context.Context, ticketID uuid.UUID, queueID uuid.UUID, tenantID uuid.UUID) (*models.Ticket, error) {
	ticket, err := s.repo.FindByID(ctx, ticketID)
	if err != nil {
		return nil, errors.New("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return nil, errors.New("access denied")
	}

	ticket.QueueID = &queueID
	ticket.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, ticket); err != nil {
		return nil, err
	}

	return ticket, nil
}

func (s *TicketService) GetOpenTicketByContact(ctx context.Context, contactID uuid.UUID, tenantID uuid.UUID) (*models.Ticket, error) {
	tickets, err := s.repo.FindByTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	for _, t := range tickets {
		if t.ContactID == contactID && t.Status == "open" {
			return &t, nil
		}
	}

	return nil, errors.New("no open ticket found")
}
