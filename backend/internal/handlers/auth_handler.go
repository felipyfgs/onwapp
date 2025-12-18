package handlers

import (
	"context"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"onwapp/internal/models"
	"onwapp/internal/services"
	"onwapp/internal/db/repository"
	"onwapp/pkg/validator"
)

type AuthHandler struct {
	service *services.AuthService
	db      *pgx.Conn
}

func NewAuthHandler(service *services.AuthService, db *pgx.Conn) *AuthHandler {
	return &AuthHandler{
		service: service,
		db:      db,
	}
}

func (h *AuthHandler) RegisterRoutes(router fiber.Router) {
	r := router.Group("/auth")
	
	r.Post("/register", h.Register)
	r.Post("/login", h.Login)
	r.Post("/validate", h.ValidateToken)
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req models.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := validator.Validate.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Get or create default tenant
	tenantID, err := h.getOrCreateDefaultTenant(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get tenant",
		})
	}

	user, err := h.service.Register(c.Context(), &req, tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Generate token for the new user
	_, token, err := h.service.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "User created but failed to generate token",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"user":  user,
		"token": token,
	})
}

func (h *AuthHandler) getOrCreateDefaultTenant(ctx context.Context) (uuid.UUID, error) {
	// Try to find existing default tenant
	tenantRepo := repository.NewTenantRepository(h.db)
	
	// For now, let's use a fixed tenant ID for the default tenant
	defaultTenantID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	
	// Check if tenant exists
	_, err := tenantRepo.FindByID(ctx, defaultTenantID)
	if err == nil {
		// Tenant exists
		return defaultTenantID, nil
	}
	
	// Create default tenant
	tenant := &models.Tenant{
		ID:     defaultTenantID,
		Name:   "Default Tenant",
		Slug:   "default",
		Active: true,
	}
	
	if createErr := tenantRepo.Create(ctx, tenant); createErr != nil {
		return uuid.Nil, createErr
	}
	
	return defaultTenantID, nil
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=8"`
	}
	
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := validator.Validate.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	user, token, err := h.service.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"user":  user,
		"token": token,
	})
}

func (h *AuthHandler) ValidateToken(c *fiber.Ctx) error {
	tokenString := c.Get("Authorization")
	if tokenString == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authorization header missing",
		})
	}

	claims, err := h.service.ValidateToken(tokenString)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid token",
		})
	}

	return c.JSON(claims)
}