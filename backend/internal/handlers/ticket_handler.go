package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"onwapp/internal/models"
	"onwapp/internal/services"
	"onwapp/pkg/validator"
)

type TicketHandler struct {
	service *services.TicketService
}

func NewTicketHandler(service *services.TicketService) *TicketHandler {
	return &TicketHandler{service: service}
}

func (h *TicketHandler) CreateTicket(c *fiber.Ctx) error {
	var req models.CreateTicketRequest
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
	ticket, err := h.service.CreateTicket(c.Context(), &req, tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create ticket",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(ticket)
}

func (h *TicketHandler) ListTickets(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	tickets, err := h.service.GetTicketsByTenant(c.Context(), tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to list tickets",
		})
	}

	return c.JSON(tickets)
}

func (h *TicketHandler) GetTicket(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ticket ID",
		})
	}

	ticket, err := h.service.GetTicketByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ticket not found",
		})
	}

	return c.JSON(ticket)
}

func (h *TicketHandler) UpdateTicket(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ticket ID",
		})
	}

	var req models.Ticket
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	ticket, err := h.service.UpdateTicket(c.Context(), id, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update ticket",
		})
	}

	return c.JSON(ticket)
}

func (h *TicketHandler) DeleteTicket(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ticket ID",
		})
	}

	if err := h.service.DeleteTicket(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete ticket",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *TicketHandler) CloseTicket(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ticket ID",
		})
	}

	ticket, err := h.service.CloseTicket(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to close ticket",
		})
	}

	return c.JSON(ticket)
}

func (h *TicketHandler) GetTicketWithMessages(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ticket ID",
		})
	}

	tenantID := c.Locals("tenant_id").(uuid.UUID)
	ticketData, err := h.service.GetTicketWithMessages(c.Context(), id, tenantID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(ticketData)
}

func (h *TicketHandler) AssignTicket(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ticket ID",
		})
	}

	var req models.AssignTicketRequest
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
	ticket, err := h.service.AssignToUser(c.Context(), id, req.UserID, tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(ticket)
}

func (h *TicketHandler) TransferTicket(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ticket ID",
		})
	}

	var req models.TransferTicketRequest
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
	ticket, err := h.service.TransferToQueue(c.Context(), id, req.QueueID, tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(ticket)
}
