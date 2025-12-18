package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"onwapp/internal/models"
	"onwapp/internal/services"
	"onwapp/pkg/validator"
)

type ContactHandler struct {
	service *services.ContactService
}

func NewContactHandler(service *services.ContactService) *ContactHandler {
	return &ContactHandler{service: service}
}

func (h *ContactHandler) CreateContact(c *fiber.Ctx) error {
	var req models.CreateContactRequest
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
	contact, err := h.service.CreateContact(c.Context(), &req, tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create contact",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(contact)
}

func (h *ContactHandler) ListContacts(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	contacts, err := h.service.GetContactsByTenant(c.Context(), tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to list contacts",
		})
	}

	return c.JSON(contacts)
}

func (h *ContactHandler) GetContact(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid contact ID",
		})
	}

	contact, err := h.service.GetContactByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Contact not found",
		})
	}

	return c.JSON(contact)
}

func (h *ContactHandler) UpdateContact(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid contact ID",
		})
	}

	var req models.CreateContactRequest
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

	contact, err := h.service.UpdateContact(c.Context(), id, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update contact",
		})
	}

	return c.JSON(contact)
}

func (h *ContactHandler) DeleteContact(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid contact ID",
		})
	}

	if err := h.service.DeleteContact(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete contact",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *ContactHandler) SearchContacts(c *fiber.Ctx) error {
	query := c.Query("q")
	if query == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Query parameter 'q' is required",
		})
	}

	tenantID := c.Locals("tenant_id").(uuid.UUID)
	contacts, err := h.service.SearchContacts(c.Context(), tenantID, query)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to search contacts",
		})
	}

	return c.JSON(contacts)
}

func (h *ContactHandler) GetByWhatsAppID(c *fiber.Ctx) error {
	whatsappID := c.Params("waid")
	if whatsappID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "WhatsApp ID is required",
		})
	}

	tenantID := c.Locals("tenant_id").(uuid.UUID)
	contact, err := h.service.FindByWhatsAppID(c.Context(), whatsappID, tenantID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(contact)
}
