package chatwoot

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/types"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

// Handler handles HTTP requests for Chatwoot integration
type Handler struct {
	service           *Service
	sessionService    *service.SessionService
	whatsappSvc       *service.WhatsAppService
	database          *db.Database
	botCommandHandler *BotCommandHandler
}

// NewHandler creates a new Chatwoot handler
func NewHandler(svc *Service, sessionSvc *service.SessionService, whatsappSvc *service.WhatsAppService, database *db.Database) *Handler {
	return &Handler{
		service:           svc,
		sessionService:    sessionSvc,
		whatsappSvc:       whatsappSvc,
		database:          database,
		botCommandHandler: NewBotCommandHandler(svc, sessionSvc),
	}
}

// =============================================================================
// CONFIG ENDPOINTS
// =============================================================================

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

// =============================================================================
// WEBHOOK ENDPOINT
// =============================================================================

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

	isConnected := session.Status == model.StatusConnected
	logger.Debug().
		Str("session", sessionName).
		Str("status", string(session.Status)).
		Bool("isConnected", isConnected).
		Msg("Chatwoot webhook check")

	if !isConnected {
		c.JSON(http.StatusOK, gin.H{"message": "session not connected, ignored"})
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	payload, err := ParseWebhookPayload(body)
	if err != nil {
		logger.Warn().Err(err).Str("session", sessionName).Msg("Failed to parse Chatwoot webhook")
		c.JSON(http.StatusOK, gin.H{"message": "invalid payload"})
		return
	}

	// Log webhook event details for debugging
	contentPreview := payload.Content
	if len(contentPreview) > 50 {
		contentPreview = contentPreview[:50] + "..."
	}
	logger.Info().
		Str("session", sessionName).
		Str("event", payload.Event).
		Interface("messageType", payload.MessageType).
		Int("msgId", payload.ID).
		Str("sourceId", payload.SourceID).
		Bool("private", payload.Private).
		Str("content", contentPreview).
		Msg("Chatwoot webhook received")

	// Handle message_updated event with deleted flag
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
		// Skip messages with WAID: source_id - prevents loop when syncing from WhatsApp
		if payload.SourceID != "" && strings.HasPrefix(payload.SourceID, "WAID:") {
			logger.Debug().
				Str("session", sessionName).
				Str("sourceId", payload.SourceID).
				Int("msgId", payload.ID).
				Msg("Chatwoot: skipping message with WAID source_id (anti-loop)")
			c.JSON(http.StatusOK, gin.H{"message": "skipped - from whatsapp"})
			return
		}

		// Also check first message in conversation (Evolution API pattern)
		if payload.Conversation != nil && len(payload.Conversation.Messages) > 0 {
			firstMsg := payload.Conversation.Messages[0]
			if strings.HasPrefix(firstMsg.SourceID, "WAID:") && firstMsg.ID == payload.ID {
				logger.Debug().
					Str("session", sessionName).
					Str("sourceId", firstMsg.SourceID).
					Int("msgId", payload.ID).
					Msg("Chatwoot: skipping message (conversation first msg has WAID)")
				c.JSON(http.StatusOK, gin.H{"message": "skipped - from whatsapp"})
				return
			}
		}

		chatId := h.extractChatId(payload)

		// Handle bot commands (Evolution API pattern)
		if IsBotContact(chatId) {
			cfg, _ := h.service.GetEnabledConfig(c.Request.Context(), session.ID)
			if cfg != nil {
				h.botCommandHandler.HandleCommand(c.Request.Context(), session, cfg, payload.Content)
			}
			c.JSON(http.StatusOK, gin.H{"message": "bot command"})
			return
		}

		chatJid, content, attachments, err := h.service.GetWebhookDataForSending(c.Request.Context(), session.ID, payload)
		if err != nil {
			logger.Warn().Err(err).
				Str("session", sessionName).
				Int("msgId", payload.ID).
				Msg("Chatwoot: GetWebhookDataForSending failed")
			c.JSON(http.StatusOK, gin.H{"message": "processing error"})
			return
		}

		// Debug log to understand what's being extracted
		logger.Debug().
			Str("session", sessionName).
			Str("chatJid", chatJid).
			Str("content", content).
			Int("attachments", len(attachments)).
			Int("msgId", payload.ID).
			Msg("Chatwoot: extracted data for sending")

		quotedMsg := h.service.GetQuotedMessage(c.Request.Context(), session.ID, payload)

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

func (h *Handler) extractChatId(payload *WebhookPayload) string {
	if payload.Conversation != nil && payload.Conversation.Meta != nil && payload.Conversation.Meta.Sender != nil {
		chatId := payload.Conversation.Meta.Sender.Identifier
		if chatId == "" {
			chatId = strings.TrimPrefix(payload.Conversation.Meta.Sender.PhoneNumber, "+")
		}
		return chatId
	}
	return ""
}

// =============================================================================
// WHATSAPP MESSAGE SENDING
// =============================================================================

func (h *Handler) sendToWhatsApp(c *gin.Context, session *model.Session, chatJid, content string, attachments []Attachment, quotedMsg *QuotedMessageInfo, chatwootMsgID, chatwootConvID int) error {
	// Use a longer timeout context for sending messages, especially for groups
	// Groups require encrypting for each participant, which can take time
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Use the full JID (chatJid) instead of extracting phone - parseJID now supports both
	// This fixes sending to groups which have JIDs like "120363161632436488@g.us"
	recipient := chatJid

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

	// Send attachments first
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
				resp, err := h.whatsappSvc.SendImageWithQuote(ctx, session.Name, recipient, mediaData, content, mimeType, quoted)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send image")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
			case "video":
				resp, err := h.whatsappSvc.SendVideoWithQuote(ctx, session.Name, recipient, mediaData, content, mimeType, quoted)
				if err != nil {
					logger.Warn().Err(err).Str("url", att.DataURL).Msg("Failed to send video")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
			case "audio":
				resp, err := h.whatsappSvc.SendAudioWithQuote(ctx, session.Name, recipient, mediaData, mimeType, true, quoted)
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
				resp, err := h.whatsappSvc.SendDocumentWithQuote(ctx, session.Name, recipient, mediaData, filename, mimeType, quoted)
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
		resp, err := h.whatsappSvc.SendTextWithQuote(ctx, session.Name, recipient, content, quoted)
		if err != nil {
			return err
		}
		h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
		logger.Info().
			Str("session", session.Name).
			Str("chatJid", chatJid).
			Str("msgId", resp.ID).
			Int("cwMsgId", chatwootMsgID).
			Msg("Chatwoot: message sent to WhatsApp")
	}

	return nil
}

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
		IsGroup:    IsGroupJID(chatJid),
		Status:     model.MessageStatusSent,
		CwMsgId:    &chatwootMsgID,
		CwConvId:   &chatwootConvID,
		CwSourceId: sourceID,
	}

	if _, err := h.database.Messages.Save(ctx, msg); err != nil {
		logger.Warn().Err(err).Str("messageId", messageID).Msg("Chatwoot: failed to save outgoing message")
	}
}

