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
	"zpwoot/internal/queue"
	"zpwoot/internal/service"
	"zpwoot/internal/service/wpp"
)

// Handler handles HTTP requests for Chatwoot integration
type Handler struct {
	service           *cwservice.Service
	sessionService    *service.SessionService
	wpp               *wpp.Service
	database          *db.Database
	botCommandHandler *cwservice.BotCommandHandler
	queueProducer     *queue.Producer
}

// NewHandler creates a new Chatwoot handler
func NewHandler(svc *cwservice.Service, sessionSvc *service.SessionService, wppSvc *wpp.Service, database *db.Database) *Handler {
	return &Handler{
		service:           svc,
		sessionService:    sessionSvc,
		wpp:               wppSvc,
		database:          database,
		botCommandHandler: cwservice.NewBotCommandHandler(svc, sessionSvc),
	}
}

// SetQueueProducer sets the queue producer for async message processing
func (h *Handler) SetQueueProducer(producer *queue.Producer) {
	h.queueProducer = producer
}

// =============================================================================
// CONFIG ENDPOINTS
// =============================================================================

// SetConfig handles POST /sessions/:sessionId/chatwoot/set
// @Summary Set Chatwoot configuration
// @Description Configure Chatwoot integration for a session
// @Tags         chatwoot
// @Accept json
// @Produce json
// @Param sessionId path string true "Session name"
// @Param config body SetConfigRequest true "Chatwoot configuration"
// @Success 200 {object} core.Config
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security Authorization
// @Router /sessions/{sessionId}/chatwoot/set [post]
func (h *Handler) SetConfig(c *gin.Context) {
	sessionId := c.Param("sessionId")
	session, err := h.sessionService.Get(sessionId)
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

	cfg, err := h.service.SetConfig(c.Request.Context(), session.ID, session.Session, svcReq)
	if err != nil {
		logger.Warn().Err(err).Str("session", sessionId).Msg("Chatwoot: failed to set config")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cfg)
}

// GetConfig handles GET /sessions/:sessionId/chatwoot/find
// @Summary Get Chatwoot configuration
// @Description Get Chatwoot integration configuration for a session
// @Tags         chatwoot
// @Produce json
// @Param sessionId path string true "Session name"
// @Success 200 {object} core.Config
// @Failure 404 {object} map[string]interface{}
// @Security Authorization
// @Router /sessions/{sessionId}/chatwoot/find [get]
func (h *Handler) GetConfig(c *gin.Context) {
	sessionId := c.Param("sessionId")
	session, err := h.sessionService.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	cfg, err := h.service.GetConfig(c.Request.Context(), session.ID)
	if err != nil {
		logger.Warn().Err(err).Str("session", sessionId).Msg("Chatwoot: failed to get config")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cfg)
}

// DeleteConfig handles DELETE /sessions/:sessionId/chatwoot
// @Summary Delete Chatwoot configuration
// @Description Remove Chatwoot integration configuration for a session
// @Tags         chatwoot
// @Produce json
// @Param sessionId path string true "Session name"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security Authorization
// @Router /sessions/{sessionId}/chatwoot [delete]
func (h *Handler) DeleteConfig(c *gin.Context) {
	sessionId := c.Param("sessionId")
	session, err := h.sessionService.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	if err := h.service.DeleteConfig(c.Request.Context(), session.ID); err != nil {
		logger.Warn().Err(err).Str("session", sessionId).Msg("Chatwoot: failed to delete config")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "chatwoot configuration deleted"})
}

// =============================================================================
// WEBHOOK ENDPOINT
// =============================================================================

