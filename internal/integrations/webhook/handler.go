package webhook

import (
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

// Handler handles HTTP requests for Webhook integration
type Handler struct {
	service        *Service
	sessionService *service.SessionService
}

// NewHandler creates a new Webhook handler
func NewHandler(svc *Service, sessionSvc *service.SessionService) *Handler {
	return &Handler{
		service:        svc,
		sessionService: sessionSvc,
	}
}

// GetWebhookResponse represents the webhook response
type GetWebhookResponse struct {
	ID        string   `json:"id,omitempty"`
	SessionID string   `json:"sessionId"`
	URL       string   `json:"url,omitempty"`
	Events    []string `json:"events,omitempty"`
	Enabled   bool     `json:"enabled"`
}

// SetWebhookRequest represents the request to set a webhook
type SetWebhookRequest struct {
	URL     string   `json:"url"`
	Events  []string `json:"events"`
	Enabled bool     `json:"enabled"`
	Secret  string   `json:"secret,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// GetWebhook godoc
// @Summary Get webhook
// @Description Get the webhook configuration for a session
// @Tags webhook
// @Produce json
// @Param name path string true "Session name"
// @Success 200 {object} GetWebhookResponse
// @Failure 404 {object} ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhooks [get]
func (h *Handler) GetWebhook(c *gin.Context) {
	name := c.Param("name")

	session, err := h.sessionService.Get(name)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "session not found"})
		return
	}

	webhook, err := h.service.GetBySession(c.Request.Context(), session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	if webhook == nil {
		c.JSON(http.StatusOK, GetWebhookResponse{
			SessionID: session.ID,
			Enabled:   false,
		})
		return
	}

	c.JSON(http.StatusOK, GetWebhookResponse{
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
// @Param request body SetWebhookRequest true "Webhook configuration"
// @Success 200 {object} GetWebhookResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhooks [post]
func (h *Handler) SetWebhook(c *gin.Context) {
	name := c.Param("name")

	var req SetWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	if req.URL != "" {
		parsedURL, err := url.ParseRequestURI(req.URL)
		if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid webhook URL: must be a valid http or https URL"})
			return
		}
	}

	session, err := h.sessionService.Get(name)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "session not found"})
		return
	}

	webhook, err := h.service.Set(c.Request.Context(), session.ID, req.URL, req.Events, req.Enabled, req.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, GetWebhookResponse{
		ID:        webhook.ID,
		SessionID: webhook.SessionID,
		URL:       webhook.URL,
		Events:    webhook.Events,
		Enabled:   webhook.Enabled,
	})
}

// UpdateWebhook godoc
// @Summary Update webhook
// @Description Update an existing webhook configuration for a session
// @Tags webhook
// @Accept json
// @Produce json
// @Param name path string true "Session name"
// @Param request body SetWebhookRequest true "Webhook configuration"
// @Success 200 {object} GetWebhookResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhooks [put]
func (h *Handler) UpdateWebhook(c *gin.Context) {
	name := c.Param("name")

	var req SetWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	if req.URL != "" {
		parsedURL, err := url.ParseRequestURI(req.URL)
		if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid webhook URL: must be a valid http or https URL"})
			return
		}
	}

	session, err := h.sessionService.Get(name)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "session not found"})
		return
	}

	// Check if webhook exists
	existing, err := h.service.GetBySession(c.Request.Context(), session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	if existing == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "webhook not found for this session"})
		return
	}

	webhook, err := h.service.Set(c.Request.Context(), session.ID, req.URL, req.Events, req.Enabled, req.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, GetWebhookResponse{
		ID:        webhook.ID,
		SessionID: webhook.SessionID,
		URL:       webhook.URL,
		Events:    webhook.Events,
		Enabled:   webhook.Enabled,
	})
}

// DeleteWebhook godoc
// @Summary Delete webhook
// @Description Delete the webhook configuration for a session
// @Tags webhook
// @Produce json
// @Param name path string true "Session name"
// @Success 200 {object} MessageResponse
// @Failure 404 {object} ErrorResponse
// @Security ApiKeyAuth
// @Router /sessions/{name}/webhooks [delete]
func (h *Handler) DeleteWebhook(c *gin.Context) {
	name := c.Param("name")

	session, err := h.sessionService.Get(name)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "session not found"})
		return
	}

	// Check if webhook exists
	existing, err := h.service.GetBySession(c.Request.Context(), session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	if existing == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "webhook not found for this session"})
		return
	}

	if err := h.service.Delete(c.Request.Context(), session.ID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, MessageResponse{Message: "webhook deleted"})
}

// MessageResponse represents a success message response
type MessageResponse struct {
	Message string `json:"message"`
}

// GetEvents godoc
// @Summary List available webhook events
// @Description Get a list of all available webhook event types organized by category
// @Tags webhook
// @Produce json
// @Success 200 {object} EventsResponse
// @Security ApiKeyAuth
// @Router /events [get]
func (h *Handler) GetEvents(c *gin.Context) {
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

	c.JSON(http.StatusOK, EventsResponse{
		Categories: categories,
		All:        all,
	})
}

// EventsResponse represents the available events response
type EventsResponse struct {
	Categories map[string][]string `json:"categories"`
	All        []string            `json:"all"`
}
