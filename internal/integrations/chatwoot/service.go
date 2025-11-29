package chatwoot

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// MediaDownloader is a function type for downloading media from WhatsApp messages
type MediaDownloader func(ctx context.Context, sessionName string, msg *waE2E.Message) ([]byte, error)

// ProfilePictureFetcher is a function type for getting profile pictures from WhatsApp
// This is an alias that matches ProfilePictureGetter in contact_manager.go
type ProfilePictureFetcher = func(ctx context.Context, sessionName string, jid string) (string, error)

// Service handles Chatwoot integration business logic
type Service struct {
	repo                  *Repository
	database              *db.Database
	baseURL               string // Server base URL for webhooks
	mediaDownloader       MediaDownloader
	profilePictureFetcher ProfilePictureFetcher
	contactManager        *ContactManager
}

// NewService creates a new Chatwoot service
func NewService(repo *Repository, database *db.Database, baseURL string) *Service {
	return &Service{
		repo:           repo,
		database:       database,
		baseURL:        strings.TrimSuffix(baseURL, "/"),
		contactManager: NewContactManager(),
	}
}

// SetMediaDownloader sets the function used to download media from WhatsApp
func (s *Service) SetMediaDownloader(downloader MediaDownloader) {
	s.mediaDownloader = downloader
}

// SetProfilePictureFetcher sets the function used to fetch profile pictures from WhatsApp
func (s *Service) SetProfilePictureFetcher(fetcher ProfilePictureFetcher) {
	s.profilePictureFetcher = fetcher
}

// SetConfig creates or updates Chatwoot configuration for a session
func (s *Service) SetConfig(ctx context.Context, sessionID, sessionName string, req *SetConfigRequest) (*Config, error) {
	webhookURL := fmt.Sprintf("%s/chatwoot/webhook/%s", s.baseURL, sessionName)

	cfg := &Config{
		SessionID:     sessionID,
		Enabled:       req.Enabled,
		URL:           strings.TrimSuffix(req.URL, "/"),
		Token:         req.Token,
		Account:       req.Account,
		Inbox:         req.Inbox,
		SignAgent:     req.SignAgent,
		SignSeparator: req.SignSeparator,
		AutoReopen:    req.AutoReopen,
		StartPending:  req.StartPending,
		MergeBrPhones: req.MergeBrPhones,
		SyncContacts:  req.SyncContacts,
		SyncMessages:  req.SyncMessages,
		SyncDays:      req.SyncDays,
		IgnoreChats:   req.IgnoreChats,
		AutoInbox:     req.AutoInbox,
		WebhookURL:    webhookURL,
	}

	if cfg.Inbox == "" {
		cfg.Inbox = sessionName
	}

	// Save configuration
	savedCfg, err := s.repo.Upsert(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to save chatwoot config: %w", err)
	}

	// Auto-create inbox if enabled
	if req.Enabled && req.AutoInbox {
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
	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	inbox, err := client.GetOrCreateInbox(ctx, cfg.Inbox, cfg.WebhookURL)
	if err != nil {
		return err
	}

	// Update config with inbox ID
	if err := s.repo.UpdateInboxID(ctx, cfg.SessionID, inbox.ID); err != nil {
		return err
	}

	cfg.InboxID = inbox.ID
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

	// Check if JID should be ignored
	remoteJid := evt.Info.Chat.String()
	if s.shouldIgnoreJid(cfg, remoteJid) {
		return nil
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	// Ensure inbox exists
	if cfg.InboxID == 0 {
		if err := s.initInbox(ctx, cfg); err != nil {
			return fmt.Errorf("failed to init inbox: %w", err)
		}
	}

	// Check if this is a group message
	isGroup := strings.HasSuffix(remoteJid, "@g.us")
	participantJid := ""
	if isGroup && evt.Info.Sender.String() != "" {
		participantJid = evt.Info.Sender.String()
	}

	// Get or create contact and conversation using ContactManager with caching
	convID, err := s.contactManager.GetOrCreateContactAndConversation(
		ctx,
		client,
		cfg,
		remoteJid,
		evt.Info.PushName,
		evt.Info.IsFromMe,
		participantJid,
		s.profilePictureFetcher,
		session.Name,
	)
	if err != nil {
		return fmt.Errorf("failed to get/create conversation: %w", err)
	}

	sourceID := fmt.Sprintf("WAID:%s", evt.Info.ID)

	// Check if this is a media message
	if s.isMediaMessage(evt.Message) && s.mediaDownloader != nil {
		return s.processIncomingMediaMessage(ctx, session, evt, client, convID, sourceID, cfg)
	}

	// Extract message content for text messages
	content := s.extractMessageContent(evt)
	if content == "" {
		return nil
	}

	// Format group messages to show participant info
	if isGroup && participantJid != "" && !evt.Info.IsFromMe {
		content = s.contactManager.FormatGroupMessage(content, participantJid, evt.Info.PushName)
	}

	// Create message in Chatwoot
	msgReq := &CreateMessageRequest{
		Content:     content,
		MessageType: "incoming",
		SourceID:    sourceID,
	}

	// Check if this is a reply/quote message and add in_reply_to
	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	cwMsg, err := client.CreateMessage(ctx, convID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to create message in chatwoot: %w", err)
	}

	// Save Chatwoot message ID for quote/reply support
	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, convID, sourceID); err != nil {
			logger.Warn().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update message fields")
		}
	}

	return nil
}

