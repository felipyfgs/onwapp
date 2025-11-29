package chatwoot

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// Service handles Chatwoot integration business logic
type Service struct {
	repo     *Repository
	database *db.Database
	baseURL  string // Server base URL for webhooks
}

// NewService creates a new Chatwoot service
func NewService(repo *Repository, database *db.Database, baseURL string) *Service {
	return &Service{
		repo:     repo,
		database: database,
		baseURL:  strings.TrimSuffix(baseURL, "/"),
	}
}

// SetConfig creates or updates Chatwoot configuration for a session
func (s *Service) SetConfig(ctx context.Context, sessionID, sessionName string, req *SetConfigRequest) (*Config, error) {
	webhookURL := fmt.Sprintf("%s/chatwoot/webhook/%s", s.baseURL, sessionName)

	cfg := &Config{
		SessionID:           sessionID,
		Enabled:             req.Enabled,
		URL:                 strings.TrimSuffix(req.URL, "/"),
		APIAccessToken:      req.APIAccessToken,
		AccountID:           req.AccountID,
		InboxName:           req.InboxName,
		SignMsg:             req.SignMsg,
		SignDelimiter:       req.SignDelimiter,
		ReopenConversation:  req.ReopenConversation,
		ConversationPending: req.ConversationPending,
		MergeBrazilContacts: req.MergeBrazilContacts,
		ImportContacts:      req.ImportContacts,
		ImportMessages:      req.ImportMessages,
		DaysLimitImport:     req.DaysLimitImport,
		IgnoreJids:          req.IgnoreJids,
		AutoCreate:          req.AutoCreate,
		WebhookURL:          webhookURL,
	}

	if cfg.InboxName == "" {
		cfg.InboxName = sessionName
	}

	// Save configuration
	savedCfg, err := s.repo.Upsert(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to save chatwoot config: %w", err)
	}

	// Auto-create inbox if enabled
	if req.Enabled && req.AutoCreate {
		if err := s.initInbox(ctx, savedCfg); err != nil {
			logger.Warn().Err(err).Str("session", sessionName).Msg("Failed to auto-create Chatwoot inbox")
		}
	}

	return savedCfg, nil
}

// GetConfig retrieves Chatwoot configuration for a session
func (s *Service) GetConfig(ctx context.Context, sessionID string) (*Config, error) {
	cfg, err := s.repo.GetBySessionID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if cfg == nil {
		// Return empty config if not found
		return &Config{
			SessionID:  sessionID,
			Enabled:    false,
			WebhookURL: "",
		}, nil
	}

	return cfg, nil
}

// GetEnabledConfig retrieves enabled Chatwoot configuration
func (s *Service) GetEnabledConfig(ctx context.Context, sessionID string) (*Config, error) {
	return s.repo.GetEnabledBySessionID(ctx, sessionID)
}

// DeleteConfig removes Chatwoot configuration for a session
func (s *Service) DeleteConfig(ctx context.Context, sessionID string) error {
	return s.repo.Delete(ctx, sessionID)
}

// initInbox creates or retrieves the inbox in Chatwoot
func (s *Service) initInbox(ctx context.Context, cfg *Config) error {
	client := NewClient(cfg.URL, cfg.APIAccessToken, cfg.AccountID)

	inbox, err := client.GetOrCreateInbox(ctx, cfg.InboxName, cfg.WebhookURL)
	if err != nil {
		return err
	}

	// Update config with inbox ID
	if err := s.repo.UpdateInboxID(ctx, cfg.SessionID, inbox.ID); err != nil {
		return err
	}

	cfg.InboxID = inbox.ID
	logger.Info().
		Str("sessionId", cfg.SessionID).
		Int("inboxId", inbox.ID).
		Str("inboxName", inbox.Name).
		Msg("Chatwoot inbox initialized")

	return nil
}

