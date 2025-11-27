package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

type Database struct {
	Pool      *pgxpool.Pool
	Container *sqlstore.Container
}

func New(ctx context.Context, databaseURL string) (*Database, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	dbLog := waLog.Stdout("Database", "INFO", true)
	container, err := sqlstore.New(ctx, "pgx", databaseURL, dbLog)
	if err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to create sqlstore: %w", err)
	}

	return &Database{
		Pool:      pool,
		Container: container,
	}, nil
}

func (d *Database) Close() {
	d.Pool.Close()
}
