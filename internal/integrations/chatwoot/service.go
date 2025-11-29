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

// ProcessOutgoingMessage is called when a message is sent from WhatsApp
func (s *Service) ProcessOutgoingMessage(ctx context.Context, session *model.Session, msgID, chatJid, content string) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil || cfg == nil {
		return nil
	}

	if s.shouldIgnoreJid(cfg, chatJid) {
		return nil
	}

	client := NewClient(cfg.URL, cfg.APIAccessToken, cfg.AccountID)

	// Get contact and conversation
	isGroup := strings.HasSuffix(chatJid, "@g.us")
	phoneNumber := strings.Split(chatJid, "@")[0]

	contact, err := client.GetOrCreateContact(ctx, cfg.InboxID, phoneNumber, chatJid, phoneNumber, "", isGroup)
	if err != nil {
		return fmt.Errorf("failed to get/create contact: %w", err)
	}

	conv, err := client.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, "open")
	if err != nil {
		return fmt.Errorf("failed to get/create conversation: %w", err)
	}

	// Create outgoing message
	msgReq := &CreateMessageRequest{
		Content:     content,
		MessageType: "outgoing",
		SourceID:    fmt.Sprintf("WAID:%s", msgID),
	}

	_, err = client.CreateMessage(ctx, conv.ID, msgReq)
	return err
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
		return "", "", nil, fmt.Errorf("chatwoot not enabled")
	}

	// Skip non-outgoing or private messages
	if payload.MessageType != "outgoing" || payload.Private {
		return "", "", nil, nil
	}

	// Skip messages from WhatsApp
	if payload.Conversation != nil && len(payload.Conversation.Messages) > 0 {
		for _, msg := range payload.Conversation.Messages {
			if strings.HasPrefix(msg.SourceID, "WAID:") && msg.ID == payload.ID {
				return "", "", nil, nil
			}
		}
	}

	// Get chat JID
	if payload.Conversation == nil || payload.Conversation.Meta == nil || payload.Conversation.Meta.Sender == nil {
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