// processIncomingMediaMessage handles media messages (images, videos, documents, etc.)
func (s *Service) processIncomingMediaMessage(ctx context.Context, session *model.Session, evt *events.Message, client *Client, conversationID int, sourceID string, cfg *Config) error {
	mediaInfo := s.getMediaInfo(evt.Message)
	if mediaInfo == nil {
		return fmt.Errorf("failed to get media info")
	}

	// Check if this is a reply/quote message
	var contentAttributes map[string]interface{}
	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		contentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	// Download media from WhatsApp
	mediaData, err := s.mediaDownloader(ctx, session.Name, evt.Message)
	if err != nil {
		logger.Warn().Err(err).
			Str("session", session.Name).
			Str("messageId", evt.Info.ID).
			Msg("Chatwoot: failed to download media, sending filename as text instead")

		// Fallback: send filename as text
		content := mediaInfo.Filename
		if mediaInfo.Caption != "" {
			content = mediaInfo.Caption
		}
		msgReq := &CreateMessageRequest{
			Content:           content,
			MessageType:       "incoming",
			SourceID:          sourceID,
			ContentAttributes: contentAttributes,
		}
		_, err := client.CreateMessage(ctx, conversationID, msgReq)
		return err
	}

	// Upload media to Chatwoot with proper MIME type
	content := mediaInfo.Caption
	cwMsg, err := client.CreateMessageWithAttachmentAndMime(ctx, conversationID, content, "incoming", bytes.NewReader(mediaData), mediaInfo.Filename, mediaInfo.MimeType, contentAttributes)
	if err != nil {
		return fmt.Errorf("failed to upload media to chatwoot: %w", err)
	}

	// Save Chatwoot message ID for quote/reply support
	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conversationID, sourceID); err != nil {
			logger.Warn().Err(err).
				Str("messageId", evt.Info.ID).
				Int("chatwootMessageId", cwMsg.ID).
				Msg("Chatwoot: failed to save chatwoot message ID for media")
		}
	}

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
	if s.database != nil {
		existingMsg, _ := s.database.Messages.GetByMsgId(ctx, session.ID, evt.Info.ID)
		if existingMsg != nil && existingMsg.CwMsgId != nil && *existingMsg.CwMsgId > 0 {
			return nil
		}
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	// Ensure inbox exists
	if cfg.InboxID == 0 {
		if err := s.initInbox(ctx, cfg); err != nil {
			return fmt.Errorf("failed to init inbox: %w", err)
		}
	}

	// Get contact and conversation
	isGroup := strings.HasSuffix(remoteJid, "@g.us")
	phoneNumber := strings.Split(remoteJid, "@")[0]
	// Remove device suffix (e.g., "559984059035:2" -> "559984059035")
	if colonIdx := strings.Index(phoneNumber, ":"); colonIdx > 0 {
		phoneNumber = phoneNumber[:colonIdx]
	}

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
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	cwMsg, err := client.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to create outgoing message in chatwoot: %w", err)
	}

	// Save Chatwoot message ID for quote/reply support
	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conv.ID, sourceID); err != nil {
			logger.Warn().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update outgoing message fields")
		}
	}

	return nil
}

