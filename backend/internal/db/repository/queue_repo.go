package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/seu-usuario/onwapp/internal/models"
)

type QueueRepository struct {
	db *pgx.Conn
}

func NewQueueRepository(db *pgx.Conn) *QueueRepository {
	return &QueueRepository{db: db}
}

func (r *QueueRepository) Create(ctx context.Context, queue *models.Queue) error {
	query := `
		INSERT INTO queues (id, tenant_id, name, color, greeting_message, order_num, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	
	_, err := r.db.Exec(ctx, query,
		queue.ID,
		queue.TenantID,
		queue.Name,
		queue.Color,
		queue.GreetingMessage,
		queue.OrderNum,
		time.Now(),
	)
	
	return err
}

func (r *QueueRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Queue, error) {
	query := `
		SELECT id, tenant_id, name, color, greeting_message, order_num, created_at
		FROM queues
		WHERE id = $1
	`
	
	var queue models.Queue
	err := r.db.QueryRow(ctx, query, id).Scan(
		&queue.ID,
		&queue.TenantID,
		&queue.Name,
		&queue.Color,
		&queue.GreetingMessage,
		&queue.OrderNum,
		&queue.CreatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return &queue, nil
}

func (r *QueueRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.Queue, error) {
	query := `
		SELECT id, tenant_id, name, color, greeting_message, order_num, created_at
		FROM queues
		WHERE tenant_id = $1
		ORDER BY order_num, name
	`
	
	rows, err := r.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var queues []models.Queue
	for rows.Next() {
		var queue models.Queue
		if err := rows.Scan(
			&queue.ID,
			&queue.TenantID,
			&queue.Name,
			&queue.Color,
			&queue.GreetingMessage,
			&queue.OrderNum,
			&queue.CreatedAt,
		); err != nil {
			return nil, err
		}
		queues = append(queues, queue)
	}
	
	return queues, nil
}

func (r *QueueRepository) Update(ctx context.Context, queue *models.Queue) error {
	query := `
		UPDATE queues
		SET name = $1, color = $2, greeting_message = $3, order_num = $4
		WHERE id = $5
	`
	
	_, err := r.db.Exec(ctx, query,
		queue.Name,
		queue.Color,
		queue.GreetingMessage,
		queue.OrderNum,
		queue.ID,
	)
	
	return err
}

func (r *QueueRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM queues WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
