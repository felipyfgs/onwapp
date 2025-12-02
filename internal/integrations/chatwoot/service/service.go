package service

import (
	"bytes"
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"go.mau.fi/whatsmeow/proto/waE2E"

	"zpwoot/internal/db"
	"zpwoot/internal/integrations/chatwoot/client"
	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/integrations/chatwoot/repository"
	"zpwoot/internal/integrations/chatwoot/util"
	"zpwoot/internal/logger"
)

// processingCache prevents duplicate message processing
type processingCache struct {
	mu    sync.Mutex
	items map[string]time.Time
}

func newProcessingCache() *processingCache {
	return &processingCache{
		items: make(map[string]time.Time),
	}
}

// tryAcquire attempts to acquire a lock for processing a message.
// Returns true if acquired, false if already being processed.
func (c *processingCache) tryAcquire(key string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Clean old entries (older than 30 seconds)
	now := time.Now()
	for k, t := range c.items {
		if now.Sub(t) > 30*time.Second {
			delete(c.items, k)
		}
	}

	if _, exists := c.items[key]; exists {
		return false
	}
	c.items[key] = now
	return true
}

// release releases the lock for a message
func (c *processingCache) release(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

var msgProcessingCache = newProcessingCache()

// pendingSentCache tracks messages being sent from Chatwoot to WhatsApp
// This prevents the event handler from reprocessing messages we just sent
type pendingSentCache struct {
	mu    sync.Mutex
	items map[string]time.Time // key: "sessionID:chatJID:cwMsgId"
}

func newPendingSentCache() *pendingSentCache {
	return &pendingSentCache{
		items: make(map[string]time.Time),
	}
}

// markPending marks a message as being sent from Chatwoot
func (c *pendingSentCache) markPending(sessionID, chatJID string, cwMsgID int) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Clean old entries (older than 2 minutes)
	now := time.Now()
	for k, t := range c.items {
		if now.Sub(t) > 2*time.Minute {
			delete(c.items, k)
		}
	}

	key := fmt.Sprintf("%s:%s:%d", sessionID, chatJID, cwMsgID)
	c.items[key] = now
}

// isPendingByChat checks if there's any pending message for this session/chat
// Used when we don't have cwMsgId (from WhatsApp event)
func (c *pendingSentCache) isPendingByChat(sessionID, chatJID string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	prefix := fmt.Sprintf("%s:%s:", sessionID, chatJID)
	now := time.Now()
	for k, t := range c.items {
		// Consider entries within 2 minutes (enough for sending many large files)
		if strings.HasPrefix(k, prefix) && now.Sub(t) < 2*time.Minute {
			return true
		}
	}
	return false
}

// clearPending removes a pending message
func (c *pendingSentCache) clearPending(sessionID, chatJID string, cwMsgID int) {
	c.mu.Lock()
	defer c.mu.Unlock()

	key := fmt.Sprintf("%s:%s:%d", sessionID, chatJID, cwMsgID)
	delete(c.items, key)
}

var pendingSentFromChatwoot = newPendingSentCache()

// MarkPendingSentFromChatwoot marks a message as being sent from Chatwoot webhook
// Call this BEFORE sending to WhatsApp to prevent duplicate processing
func MarkPendingSentFromChatwoot(sessionID, chatJID string, cwMsgID int) {
	pendingSentFromChatwoot.markPending(sessionID, chatJID, cwMsgID)
}

// ClearPendingSentFromChatwoot removes the pending marker after message is saved
func ClearPendingSentFromChatwoot(sessionID, chatJID string, cwMsgID int) {
	pendingSentFromChatwoot.clearPending(sessionID, chatJID, cwMsgID)
}

// IsPendingSentFromChatwoot checks if there's a pending send for this chat
func IsPendingSentFromChatwoot(sessionID, chatJID string) bool {
	return pendingSentFromChatwoot.isPendingByChat(sessionID, chatJID)
}

// cwToWAProcessingCache prevents duplicate CW->WA message processing
// when NATS redelivers messages due to slow ACK (e.g., sending multiple large files)
var cwToWAProcessingCache = newCWToWAProcessingCache()

type cwToWAProcessingCacheType struct {
	mu    sync.Mutex
	items map[string]time.Time
}

func newCWToWAProcessingCache() *cwToWAProcessingCacheType {
	return &cwToWAProcessingCacheType{
		items: make(map[string]time.Time),
	}
}

func (c *cwToWAProcessingCacheType) tryAcquire(key string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	// Clean old entries (older than 2 minutes - enough for large file transfers)
	for k, t := range c.items {
		if now.Sub(t) > 2*time.Minute {
			delete(c.items, k)
		}
	}

	if _, exists := c.items[key]; exists {
		return false
	}
	c.items[key] = now
	return true
}

