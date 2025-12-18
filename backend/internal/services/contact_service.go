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

type ContactService struct {
	repo *repository.ContactRepository
	db   *pgx.Conn
}

func NewContactService(db *pgx.Conn) *ContactService {
	return &ContactService{
		repo: repository.NewContactRepository(db),
		db:   db,
	}
}

func (s *ContactService) CreateContact(ctx context.Context, req *models.CreateContactRequest, tenantID uuid.UUID) (*models.Contact, error) {
	contact := &models.Contact{
		ID:            uuid.New(),
		TenantID:      tenantID,
		WhatsAppID:    req.WhatsAppID,
		Name:          req.Name,
		PhoneNumber:   req.PhoneNumber,
		ProfilePicURL: req.ProfilePicURL,
		IsGroup:       req.IsGroup,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.Create(ctx, contact); err != nil {
		return nil, err
	}

	return contact, nil
}

func (s *ContactService) GetContactsByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.Contact, error) {
	return s.repo.ListByTenant(ctx, tenantID)
}

func (s *ContactService) GetContactByID(ctx context.Context, id uuid.UUID) (*models.Contact, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *ContactService) UpdateContact(ctx context.Context, id uuid.UUID, req *models.CreateContactRequest) (*models.Contact, error) {
	contact, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	contact.Name = req.Name
	contact.WhatsAppID = req.WhatsAppID
	contact.PhoneNumber = req.PhoneNumber
	contact.ProfilePicURL = req.ProfilePicURL
	contact.IsGroup = req.IsGroup
	contact.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, contact); err != nil {
		return nil, err
	}

	return contact, nil
}

func (s *ContactService) DeleteContact(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *ContactService) FindByWhatsAppID(ctx context.Context, whatsappID string, tenantID uuid.UUID) (*models.Contact, error) {
	query := `
		SELECT id, tenant_id, whatsapp_id, name, phone_number, profile_pic_url, is_group, created_at, updated_at
		FROM contacts
		WHERE whatsapp_id = $1 AND tenant_id = $2
	`
	var contact models.Contact
	err := s.db.QueryRow(ctx, query, whatsappID, tenantID).Scan(
		&contact.ID, &contact.TenantID, &contact.WhatsAppID, &contact.Name,
		&contact.PhoneNumber, &contact.ProfilePicURL, &contact.IsGroup,
		&contact.CreatedAt, &contact.UpdatedAt,
	)
	if err != nil {
		return nil, errors.New("contact not found")
	}
	return &contact, nil
}

func (s *ContactService) SearchContacts(ctx context.Context, tenantID uuid.UUID, query string) ([]models.Contact, error) {
	searchQuery := `
		SELECT id, tenant_id, whatsapp_id, name, phone_number, profile_pic_url, is_group, created_at, updated_at
		FROM contacts
		WHERE tenant_id = $1 AND (name ILIKE $2 OR phone_number ILIKE $2)
		ORDER BY name
		LIMIT 50
	`
	rows, err := s.db.Query(ctx, searchQuery, tenantID, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []models.Contact
	for rows.Next() {
		var c models.Contact
		if err := rows.Scan(
			&c.ID, &c.TenantID, &c.WhatsAppID, &c.Name,
			&c.PhoneNumber, &c.ProfilePicURL, &c.IsGroup,
			&c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		contacts = append(contacts, c)
	}
	return contacts, nil
}
