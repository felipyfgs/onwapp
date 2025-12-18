package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"onwapp/internal/models"
	"onwapp/internal/services"
	"onwapp/pkg/validator"
)

type MessageHandler struct {
	service *services.MessageService
}

func NewMessageHandler(service *services.MessageService) *MessageHandler {
	return &MessageHandler{service: service}
}

func (h *MessageHandler) SendMessage(c *fiber.Ctx) error {
	var req models.CreateMessageRequest
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
	msg, err := h.service.SendMessage(c.Context(), &req, tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(msg)
}

func (h *MessageHandler) ListMessages(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)

	// Parse limit query param
	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		parsed, err := strconv.Atoi(limitStr)
		if err == nil && parsed > 0 {
			limit = parsed
		}
	}

	messages, err := h.service.ListMessages(c.Context(), tenantID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to list messages",
		})
	}

	return c.JSON(messages)
}

func (h *MessageHandler) GetTicketMessages(c *fiber.Ctx) error {
	ticketID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ticket ID",
		})
	}

	tenantID := c.Locals("tenant_id").(uuid.UUID)
	messages, err := h.service.GetTicketMessages(c.Context(), ticketID, tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(messages)
}

func (h *MessageHandler) MarkAsRead(c *fiber.Ctx) error {
	msgID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	tenantID := c.Locals("tenant_id").(uuid.UUID)
	if err := h.service.MarkAsRead(c.Context(), msgID, tenantID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to mark message as read",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
