package chatwoot

import (
	"context"
	"fmt"
	"strings"

	"go.mau.fi/whatsmeow/proto/waE2E"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
)

// MediaDownloader is a function type for downloading media from WhatsApp messages
type MediaDownloader func(ctx context.Context, sessionName string, msg *waE2E.Message) ([]byte, error)

// ProfilePictureFetcher is a function type for getting profile pictures from WhatsApp
type ProfilePictureFetcher = func(ctx context.Context, sessionName string, jid string) (string, error)

// GroupInfoFetcher is a function type for getting group metadata from WhatsApp
type GroupInfoFetcher = func(ctx context.Context, sessionName string, groupJid string) (string, error)

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

// SetConfig creates or updates Chatwoot configuration for a session
func (s *Service) SetConfig(ctx context.Context, sessionID, sessionName string, req *SetConfigRequest) (*Config, error) {
	webhookURL := fmt.Sprintf("%s/chatwoot/webhook/%s", s.baseURL, sessionName)

	cfg := &Config{
		SessionID:       sessionID,
		Enabled:         req.Enabled,
		URL:             strings.TrimSuffix(req.URL, "/"),
		Token:           req.Token,
		Account:         req.Account,
		Inbox:           req.Inbox,
		SignAgent:       req.SignAgent,
		SignSeparator:   req.SignSeparator,
		AutoReopen:      req.AutoReopen,
		StartPending:    req.StartPending,
		MergeBrPhones:   req.MergeBrPhones,
		SyncContacts:    req.SyncContacts,
		SyncMessages:    req.SyncMessages,
		SyncDays:        req.SyncDays,
		IgnoreChats:     req.IgnoreChats,
		AutoCreate:      req.AutoCreate,
		WebhookURL:      webhookURL,
		ChatwootDBHost:  req.ChatwootDBHost,
		ChatwootDBPort:  req.ChatwootDBPort,
		ChatwootDBUser:  req.ChatwootDBUser,
		ChatwootDBPass:  req.ChatwootDBPass,
		ChatwootDBName:  req.ChatwootDBName,
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

// initInbox creates or retrieves the inbox in Chatwoot (without bot contact)
func (s *Service) initInbox(ctx context.Context, cfg *Config) error {
	return s.initInboxWithBot(ctx, cfg, "", "", "")
}

// initInboxWithBot creates or retrieves the inbox in Chatwoot and creates a bot contact (Evolution API pattern)
func (s *Service) initInboxWithBot(ctx context.Context, cfg *Config, number, organization, logo string) error {
	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	// AutoReopen also sets lock_to_single_conversation on the inbox
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

		updatedInbox, err := client.UpdateInboxWebhook(ctx, inbox.ID, cfg.WebhookURL)
		if err != nil {
			logger.Warn().Err(err).Msg("Chatwoot: failed to update inbox webhook URL")
		} else {
			inbox = updatedInbox
		}
	}

	if err := s.repo.UpdateInboxID(ctx, cfg.SessionID, inbox.ID); err != nil {
		return err
	}

	cfg.InboxID = inbox.ID

	// Create bot contact with number 123456 (Evolution API pattern)
	if err := s.initBotContact(ctx, client, inbox.ID, number, organization, logo); err != nil {
		logger.Warn().Err(err).Msg("Chatwoot: failed to create bot contact")
	}

	return nil
}

// initBotContact creates a bot contact with number 123456 and sends init message (Evolution API pattern)
func (s *Service) initBotContact(ctx context.Context, client *Client, inboxID int, number, organization, logo string) error {
	const botPhone = "123456"
	
	// Default values like Evolution API
	botName := "ZPWoot"
	if organization != "" {
		botName = organization
	}
	
	botAvatar := "https://evolution-api.com/files/evolution-api-favicon.png"
	if logo != "" {
		botAvatar = logo
	}

	// Find contact by phone number (Evolution API pattern)
	contact, err := client.FindContactByPhone(ctx, "+"+botPhone)
	if err != nil {
		logger.Debug().Err(err).Msg("Chatwoot: error finding bot contact")
	}

	if contact == nil {
		// Create bot contact
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

	// Create conversation for bot
	convReq := &CreateConversationRequest{
		InboxID:   fmt.Sprintf("%d", inboxID),
		ContactID: fmt.Sprintf("%d", contact.ID),
	}
	conv, err := client.CreateConversation(ctx, convReq)
	if err != nil {
		// Conversation might already exist
		logger.Debug().Err(err).Msg("Chatwoot: conversation might already exist")
		return nil
	}

	// Send init message (with number if provided, like Evolution API)
	initContent := "init"
	if number != "" {
		initContent = fmt.Sprintf("init:%s", number)
	}

	msgReq := &CreateMessageRequest{
		Content:     initContent,
		MessageType: "outgoing",
		Private:     false,
	}
	_, err = client.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot: failed to send init message")
	} else {
		logger.Info().Int("conversationId", conv.ID).Str("content", initContent).Msg("Chatwoot: sent init message to bot")
	}

	return nil
}

// shouldIgnoreJid checks if a JID should be ignored
func (s *Service) shouldIgnoreJid(cfg *Config, jid string) bool {
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

// isMediaMessage checks if the message contains downloadable media
func (s *Service) isMediaMessage(msg *waE2E.Message) bool {
	return IsMediaMessage(msg)
}

// getMediaInfo extracts media information from a message
func (s *Service) getMediaInfo(msg *waE2E.Message) *MediaInfo {
	return GetMediaInfo(msg)
}
