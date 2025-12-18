package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"onwapp/internal/models"
	"onwapp/internal/services"
	"onwapp/pkg/validator"
)

type QueueHandler struct {
	service *services.QueueService
}

func NewQueueHandler(service *services.QueueService) *QueueHandler {
	return &QueueHandler{service: service}
}

func (h *QueueHandler) RegisterRoutes(router fiber.Router) {
	r := router.Group("/queues")
	
	r.Get("", h.ListQueues)
	r.Post("", h.CreateQueue)
	r.Get("/:id", h.GetQueue)
	r.Put("/:id", h.UpdateQueue)
	r.Delete("/:id", h.DeleteQueue)
}

func (h *QueueHandler) CreateQueue(c *fiber.Ctx) error {
	var req models.CreateQueueRequest
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
	queue, err := h.service.CreateQueue(c.Context(), &req, tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create queue",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(queue)
}

func (h *QueueHandler) ListQueues(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uuid.UUID)
	queues, err := h.service.GetQueuesByTenant(c.Context(), tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to list queues",
		})
	}

	return c.JSON(queues)
}

func (h *QueueHandler) GetQueue(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid queue ID",
		})
	}

	queue, err := h.service.GetQueueByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Queue not found",
		})
	}

	return c.JSON(queue)
}

func (h *QueueHandler) UpdateQueue(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid queue ID",
		})
	}

	var req models.CreateQueueRequest
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

	queue, err := h.service.UpdateQueue(c.Context(), id, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update queue",
		})
	}

	return c.JSON(queue)
}

func (h *QueueHandler) DeleteQueue(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid queue ID",
		})
	}

	if err := h.service.DeleteQueue(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete queue",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