// ProcessIncomingMessage processes a WhatsApp message and sends to Chatwoot
func (s *Service) ProcessIncomingMessage(ctx context.Context, session *model.Session, evt *events.Message) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		logger.Debug().Err(err).Str("sessionId", session.ID).Msg("Chatwoot: error getting config")
		return nil
	}
	if cfg == nil {
		return nil // Chatwoot not enabled for this session
	}

	logger.Debug().
		Str("session", session.Name).
		Str("chatJid", evt.Info.Chat.String()).
		Msg("Chatwoot: processing incoming message")

	// Check if JID should be ignored
	remoteJid := evt.Info.Chat.String()
	if s.shouldIgnoreJid(cfg, remoteJid) {
		logger.Debug().Str("jid", remoteJid).Msg("Chatwoot: ignoring JID")
		return nil
	}

	client := NewClient(cfg.URL, cfg.APIAccessToken, cfg.AccountID)

	// Ensure inbox exists
	if cfg.InboxID == 0 {
		if err := s.initInbox(ctx, cfg); err != nil {
			return fmt.Errorf("failed to init inbox: %w", err)
		}
	}

	// Get or create contact
	isGroup := strings.HasSuffix(remoteJid, "@g.us")
	phoneNumber := strings.Split(remoteJid, "@")[0]
	contactName := evt.Info.PushName
	if contactName == "" {
		contactName = phoneNumber
	}

	contact, err := client.GetOrCreateContact(ctx, cfg.InboxID, phoneNumber, remoteJid, contactName, "", isGroup)
	if err != nil {
		return fmt.Errorf("failed to get/create contact: %w", err)
	}

	// Get or create conversation
	status := "open"
	if cfg.ConversationPending {
		status = "pending"
	}

	conv, err := client.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, status)
	if err != nil {
		return fmt.Errorf("failed to get/create conversation: %w", err)
	}

	// Extract message content
	content := s.extractMessageContent(evt)
	if content == "" {
		return nil
	}

	// Create message in Chatwoot
	sourceID := fmt.Sprintf("WAID:%s", evt.Info.ID)
	msgReq := &CreateMessageRequest{
		Content:     content,
		MessageType: "incoming",
		SourceID:    sourceID,
	}

	// Check if this is a reply/quote message and add in_reply_to
	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.ChatwootMessageID,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
		logger.Info().
			Int("in_reply_to", replyInfo.ChatwootMessageID).
			Str("in_reply_to_external_id", replyInfo.WhatsAppMessageID).
			Interface("content_attributes", msgReq.ContentAttributes).
			Msg("Chatwoot: sending message with reply reference (WA->CW)")
	}

	cwMsg, err := client.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to create message in chatwoot: %w", err)
	}

	// Save Chatwoot message ID for quote/reply support
	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateChatwootFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conv.ID, sourceID); err != nil {
			logger.Warn().Err(err).
				Str("messageId", evt.Info.ID).
				Int("chatwootMessageId", cwMsg.ID).
				Msg("Chatwoot: failed to save chatwoot message ID")
		} else {
			logger.Debug().
				Str("messageId", evt.Info.ID).
				Int("chatwootMessageId", cwMsg.ID).
				Msg("Chatwoot: saved chatwoot message ID")
		}
	}

	logger.Info().
		Str("session", session.Name).
		Str("chatJid", remoteJid).
		Int("conversationId", conv.ID).
		Str("content", content).
		Msg("Chatwoot: message sent successfully")

	return nil
}

