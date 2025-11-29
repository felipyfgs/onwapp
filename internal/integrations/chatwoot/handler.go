package chatwoot

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

// Handler handles HTTP requests for Chatwoot integration
type Handler struct {
	service        *Service
	sessionService *service.SessionService
	whatsappSvc    *service.WhatsAppService
	database       *db.Database
}

// NewHandler creates a new Chatwoot handler
func NewHandler(svc *Service, sessionSvc *service.SessionService, whatsappSvc *service.WhatsAppService, database *db.Database) *Handler {
	return &Handler{
		service:        svc,
		sessionService: sessionSvc,
		whatsappSvc:    whatsappSvc,
		database:       database,
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

	// Log raw body for debugging
	logger.Debug().
		Str("session", sessionName).
		Str("rawBody", string(body)).
		Msg("Chatwoot webhook raw payload")

	// Parse webhook payload
	payload, err := ParseWebhookPayload(body)
	if err != nil {
		logger.Warn().Err(err).Str("session", sessionName).Msg("Failed to parse Chatwoot webhook")
		c.JSON(http.StatusOK, gin.H{"message": "invalid payload"})
		return
	}

	// Detailed logging for debugging
	logger.Info().
		Str("session", sessionName).
		Str("event", payload.Event).
		Str("messageType", payload.MessageType).
		Int("messageId", payload.ID).
		Str("content", payload.Content).
		Bool("private", payload.Private).
		Interface("sender", payload.Sender).
		Msg("Received Chatwoot webhook")

	// Extra debug for message_created
	if payload.Event == "message_created" {
		logger.Debug().
			Str("session", sessionName).
			Int("messageId", payload.ID).
			Str("messageType", payload.MessageType).
			Bool("private", payload.Private).
			Interface("conversation", payload.Conversation).
			Interface("contentAttrs", payload.ContentAttrs).
			Msg("Chatwoot message_created details")
	}

	// Handle message_created event - send to WhatsApp
	// message_type can be "outgoing" or 1 (int)
	isOutgoing := payload.MessageType == "outgoing" || payload.MessageType == "1"
	
	logger.Debug().
		Str("session", sessionName).
		Str("event", payload.Event).
		Bool("isOutgoing", isOutgoing).
		Bool("private", payload.Private).
		Msg("Chatwoot webhook processing check")

	if payload.Event == "message_created" && isOutgoing && !payload.Private {
		logger.Info().
			Str("session", sessionName).
			Int("messageId", payload.ID).
			Msg("Chatwoot: processing outgoing message_created")

		chatJid, content, attachments, err := h.service.GetWebhookDataForSending(c.Request.Context(), session.ID, payload)
		if err != nil {
			logger.Warn().Err(err).Str("session", sessionName).Msg("Failed to process Chatwoot webhook")
			c.JSON(http.StatusOK, gin.H{"message": "processing error"})
			return
		}

		logger.Debug().
			Str("session", sessionName).
			Str("chatJid", chatJid).
			Str("content", content).
			Int("attachmentsCount", len(attachments)).
			Msg("Chatwoot: GetWebhookDataForSending result")

		// Check if this is a reply to another message
		quotedMsg := h.service.GetQuotedMessage(c.Request.Context(), session.ID, payload)
		if quotedMsg != nil {
			logger.Debug().
				Str("session", sessionName).
				Str("quotedMessageId", quotedMsg.MessageID).
				Msg("Chatwoot: found quoted message for reply")
		}

		// Get conversation ID for saving message
		var conversationID int
		if payload.Conversation != nil {
			conversationID = payload.Conversation.ID
		}

		if chatJid != "" && (content != "" || len(attachments) > 0) {
			logger.Info().
				Str("session", sessionName).
				Str("chatJid", chatJid).
				Str("content", content).
				Int("conversationId", conversationID).
				Msg("Chatwoot: sending message to WhatsApp")

			// Send message to WhatsApp and save to database
			if err := h.sendToWhatsApp(c, session, chatJid, content, attachments, quotedMsg, payload.ID, conversationID); err != nil {
				logger.Error().Err(err).
					Str("session", sessionName).
					Str("chatJid", chatJid).
					Msg("Failed to send message to WhatsApp from Chatwoot")
			} else {
				logger.Info().
					Str("session", sessionName).
					Str("chatJid", chatJid).
					Msg("Chatwoot: message sent to WhatsApp successfully")
			}
		} else {
			logger.Warn().
				Str("session", sessionName).
				Str("chatJid", chatJid).
				Str("content", content).
				Int("attachmentsCount", len(attachments)).
				Msg("Chatwoot: skipping send - empty chatJid or content")
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func (h *Handler) sendToWhatsApp(c *gin.Context, session *model.Session, chatJid, content string, attachments []Attachment, quotedMsg *QuotedMessageInfo, chatwootMsgID, chatwootConvID int) error {
	ctx := c.Request.Context()

	// Extract phone number from JID
	phone := extractPhone(chatJid)

	// Convert QuotedMessageInfo to service.QuotedMessage
	var quoted *service.QuotedMessage
	if quotedMsg != nil {
		quoted = &service.QuotedMessage{
			MessageID: quotedMsg.MessageID,
			ChatJID:   quotedMsg.ChatJID,
			SenderJID: quotedMsg.SenderJID,
			Content:   quotedMsg.Content,
			IsFromMe:  quotedMsg.IsFromMe,
		}
		logger.Info().
			Str("quotedMessageId", quoted.MessageID).
			Str("quotedContent", quoted.Content).
			Msg("Chatwoot: sending message with quote")
	}

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
				resp, err := h.whatsappSvc.SendImage(ctx, session.Name, phone, mediaData, content, mimeType)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send image")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = "" // Don't send caption again
			case "video":
				resp, err := h.whatsappSvc.SendVideo(ctx, session.Name, phone, mediaData, content, mimeType)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send video")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
			case "audio":
				resp, err := h.whatsappSvc.SendAudio(ctx, session.Name, phone, mediaData, mimeType, false)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send audio")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, "", resp.ID, chatwootMsgID, chatwootConvID)
				}
			default:
				filename := att.Extension
				if filename == "" {
					filename = "document"
				}
				resp, err := h.whatsappSvc.SendDocument(ctx, session.Name, phone, mediaData, filename, mimeType)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send document")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
			}
		}
	}

	// Send text message if there's content left
	if content != "" {
		// Use SendTextWithQuote if we have a quoted message
		resp, err := h.whatsappSvc.SendTextWithQuote(ctx, session.Name, phone, content, quoted)
		if err != nil {
			return err
		}
		// Save message to database for reply tracking
		h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
	}

	return nil
}

