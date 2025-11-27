package handler

import (
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/db"
	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

type WebhookHandler struct {
	webhookService *service.WebhookService
	database       *db.Database
}

func NewWebhookHandler(webhookService *service.WebhookService, database *db.Database) *WebhookHandler {
	return &WebhookHandler{
		webhookService: webhookService,
		database:       database,
	}
}

// GetWebhook godoc
// @Summary Get webhook
// @Description Get the webhook configuration for a session
// @Tags webhook
// @Produce json
// @Param name path string true "Session name"
// @Success 200 {object} dto.WebhookResponse
// @Failure 404 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhook [get]
func (h *WebhookHandler) GetWebhook(c *gin.Context) {
	name := c.Param("name")

	session, err := h.database.Sessions.GetByName(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	webhook, err := h.webhookService.GetBySession(c.Request.Context(), session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if webhook == nil {
		c.JSON(http.StatusOK, dto.WebhookResponse{
			SessionID: session.ID,
			Enabled:   false,
		})
		return
	}

	c.JSON(http.StatusOK, dto.WebhookResponse{
		ID:        webhook.ID,
		SessionID: webhook.SessionID,
		URL:       webhook.URL,
		Events:    webhook.Events,
		Enabled:   webhook.Enabled,
	})
}

// SetWebhook godoc
// @Summary Set webhook
// @Description Set or update the webhook configuration for a session (one webhook per session)
// @Tags webhook
// @Accept json
// @Produce json
// @Param name path string true "Session name"
// @Param request body dto.SetWebhookRequest true "Webhook configuration"
// @Success 200 {object} dto.WebhookResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhook [post]
func (h *WebhookHandler) SetWebhook(c *gin.Context) {
	name := c.Param("name")

	var req dto.SetWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Validate URL format if provided
	if req.URL != "" {
		parsedURL, err := url.ParseRequestURI(req.URL)
		if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid webhook URL: must be a valid http or https URL"})
			return
		}
	}

	session, err := h.database.Sessions.GetByName(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	webhook, err := h.webhookService.Set(c.Request.Context(), session.ID, req.URL, req.Events, req.Enabled, req.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.WebhookResponse{
		ID:        webhook.ID,
		SessionID: webhook.SessionID,
		URL:       webhook.URL,
		Events:    webhook.Events,
		Enabled:   webhook.Enabled,
	})
}

// GetEvents godoc
// @Summary List available webhook events
// @Description Get a list of all available webhook event types organized by category
// @Tags webhook
// @Produce json
// @Success 200 {object} dto.EventsResponse
// @Security ApiKeyAuth
// @Router /events [get]
func (h *WebhookHandler) GetEvents(c *gin.Context) {
	categories := make(map[string][]string)
	for cat, evts := range model.EventCategories {
		eventStrings := make([]string, len(evts))
		for i, e := range evts {
			eventStrings[i] = string(e)
		}
		categories[cat] = eventStrings
	}

	allEvents := model.AllEvents()
	all := make([]string, len(allEvents))
	for i, e := range allEvents {
		all[i] = string(e)
	}

	c.JSON(http.StatusOK, dto.EventsResponse{
		Categories: categories,
		All:        all,
	})
}
