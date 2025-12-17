package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/seu-usuario/onwapp/internal/models"
)

type ContactRepository struct {
	db *pgx.Conn
}

func NewContactRepository(db *pgx.Conn) *ContactRepository {
	return &ContactRepository{db: db}
}

func (r *ContactRepository) Create(ctx context.Context, contact *models.Contact) error {
	query := `
		INSERT INTO contacts (id, tenant_id, whatsapp_id, name, phone_number, profile_pic_url, is_group, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	
	_, err := r.db.Exec(ctx, query,
		contact.ID,
		contact.TenantID,
		contact.WhatsAppID,
		contact.Name,
		contact.PhoneNumber,
		contact.ProfilePicURL,
		contact.IsGroup,
		time.Now(),
		time.Now(),
	)
	
	return err
}

func (r *ContactRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Contact, error) {
	query := `
		SELECT id, tenant_id, whatsapp_id, name, phone_number, profile_pic_url, is_group, created_at, updated_at
		FROM contacts
		WHERE id = $1
	`
	
	var contact models.Contact
	err := r.db.QueryRow(ctx, query, id).Scan(
		&contact.ID,
		&contact.TenantID,
		&contact.WhatsAppID,
		&contact.Name,
		&contact.PhoneNumber,
		&contact.ProfilePicURL,
		&contact.IsGroup,
		&contact.CreatedAt,
		&contact.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &contact, nil
}

func (r *ContactRepository) FindByPhoneNumber(ctx context.Context, tenantID uuid.UUID, phoneNumber string) (*models.Contact, error) {
	query := `
		SELECT id, tenant_id, whatsapp_id, name, phone_number, profile_pic_url, is_group, created_at, updated_at
		FROM contacts
		WHERE tenant_id = $1 AND phone_number = $2
	`
	
	var contact models.Contact
	err := r.db.QueryRow(ctx, query, tenantID, phoneNumber).Scan(
		&contact.ID,
		&contact.TenantID,
		&contact.WhatsAppID,
		&contact.Name,
		&contact.PhoneNumber,
		&contact.ProfilePicURL,
		&contact.IsGroup,
		&contact.CreatedAt,
		&contact.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &contact, nil
}

func (r *ContactRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.Contact, error) {
	query := `
		SELECT id, tenant_id, whatsapp_id, name, phone_number, profile_pic_url, is_group, created_at, updated_at
		FROM contacts
		WHERE tenant_id = $1
		ORDER BY name
	`
	
	rows, err := r.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var contacts []models.Contact
	for rows.Next() {
		var contact models.Contact
		if err := rows.Scan(
			&contact.ID,
			&contact.TenantID,
			&contact.WhatsAppID,
			&contact.Name,
			&contact.PhoneNumber,
			&contact.ProfilePicURL,
			&contact.IsGroup,
			&contact.CreatedAt,
			&contact.UpdatedAt,
		); err != nil {
			return nil, err
		}
		contacts = append(contacts, contact)
	}
	
	return contacts, nil
}

func (r *ContactRepository) Update(ctx context.Context, contact *models.Contact) error {
	query := `
		UPDATE contacts
		SET whatsapp_id = $1, name = $2, phone_number = $3, profile_pic_url = $4, is_group = $5, updated_at = $6
		WHERE id = $7
	`
	
	_, err := r.db.Exec(ctx, query,
		contact.WhatsAppID,
		contact.Name,
		contact.PhoneNumber,
		contact.ProfilePicURL,
		contact.IsGroup,
		time.Now(),
		contact.ID,
	)
	
	return err
}

func (r *ContactRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM contacts WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