// saveOutgoingMessage saves a message sent from Chatwoot to database for reply tracking
func (h *Handler) saveOutgoingMessage(ctx context.Context, session *model.Session, chatJid, content, messageID string, chatwootMsgID, chatwootConvID int) {
	logger.Info().
		Str("messageId", messageID).
		Int("chatwootMsgId", chatwootMsgID).
		Int("chatwootConvId", chatwootConvID).
		Str("chatJid", chatJid).
		Msg("Chatwoot: saveOutgoingMessage called")

	if h.database == nil {
		logger.Warn().Msg("Chatwoot: database is nil, cannot save outgoing message")
		return
	}

	sourceID := fmt.Sprintf("WAID:%s", messageID)
	
	// Get sender JID from device
	var senderJID string
	if session.Device != nil && session.Device.ID != nil {
		senderJID = session.Device.ID.String()
	}
	
	msg := &model.Message{
		SessionID:              session.ID,
		MessageID:              messageID,
		ChatJID:                chatJid,
		SenderJID:              senderJID, // From us
		Timestamp:              time.Now(),
		Type:                   "text",
		Content:                content,
		IsFromMe:               true,
		IsGroup:                false,
		Status:                 model.MessageStatusSent,
		ChatwootMessageID:      &chatwootMsgID,
		ChatwootConversationID: &chatwootConvID,
		ChatwootSourceID:       sourceID,
	}

	if _, err := h.database.Messages.Save(ctx, msg); err != nil {
		logger.Warn().Err(err).
			Str("messageId", messageID).
			Int("chatwootMsgId", chatwootMsgID).
			Msg("Chatwoot: failed to save outgoing message")
	} else {
		logger.Debug().
			Str("messageId", messageID).
			Int("chatwootMsgId", chatwootMsgID).
			Msg("Chatwoot: saved outgoing message for reply tracking")
	}
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
