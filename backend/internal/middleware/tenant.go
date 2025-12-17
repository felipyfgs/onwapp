package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"onwapp/internal/services"
)

func TenantMiddleware(tenantService *services.TenantService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get tenant ID from context (set by auth middleware)
		tenantID, ok := c.Locals("tenantID").(uuid.UUID)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Tenant ID not found in context",
			})
		}

		// Verify tenant exists and is active
		tenant, err := tenantService.GetTenantByID(c.Context(), tenantID)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Tenant not found",
			})
		}

		if !tenant.Active {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Tenant is inactive",
			})
		}

		// Set tenant in context
		c.Locals("tenant", tenant)

		return c.Next()
	}
}