func (c *cwToWAProcessingCacheType) release(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

// TryAcquireCWToWAProcessing attempts to acquire processing lock for a CW->WA message
func TryAcquireCWToWAProcessing(key string) bool {
	return cwToWAProcessingCache.tryAcquire(key)
}

// ReleaseCWToWAProcessing releases the processing lock
func ReleaseCWToWAProcessing(key string) {
	cwToWAProcessingCache.release(key)
}

// MediaDownloader is a function type for downloading media from WhatsApp messages
type MediaDownloader func(ctx context.Context, sessionId string, msg *waE2E.Message) ([]byte, error)

// WebhookSender is an interface for sending webhooks with Chatwoot info
type WebhookSender interface {
	SendWithChatwoot(ctx context.Context, sessionID, sessionId, event string, rawEvent interface{}, cwInfo *ChatwootInfo)
	SendWithPreserializedJSON(ctx context.Context, sessionID, sessionId, event string, eventJSON []byte, cwInfo *ChatwootInfo)
}

// ChatwootInfo contains Chatwoot metadata for webhook
type ChatwootInfo struct {
	Account        int
	InboxID        int
	ConversationID int
	MessageID      int
}

// Service handles Chatwoot integration business logic
type Service struct {
	repo                  *repository.ConfigRepository
	database              *db.Database
	baseURL               string
	mediaDownloader       MediaDownloader
	profilePictureFetcher ProfilePictureFetcher
	groupInfoFetcher      GroupInfoFetcher
	contactManager        *ContactManager
	webhookSender         WebhookSender
}

// NewService creates a new Chatwoot service
func NewService(repo *repository.ConfigRepository, database *db.Database, baseURL string) *Service {
	return &Service{
		repo:           repo,
		database:       database,
		baseURL:        strings.TrimSuffix(baseURL, "/"),
		contactManager: NewContactManager(),
	}
}

// SetWebhookSender sets the webhook sender for dispatching webhooks after message processing
func (s *Service) SetWebhookSender(sender WebhookSender) {
	s.webhookSender = sender
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

// GetRepository returns the repository for external access
func (s *Service) GetRepository() *repository.ConfigRepository {
	return s.repo
}

// GetDatabase returns the database for external access
func (s *Service) GetDatabase() *db.Database {
	return s.database
}

// GetMediaDownloader returns the media downloader function
func (s *Service) GetMediaDownloader() MediaDownloader {
	return s.mediaDownloader
}

// GetProfilePictureFetcher returns the profile picture fetcher function
func (s *Service) GetProfilePictureFetcher() ProfilePictureFetcher {
	return s.profilePictureFetcher
}

// GetGroupInfoFetcher returns the group info fetcher function
func (s *Service) GetGroupInfoFetcher() GroupInfoFetcher {
	return s.groupInfoFetcher
}

// GetContactManager returns the contact manager
func (s *Service) GetContactManager() *ContactManager {
	return s.contactManager
}

// =============================================================================
// CONFIG MANAGEMENT
// =============================================================================

// SetConfigRequest represents the request to set Chatwoot config
type SetConfigRequest struct {
	Enabled       bool   `json:"enabled"`
	URL           string `json:"url" binding:"required_if=Enabled true"`
	Token         string `json:"token" binding:"required_if=Enabled true"`
	Account       int    `json:"account" binding:"required_if=Enabled true"`
	Inbox         string `json:"inbox,omitempty"`
	SignAgent     bool   `json:"signAgent"`
	SignSeparator string `json:"signSeparator,omitempty"`
	// AutoReopen configures Chatwoot inbox settings for conversation management.
	// When true: sets lock_to_single_conversation=true and allow_messages_after_resolved=true
	// This means Chatwoot will automatically reopen resolved conversations when new messages arrive.
	// When false: creates new conversations for each interaction (default Chatwoot behavior).
	AutoReopen    bool `json:"autoReopen"`
	StartPending  bool `json:"startPending"`
	MergeBrPhones bool `json:"mergeBrPhones"`
	SyncContacts   bool     `json:"syncContacts"`
	SyncMessages   bool     `json:"syncMessages"`
	SyncDays       int      `json:"syncDays,omitempty"`
	IgnoreChats    []string `json:"ignoreChats,omitempty"`
	AutoCreate     bool     `json:"autoCreate"`
	Number         string   `json:"number,omitempty"`
	Organization   string   `json:"organization,omitempty"`
	Logo           string   `json:"logo,omitempty"`
	ChatwootDBHost string   `json:"chatwootDbHost,omitempty"`
	ChatwootDBPort int      `json:"chatwootDbPort,omitempty"`
	ChatwootDBUser string   `json:"chatwootDbUser,omitempty"`
	ChatwootDBPass string   `json:"chatwootDbPass,omitempty"`
	ChatwootDBName string   `json:"chatwootDbName,omitempty"`
}

// SetConfig creates or updates Chatwoot configuration for a session
func (s *Service) SetConfig(ctx context.Context, sessionID, sessionId string, req *SetConfigRequest) (*core.Config, error) {
	webhookURL := fmt.Sprintf("%s/chatwoot/webhook/%s", s.baseURL, sessionId)

	cfg := &core.Config{
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
		cfg.Inbox = sessionId
	}

	savedCfg, err := s.repo.Upsert(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to save chatwoot config: %w", err)
	}

	if req.Enabled && req.AutoCreate {
		if err := s.initInboxWithBot(ctx, savedCfg, req.Number, req.Organization, req.Logo); err != nil {
			logger.Warn().Err(err).Str("session", sessionId).Msg("Failed to auto-create Chatwoot inbox")
		}
	}

	return savedCfg, nil
}

// GetConfig retrieves Chatwoot configuration for a session
func (s *Service) GetConfig(ctx context.Context, sessionID string) (*core.Config, error) {
	cfg, err := s.repo.GetBySessionID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if cfg == nil {
		return &core.Config{
			SessionID:  sessionID,
			Enabled:    false,
			WebhookURL: "",
		}, nil
	}

	return cfg, nil
}

// GetEnabledConfig retrieves enabled Chatwoot configuration
func (s *Service) GetEnabledConfig(ctx context.Context, sessionID string) (*core.Config, error) {
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
func (s *Service) InitInbox(ctx context.Context, cfg *core.Config) error {
	return s.initInboxWithBot(ctx, cfg, "", "", "")
}

// initInboxWithBot creates or retrieves the inbox in Chatwoot and creates a bot contact
func (s *Service) initInboxWithBot(ctx context.Context, cfg *core.Config, number, organization, logo string) error {
	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)

	inbox, err := c.GetOrCreateInboxWithOptions(ctx, cfg.Inbox, cfg.WebhookURL, cfg.AutoReopen)
	if err != nil {
		return err
	}

	logger.Debug().Int("inboxId", inbox.ID).Str("name", inbox.Name).Msg("Chatwoot: inbox ready")

	if inbox.WebhookURL != cfg.WebhookURL {
		logger.Debug().
			Str("oldWebhook", inbox.WebhookURL).
			Str("newWebhook", cfg.WebhookURL).
			Msg("Chatwoot: updating inbox webhook URL")

		if updatedInbox, err := c.UpdateInboxWebhook(ctx, inbox.ID, cfg.WebhookURL); err != nil {
			logger.Warn().Err(err).Msg("Chatwoot: failed to update inbox webhook URL")
		} else {
			inbox = updatedInbox
		}
	}

	if err := s.repo.UpdateInboxID(ctx, cfg.SessionID, inbox.ID); err != nil {
		return err
	}

	cfg.InboxID = inbox.ID

	if err := s.initBotContact(ctx, c, inbox.ID, number, organization, logo); err != nil {
		logger.Warn().Err(err).Msg("Chatwoot: failed to create bot contact")
	}

	return nil
}

// initBotContact creates a bot contact with number 123456 (Evolution API pattern)
func (s *Service) initBotContact(ctx context.Context, c *client.Client, inboxID int, number, organization, logo string) error {
	const botPhone = "123456"

	botName := "ZPWoot"
	if organization != "" {
		botName = organization
	}

	botAvatar := "https://evolution-api.com/files/evolution-api-favicon.png"
	if logo != "" {
		botAvatar = logo
	}

	contact, err := c.FindContactByPhone(ctx, "+"+botPhone)
	if err != nil {
		logger.Debug().Err(err).Msg("Chatwoot: error finding bot contact")
	}

	if contact == nil {
		createReq := &client.CreateContactRequest{
			InboxID:     inboxID,
			Name:        botName,
			PhoneNumber: "+" + botPhone,
			AvatarURL:   botAvatar,
		}
		contact, err = c.CreateContact(ctx, createReq)
		if err != nil {
			return fmt.Errorf("failed to create bot contact: %w", err)
		}
		logger.Debug().Int("contactId", contact.ID).Str("name", botName).Msg("Chatwoot: created bot contact")
	}

	convReq := &client.CreateConversationRequest{
		InboxID:   fmt.Sprintf("%d", inboxID),
		ContactID: fmt.Sprintf("%d", contact.ID),
	}
	conv, err := c.CreateConversation(ctx, convReq)
	if err != nil {
		logger.Debug().Err(err).Msg("Chatwoot: conversation might already exist")
		return nil
	}

	initContent := "init"
	if number != "" {
		initContent = fmt.Sprintf("init:%s", number)
	}

	msgReq := &client.CreateMessageRequest{
		Content:     initContent,
		MessageType: "outgoing",
		Private:     false,
	}
	if _, err = c.CreateMessage(ctx, conv.ID, msgReq); err != nil {
		logger.Debug().Err(err).Msg("Chatwoot: failed to send init message")
	}

	return nil
}

// =============================================================================
// BOT STATUS MESSAGES
// =============================================================================

// SendBotStatusMessage sends a status message to the bot contact
func (s *Service) SendBotStatusMessage(ctx context.Context, cfg *core.Config, status, message string) error {
	if cfg == nil || !cfg.Enabled || cfg.InboxID == 0 {
		return core.ErrNotConfigured
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)
	const botPhone = "123456"

	contact, err := c.FindContactByPhone(ctx, "+"+botPhone)
	if err != nil {
		logger.Debug().Err(err).Msg("Chatwoot: bot contact not found")
		return core.ErrBotNotFound
	}
	if contact == nil {
		return core.ErrBotNotFound
	}

	conv, err := c.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, "open", true)
	if err != nil {
		logger.Warn().Err(err).Int("contactId", contact.ID).Msg("Chatwoot: failed to get bot conversation")
		return fmt.Errorf("failed to get bot conversation: %w", err)
	}

	content := s.formatStatusMessage(status, message)

	msgReq := &client.CreateMessageRequest{
		Content:     content,
		MessageType: "incoming",
		Private:     false,
	}

	if _, err = c.CreateMessage(ctx, conv.ID, msgReq); err != nil {
		return fmt.Errorf("failed to send status message: %w", err)
	}

	return nil
}

// SendBotQRCode sends a QR code image to the bot contact
func (s *Service) SendBotQRCode(ctx context.Context, cfg *core.Config, qrCodeData []byte, pairingCode string) error {
	if cfg == nil || !cfg.Enabled || cfg.InboxID == 0 {
		return core.ErrNotConfigured
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)
	const botPhone = "123456"

	contact, err := c.FindContactByPhone(ctx, "+"+botPhone)
	if err != nil || contact == nil {
		return core.ErrBotNotFound
	}

	conv, err := c.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, "open", true)
	if err != nil {
		return fmt.Errorf("failed to get bot conversation: %w", err)
	}

	content := "📱 *Scan QR Code to connect*"
	if pairingCode != "" {
		content = fmt.Sprintf("📱 *Scan QR Code to connect*\n\n🔑 Pairing Code: `%s`", pairingCode)
	}

	reader := bytes.NewReader(qrCodeData)
	_, err = c.CreateMessageWithAttachmentAndMime(ctx, conv.ID, content, "incoming", reader, "qrcode.png", "image/png", nil)
	if err != nil {
		return fmt.Errorf("failed to send QR code: %w", err)
	}

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

// HandleConversationNotFound clears conversation references when a 404 error occurs
// This allows the system to recreate the conversation on the next interaction
func (s *Service) HandleConversationNotFound(ctx context.Context, sessionID string, conversationID int) {
	if s.database == nil || conversationID <= 0 {
		return
	}

	affected, err := s.database.Messages.ClearCwConversation(ctx, sessionID, conversationID)
	if err != nil {
		logger.Warn().
			Err(err).
			Str("sessionId", sessionID).
			Int("conversationId", conversationID).
			Msg("Chatwoot: failed to clear deleted conversation references")
		return
	}

	logger.Info().
		Str("sessionId", sessionID).
		Int("conversationId", conversationID).
		Int64("messagesCleared", affected).
		Msg("Chatwoot: cleared references for deleted conversation (will recreate on next message)")
}

// ShouldIgnoreJid checks if a JID should be ignored
func (s *Service) ShouldIgnoreJid(cfg *core.Config, jid string) bool {
	if util.IsStatusBroadcast(jid) || util.IsNewsletter(jid) {
		return true
	}

	if len(cfg.IgnoreChats) == 0 {
		return false
	}

	for _, ignoreJid := range cfg.IgnoreChats {
		if ignoreJid == "@g.us" && util.IsGroupJID(jid) {
			return true
		}
		if ignoreJid == "@s.whatsapp.net" && !util.IsGroupJID(jid) && !util.IsStatusBroadcast(jid) {
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
