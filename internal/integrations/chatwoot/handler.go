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

// whatsappContactsAdapter adapts WhatsAppService to ContactsGetter interface
type whatsappContactsAdapter struct {
	whatsappSvc *service.WhatsAppService
	sessionName string
}

func (a *whatsappContactsAdapter) GetAllContacts(ctx context.Context) ([]WhatsAppContact, error) {
	contactsMap, err := a.whatsappSvc.GetContacts(ctx, a.sessionName)
	if err != nil {
		return nil, err
	}

	var contacts []WhatsAppContact
	for jid, data := range contactsMap {
		if dataMap, ok := data.(map[string]interface{}); ok {
			contact := WhatsAppContact{JID: jid}
			if v, ok := dataMap["pushName"].(string); ok {
				contact.PushName = v
			}
			if v, ok := dataMap["businessName"].(string); ok {
				contact.BusinessName = v
			}
			if v, ok := dataMap["fullName"].(string); ok {
				contact.FullName = v
			}
			if v, ok := dataMap["firstName"].(string); ok {
				contact.FirstName = v
			}
			contacts = append(contacts, contact)
		}
	}
	return contacts, nil
}

func (a *whatsappContactsAdapter) GetProfilePictureURL(ctx context.Context, jid string) (string, error) {
	// Extract phone from JID (remove @s.whatsapp.net)
	phone := ExtractPhoneFromJID(jid)
	if phone == "" {
		return "", nil
	}

	pic, err := a.whatsappSvc.GetProfilePicture(ctx, a.sessionName, phone)
	if err != nil {
		return "", err
	}
	if pic == nil {
		return "", nil
	}
	return pic.URL, nil
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
// @Security ApiKeyAuth
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
// @Security ApiKeyAuth
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
// @Security ApiKeyAuth
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

	// Check if session is connected - if not, silently ignore (don't cause Chatwoot retry loop)
	isConnected := session.Status == model.StatusConnected
	logger.Info().
		Str("session", sessionName).
		Str("status", string(session.Status)).
		Bool("isConnected", isConnected).
		Msg("Chatwoot webhook check")
	
	if !isConnected {
		c.JSON(http.StatusOK, gin.H{"message": "session not connected, ignored"})
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

	// Handle message_updated event with deleted flag - delete from WhatsApp
	if payload.Event == "message_updated" && payload.ContentAttrs != nil {
		if deleted, ok := payload.ContentAttrs["deleted"].(bool); ok && deleted {
			if err := h.handleMessageDeleted(c.Request.Context(), session, payload); err != nil {
				logger.Warn().Err(err).Str("session", sessionName).Msg("Chatwoot: failed to delete message from WhatsApp")
			}
			c.JSON(http.StatusOK, gin.H{"message": "ok"})
			return
		}
	}

	// Handle message_created event - send to WhatsApp
	isOutgoing := payload.MessageType == "outgoing" || payload.MessageType == "1"

	if payload.Event == "message_created" && isOutgoing && !payload.Private {
		chatJid, content, attachments, err := h.service.GetWebhookDataForSending(c.Request.Context(), session.ID, payload)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"message": "processing error"})
			return
		}

		// Check if this is a reply to another message
		quotedMsg := h.service.GetQuotedMessage(c.Request.Context(), session.ID, payload)

		// Get conversation ID for saving message
		var conversationID int
		if payload.Conversation != nil {
			conversationID = payload.Conversation.ID
		}

		if chatJid != "" && (content != "" || len(attachments) > 0) {
			if err := h.sendToWhatsApp(c, session, chatJid, content, attachments, quotedMsg, payload.ID, conversationID); err != nil {
				logger.Error().Err(err).
					Str("session", sessionName).
					Str("chatJid", chatJid).
					Msg("Chatwoot: failed to send to WhatsApp")
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func (h *Handler) sendToWhatsApp(c *gin.Context, session *model.Session, chatJid, content string, attachments []Attachment, quotedMsg *QuotedMessageInfo, chatwootMsgID, chatwootConvID int) error {
	ctx := c.Request.Context()

	phone := ExtractPhoneFromJID(chatJid)

	// Convert QuotedMessageInfo to service.QuotedMessage
	var quoted *service.QuotedMessage
	if quotedMsg != nil {
		quoted = &service.QuotedMessage{
			MessageID: quotedMsg.MsgId,
			ChatJID:   quotedMsg.ChatJID,
			SenderJID: quotedMsg.SenderJID,
			Content:   quotedMsg.Content,
			IsFromMe:  quotedMsg.FromMe,
		}
	}

	// Send attachments first (with quote support)
	for _, att := range attachments {
		if att.DataURL != "" {
			mediaData, mimeType, err := downloadMedia(att.DataURL)
			if err != nil {
				logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to download attachment")
				continue
			}

			mediaType := GetMediaTypeFromURL(att.DataURL)
			switch mediaType {
			case "image":
				resp, err := h.whatsappSvc.SendImageWithQuote(ctx, session.Name, phone, mediaData, content, mimeType, quoted)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send image")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = "" // Don't send caption again
				quoted = nil // Only quote on first attachment
			case "video":
				resp, err := h.whatsappSvc.SendVideoWithQuote(ctx, session.Name, phone, mediaData, content, mimeType, quoted)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send video")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
			case "audio":
				// Send as PTT (push-to-talk/voice note) so it appears as narrated audio in WhatsApp
				resp, err := h.whatsappSvc.SendAudioWithQuote(ctx, session.Name, phone, mediaData, mimeType, true, quoted)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send audio")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, "", resp.ID, chatwootMsgID, chatwootConvID)
				}
				quoted = nil
			default:
				filename := att.Extension
				if filename == "" {
					filename = "document"
				}
				resp, err := h.whatsappSvc.SendDocumentWithQuote(ctx, session.Name, phone, mediaData, filename, mimeType, quoted)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send document")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
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
	if h.database == nil {
		return
	}

	sourceID := fmt.Sprintf("WAID:%s", messageID)
	
	var senderJID string
	if session.Device != nil && session.Device.ID != nil {
		senderJID = session.Device.ID.String()
	}
	
	msg := &model.Message{
		SessionID:  session.ID,
		MsgId:      messageID,
		ChatJID:    chatJid,
		SenderJID:  senderJID,
		Timestamp:  time.Now(),
		Type:       "text",
		Content:    content,
		FromMe:     true,
		IsGroup:    false,
		Status:     model.MessageStatusSent,
		CwMsgId:    &chatwootMsgID,
		CwConvId:   &chatwootConvID,
		CwSourceId: sourceID,
	}

	if _, err := h.database.Messages.Save(ctx, msg); err != nil {
		logger.Warn().Err(err).Str("messageId", messageID).Msg("Chatwoot: failed to save outgoing message")
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

// SyncContacts handles POST /sessions/:name/chatwoot/sync/contacts
// @Summary Sync contacts to Chatwoot (async)
// @Description Start async synchronization of contacts from message history to Chatwoot. Requires chatwootDbHost to be configured.
// @Tags Chatwoot
// @Produce json
// @Param name path string true "Session name"
// @Success 202 {object} SyncStatus
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /sessions/{name}/chatwoot/sync/contacts [post]
func (h *Handler) SyncContacts(c *gin.Context) {
	sessionName := c.Param("name")
	session, err := h.sessionService.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	cfg, err := h.service.GetEnabledConfig(c.Request.Context(), session.ID)
	if err != nil || cfg == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chatwoot not configured or disabled"})
		return
	}

	if cfg.ChatwootDBHost == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chatwootDbHost not configured - sync requires direct database access"})
		return
	}

	// Create contacts adapter for WhatsApp service
	contactsAdapter := &whatsappContactsAdapter{
		whatsappSvc: h.whatsappSvc,
		sessionName: sessionName,
	}

	dbSync, err := NewChatwootDBSync(cfg, h.database.Messages, contactsAdapter, session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to chatwoot db: " + err.Error()})
		return
	}

	daysLimit := cfg.SyncDays
	if days := c.Query("days"); days != "" {
		_, _ = fmt.Sscanf(days, "%d", &daysLimit)
	}

	status, err := dbSync.StartSyncAsync("contacts", daysLimit)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "status": status})
		return
	}

	c.JSON(http.StatusAccepted, status)
}

// SyncMessages handles POST /sessions/:name/chatwoot/sync/messages
// @Summary Sync messages to Chatwoot (async)
// @Description Start async synchronization of message history to Chatwoot with original timestamps. Requires chatwootDbHost to be configured.
// @Tags Chatwoot
// @Produce json
// @Param name path string true "Session name"
// @Param days query int false "Limit to last N days"
// @Success 202 {object} SyncStatus
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /sessions/{name}/chatwoot/sync/messages [post]
func (h *Handler) SyncMessages(c *gin.Context) {
	sessionName := c.Param("name")
	session, err := h.sessionService.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	cfg, err := h.service.GetEnabledConfig(c.Request.Context(), session.ID)
	if err != nil || cfg == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chatwoot not configured or disabled"})
		return
	}

	if cfg.ChatwootDBHost == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chatwootDbHost not configured - sync requires direct database access"})
		return
	}

	// Create contacts adapter for WhatsApp service (needed for SyncAll)
	contactsAdapter := &whatsappContactsAdapter{
		whatsappSvc: h.whatsappSvc,
		sessionName: sessionName,
	}

	dbSync, err := NewChatwootDBSync(cfg, h.database.Messages, contactsAdapter, session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to chatwoot db: " + err.Error()})
		return
	}

	daysLimit := cfg.SyncDays
	if days := c.Query("days"); days != "" {
		_, _ = fmt.Sscanf(days, "%d", &daysLimit)
	}

	status, err := dbSync.StartSyncAsync("messages", daysLimit)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "status": status})
		return
	}

	c.JSON(http.StatusAccepted, status)
}