// ProcessOutgoingMessage processes outgoing messages sent directly from WhatsApp (not via Chatwoot)
// This syncs messages sent by the agent using WhatsApp directly to Chatwoot
func (s *Service) ProcessOutgoingMessage(ctx context.Context, session *model.Session, evt *events.Message) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		return nil
	}
	if cfg == nil {
		return nil // Chatwoot not enabled for this session
	}

	remoteJid := evt.Info.Chat.String()
	if s.shouldIgnoreJid(cfg, remoteJid) {
		return nil
	}

	// Extract message content
	content := s.extractMessageContent(evt)
	if content == "" {
		return nil // Skip empty messages
	}

	sourceID := fmt.Sprintf("WAID:%s", evt.Info.ID)

	// Check if this message was already sent by Chatwoot (avoid duplicates)
	// If the message has a sourceID that matches, it was sent from Chatwoot
	if s.database != nil {
		existingMsg, _ := s.database.Messages.GetByMessageID(ctx, session.ID, evt.Info.ID)
		if existingMsg != nil && existingMsg.ChatwootMessageID != nil && *existingMsg.ChatwootMessageID > 0 {
			// Message already synced from Chatwoot, skip
			logger.Debug().
				Str("messageId", evt.Info.ID).
				Int("chatwootMessageId", *existingMsg.ChatwootMessageID).
				Msg("Chatwoot: skipping outgoing message - already synced from Chatwoot")
			return nil
		}
	}

	logger.Debug().
		Str("session", session.Name).
		Str("chatJid", remoteJid).
		Str("content", content).
		Msg("Chatwoot: processing outgoing message from WhatsApp")

	client := NewClient(cfg.URL, cfg.APIAccessToken, cfg.AccountID)

	// Ensure inbox exists
	if cfg.InboxID == 0 {
		if err := s.initInbox(ctx, cfg); err != nil {
			return fmt.Errorf("failed to init inbox: %w", err)
		}
	}

	// Get contact and conversation
	isGroup := strings.HasSuffix(remoteJid, "@g.us")
	phoneNumber := strings.Split(remoteJid, "@")[0]

	contact, err := client.GetOrCreateContact(ctx, cfg.InboxID, phoneNumber, remoteJid, phoneNumber, "", isGroup)
	if err != nil {
		return fmt.Errorf("failed to get/create contact: %w", err)
	}

	conv, err := client.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, "open")
	if err != nil {
		return fmt.Errorf("failed to get/create conversation: %w", err)
	}

	// Create outgoing message in Chatwoot
	msgReq := &CreateMessageRequest{
		Content:     content,
		MessageType: "outgoing",
		SourceID:    sourceID,
	}

	// Check if this is a reply/quote message and add in_reply_to
	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.ChatwootMessageID,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	cwMsg, err := client.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to create outgoing message in chatwoot: %w", err)
	}

	// Save Chatwoot message ID for quote/reply support
	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateChatwootFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conv.ID, sourceID); err != nil {
			logger.Warn().Err(err).
				Str("messageId", evt.Info.ID).
				Int("chatwootMessageId", cwMsg.ID).
				Msg("Chatwoot: failed to save chatwoot message ID for outgoing message")
		}
	}

	logger.Info().
		Str("session", session.Name).
		Str("chatJid", remoteJid).
		Int("conversationId", conv.ID).
		Str("content", content).
		Msg("Chatwoot: outgoing message synced successfully")

	return nil
}

// HandleWebhook processes incoming webhooks from Chatwoot
func (s *Service) HandleWebhook(ctx context.Context, sessionID string, payload *WebhookPayload) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		return fmt.Errorf("chatwoot not enabled for session: %s", sessionID)
	}

	logger.Debug().
		Str("sessionId", sessionID).
		Str("event", payload.Event).
		Msg("Received Chatwoot webhook")

	switch payload.Event {
	case "message_created":
		return s.handleMessageCreated(ctx, sessionID, cfg, payload)
	case "message_updated":
		return s.handleMessageUpdated(ctx, sessionID, cfg, payload)
	case "conversation_status_changed":
		return s.handleConversationStatusChanged(ctx, sessionID, cfg, payload)
	default:
		logger.Debug().Str("event", payload.Event).Msg("Unhandled Chatwoot webhook event")
	}

	return nil
}

func (s *Service) handleMessageCreated(ctx context.Context, sessionID string, cfg *Config, payload *WebhookPayload) error {
	// Skip if not an outgoing message from agent
	if payload.MessageType != "outgoing" {
		return nil
	}

	// Skip private notes
	if payload.Private {
		return nil
	}

	// Skip if message already originated from WhatsApp
	if payload.Conversation != nil && len(payload.Conversation.Messages) > 0 {
		for _, msg := range payload.Conversation.Messages {
			if msg.SourceID != "" && strings.HasPrefix(msg.SourceID, "WAID:") && msg.ID == payload.ID {
				return nil
			}
		}
	}

	// Get chat JID from conversation meta
	if payload.Conversation == nil || payload.Conversation.Meta == nil || payload.Conversation.Meta.Sender == nil {
		return fmt.Errorf("missing conversation metadata")
	}

	chatJid := payload.Conversation.Meta.Sender.Identifier
	if chatJid == "" {
		phoneNumber := strings.TrimPrefix(payload.Conversation.Meta.Sender.PhoneNumber, "+")
		chatJid = phoneNumber + "@s.whatsapp.net"
	}

	// Format message content
	content := payload.Content
	if cfg.SignMsg && payload.Sender != nil && payload.Sender.AvailableName != "" {
		delimiter := cfg.SignDelimiter
		if delimiter == "" {
			delimiter = "\n"
		}
		delimiter = strings.ReplaceAll(delimiter, "\\n", "\n")
		content = fmt.Sprintf("*%s:*%s%s", payload.Sender.AvailableName, delimiter, content)
	}

	// Convert Chatwoot markdown to WhatsApp format
	content = s.convertMarkdown(content)

	// Return data for handler to send via WhatsApp
	// The actual sending will be done by the handler which has access to the session
	logger.Info().
		Str("sessionId", sessionID).
		Str("chatJid", chatJid).
		Str("content", content).
		Msg("Message to send to WhatsApp from Chatwoot")

	return nil
}

