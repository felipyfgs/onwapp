package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"onwapp/internal/models"
	"onwapp/internal/services"
	"onwapp/pkg/validator"
)

type MessagingSessionHandler struct {
	service *services.MessagingSessionService
}

func NewMessagingSessionHandler(service *services.MessagingSessionService) *MessagingSessionHandler {
	return &MessagingSessionHandler{service: service}
}

func (h *MessagingSessionHandler) RegisterRoutes(router fiber.Router) {
	r := router.Group("/sessions")
	
	r.Get("", h.ListSessions)
	r.Post("", h.CreateSession)
	r.Get("/:id", h.GetSession)
	r.Put("/:id", h.UpdateSession)
	r.Delete("/:id", h.DeleteSession)
	r.Post("/:id/connect", h.ConnectSession)
	r.Post("/:id/disconnect", h.DisconnectSession)
}

func (h *MessagingSessionHandler) CreateSession(c *fiber.Ctx) error {
	var req models.CreateMessagingSessionRequest
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

	tenantID := c.Locals("tenant_id").(uuid.UUID)
	session, err := h.service.CreateSession(c.Context(), &req, tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create session",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(session)
}

func (h *MessagingSessionHandler) ListSessions(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	sessions, err := h.service.GetSessionsByTenant(c.Context(), tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to list sessions",
		})
	}

	return c.JSON(sessions)
}

func (h *MessagingSessionHandler) GetSession(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	session, err := h.service.GetSessionByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Session not found",
		})
	}

	return c.JSON(session)
}

func (h *MessagingSessionHandler) UpdateSession(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	var req models.UpdateMessagingSessionRequest
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

	session, err := h.service.UpdateSession(c.Context(), id, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update session",
		})
	}

	return c.JSON(session)
}

func (h *MessagingSessionHandler) DeleteSession(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	if err := h.service.DeleteSession(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete session",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MessagingSessionHandler) ConnectSession(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	if err := h.service.ConnectSession(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect session",
		})
	}

	// Aqui você pode iniciar a conexão real com WhatsApp via NATS ou websocket
	// Por enquanto, vamos retornar sucesso e simular a geração de QR code

	return c.JSON(fiber.Map{
		"message": "Session connecting",
		"qr_code_pending": true,
	})
}

func (h *MessagingSessionHandler) DisconnectSession(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	if err := h.service.DisconnectSession(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to disconnect session",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Session disconnected",
	})
}
