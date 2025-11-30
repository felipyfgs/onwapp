package chatwoot

import (
	"bytes"
	"context"
	"fmt"
	"strings"

	"go.mau.fi/whatsmeow/proto/waE2E"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
)

// =============================================================================
// FUNCTION TYPES
// =============================================================================

// MediaDownloader is a function type for downloading media from WhatsApp messages
type MediaDownloader func(ctx context.Context, sessionName string, msg *waE2E.Message) ([]byte, error)

// ProfilePictureFetcher is a function type for getting profile pictures from WhatsApp
type ProfilePictureFetcher func(ctx context.Context, sessionName string, jid string) (string, error)

// GroupInfoFetcher is a function type for getting group metadata from WhatsApp
type GroupInfoFetcher func(ctx context.Context, sessionName string, groupJid string) (string, error)

// =============================================================================
// SERVICE
// =============================================================================

// Service handles Chatwoot integration business logic
type Service struct {
	repo                  *Repository
	database              *db.Database
	baseURL               string
	mediaDownloader       MediaDownloader
	profilePictureFetcher ProfilePictureFetcher
	groupInfoFetcher      GroupInfoFetcher
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

// SetGroupInfoFetcher sets the function used to fetch group info from WhatsApp
func (s *Service) SetGroupInfoFetcher(fetcher GroupInfoFetcher) {
	s.groupInfoFetcher = fetcher
}

// =============================================================================
// CONFIG MANAGEMENT
// =============================================================================

// SetConfig creates or updates Chatwoot configuration for a session
func (s *Service) SetConfig(ctx context.Context, sessionID, sessionName string, req *SetConfigRequest) (*Config, error) {
	webhookURL := fmt.Sprintf("%s/chatwoot/webhook/%s", s.baseURL, sessionName)

	cfg := &Config{
		SessionID:      sessionID,
		Enabled:        req.Enabled,
		URL:            strings.TrimSuffix(req.URL, "/"),
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
		WebhookURL:     webhookURL,
		ChatwootDBHost: req.ChatwootDBHost,
		ChatwootDBPort: req.ChatwootDBPort,
		ChatwootDBUser: req.ChatwootDBUser,
		ChatwootDBPass: req.ChatwootDBPass,
		ChatwootDBName: req.ChatwootDBName,
	}

	if cfg.Inbox == "" {
		cfg.Inbox = sessionName
	}

	savedCfg, err := s.repo.Upsert(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to save chatwoot config: %w", err)
	}

	if req.Enabled && req.AutoCreate {
		if err := s.initInboxWithBot(ctx, savedCfg, req.Number, req.Organization, req.Logo); err != nil {
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

// =============================================================================
// INBOX MANAGEMENT
// =============================================================================

// InitInbox creates or retrieves the inbox in Chatwoot (without bot contact)
func (s *Service) InitInbox(ctx context.Context, cfg *Config) error {
	return s.initInboxWithBot(ctx, cfg, "", "", "")
}

// initInboxWithBot creates or retrieves the inbox in Chatwoot and creates a bot contact
func (s *Service) initInboxWithBot(ctx context.Context, cfg *Config, number, organization, logo string) error {
	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	inbox, err := client.GetOrCreateInboxWithOptions(ctx, cfg.Inbox, cfg.WebhookURL, cfg.AutoReopen)
	if err != nil {
		return err
	}

	logger.Info().Int("inboxId", inbox.ID).Str("name", inbox.Name).Msg("Chatwoot: inbox ready")

	if inbox.WebhookURL != cfg.WebhookURL {
		logger.Info().
			Str("oldWebhook", inbox.WebhookURL).
			Str("newWebhook", cfg.WebhookURL).
			Msg("Chatwoot: updating inbox webhook URL")

		if updatedInbox, err := client.UpdateInboxWebhook(ctx, inbox.ID, cfg.WebhookURL); err != nil {
			logger.Warn().Err(err).Msg("Chatwoot: failed to update inbox webhook URL")
		} else {
			inbox = updatedInbox
		}
	}

	if err := s.repo.UpdateInboxID(ctx, cfg.SessionID, inbox.ID); err != nil {
		return err
	}

	cfg.InboxID = inbox.ID

	if err := s.initBotContact(ctx, client, inbox.ID, number, organization, logo); err != nil {
		logger.Warn().Err(err).Msg("Chatwoot: failed to create bot contact")
	}

	return nil
}

// initBotContact creates a bot contact with number 123456 (Evolution API pattern)
func (s *Service) initBotContact(ctx context.Context, client *Client, inboxID int, number, organization, logo string) error {
	const botPhone = "123456"

	botName := "ZPWoot"
	if organization != "" {
		botName = organization
	}

	botAvatar := "https://evolution-api.com/files/evolution-api-favicon.png"
	if logo != "" {
		botAvatar = logo
	}

	contact, err := client.FindContactByPhone(ctx, "+"+botPhone)
	if err != nil {
		logger.Debug().Err(err).Msg("Chatwoot: error finding bot contact")
	}

	if contact == nil {
		createReq := &CreateContactRequest{
			InboxID:     inboxID,
			Name:        botName,
			PhoneNumber: "+" + botPhone,
			AvatarURL:   botAvatar,
		}
		contact, err = client.CreateContact(ctx, createReq)
		if err != nil {
			return fmt.Errorf("failed to create bot contact: %w", err)
		}
		logger.Info().Int("contactId", contact.ID).Str("name", botName).Msg("Chatwoot: created bot contact")
	}

	convReq := &CreateConversationRequest{
		InboxID:   fmt.Sprintf("%d", inboxID),
		ContactID: fmt.Sprintf("%d", contact.ID),
	}
	conv, err := client.CreateConversation(ctx, convReq)
	if err != nil {
		logger.Debug().Err(err).Msg("Chatwoot: conversation might already exist")
		return nil
	}

	initContent := "init"
	if number != "" {
		initContent = fmt.Sprintf("init:%s", number)
	}

	msgReq := &CreateMessageRequest{
		Content:     initContent,
		MessageType: "outgoing",
		Private:     false,
	}
	if _, err = client.CreateMessage(ctx, conv.ID, msgReq); err != nil {
		logger.Warn().Err(err).Msg("Chatwoot: failed to send init message")
	} else {
		logger.Info().Int("conversationId", conv.ID).Str("content", initContent).Msg("Chatwoot: sent init message to bot")
	}

	return nil
}

// =============================================================================
// BOT STATUS MESSAGES
// =============================================================================

// SendBotStatusMessage sends a status message to the bot contact
func (s *Service) SendBotStatusMessage(ctx context.Context, cfg *Config, status, message string) error {
	if cfg == nil || !cfg.Enabled || cfg.InboxID == 0 {
		return ErrNotConfigured
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)
	const botPhone = "123456"

	contact, err := client.FindContactByPhone(ctx, "+"+botPhone)
	if err != nil {
		logger.Error().Err(err).Msg("Chatwoot: error finding bot contact")
		return ErrBotNotFound
	}
	if contact == nil {
		logger.Error().Msg("Chatwoot: bot contact is nil")
		return ErrBotNotFound
	}

	conv, err := client.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, "open", true)
	if err != nil {
		logger.Error().Err(err).Int("contactId", contact.ID).Msg("Chatwoot: failed to get bot conversation")
		return fmt.Errorf("failed to get bot conversation: %w", err)
	}

	content := s.formatStatusMessage(status, message)

	msgReq := &CreateMessageRequest{
		Content:     content,
		MessageType: "incoming",
		Private:     false,
	}

	if _, err = client.CreateMessage(ctx, conv.ID, msgReq); err != nil {
		return fmt.Errorf("failed to send status message: %w", err)
	}

	logger.Info().
		Str("status", status).
		Int("conversationId", conv.ID).
		Msg("Chatwoot: sent bot status message")

	return nil
}

// SendBotQRCode sends a QR code image to the bot contact
func (s *Service) SendBotQRCode(ctx context.Context, cfg *Config, qrCodeData []byte, pairingCode string) error {
	if cfg == nil || !cfg.Enabled || cfg.InboxID == 0 {
		return ErrNotConfigured
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)
	const botPhone = "123456"

	contact, err := client.FindContactByPhone(ctx, "+"+botPhone)
	if err != nil || contact == nil {
		return ErrBotNotFound
	}

	conv, err := client.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, "open", true)
	if err != nil {
		return fmt.Errorf("failed to get bot conversation: %w", err)
	}

	content := "📱 *Scan QR Code to connect*"
	if pairingCode != "" {
		content = fmt.Sprintf("📱 *Scan QR Code to connect*\n\n🔑 Pairing Code: `%s`", pairingCode)
	}

	reader := bytes.NewReader(qrCodeData)
	msg, err := client.CreateMessageWithAttachmentAndMime(ctx, conv.ID, content, "incoming", reader, "qrcode.png", "image/png", nil)
	if err != nil {
		return fmt.Errorf("failed to send QR code: %w", err)
	}

	logger.Info().
		Int("conversationId", conv.ID).
		Int("messageId", msg.ID).
		Msg("Chatwoot: sent QR code to bot")

	return nil
}

func (s *Service) formatStatusMessage(status, message string) string {
	switch status {
	case "connected":
		return fmt.Sprintf("🟢 *Connection established!*\n\n%s", message)
	case "disconnected":
		return fmt.Sprintf("🔴 *Disconnected*\n\n%s", message)
	case "connecting":
		return fmt.Sprintf("🟡 *Connecting...*\n\n%s", message)
	case "qrcode":
		return fmt.Sprintf("📱 *Scan QR Code*\n\n%s", message)
	default:
		return message
	}
}

// =============================================================================
// HELPER METHODS
// =============================================================================

// ShouldIgnoreJid checks if a JID should be ignored
func (s *Service) ShouldIgnoreJid(cfg *Config, jid string) bool {
	if IsStatusBroadcast(jid) || IsNewsletter(jid) {
		return true
	}

	if len(cfg.IgnoreChats) == 0 {
		return false
	}

	for _, ignoreJid := range cfg.IgnoreChats {
		if ignoreJid == "@g.us" && IsGroupJID(jid) {
			return true
		}
		if ignoreJid == "@s.whatsapp.net" && !IsGroupJID(jid) && !IsStatusBroadcast(jid) {
			return true
		}
		if jid == ignoreJid {
			return true
		}
	}

	return false
}

// ConvertMarkdown converts Chatwoot markdown to WhatsApp format
func (s *Service) ConvertMarkdown(content string) string {
	content = strings.ReplaceAll(content, "**", "§BOLD§")
	content = strings.ReplaceAll(content, "*", "_")
	content = strings.ReplaceAll(content, "§BOLD§", "*")
	content = strings.ReplaceAll(content, "~~", "~")
	return content
}