// HandleWebhook processes incoming webhooks from Chatwoot
func (s *Service) HandleWebhook(ctx context.Context, sessionID string, payload *WebhookPayload) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		return fmt.Errorf("chatwoot not enabled for session: %s", sessionID)
	}

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
	if cfg.SignAgent && payload.Sender != nil && payload.Sender.AvailableName != "" {
		delimiter := cfg.SignSeparator
		if delimiter == "" {
			delimiter = "\n"
		}
		delimiter = strings.ReplaceAll(delimiter, "\\n", "\n")
		content = fmt.Sprintf("*%s:*%s%s", payload.Sender.AvailableName, delimiter, content)
	}

	// Convert Chatwoot markdown to WhatsApp format
	content = s.convertMarkdown(content)

	// TODO: implement sending message to WhatsApp using chatJid and content
	_ = chatJid
	_ = content

	return nil
}

func (s *Service) handleMessageUpdated(ctx context.Context, sessionID string, cfg *Config, payload *WebhookPayload) error {
	return nil
}

func (s *Service) handleConversationStatusChanged(ctx context.Context, sessionID string, cfg *Config, payload *WebhookPayload) error {
	// Handle conversation resolved/reopened
	// TODO: implement conversation status change handling
	return nil
}

// Helper methods

func (s *Service) shouldIgnoreJid(cfg *Config, jid string) bool {
	if len(cfg.IgnoreChats) == 0 {
		return false
	}

	for _, ignoreJid := range cfg.IgnoreChats {
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

// MediaInfo holds information about media in a message
type MediaInfo struct {
	IsMedia  bool
	MimeType string
	Filename string
	Caption  string
}

// isMediaMessage checks if the message contains downloadable media
func (s *Service) isMediaMessage(msg *waE2E.Message) bool {
	if msg == nil {
		return false
	}
	return msg.ImageMessage != nil ||
		msg.VideoMessage != nil ||
		msg.AudioMessage != nil ||
		msg.DocumentMessage != nil ||
		msg.StickerMessage != nil
}

// getMediaInfo extracts media information from a message
func (s *Service) getMediaInfo(msg *waE2E.Message) *MediaInfo {
	if msg == nil {
		return nil
	}

	if img := msg.GetImageMessage(); img != nil {
		return &MediaInfo{
			IsMedia:  true,
			MimeType: img.GetMimetype(),
			Filename: "image.jpg",
			Caption:  img.GetCaption(),
		}
	}

	if vid := msg.GetVideoMessage(); vid != nil {
		return &MediaInfo{
			IsMedia:  true,
			MimeType: vid.GetMimetype(),
			Filename: "video.mp4",
			Caption:  vid.GetCaption(),
		}
	}

	if aud := msg.GetAudioMessage(); aud != nil {
		ext := "ogg"
		if strings.Contains(aud.GetMimetype(), "mpeg") {
			ext = "mp3"
		}
		return &MediaInfo{
			IsMedia:  true,
			MimeType: aud.GetMimetype(),
			Filename: "audio." + ext,
			Caption:  "",
		}
	}

	if doc := msg.GetDocumentMessage(); doc != nil {
		filename := doc.GetFileName()
		if filename == "" {
			filename = "document"
		}
		return &MediaInfo{
			IsMedia:  true,
			MimeType: doc.GetMimetype(),
			Filename: filename,
			Caption:  doc.GetCaption(),
		}
	}

	if stk := msg.GetStickerMessage(); stk != nil {
		return &MediaInfo{
			IsMedia:  true,
			MimeType: stk.GetMimetype(),
			Filename: "sticker.webp",
			Caption:  "",
		}
	}

	return nil
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

	// Media with caption - return caption only (media will be handled separately)
	if img := msg.GetImageMessage(); img != nil {
		return img.GetCaption()
	}
	if vid := msg.GetVideoMessage(); vid != nil {
		return vid.GetCaption()
	}
	if doc := msg.GetDocumentMessage(); doc != nil {
		return doc.GetCaption() // Return only caption, not filename
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
	CwMsgId           int    // Chatwoot message ID to reply to
	WhatsAppMessageID string // Original WhatsApp message ID (stanzaId)
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
		return nil
	}

	// Find original message by WhatsApp message ID
	originalMsg, err := s.database.Messages.GetByMsgId(ctx, sessionID, stanzaID)
	if err != nil || originalMsg == nil {
		return nil
	}

	// Check if original message has Chatwoot message ID
	if originalMsg.CwMsgId == nil || *originalMsg.CwMsgId == 0 {
		return nil
	}

	return &ReplyInfo{
		CwMsgId:           *originalMsg.CwMsgId,
		WhatsAppMessageID: stanzaID,
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
	MsgId     string `json:"msgId"`     // WhatsApp message ID
	ChatJID   string `json:"chatJid"`   // Chat JID
	SenderJID string `json:"senderJid"` // Sender JID
	Content   string `json:"content"`   // Original message content
	FromMe    bool   `json:"fromMe"`    // Was message from me
}

// GetWebhookDataForSending extracts data from webhook for sending via WhatsApp
func (s *Service) GetWebhookDataForSending(ctx context.Context, sessionID string, payload *WebhookPayload) (chatJid, content string, attachments []Attachment, err error) {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		return "", "", nil, fmt.Errorf("chatwoot not enabled")
	}

	// Skip non-outgoing or private messages
	isOutgoing := payload.MessageType == "outgoing" || payload.MessageType == "1"
	if !isOutgoing || payload.Private {
		return "", "", nil, nil
	}

	// Skip messages from WhatsApp (already sent via API)
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

	// Sign message with agent name if enabled
	if cfg.SignAgent && payload.Sender != nil {
		// Use AvailableName first, fallback to Name
		senderName := payload.Sender.AvailableName
		if senderName == "" {
			senderName = payload.Sender.Name
		}

		if senderName != "" {
			delimiter := cfg.SignSeparator
			if delimiter == "" {
				delimiter = "\n"
			}
			delimiter = strings.ReplaceAll(delimiter, "\\n", "\n")
			content = fmt.Sprintf("*%s:*%s%s", senderName, delimiter, content)
		}
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
		return nil
	}

	// Find message by Chatwoot message ID
	msg, err := s.database.Messages.GetByCwMsgId(ctx, sessionID, chatwootMsgID)
	if err != nil || msg == nil {
		return nil
	}

	return &QuotedMessageInfo{
		MsgId:     msg.MsgId,
		ChatJID:   msg.ChatJID,
		SenderJID: msg.SenderJID,
		Content:   msg.Content,
		FromMe:    msg.FromMe,
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



	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	// Get or create contact
	isGroup := strings.HasSuffix(remoteJid, "@g.us")
	phoneNumber := strings.Split(remoteJid, "@")[0]
	// Remove device suffix (e.g., "559984059035:2" -> "559984059035")
	if colonIdx := strings.Index(phoneNumber, ":"); colonIdx > 0 {
		phoneNumber = phoneNumber[:colonIdx]
	}

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
	if cfg.StartPending {
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
		originalMsg, err := s.database.Messages.GetByMsgId(ctx, session.ID, targetMsgID)
		if err == nil && originalMsg != nil && originalMsg.CwMsgId != nil {
			inReplyTo = originalMsg.CwMsgId
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
	}

	_, err = client.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to send reaction to chatwoot: %w", err)
	}

	return nil
}

// ProcessReceipt handles message receipt (delivered/read) events
func (s *Service) ProcessReceipt(ctx context.Context, session *model.Session, evt *events.Receipt) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil || cfg == nil {
		return nil
	}

	// Only process READ receipts for messages we sent (fromMe)
	// This updates the "seen" indicator in Chatwoot
	if evt.Type == types.ReceiptTypeRead {
		for _, msgID := range evt.MessageIDs {
			if err := s.HandleMessageRead(ctx, session, msgID); err != nil {
				logger.Debug().Err(err).Str("messageId", msgID).Msg("Chatwoot: failed to process read receipt")
			}
		}
	}

	return nil
}

// ProcessMessageDelete handles message deletion from WhatsApp and syncs to Chatwoot
func (s *Service) ProcessMessageDelete(ctx context.Context, session *model.Session, messageID string) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil || cfg == nil {
		return nil
	}

	// Find the message in database
	msg, err := s.database.Messages.GetByMsgId(ctx, session.ID, messageID)
	if err != nil || msg == nil {
		logger.Debug().Str("messageId", messageID).Msg("Chatwoot: message not found for deletion")
		return nil
	}

	// Check if message has Chatwoot IDs
	if msg.CwMsgId == nil || msg.CwConvId == nil {
		logger.Debug().Str("messageId", messageID).Msg("Chatwoot: message has no Chatwoot IDs")
		return nil
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	// Delete message from Chatwoot
	if err := client.DeleteMessage(ctx, *msg.CwConvId, *msg.CwMsgId); err != nil {
		return fmt.Errorf("failed to delete message from Chatwoot: %w", err)
	}

	// Delete from local database
	if err := s.database.Messages.Delete(ctx, session.ID, messageID); err != nil {
		logger.Warn().Err(err).Str("messageId", messageID).Msg("Chatwoot: failed to delete message from database")
	}

	logger.Info().
		Str("session", session.Name).
		Str("messageId", messageID).
		Int("chatwootMsgId", *msg.CwMsgId).
		Msg("Chatwoot: message deleted from Chatwoot")

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

// HandleMessageRead processes read receipts and updates Chatwoot last_seen
// This is called when a message we sent is read by the recipient
func (s *Service) HandleMessageRead(ctx context.Context, session *model.Session, messageID string) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		return nil
	}
	if cfg == nil {
		return nil // Chatwoot not enabled
	}

	// Get the message from database to find chatwoot conversation ID
	msg, err := s.database.Messages.GetByMsgId(ctx, session.ID, messageID)
	if err != nil || msg == nil {
		logger.Debug().Str("messageId", messageID).Msg("Chatwoot: message not found for read receipt")
		return nil
	}

	// Check if message has Chatwoot conversation ID
	if msg.CwConvId == nil || *msg.CwConvId == 0 {
		logger.Debug().Str("messageId", messageID).Msg("Chatwoot: message has no conversation ID")
		return nil
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	// Get inbox to get inbox_identifier
	if cfg.InboxID == 0 {
		logger.Debug().Msg("Chatwoot: inbox ID not set")
		return nil
	}

	inbox, err := client.GetInbox(ctx, cfg.InboxID)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot: failed to get inbox")
		return nil
	}

	if inbox.InboxIdentifier == "" {
		logger.Debug().Msg("Chatwoot: inbox_identifier not available")
		return nil
	}

	// Get conversation to get contact_inbox source_id
	conv, contactSourceID, err := client.GetConversationWithContactInbox(ctx, *msg.CwConvId)
	if err != nil {
		logger.Warn().Err(err).Int("conversationId", *msg.CwConvId).Msg("Chatwoot: failed to get conversation")
		return nil
	}

	logger.Debug().
		Int("conversationId", *msg.CwConvId).
		Str("contactSourceID", contactSourceID).
		Str("inboxIdentifier", inbox.InboxIdentifier).
		Interface("convID", conv.ID).
		Msg("Chatwoot: read receipt debug info")

	if contactSourceID == "" {
		logger.Debug().Int("conversationId", *msg.CwConvId).Msg("Chatwoot: contact_source_id not found")
		return nil
	}

	// Call public API to update last_seen
	if err := client.UpdateLastSeen(ctx, inbox.InboxIdentifier, contactSourceID, *msg.CwConvId); err != nil {
		logger.Warn().Err(err).
			Int("conversationId", *msg.CwConvId).
			Str("inboxIdentifier", inbox.InboxIdentifier).
			Msg("Chatwoot: failed to update last_seen")
		return err
	}

	logger.Info().
		Str("session", session.Name).
		Str("messageId", messageID).
		Int("conversationId", *msg.CwConvId).
		Msg("Chatwoot: updated last_seen (read receipt)")

	return nil
}
