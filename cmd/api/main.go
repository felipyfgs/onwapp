package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/handler"
	"zpwoot/internal/session"
)

func main() {
	ctx := context.Background()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://zpwoot:zpwoot123@localhost:5432/zpwoot?sslmode=disable"
	}

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	manager := session.NewManager(pool)
	if err := manager.Init(ctx); err != nil {
		log.Fatalf("failed to initialize session manager: %v", err)
	}

	h := handler.NewSessionHandler(manager)

	r := gin.Default()

	sessions := r.Group("/sessions")
	{
		sessions.POST("/:name", h.Create)
		sessions.DELETE("/:name", h.Delete)
		sessions.GET("/:name", h.Info)
		sessions.POST("/:name/connect", h.Connect)
		sessions.POST("/:name/logout", h.Logout)
		sessions.POST("/:name/restart", h.Restart)
		sessions.GET("/:name/qr", h.QR)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
