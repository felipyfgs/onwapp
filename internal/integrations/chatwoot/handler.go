package chatwoot

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/logger"
	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

// Handler handles HTTP requests for Chatwoot integration
type Handler struct {
	service        *Service
	sessionService *service.SessionService
	whatsappSvc    *service.WhatsAppService
}

// NewHandler creates a new Chatwoot handler
func NewHandler(svc *Service, sessionSvc *service.SessionService, whatsappSvc *service.WhatsAppService) *Handler {
	return &Handler{
		service:        svc,
		sessionService: sessionSvc,
		whatsappSvc:    whatsappSvc,
	}
}

// SetConfig handles POST /sessions/:name/chatwoot/set
// @Summary Set Chatwoot configuration
// @Description Configure Chatwoot integration for a session
// @Tags Chatwoot
// @Accept json
// @Produce json
// @Param name path string true "Session name"
// @Param config body SetConfigRequest true "Chatwoot configuration"
// @Success 200 {object} Config
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /sessions/{name}/chatwoot/set [post]
func (h *Handler) SetConfig(c *gin.Context) {
	sessionName := c.Param("name")
	session, err := h.sessionService.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	var req SetConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate URL if enabled
	if req.Enabled && req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url is required when enabled"})
		return
	}

	cfg, err := h.service.SetConfig(c.Request.Context(), session.ID, session.Name, &req)
	if err != nil {
		logger.Error().Err(err).Str("session", sessionName).Msg("Failed to set Chatwoot config")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cfg)
}

// GetConfig handles GET /sessions/:name/chatwoot/find
// @Summary Get Chatwoot configuration
// @Description Get Chatwoot integration configuration for a session
// @Tags Chatwoot
// @Produce json
// @Param name path string true "Session name"
// @Success 200 {object} Config
// @Failure 404 {object} map[string]interface{}
// @Router /sessions/{name}/chatwoot/find [get]
func (h *Handler) GetConfig(c *gin.Context) {
	sessionName := c.Param("name")
	session, err := h.sessionService.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	cfg, err := h.service.GetConfig(c.Request.Context(), session.ID)
	if err != nil {
		logger.Error().Err(err).Str("session", sessionName).Msg("Failed to get Chatwoot config")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cfg)
}

// DeleteConfig handles DELETE /sessions/:name/chatwoot
// @Summary Delete Chatwoot configuration
// @Description Remove Chatwoot integration configuration for a session
// @Tags Chatwoot
// @Produce json
// @Param name path string true "Session name"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /sessions/{name}/chatwoot [delete]
func (h *Handler) DeleteConfig(c *gin.Context) {
	sessionName := c.Param("name")
	session, err := h.sessionService.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	if err := h.service.DeleteConfig(c.Request.Context(), session.ID); err != nil {
		logger.Error().Err(err).Str("session", sessionName).Msg("Failed to delete Chatwoot config")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "chatwoot configuration deleted"})
}

// ReceiveWebhook handles POST /chatwoot/webhook/:name
// @Summary Receive Chatwoot webhook
// @Description Receive webhook events from Chatwoot
// @Tags Chatwoot
// @Accept json
// @Produce json
// @Param name path string true "Session name"
// @Success 200 {object} map[string]interface{}
// @Router /chatwoot/webhook/{name} [post]
func (h *Handler) ReceiveWebhook(c *gin.Context) {
	sessionName := c.Param("name")
	session, err := h.sessionService.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusOK, gin.H{"message": "session not found, ignoring"})
		return
	}

	// Read raw body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	// Parse webhook payload
	payload, err := ParseWebhookPayload(body)
	if err != nil {
		logger.Warn().Err(err).Str("session", sessionName).Msg("Failed to parse Chatwoot webhook")
		c.JSON(http.StatusOK, gin.H{"message": "invalid payload"})
		return
	}

	logger.Debug().
		Str("session", sessionName).
		Str("event", payload.Event).
		Msg("Received Chatwoot webhook")

	// Handle message_created event - send to WhatsApp
	if payload.Event == "message_created" && payload.MessageType == "outgoing" && !payload.Private {
		chatJid, content, attachments, err := h.service.GetWebhookDataForSending(c.Request.Context(), session.ID, payload)
		if err != nil {
			logger.Warn().Err(err).Str("session", sessionName).Msg("Failed to process Chatwoot webhook")
			c.JSON(http.StatusOK, gin.H{"message": "processing error"})
			return
		}

		if chatJid != "" && (content != "" || len(attachments) > 0) {
			// Send message to WhatsApp
			if err := h.sendToWhatsApp(c, session, chatJid, content, attachments); err != nil {
				logger.Error().Err(err).
					Str("session", sessionName).
					Str("chatJid", chatJid).
					Msg("Failed to send message to WhatsApp from Chatwoot")
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func (h *Handler) sendToWhatsApp(c *gin.Context, session *model.Session, chatJid, content string, attachments []Attachment) error {
	ctx := c.Request.Context()

	// Extract phone number from JID
	phone := extractPhone(chatJid)

	// Send attachments first
	for _, att := range attachments {
		if att.DataURL != "" {
			// Download attachment from URL
			mediaData, mimeType, err := downloadMedia(att.DataURL)
			if err != nil {
				logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to download attachment")
				continue
			}

			mediaType := GetMediaType(att.DataURL)
			switch mediaType {
			case "image":
				_, err := h.whatsappSvc.SendImage(ctx, session.Name, phone, mediaData, content, mimeType)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send image")
				}
				content = "" // Don't send caption again
			case "video":
				_, err := h.whatsappSvc.SendVideo(ctx, session.Name, phone, mediaData, content, mimeType)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send video")
				}
				content = ""
			case "audio":
				_, err := h.whatsappSvc.SendAudio(ctx, session.Name, phone, mediaData, mimeType, false)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send audio")
				}
			default:
				filename := att.Extension
				if filename == "" {
					filename = "document"
				}
				_, err := h.whatsappSvc.SendDocument(ctx, session.Name, phone, mediaData, filename, mimeType)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send document")
				}
				content = ""
			}
		}
	}

	// Send text message if there's content left
	if content != "" {
		_, err := h.whatsappSvc.SendText(ctx, session.Name, phone, content)
		if err != nil {
			return err
		}
	}

	return nil
}

func downloadMedia(url string) ([]byte, string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	mimeType := resp.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	return data, mimeType, nil
}

func extractPhone(jid string) string {
	// Remove @s.whatsapp.net or @g.us suffix
	phone := jid
	if idx := len(jid) - len("@s.whatsapp.net"); idx > 0 && jid[idx:] == "@s.whatsapp.net" {
		phone = jid[:idx]
	} else if idx := len(jid) - len("@g.us"); idx > 0 && jid[idx:] == "@g.us" {
		phone = jid[:idx]
	}
	return phone
}