// SyncAll handles POST /sessions/:name/chatwoot/sync
// @Summary Full sync to Chatwoot (async)
// @Description Start async synchronization of all contacts and messages to Chatwoot with original timestamps. Requires chatwootDbHost to be configured.
// @Tags Chatwoot
// @Produce json
// @Param name path string true "Session name"
// @Param days query int false "Limit to last N days"
// @Success 202 {object} SyncStatus
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /sessions/{name}/chatwoot/sync [post]
func (h *Handler) SyncAll(c *gin.Context) {
	sessionName := c.Param("name")
	session, err := h.sessionService.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	cfg, err := h.service.GetEnabledConfig(c.Request.Context(), session.ID)
	if err != nil || cfg == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chatwoot not configured or disabled"})
		return
	}

	if cfg.ChatwootDBHost == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chatwootDbHost not configured - sync requires direct database access"})
		return
	}

	// Create contacts adapter for WhatsApp service
	contactsAdapter := &whatsappContactsAdapter{
		whatsappSvc: h.whatsappSvc,
		sessionName: sessionName,
	}

	dbSync, err := NewChatwootDBSync(cfg, h.database.Messages, contactsAdapter, session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to chatwoot db: " + err.Error()})
		return
	}

	daysLimit := cfg.SyncDays
	if days := c.Query("days"); days != "" {
		_, _ = fmt.Sscanf(days, "%d", &daysLimit)
	}

	status, err := dbSync.StartSyncAsync("all", daysLimit)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "status": status})
		return
	}

	c.JSON(http.StatusAccepted, status)
}