func (h *Handler) handleMessageDeleted(ctx context.Context, session *model.Session, payload *WebhookPayload) error {
	if h.database == nil {
		return fmt.Errorf("database not available")
	}

	messages, err := h.database.Messages.GetAllByCwMsgId(ctx, session.ID, payload.ID)
	if err != nil {
		return fmt.Errorf("failed to query messages: %w", err)
	}

	if len(messages) == 0 {
		logger.Debug().Int("chatwootMsgId", payload.ID).Msg("Chatwoot: no messages found for deletion")
		return nil
	}

	var deleteErrors []error
	for _, msg := range messages {
		if _, err := h.whatsappSvc.DeleteMessage(ctx, session.Name, msg.ChatJID, msg.MsgId, msg.FromMe); err != nil {
			logger.Warn().Err(err).Str("messageId", msg.MsgId).Msg("Chatwoot: failed to delete message from WhatsApp")
			deleteErrors = append(deleteErrors, err)
			continue
		}

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

// =============================================================================
// SYNC ENDPOINTS
// =============================================================================

// SyncContacts handles POST /sessions/:name/chatwoot/sync/contacts
// @Summary Sync contacts to Chatwoot (async)
// @Description Start async synchronization of contacts from message history to Chatwoot
// @Tags Chatwoot
// @Produce json
// @Param name path string true "Session name"
// @Success 202 {object} SyncStatus
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security ApiKeyAuth
// @Router /sessions/{name}/chatwoot/sync/contacts [post]
func (h *Handler) SyncContacts(c *gin.Context) {
	h.handleSync(c, "contacts")
}

// SyncMessages handles POST /sessions/:name/chatwoot/sync/messages
// @Summary Sync messages to Chatwoot (async)
// @Description Start async synchronization of message history to Chatwoot
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
	h.handleSync(c, "messages")
}

// SyncAll handles POST /sessions/:name/chatwoot/sync
// @Summary Full sync to Chatwoot (async)
// @Description Start async synchronization of all contacts and messages to Chatwoot
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
	h.handleSync(c, "all")
}