// ReceiveWebhook handles POST /chatwoot/webhook/:sessionId
// @Summary Receive Chatwoot webhook
// @Description Receive webhook events from Chatwoot
// @Tags         chatwoot
// @Accept json
// @Produce json
// @Param sessionId path string true "Session name"
// @Success 200 {object} map[string]interface{}
// @Router /chatwoot/webhook/{sessionId} [post]
func (h *Handler) ReceiveWebhook(c *gin.Context) {
	sessionId := c.Param("sessionId")
	session, err := h.sessionService.Get(sessionId)
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
		logger.Warn().Err(err).Str("session", sessionId).Msg("Chatwoot: invalid webhook payload")
		c.JSON(http.StatusOK, gin.H{"message": "invalid payload"})
		return
	}

	// Ignore message_updated events (except deletions) - same as Evolution API
	// Chatwoot sends these in bulk when messages are viewed/read, causing spam
	if payload.Event == "message_updated" {
		if payload.ContentAttrs != nil {
			if deleted, ok := payload.ContentAttrs["deleted"].(bool); ok && deleted {
				// Handle deletion
				deleteCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
				go func() {
					defer cancel()
					if err := h.handleMessageDeleted(deleteCtx, session, payload); err != nil {
						logger.Warn().Err(err).Str("session", sessionId).Msg("Chatwoot: failed to delete message from WhatsApp")
					}
				}()
				c.JSON(http.StatusOK, gin.H{"message": "ok"})
				return
			}
		}
		// Ignore all other message_updated events silently (like Evolution API)
		c.JSON(http.StatusOK, gin.H{"message": "ignored"})
		return
	}

	logger.Debug().
		Str("session", sessionId).
		Str("event", payload.Event).
		Int("msgId", payload.ID).
		Msg("Chatwoot: webhook received")

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

		// Check for duplicate webhook (same Chatwoot message ID already processed)
		if h.database != nil && payload.ID > 0 {
			existingMsg, _ := h.database.Messages.GetByCwMsgId(c.Request.Context(), session.ID, payload.ID)
			if existingMsg != nil {
				logger.Debug().
					Str("session", sessionId).
					Int("cwMsgId", payload.ID).
					Msg("Chatwoot: skipping duplicate webhook")
				c.JSON(http.StatusOK, gin.H{"message": "skipped - duplicate"})
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
			logger.Warn().Err(err).Str("session", sessionId).Int("msgId", payload.ID).Msg("Chatwoot: webhook data extraction failed")
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

			// Use queue if available, otherwise process directly in goroutine
			if h.queueProducer != nil && h.queueProducer.IsConnected() {
				h.enqueueToWhatsApp(c.Request.Context(), session, chatJid, content, attachments, quotedMsg, payload.ID, conversationID)
			} else {
				go func(sess *model.Session, jid, txt string, atts []core.Attachment, quoted *core.QuotedMessageInfo, cwMsgID, convID int) {
					bgCtx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
					defer cancel()
					if err := h.sendToWhatsAppBackground(bgCtx, sess, jid, txt, atts, quoted, cwMsgID, convID); err != nil {
						logger.Warn().Err(err).Str("session", sess.Session).Str("chatJid", jid).Msg("Chatwoot: failed to send to WhatsApp")
					}
				}(session, chatJid, content, attachments, quotedMsg, payload.ID, conversationID)
			}
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

	// Mark as pending BEFORE sending to prevent duplicate processing
	// when emitSentMessageEvent triggers the Chatwoot event handler
	cwservice.MarkPendingSentFromChatwoot(session.ID, chatJid, chatwootMsgID)
	defer cwservice.ClearPendingSentFromChatwoot(session.ID, chatJid, chatwootMsgID)

	// Mark incoming messages as read in WhatsApp when agent responds (like Evolution API)
	h.markMessagesAsRead(ctx, session, chatJid)

	var quoted *wpp.QuotedMessage
	if quotedMsg != nil {
		quoted = &wpp.QuotedMessage{
			MessageID: quotedMsg.MsgId,
			ChatJID:   quotedMsg.ChatJID,
			SenderJID: quotedMsg.SenderJID,
			Content:   quotedMsg.Content,
			IsFromMe:  quotedMsg.FromMe,
		}
		logger.Debug().
			Str("recipient", recipient).
			Str("quoteMessageID", quotedMsg.MsgId).
			Str("quoteChatJID", quotedMsg.ChatJID).
			Str("quoteSenderJID", quotedMsg.SenderJID).
			Str("quoteContent", quotedMsg.Content).
			Bool("quoteFromMe", quotedMsg.FromMe).
			Int("cwMsgID", chatwootMsgID).
			Msg("Chatwoot: sending message with quote")
	} else {
		logger.Debug().
			Str("recipient", recipient).
			Int("cwMsgID", chatwootMsgID).
			Msg("Chatwoot: sending message without quote")
	}

	for _, att := range attachments {
		if att.DataURL != "" {
			mediaData, mimeType, err := downloadMedia(att.DataURL)
			if err != nil {
				logger.Warn().Err(err).Str("url", att.DataURL).Msg("Chatwoot: failed to download attachment")
				continue
			}

			mediaType := util.GetMediaTypeFromURL(att.DataURL)
			switch mediaType {
			case "image":
				resp, err := h.wpp.SendImage(ctx, session.Session, recipient, mediaData, content, mimeType, quoted)
				if err != nil {
					logger.Warn().Err(err).Msg("Chatwoot: failed to send image")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
			case "video":
				resp, err := h.wpp.SendVideo(ctx, session.Session, recipient, mediaData, content, mimeType, quoted)
				if err != nil {
					logger.Warn().Err(err).Msg("Chatwoot: failed to send video")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
			case "audio":
				resp, err := h.wpp.SendAudio(ctx, session.Session, recipient, mediaData, mimeType, true, quoted)
				if err != nil {
					logger.Warn().Err(err).Msg("Chatwoot: failed to send audio")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, "", resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = "" // Clear content to prevent sending agent signature as separate text
				quoted = nil
			default:
				filename := att.FileName
				if filename == "" {
					filename = att.Extension
				}
				if filename == "" {
					// Try to extract filename from URL
					filename = util.ExtractFilenameFromURL(att.DataURL)
				}
				if filename == "" {
					filename = "document"
				}
				resp, err := h.wpp.SendDocument(ctx, session.Session, recipient, mediaData, filename, mimeType, quoted)
				if err != nil {
					logger.Warn().Err(err).Msg("Chatwoot: failed to send document")
				} else {
					h.saveOutgoingMessage(ctx, session, chatJid, content, resp.ID, chatwootMsgID, chatwootConvID)
				}
				content = ""
				quoted = nil
			}
		}
	}

	if content != "" {
		resp, err := h.wpp.SendTextQuoted(ctx, session.Session, recipient, content, quoted)
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

// enqueueToWhatsApp enqueues a message to be sent to WhatsApp via the queue
func (h *Handler) enqueueToWhatsApp(ctx context.Context, session *model.Session, chatJid, content string, attachments []core.Attachment, quotedMsg *core.QuotedMessageInfo, chatwootMsgID, chatwootConvID int) {
	var quotedInfo *queue.QuotedInfo
	if quotedMsg != nil {
		quotedInfo = &queue.QuotedInfo{
			MsgID:     quotedMsg.MsgId,
			ChatJID:   quotedMsg.ChatJID,
			SenderJID: quotedMsg.SenderJID,
			Content:   quotedMsg.Content,
			FromMe:    quotedMsg.FromMe,
		}
	}

	msgType := queue.MsgTypeSendText
	if len(attachments) > 0 {
		msgType = queue.MsgTypeSendMedia
	}

	queueMsg := &queue.CWToWAMessage{
		ChatJID:        chatJid,
		Content:        content,
		Attachments:    attachments,
		QuotedMsg:      quotedInfo,
		ChatwootMsgID:  chatwootMsgID,
		ChatwootConvID: chatwootConvID,
	}

	if err := h.queueProducer.PublishCWToWA(ctx, session.ID, msgType, queueMsg); err != nil {
		logger.Warn().
			Err(err).
			Str("session", session.Session).
			Str("chatJid", chatJid).
			Int("cwMsgId", chatwootMsgID).
			Msg("Failed to enqueue message, falling back to direct processing")

		// Fallback to direct processing
		go func() {
			bgCtx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
			defer cancel()
			if err := h.sendToWhatsAppBackground(bgCtx, session, chatJid, content, attachments, quotedMsg, chatwootMsgID, chatwootConvID); err != nil {
				logger.Warn().Err(err).Str("session", session.Session).Str("chatJid", chatJid).Msg("Chatwoot: failed to send to WhatsApp")
			}
		}()
		return
	}

	logger.Debug().
		Str("session", session.Session).
		Str("chatJid", chatJid).
		Int("cwMsgId", chatwootMsgID).
		Int("attachments", len(attachments)).
		Msg("Message enqueued for WhatsApp delivery")
}

// SendToWhatsAppFromQueue processes a message from the queue and sends it to WhatsApp
func (h *Handler) SendToWhatsAppFromQueue(ctx context.Context, sessionID string, data *queue.CWToWAMessage) error {
	session, err := h.sessionService.GetByID(sessionID)
	if err != nil || session == nil {
		return fmt.Errorf("session not found: %s", sessionID)
	}

	if session.Status != model.StatusConnected {
		return fmt.Errorf("session not connected: %s", sessionID)
	}

	var quotedMsg *core.QuotedMessageInfo
	if data.QuotedMsg != nil {
		quotedMsg = cwservice.QuotedMessageFromQueue(data.QuotedMsg)
	}

	return h.sendToWhatsAppBackground(ctx, session, data.ChatJID, data.Content, data.Attachments, quotedMsg, data.ChatwootMsgID, data.ChatwootConvID)
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
		if _, err := h.wpp.DeleteMessage(ctx, session.Session, msg.ChatJID, msg.MsgId, msg.FromMe); err != nil {
			logger.Warn().Err(err).Str("messageId", msg.MsgId).Msg("Chatwoot: failed to delete from WhatsApp")
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

// SyncContacts handles POST /sessions/:sessionId/chatwoot/sync/contacts
// @Summary Sync contacts to Chatwoot (async)
// @Description Start async synchronization of contacts from message history to Chatwoot
// @Tags         chatwoot
// @Produce json
// @Param sessionId path string true "Session name"
// @Success 202 {object} core.SyncStatus
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security Authorization
// @Router /sessions/{sessionId}/chatwoot/sync/contacts [post]
func (h *Handler) SyncContacts(c *gin.Context) {
	h.handleSync(c, "contacts")
}

// SyncMessages handles POST /sessions/:sessionId/chatwoot/sync/messages
// @Summary Sync messages to Chatwoot (async)
// @Description Start async synchronization of message history to Chatwoot. By default imports ALL messages. Use ?days=N to limit.
// @Tags         chatwoot
// @Produce json
// @Param sessionId path string true "Session name"
// @Param days query int false "Limit to last N days (default: 0 = all messages)"
// @Success 202 {object} core.SyncStatus
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security Authorization
// @Router /sessions/{sessionId}/chatwoot/sync/messages [post]
func (h *Handler) SyncMessages(c *gin.Context) {
	h.handleSync(c, "messages")
}

// SyncAll handles POST /sessions/:sessionId/chatwoot/sync
// @Summary Full sync to Chatwoot (async)
// @Description Start async synchronization of all contacts and messages to Chatwoot. By default imports ALL messages. Use ?days=N to limit.
// @Tags         chatwoot
// @Produce json
// @Param sessionId path string true "Session name"
// @Param days query int false "Limit to last N days (default: 0 = all messages)"
// @Success 202 {object} core.SyncStatus
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security Authorization
// @Router /sessions/{sessionId}/chatwoot/sync [post]
func (h *Handler) SyncAll(c *gin.Context) {
	h.handleSync(c, "all")
}

func (h *Handler) handleSync(c *gin.Context, syncType string) {
	sessionId := c.Param("sessionId")
	session, err := h.sessionService.Get(sessionId)
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
		wpp:       h.wpp,
		sessionId: sessionId,
	}

	// Use whatsmeow's native LID resolver instead of database queries
	lidResolver := &whatsappLIDResolver{session: session}

	dbSync, err := cwsync.NewChatwootDBSync(cfg, h.database.Messages, contactsAdapter, h.database.Media, session.ID, lidResolver)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to chatwoot db: " + err.Error()})
		return
	}

	// Default: import ALL messages (daysLimit=0)
	// Use ?days=N to limit to last N days
	daysLimit := 0
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

// GetSyncStatusHandler handles GET /sessions/:sessionId/chatwoot/sync/status
// @Summary Get sync status
// @Description Get the current sync status for a session
// @Tags         chatwoot
// @Produce json
// @Param sessionId path string true "Session name"
// @Success 200 {object} core.SyncStatus
// @Failure 404 {object} map[string]interface{}
// @Security Authorization
// @Router /sessions/{sessionId}/chatwoot/sync/status [get]
func (h *Handler) GetSyncStatusHandler(c *gin.Context) {
	sessionId := c.Param("sessionId")
	session, err := h.sessionService.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	status := cwsync.GetSyncStatus(session.ID)
	c.JSON(http.StatusOK, status)
}

// ResetChatwoot handles POST /sessions/:sessionId/chatwoot/reset
// @Summary Reset Chatwoot data for testing
// @Description Delete all Chatwoot contacts, conversations and messages (except bot)
// @Tags         chatwoot
// @Produce json
// @Security Authorization
// @Param sessionId path string true "Session name"
// @Success 200 {object} map[string]interface{}
// @Router /sessions/{sessionId}/chatwoot/reset [post]
func (h *Handler) ResetChatwoot(c *gin.Context) {
	sessionId := c.Param("sessionId")
	session, err := h.sessionService.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	cfg, err := h.service.GetConfig(c.Request.Context(), session.ID)
	if err != nil || cfg == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "chatwoot not configured"})
		return
	}

	// Use whatsmeow's native LID resolver instead of database queries
	lidResolver := &whatsappLIDResolver{session: session}

	dbSync, err := cwsync.NewChatwootDBSync(cfg, nil, nil, nil, session.ID, lidResolver)
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
		Str("session", sessionId).
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

// ResolveAllConversations handles POST /sessions/:sessionId/chatwoot/resolve-all
// @Summary Resolve all open conversations
// @Description Set all open conversations to resolved status
// @Tags         chatwoot
// @Produce json
// @Security Authorization
// @Param sessionId path string true "Session name"
// @Success 200 {object} map[string]interface{}
// @Router /sessions/{sessionId}/chatwoot/resolve-all [post]
func (h *Handler) ResolveAllConversations(c *gin.Context) {
	sessionId := c.Param("sessionId")
	session, err := h.sessionService.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	cfg, err := h.service.GetConfig(c.Request.Context(), session.ID)
	if err != nil || cfg == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "chatwoot not configured"})
		return
	}

	lidResolver := &whatsappLIDResolver{session: session}

	dbSync, err := cwsync.NewChatwootDBSync(cfg, nil, nil, nil, session.ID, lidResolver)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to database: " + err.Error()})
		return
	}
	defer dbSync.Close()

	resolved, err := dbSync.ResolveAllConversations(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info().
		Str("session", sessionId).
		Int("resolved", resolved).
		Msg("Chatwoot: resolved all conversations")

	c.JSON(http.StatusOK, gin.H{
		"message":  "conversations resolved",
		"resolved": resolved,
	})
}

// GetConversationsStats handles GET /sessions/:sessionId/chatwoot/conversations/stats
// @Summary Get conversations statistics
// @Description Get count of open conversations
// @Tags         chatwoot
// @Produce json
// @Security Authorization
// @Param sessionId path string true "Session name"
// @Success 200 {object} map[string]interface{}
// @Router /sessions/{sessionId}/chatwoot/conversations/stats [get]
func (h *Handler) GetConversationsStats(c *gin.Context) {
	sessionId := c.Param("sessionId")
	session, err := h.sessionService.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	cfg, err := h.service.GetConfig(c.Request.Context(), session.ID)
	if err != nil || cfg == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "chatwoot not configured"})
		return
	}

	lidResolver := &whatsappLIDResolver{session: session}

	dbSync, err := cwsync.NewChatwootDBSync(cfg, nil, nil, nil, session.ID, lidResolver)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to database: " + err.Error()})
		return
	}
	defer dbSync.Close()

	openCount, err := dbSync.GetOpenConversationsCount(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"open": openCount,
	})
}