func (s *Service) handleMessageUpdated(ctx context.Context, sessionID string, cfg *Config, payload *WebhookPayload) error {
	// Handle message deletion
	if payload.ContentAttrs != nil {
		if deleted, ok := payload.ContentAttrs["deleted"].(bool); ok && deleted {
			logger.Debug().
				Str("sessionId", sessionID).
				Int("messageId", payload.ID).
				Msg("Message deleted in Chatwoot")
		}
	}
	return nil
}

func (s *Service) handleConversationStatusChanged(ctx context.Context, sessionID string, cfg *Config, payload *WebhookPayload) error {
	// Handle conversation resolved/reopened
	if payload.Conversation != nil {
		logger.Debug().
			Str("sessionId", sessionID).
			Int("conversationId", payload.Conversation.ID).
			Str("status", payload.Conversation.Status).
			Msg("Conversation status changed")
	}
	return nil
}

// Helper methods

func (s *Service) shouldIgnoreJid(cfg *Config, jid string) bool {
	if len(cfg.IgnoreJids) == 0 {
		return false
	}

	for _, ignoreJid := range cfg.IgnoreJids {
		if ignoreJid == "@g.us" && strings.HasSuffix(jid, "@g.us") {
			return true
		}
		if ignoreJid == "@s.whatsapp.net" && strings.HasSuffix(jid, "@s.whatsapp.net") {
			return true
		}
		if jid == ignoreJid {
			return true
		}
	}

	return false
}

func (s *Service) extractMessageContent(evt *events.Message) string {
	msg := evt.Message

	if msg == nil {
		return ""
	}

	// Text messages
	if msg.GetConversation() != "" {
		return msg.GetConversation()
	}
	if ext := msg.GetExtendedTextMessage(); ext != nil {
		return ext.GetText()
	}

	// Media with caption
	if img := msg.GetImageMessage(); img != nil {
		return img.GetCaption()
	}
	if vid := msg.GetVideoMessage(); vid != nil {
		return vid.GetCaption()
	}
	if doc := msg.GetDocumentMessage(); doc != nil {
		caption := doc.GetCaption()
		if caption != "" {
			return caption
		}
		return doc.GetFileName()
	}

	// Location
	if loc := msg.GetLocationMessage(); loc != nil {
		return fmt.Sprintf("📍 Location: https://www.google.com/maps?q=%f,%f",
			loc.GetDegreesLatitude(), loc.GetDegreesLongitude())
	}

	// Contact
	if contact := msg.GetContactMessage(); contact != nil {
		return fmt.Sprintf("👤 Contact: %s", contact.GetDisplayName())
	}

	// Sticker
	if msg.GetStickerMessage() != nil {
		return "🎨 Sticker"
	}

	// Audio
	if msg.GetAudioMessage() != nil {
		return "🎵 Audio"
	}

	return ""
}

// ReplyInfo holds information about a reply reference for Chatwoot
type ReplyInfo struct {
	ChatwootMessageID  int    // Chatwoot message ID to reply to
	WhatsAppMessageID  string // Original WhatsApp message ID (stanzaId)
}

