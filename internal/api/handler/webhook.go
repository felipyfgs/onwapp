package handler

import (
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/db"
	"zpwoot/internal/service"
)

type WebhookHandler struct {
	webhookService *service.WebhookService
	sessions       *db.Database
}

func NewWebhookHandler(webhookService *service.WebhookService, database *db.Database) *WebhookHandler {
	return &WebhookHandler{
		webhookService: webhookService,
		sessions:       database,
	}
}

// CreateWebhook godoc
// @Summary Create webhook
// @Description Create a new webhook for a session
// @Tags webhook
// @Accept json
// @Produce json
// @Param name path string true "Session name"
// @Param request body dto.CreateWebhookRequest true "Webhook data"
// @Success 200 {object} dto.WebhookResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhook [post]
func (h *WebhookHandler) CreateWebhook(c *gin.Context) {
	name := c.Param("name")

	var req dto.CreateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Validate URL format
	parsedURL, err := url.ParseRequestURI(req.URL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid webhook URL: must be a valid http or https URL"})
		return
	}

	// Get session to find ID
	session, err := h.sessions.Sessions.GetByName(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	id, err := h.webhookService.Create(c.Request.Context(), session.ID, req.URL, req.Events, req.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.WebhookResponse{
		ID:        id,
		SessionID: session.ID,
		URL:       req.URL,
		Events:    req.Events,
		Enabled:   true,
	})
}

// ListWebhooks godoc
// @Summary List webhooks
// @Description List all webhooks for a session
// @Tags webhook
// @Produce json
// @Param name path string true "Session name"
// @Success 200 {array} dto.WebhookResponse
// @Failure 404 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhook [get]
func (h *WebhookHandler) ListWebhooks(c *gin.Context) {
	name := c.Param("name")

	session, err := h.sessions.Sessions.GetByName(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	webhooks, err := h.webhookService.GetBySession(c.Request.Context(), session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.WebhookResponse, 0, len(webhooks))
	for _, wh := range webhooks {
		response = append(response, dto.WebhookResponse{
			ID:        wh.ID,
			SessionID: wh.SessionID,
			URL:       wh.URL,
			Events:    wh.Events,
			Enabled:   wh.Enabled,
		})
	}

	c.JSON(http.StatusOK, response)
}

// UpdateWebhook godoc
// @Summary Update webhook
// @Description Update an existing webhook
// @Tags webhook
// @Accept json
// @Produce json
// @Param name path string true "Session name"
// @Param id path string true "Webhook ID (UUID)"
// @Param request body dto.UpdateWebhookRequest true "Webhook data"
// @Success 200 {object} dto.MessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhook/{id} [put]
func (h *WebhookHandler) UpdateWebhook(c *gin.Context) {
	var req dto.UpdateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Validate URL format
	parsedURL, err := url.ParseRequestURI(req.URL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid webhook URL: must be a valid http or https URL"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid webhook id"})
		return
	}

	if err := h.webhookService.Update(c.Request.Context(), id, req.URL, req.Events, req.Enabled, req.Secret); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "webhook updated"})
}

// DeleteWebhook godoc
// @Summary Delete webhook
// @Description Delete a webhook
// @Tags webhook
// @Produce json
// @Param name path string true "Session name"
// @Param id path string true "Webhook ID (UUID)"
// @Success 200 {object} dto.MessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhook/{id} [delete]
func (h *WebhookHandler) DeleteWebhook(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid webhook id"})
		return
	}

	if err := h.webhookService.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "webhook deleted"})
}