func (h *Handler) handleSync(c *gin.Context, syncType string) {
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

	contactsAdapter := &whatsappContactsAdapter{
		whatsappSvc: h.whatsappSvc,
		sessionName: sessionName,
	}

	dbSync, err := NewChatwootDBSync(cfg, h.database.Messages, contactsAdapter, h.database.Media, session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to chatwoot db: " + err.Error()})
		return
	}

	daysLimit := cfg.SyncDays
	if days := c.Query("days"); days != "" {
		_, _ = fmt.Sscanf(days, "%d", &daysLimit)
	}

	status, err := dbSync.StartSyncAsync(syncType, daysLimit)
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

// ResetChatwoot handles POST /sessions/:name/chatwoot/reset
// @Summary Reset Chatwoot data for testing
// @Description Delete all Chatwoot contacts, conversations and messages (except bot)
// @Tags Chatwoot
// @Produce json
// @Security ApiKeyAuth
// @Param name path string true "Session name"
// @Success 200 {object} map[string]interface{}
// @Router /sessions/{name}/chatwoot/reset [post]
func (h *Handler) ResetChatwoot(c *gin.Context) {
	sessionName := c.Param("name")
	session, err := h.sessionService.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	cfg, err := h.service.GetConfig(c.Request.Context(), session.ID)
	if err != nil || cfg == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "chatwoot not configured"})
		return
	}

	dbSync, err := NewChatwootDBSync(cfg, nil, nil, nil, session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to database: " + err.Error()})
		return
	}
	defer dbSync.Close()

	stats, err := dbSync.ResetData(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info().
		Str("session", sessionName).
		Int("contactsDeleted", stats.ContactsDeleted).
		Int("conversationsDeleted", stats.ConversationsDeleted).
		Int("messagesDeleted", stats.MessagesDeleted).
		Msg("Chatwoot: data reset completed")

	c.JSON(http.StatusOK, gin.H{
		"message": "reset completed",
		"deleted": gin.H{
			"contacts":      stats.ContactsDeleted,
			"conversations": stats.ConversationsDeleted,
			"messages":      stats.MessagesDeleted,
		},
	})
}

// =============================================================================
// ADAPTERS
// =============================================================================

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
	var pic *types.ProfilePictureInfo
	var err error

	if IsGroupJID(jid) {
		// For groups, use GetGroupProfilePicture
		pic, err = a.whatsappSvc.GetGroupProfilePicture(ctx, a.sessionName, jid)
	} else {
		// For individual contacts, extract phone and get profile picture
		phone := ExtractPhoneFromJID(jid)
		if phone == "" {
			return "", nil
		}
		pic, err = a.whatsappSvc.GetProfilePicture(ctx, a.sessionName, phone)
	}

	if err != nil {
		return "", err
	}
	if pic == nil {
		return "", nil
	}
	return pic.URL, nil
}

func (a *whatsappContactsAdapter) GetGroupName(ctx context.Context, groupJID string) (string, error) {
	info, err := a.whatsappSvc.GetGroupInfo(ctx, a.sessionName, groupJID)
	if err != nil {
		return "", err
	}
	if info == nil {
		return "", nil
	}
	return info.Name, nil
}
