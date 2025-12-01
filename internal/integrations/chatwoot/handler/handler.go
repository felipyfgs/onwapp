package handler

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
	"zpwoot/internal/integrations/chatwoot/core"
	cwservice "zpwoot/internal/integrations/chatwoot/service"
	cwsync "zpwoot/internal/integrations/chatwoot/sync"
	"zpwoot/internal/integrations/chatwoot/util"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

// Handler handles HTTP requests for Chatwoot integration
type Handler struct {
	service           *cwservice.Service
	sessionService    *service.SessionService
	whatsappSvc       *service.WhatsAppService
	database          *db.Database
	botCommandHandler *cwservice.BotCommandHandler
}

// NewHandler creates a new Chatwoot handler
func NewHandler(svc *cwservice.Service, sessionSvc *service.SessionService, whatsappSvc *service.WhatsAppService, database *db.Database) *Handler {
	return &Handler{
		service:           svc,
		sessionService:    sessionSvc,
		whatsappSvc:       whatsappSvc,
		database:          database,
		botCommandHandler: cwservice.NewBotCommandHandler(svc, sessionSvc),
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
// @Success 200 {object} core.Config
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

	// Convert DTO to service request
	svcReq := &cwservice.SetConfigRequest{
		Enabled:        req.Enabled,
		URL:            req.URL,
		Token:          req.Token,
		Account:        req.Account,
		Inbox:          req.Inbox,
		SignAgent:      req.SignAgent,
		SignSeparator:  req.SignSeparator,
		AutoReopen:     req.AutoReopen,
		StartPending:   req.StartPending,
		MergeBrPhones:  req.MergeBrPhones,
		SyncContacts:   req.SyncContacts,
		SyncMessages:   req.SyncMessages,
		SyncDays:       req.SyncDays,
		IgnoreChats:    req.IgnoreChats,
		AutoCreate:     req.AutoCreate,
		Number:         req.Number,
		Organization:   req.Organization,
		Logo:           req.Logo,
		ChatwootDBHost: req.ChatwootDBHost,
		ChatwootDBPort: req.ChatwootDBPort,
		ChatwootDBUser: req.ChatwootDBUser,
		ChatwootDBPass: req.ChatwootDBPass,
		ChatwootDBName: req.ChatwootDBName,
	}

	cfg, err := h.service.SetConfig(c.Request.Context(), session.ID, session.Name, svcReq)
	if err != nil {
		logger.Warn().Err(err).Str("session", sessionName).Msg("Chatwoot: failed to set config")
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
// @Success 200 {object} core.Config
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
		logger.Warn().Err(err).Str("session", sessionName).Msg("Chatwoot: failed to get config")
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
		logger.Warn().Err(err).Str("session", sessionName).Msg("Chatwoot: failed to delete config")
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

	if session.Status != model.StatusConnected {
		c.JSON(http.StatusOK, gin.H{"message": "session not connected, ignored"})
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	payload, err := cwservice.ParseWebhookPayload(body)
	if err != nil {
		logger.Debug().Err(err).Str("session", sessionName).Msg("Chatwoot: invalid webhook payload")
		c.JSON(http.StatusOK, gin.H{"message": "invalid payload"})
		return
	}

	logger.Debug().
		Str("session", sessionName).
		Str("event", payload.Event).
		Int("msgId", payload.ID).
		Msg("Chatwoot: webhook received")

	if payload.Event == "message_updated" && payload.ContentAttrs != nil {
		if deleted, ok := payload.ContentAttrs["deleted"].(bool); ok && deleted {
			if err := h.handleMessageDeleted(c.Request.Context(), session, payload); err != nil {
				logger.Warn().Err(err).Str("session", sessionName).Msg("Chatwoot: failed to delete message from WhatsApp")
			}
			c.JSON(http.StatusOK, gin.H{"message": "ok"})
			return
		}
	}

	isOutgoing := payload.MessageType == "outgoing" || payload.MessageType == "1"

	if payload.Event == "message_created" && isOutgoing && !payload.Private {
		if payload.SourceID != "" && strings.HasPrefix(payload.SourceID, "WAID:") {
			c.JSON(http.StatusOK, gin.H{"message": "skipped - from whatsapp"})
			return
		}

		if payload.Conversation != nil && len(payload.Conversation.Messages) > 0 {
			firstMsg := payload.Conversation.Messages[0]
			if strings.HasPrefix(firstMsg.SourceID, "WAID:") && firstMsg.ID == payload.ID {
				c.JSON(http.StatusOK, gin.H{"message": "skipped - from whatsapp"})
				return
			}
		}

		chatId := h.extractChatId(payload)

		if cwservice.IsBotContact(chatId) {
			cfg, _ := h.service.GetEnabledConfig(c.Request.Context(), session.ID)
			if cfg != nil {
				h.botCommandHandler.HandleCommand(c.Request.Context(), session, cfg, payload.Content)
			}
			c.JSON(http.StatusOK, gin.H{"message": "bot command"})
			return
		}

		chatJid, content, attachments, err := h.service.GetWebhookDataForSending(c.Request.Context(), session.ID, payload)
		if err != nil {
			logger.Debug().Err(err).Str("session", sessionName).Int("msgId", payload.ID).Msg("Chatwoot: webhook data extraction failed")
			c.JSON(http.StatusOK, gin.H{"message": "processing error"})
			return
		}

		quotedMsg := h.service.GetQuotedMessage(c.Request.Context(), session.ID, payload)

		var conversationID int
		if payload.Conversation != nil {
			conversationID = payload.Conversation.ID
		}

		if chatJid != "" && (content != "" || len(attachments) > 0) {
			c.JSON(http.StatusOK, gin.H{"message": "accepted"})

			go func(sess *model.Session, jid, txt string, atts []core.Attachment, quoted *core.QuotedMessageInfo, cwMsgID, convID int) {
				bgCtx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
				defer cancel()
				if err := h.sendToWhatsAppBackground(bgCtx, sess, jid, txt, atts, quoted, cwMsgID, convID); err != nil {
					logger.Warn().Err(err).Str("session", sess.Name).Str("chatJid", jid).Msg("Chatwoot: failed to send to WhatsApp")
				}
			}(session, chatJid, content, attachments, quotedMsg, payload.ID, conversationID)
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func (h *Handler) extractChatId(payload *cwservice.WebhookPayload) string {
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

func (h *Handler) sendToWhatsAppBackground(ctx context.Context, session *model.Session, chatJid, content string, attachments []core.Attachment, quotedMsg *core.QuotedMessageInfo, chatwootMsgID, chatwootConvID int) error {
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

	for _, att := range attachments {
		if att.DataURL != "" {
			mediaData, mimeType, err := downloadMedia(att.DataURL)
			if err != nil {
				logger.Debug().Err(err).Str("url", att.DataURL).Msg("Chatwoot: failed to download attachment")
				continue
			}

			mediaType := util.GetMediaTypeFromURL(att.DataURL)
			switch mediaType {
			case "image":
				resp, err := h.whatsappSvc.SendImageWithQuote(ctx, session.Name, recipient, mediaData, content, mimeType, quoted)
				if err != nil {
					logger.Debug().Err(err).Msg("Chatwoot: failed to send image")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
			case "video":
				resp, err := h.whatsappSvc.SendVideoWithQuote(ctx, session.Name, recipient, mediaData, content, mimeType, quoted)
				if err != nil {
					logger.Debug().Err(err).Msg("Chatwoot: failed to send video")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
			case "audio":
				resp, err := h.whatsappSvc.SendAudioWithQuote(ctx, session.Name, recipient, mediaData, mimeType, true, quoted)
				if err != nil {
					logger.Debug().Err(err).Msg("Chatwoot: failed to send audio")
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
					logger.Debug().Err(err).Msg("Chatwoot: failed to send document")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
			}
		}
	}

	if content != "" {
		resp, err := h.whatsappSvc.SendTextWithQuote(ctx, session.Name, recipient, content, quoted)
		if err != nil {
			return err
		}
		h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
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
		IsGroup:    util.IsGroupJID(chatJid),
		Status:     model.MessageStatusSent,
		CwMsgId:    &chatwootMsgID,
		CwConvId:   &chatwootConvID,
		CwSourceId: sourceID,
	}

	_, _ = h.database.Messages.Save(ctx, msg)
}

func (h *Handler) handleMessageDeleted(ctx context.Context, session *model.Session, payload *cwservice.WebhookPayload) error {
	if h.database == nil {
		return fmt.Errorf("database not available")
	}

	messages, err := h.database.Messages.GetAllByCwMsgId(ctx, session.ID, payload.ID)
	if err != nil {
		return fmt.Errorf("failed to query messages: %w", err)
	}

	if len(messages) == 0 {
		return nil
	}

	var deleteErrors []error
	for _, msg := range messages {
		if _, err := h.whatsappSvc.DeleteMessage(ctx, session.Name, msg.ChatJID, msg.MsgId, msg.FromMe); err != nil {
			logger.Debug().Err(err).Str("messageId", msg.MsgId).Msg("Chatwoot: failed to delete from WhatsApp")
			deleteErrors = append(deleteErrors, err)
			continue
		}

		_ = h.database.Messages.Delete(ctx, session.ID, msg.MsgId)
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
// @Success 202 {object} core.SyncStatus
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
// @Success 202 {object} core.SyncStatus
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
// @Success 202 {object} core.SyncStatus
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

	dbSync, err := cwsync.NewChatwootDBSync(cfg, h.database.Messages, contactsAdapter, h.database.Media, session.ID, h.database.Pool)
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
// @Success 200 {object} core.SyncStatus
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

	status := cwsync.GetSyncStatus(session.ID)
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

	dbSync, err := cwsync.NewChatwootDBSync(cfg, nil, nil, nil, session.ID, h.database.Pool)
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

type whatsappContactsAdapter struct {
	whatsappSvc *service.WhatsAppService
	sessionName string
}

func (a *whatsappContactsAdapter) GetAllContacts(ctx context.Context) ([]core.WhatsAppContact, error) {
	contactsMap, err := a.whatsappSvc.GetContacts(ctx, a.sessionName)
	if err != nil {
		return nil, err
	}

	var contacts []core.WhatsAppContact
	for jid, data := range contactsMap {
		if dataMap, ok := data.(map[string]interface{}); ok {
			contact := core.WhatsAppContact{JID: jid}
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

	if util.IsGroupJID(jid) {
		pic, err = a.whatsappSvc.GetGroupProfilePicture(ctx, a.sessionName, jid)
	} else {
		phone := util.ExtractPhoneFromJID(jid)
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