// =============================================================================
// ADAPTERS
// =============================================================================

type whatsappContactsAdapter struct {
	wpp       *wpp.Service
	sessionId string
}

func (a *whatsappContactsAdapter) GetAllContacts(ctx context.Context) ([]core.WhatsAppContact, error) {
	contactsMap, err := a.wpp.GetContacts(ctx, a.sessionId)
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
		pic, err = a.wpp.GetGroupPicture(ctx, a.sessionId, jid)
	} else {
		phone := util.ExtractPhoneFromJID(jid)
		if phone == "" {
			return "", nil
		}
		pic, err = a.wpp.GetProfilePicture(ctx, a.sessionId, phone)
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
	info, err := a.wpp.GetGroupInfo(ctx, a.sessionId, groupJID)
	if err != nil {
		return "", err
	}
	if info == nil {
		return "", nil
	}
	return info.Name, nil
}

func (a *whatsappContactsAdapter) GetAllGroupNames(ctx context.Context) (map[string]string, error) {
	groups, err := a.wpp.GetJoinedGroups(ctx, a.sessionId)
	if err != nil {
		return nil, err
	}

	result := make(map[string]string, len(groups))
	for _, g := range groups {
		if g != nil && g.JID.String() != "" {
			result[g.JID.String()] = g.Name
		}
	}
	return result, nil
}