// GetSyncStatusHandler handles GET /sessions/:name/chatwoot/sync/status
// @Summary Get sync status
// @Description Get the current sync status for a session
// @Tags Chatwoot
// @Produce json
// @Param name path string true "Session name"
// @Success 200 {object} SyncStatus
// @Failure 404 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /sessions/{name}/chatwoot/sync/status [get]
func (h *Handler) GetSyncStatusHandler(c *gin.Context) {
	sessionName := c.Param("name")
	session, err := h.sessionService.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	status := GetSyncStatus(session.ID)
	c.JSON(http.StatusOK, status)
}

// handleMessageDeleted handles message deletion from Chatwoot
// Note: A single Chatwoot message with multiple attachments creates multiple WhatsApp messages
func (h *Handler) handleMessageDeleted(ctx context.Context, session *model.Session, payload *WebhookPayload) error {
	if h.database == nil {
		return fmt.Errorf("database not available")
	}

	// Find ALL messages with this Chatwoot message ID
	// (multiple attachments = multiple WhatsApp messages with same chatwootMessageId)
	messages, err := h.database.Messages.GetAllByCwMsgId(ctx, session.ID, payload.ID)
	if err != nil {
		return fmt.Errorf("failed to query messages: %w", err)
	}

	if len(messages) == 0 {
		logger.Debug().Int("chatwootMsgId", payload.ID).Msg("Chatwoot: no messages found for deletion")
		return nil
	}

	// Delete ALL messages from WhatsApp and database
	var deleteErrors []error
	for _, msg := range messages {
		// Delete from WhatsApp
		if _, err := h.whatsappSvc.DeleteMessage(ctx, session.Name, msg.ChatJID, msg.MsgId, msg.FromMe); err != nil {
			logger.Warn().Err(err).Str("messageId", msg.MsgId).Msg("Chatwoot: failed to delete message from WhatsApp")
			deleteErrors = append(deleteErrors, err)
			continue
		}

		// Delete from local database
		if err := h.database.Messages.Delete(ctx, session.ID, msg.MsgId); err != nil {
			logger.Warn().Err(err).Str("messageId", msg.MsgId).Msg("Chatwoot: failed to delete message from database")
		}

		logger.Info().
			Str("session", session.Name).
			Str("messageId", msg.MsgId).
			Int("chatwootMsgId", payload.ID).
			Msg("Chatwoot: message deleted from WhatsApp")
	}

	if len(deleteErrors) > 0 {
		return fmt.Errorf("failed to delete %d/%d messages", len(deleteErrors), len(messages))
	}

	return nil
}