// extractReplyInfo extracts reply/quote information from a WhatsApp message
func (s *Service) extractReplyInfo(ctx context.Context, sessionID string, evt *events.Message) *ReplyInfo {
	if s.database == nil {
		return nil
	}

	msg := evt.Message
	if msg == nil {
		return nil
	}

	// Extract stanzaId from ContextInfo - check various message types
	var stanzaID string

	// Check ExtendedTextMessage (most common for text replies)
	if ext := msg.GetExtendedTextMessage(); ext != nil {
		if ctx := ext.GetContextInfo(); ctx != nil {
			stanzaID = ctx.GetStanzaID()
		}
	}

	// Check ImageMessage
	if stanzaID == "" {
		if img := msg.GetImageMessage(); img != nil {
			if ctx := img.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}

	// Check VideoMessage
	if stanzaID == "" {
		if vid := msg.GetVideoMessage(); vid != nil {
			if ctx := vid.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}

	// Check AudioMessage
	if stanzaID == "" {
		if aud := msg.GetAudioMessage(); aud != nil {
			if ctx := aud.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}

	// Check DocumentMessage
	if stanzaID == "" {
		if doc := msg.GetDocumentMessage(); doc != nil {
			if ctx := doc.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}

	// Check StickerMessage
	if stanzaID == "" {
		if stk := msg.GetStickerMessage(); stk != nil {
			if ctx := stk.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}

	if stanzaID == "" {
		return nil // Not a reply message
	}

	logger.Debug().
		Str("stanzaId", stanzaID).
		Str("sessionId", sessionID).
		Msg("Chatwoot: found reply stanzaId, looking up original message")

	// Find original message by WhatsApp message ID
	originalMsg, err := s.database.Messages.GetByMessageID(ctx, sessionID, stanzaID)
	if err != nil {
		logger.Warn().Err(err).Str("stanzaId", stanzaID).Msg("Chatwoot: error looking up original message")
		return nil
	}
	if originalMsg == nil {
		logger.Debug().Str("stanzaId", stanzaID).Msg("Chatwoot: original message not found in database")
		return nil
	}

	// Check if original message has Chatwoot message ID
	if originalMsg.ChatwootMessageID == nil || *originalMsg.ChatwootMessageID == 0 {
		logger.Debug().Str("stanzaId", stanzaID).Msg("Chatwoot: original message has no Chatwoot message ID")
		return nil
	}

	logger.Info().
		Str("stanzaId", stanzaID).
		Int("chatwootMessageId", *originalMsg.ChatwootMessageID).
		Msg("Chatwoot: found original message for reply")

	return &ReplyInfo{
		ChatwootMessageID:  *originalMsg.ChatwootMessageID,
		WhatsAppMessageID:  stanzaID,
	}
}

func (s *Service) convertMarkdown(content string) string {
	// Convert Chatwoot markdown to WhatsApp format
	// Single * to _italic_ (WhatsApp uses _ for italic)
	// Double ** to *bold* (WhatsApp uses single * for bold)
	// ~~ to ~ for strikethrough

	// This is a simplified conversion - full implementation would need proper regex
	content = strings.ReplaceAll(content, "**", "§BOLD§")
	content = strings.ReplaceAll(content, "*", "_")
	content = strings.ReplaceAll(content, "§BOLD§", "*")
	content = strings.ReplaceAll(content, "~~", "~")

	return content
}

// QuotedMessageInfo holds information about a quoted message for WhatsApp
type QuotedMessageInfo struct {
	MessageID string `json:"messageId"` // WhatsApp message ID
	ChatJID   string `json:"chatJid"`   // Chat JID
	SenderJID string `json:"senderJid"` // Sender JID
	Content   string `json:"content"`   // Original message content
	IsFromMe  bool   `json:"isFromMe"`  // Was message from me
}

// GetWebhookDataForSending extracts data from webhook for sending via WhatsApp
func (s *Service) GetWebhookDataForSending(ctx context.Context, sessionID string, payload *WebhookPayload) (chatJid, content string, attachments []Attachment, err error) {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		logger.Debug().Str("sessionId", sessionID).Msg("Chatwoot: config not enabled, skipping")
		return "", "", nil, fmt.Errorf("chatwoot not enabled")
	}

	// Skip non-outgoing or private messages
	// Accept both "outgoing" string and "1" (numeric representation)
	isOutgoing := payload.MessageType == "outgoing" || payload.MessageType == "1"
	if !isOutgoing || payload.Private {
		logger.Debug().
			Str("sessionId", sessionID).
			Str("messageType", payload.MessageType).
			Bool("private", payload.Private).
			Msg("Chatwoot: skipping non-outgoing or private message")
		return "", "", nil, nil
	}

	// Skip messages from WhatsApp (already sent via API)
	if payload.Conversation != nil && len(payload.Conversation.Messages) > 0 {
		for _, msg := range payload.Conversation.Messages {
			if strings.HasPrefix(msg.SourceID, "WAID:") && msg.ID == payload.ID {
				logger.Debug().
					Str("sessionId", sessionID).
					Int("messageId", msg.ID).
					Str("sourceId", msg.SourceID).
					Msg("Chatwoot: skipping message already from WhatsApp")
				return "", "", nil, nil
			}
		}
	}

	// Get chat JID
	if payload.Conversation == nil || payload.Conversation.Meta == nil || payload.Conversation.Meta.Sender == nil {
		logger.Debug().
			Str("sessionId", sessionID).
			Bool("hasConversation", payload.Conversation != nil).
			Bool("hasMeta", payload.Conversation != nil && payload.Conversation.Meta != nil).
			Bool("hasSender", payload.Conversation != nil && payload.Conversation.Meta != nil && payload.Conversation.Meta.Sender != nil).
			Msg("Chatwoot: missing conversation metadata")
		return "", "", nil, fmt.Errorf("missing conversation metadata")
	}

	chatJid = payload.Conversation.Meta.Sender.Identifier
	if chatJid == "" {
		phoneNumber := strings.TrimPrefix(payload.Conversation.Meta.Sender.PhoneNumber, "+")
		chatJid = phoneNumber + "@s.whatsapp.net"
	}

	// Format content
	content = payload.Content
	if cfg.SignMsg && payload.Sender != nil && payload.Sender.AvailableName != "" {
		delimiter := cfg.SignDelimiter
		if delimiter == "" {
			delimiter = "\n"
		}
		delimiter = strings.ReplaceAll(delimiter, "\\n", "\n")
		content = fmt.Sprintf("*%s:*%s%s", payload.Sender.AvailableName, delimiter, content)
	}

	content = s.convertMarkdown(content)
	attachments = payload.Attachments

	return chatJid, content, attachments, nil
}

// GetQuotedMessage finds the original message being replied to from Chatwoot
func (s *Service) GetQuotedMessage(ctx context.Context, sessionID string, payload *WebhookPayload) *QuotedMessageInfo {
	if s.database == nil {
		return nil
	}

	// Check if this message is a reply (has content_attributes.in_reply_to)
	if payload.ContentAttrs == nil {
		return nil
	}

	inReplyTo, ok := payload.ContentAttrs["in_reply_to"]
	if !ok || inReplyTo == nil {
		return nil
	}

	// Convert to int (can be float64 from JSON)
	var chatwootMsgID int
	switch v := inReplyTo.(type) {
	case float64:
		chatwootMsgID = int(v)
	case int:
		chatwootMsgID = v
	case int64:
		chatwootMsgID = int(v)
	default:
		logger.Debug().Interface("in_reply_to", inReplyTo).Msg("Chatwoot: invalid in_reply_to type")
		return nil
	}

	logger.Debug().
		Int("chatwootMessageId", chatwootMsgID).
		Str("sessionId", sessionID).
		Msg("Chatwoot: looking up quoted message")

	// Find message by Chatwoot message ID
	msg, err := s.database.Messages.GetByChatwootMessageID(ctx, sessionID, chatwootMsgID)
	if err != nil {
		logger.Warn().Err(err).Int("chatwootMessageId", chatwootMsgID).Msg("Chatwoot: error looking up quoted message")
		return nil
	}
	if msg == nil {
		logger.Debug().Int("chatwootMessageId", chatwootMsgID).Msg("Chatwoot: quoted message not found")
		return nil
	}

	logger.Info().
		Str("messageId", msg.MessageID).
		Str("chatJid", msg.ChatJID).
		Bool("isFromMe", msg.IsFromMe).
		Msg("Chatwoot: found quoted message for reply")

	return &QuotedMessageInfo{
		MessageID: msg.MessageID,
		ChatJID:   msg.ChatJID,
		SenderJID: msg.SenderJID,
		Content:   msg.Content,
		IsFromMe:  msg.IsFromMe,
	}
}

// ProcessReactionMessage handles reaction events from WhatsApp Message and sends them to Chatwoot
func (s *Service) ProcessReactionMessage(ctx context.Context, session *model.Session, emoji, targetMsgID, remoteJid, senderJid string, isFromMe bool) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil || cfg == nil {
		return nil
	}

	if cfg.InboxID == 0 {
		return nil
	}

	logger.Debug().
		Str("emoji", emoji).
		Str("targetMsgId", targetMsgID).
		Str("remoteJid", remoteJid).
		Bool("isFromMe", isFromMe).
		Msg("Chatwoot: processing reaction")

	client := NewClient(cfg.URL, cfg.APIAccessToken, cfg.AccountID)

	// Get or create contact
	isGroup := strings.HasSuffix(remoteJid, "@g.us")
	phoneNumber := strings.Split(remoteJid, "@")[0]

	// Get contact name from sender JID
	senderPhone := strings.Split(senderJid, "@")[0]
	if colonIdx := strings.Index(senderPhone, ":"); colonIdx > 0 {
		senderPhone = senderPhone[:colonIdx]
	}
	contactName := senderPhone

	contact, err := client.GetOrCreateContact(ctx, cfg.InboxID, phoneNumber, remoteJid, contactName, "", isGroup)
	if err != nil {
		return fmt.Errorf("failed to get/create contact for reaction: %w", err)
	}

	// Get or create conversation
	status := "open"
	if cfg.ConversationPending {
		status = "pending"
	}

	conv, err := client.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, status)
	if err != nil {
		return fmt.Errorf("failed to get/create conversation for reaction: %w", err)
	}

	// Find the original message to get its Chatwoot message ID
	var inReplyTo *int
	var inReplyToExternalID string

	if s.database != nil {
		originalMsg, err := s.database.Messages.GetByMessageID(ctx, session.ID, targetMsgID)
		if err == nil && originalMsg != nil && originalMsg.ChatwootMessageID != nil {
			inReplyTo = originalMsg.ChatwootMessageID
			inReplyToExternalID = targetMsgID
		}
	}

	// Determine message type based on sender
	messageType := "incoming"
	if isFromMe {
		messageType = "outgoing"
	}

	// Create message with reaction emoji
	msgReq := &CreateMessageRequest{
		Content:     emoji,
		MessageType: messageType,
	}

	// Add reply reference if we found the original message
	if inReplyTo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             *inReplyTo,
			"in_reply_to_external_id": inReplyToExternalID,
		}
		logger.Debug().
			Int("in_reply_to", *inReplyTo).
			Str("in_reply_to_external_id", inReplyToExternalID).
			Str("emoji", emoji).
			Str("messageType", messageType).
			Msg("Chatwoot: sending reaction with reply reference")
	}

	_, err = client.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to send reaction to chatwoot: %w", err)
	}

	logger.Info().
		Str("session", session.Name).
		Str("chatJid", remoteJid).
		Str("emoji", emoji).
		Str("targetMsgId", targetMsgID).
		Str("messageType", messageType).
		Msg("Chatwoot: reaction sent successfully")

	return nil
}

// ProcessReceipt handles message receipt (delivered/read) events
func (s *Service) ProcessReceipt(ctx context.Context, session *model.Session, evt *events.Receipt) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil || cfg == nil {
		return nil
	}

	// TODO: Update message status in Chatwoot if needed
	return nil
}

// Migrate runs database migrations for Chatwoot integration
func (s *Service) Migrate(ctx context.Context) error {
	return s.repo.Migrate(ctx)
}

// SessionEventPayload represents data to send back to handler for WhatsApp sending
type SessionEventPayload struct {
	ChatJid     string       `json:"chatJid"`
	Content     string       `json:"content"`
	Attachments []Attachment `json:"attachments,omitempty"`
	Timestamp   time.Time    `json:"timestamp"`
}

// ParseWebhookPayload parses raw JSON into WebhookPayload
func ParseWebhookPayload(data []byte) (*WebhookPayload, error) {
	var payload WebhookPayload
	if err := json.Unmarshal(data, &payload); err != nil {
		return nil, err
	}
	return &payload, nil
}