// whatsappLIDResolver implements util.LIDResolver using whatsmeow's native LID store
type whatsappLIDResolver struct {
	session *model.Session
}

func (r *whatsappLIDResolver) ResolveLIDToPhone(ctx context.Context, lidNumber string) string {
	if r.session == nil || r.session.Client == nil || r.session.Client.Store == nil || r.session.Client.Store.LIDs == nil {
		return ""
	}

	// Create LID JID from number
	lidJID := types.JID{User: lidNumber, Server: types.HiddenUserServer}

	pnJID, err := r.session.Client.Store.LIDs.GetPNForLID(ctx, lidJID)
	if err != nil || pnJID.IsEmpty() {
		return ""
	}

	return pnJID.User
}

// =============================================================================
// READ RECEIPTS
// =============================================================================

// markMessagesAsRead sends read receipts to WhatsApp for unread incoming messages
// This is called when agent responds in Chatwoot (like Evolution API MESSAGE_READ feature)
func (h *Handler) markMessagesAsRead(ctx context.Context, session *model.Session, chatJid string) {
	if h.database == nil {
		return
	}

	// Get unread incoming messages from this chat (limit 50 to avoid huge batches)
	unreadMsgs, err := h.database.Messages.GetUnreadIncomingByChat(ctx, session.ID, chatJid, 50)
	if err != nil {
		logger.Debug().Err(err).Str("session", session.Session).Str("chatJid", chatJid).Msg("Chatwoot: failed to get unread messages")
		return
	}

	if len(unreadMsgs) == 0 {
		return
	}

	// Extract message IDs and phone number
	msgIds := make([]string, len(unreadMsgs))
	for i, msg := range unreadMsgs {
		msgIds[i] = msg.MsgId
	}

	// Extract phone from JID (remove @s.whatsapp.net or @g.us)
	phone := strings.Split(chatJid, "@")[0]

	// Send read receipt to WhatsApp
	if err := h.wpp.MarkRead(ctx, session.Session, phone, msgIds); err != nil {
		logger.Debug().Err(err).Str("session", session.Session).Str("chatJid", chatJid).Int("count", len(msgIds)).Msg("Chatwoot: failed to send read receipts to WhatsApp")
		return
	}

	// Mark messages as read in database
	affected, err := h.database.Messages.MarkAsReadByAgent(ctx, session.ID, msgIds)
	if err != nil {
		logger.Debug().Err(err).Str("session", session.Session).Msg("Chatwoot: failed to mark messages as read in database")
		return
	}

	logger.Debug().
		Str("session", session.Session).
		Str("chatJid", chatJid).
		Int64("marked", affected).
		Msg("Chatwoot: marked messages as read in WhatsApp")
}
