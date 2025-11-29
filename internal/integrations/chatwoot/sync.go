package chatwoot

import (
	"context"
	"fmt"
	"time"

	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// SyncService handles synchronization of contacts and messages to Chatwoot
type SyncService struct {
	client     *Client
	cfg        *Config
	msgRepo    MessageRepository
	sessionID  string
}

// MessageRepository interface for accessing stored messages
type MessageRepository interface {
	GetBySession(ctx context.Context, sessionID string, limit, offset int) ([]model.Message, error)
	GetByChat(ctx context.Context, sessionID, chatJID string, limit, offset int) ([]model.Message, error)
	UpdateCwFields(ctx context.Context, sessionID, msgId string, cwMsgId, cwConvId int, cwSourceId string) error
}

// SyncStats holds statistics from a sync operation
type SyncStats struct {
	ContactsCreated   int `json:"contactsCreated"`
	ContactsUpdated   int `json:"contactsUpdated"`
	ContactsSkipped   int `json:"contactsSkipped"`
	MessagesImported  int `json:"messagesImported"`
	MessagesSkipped   int `json:"messagesSkipped"`
	ConversationsUsed int `json:"conversationsUsed"`
	Errors            int `json:"errors"`
}

// NewSyncService creates a new sync service
func NewSyncService(cfg *Config, msgRepo MessageRepository, sessionID string) *SyncService {
	return &SyncService{
		client:    NewClient(cfg.URL, cfg.Token, cfg.Account),
		cfg:       cfg,
		msgRepo:   msgRepo,
		sessionID: sessionID,
	}
}

// SyncContacts synchronizes contacts from our database to Chatwoot
// It extracts unique contacts from message history and creates them in Chatwoot
func (s *SyncService) SyncContacts(ctx context.Context, daysLimit int) (*SyncStats, error) {
	stats := &SyncStats{}

	logger.Info().
		Str("sessionId", s.sessionID).
		Int("daysLimit", daysLimit).
		Msg("Chatwoot: starting contacts sync")

	// Get messages from our database to extract contacts
	limit := 10000 // Max messages to process
	messages, err := s.msgRepo.GetBySession(ctx, s.sessionID, limit, 0)
	if err != nil {
		return stats, fmt.Errorf("failed to get messages: %w", err)
	}

	// Calculate cutoff date
	var cutoffTime time.Time
	if daysLimit > 0 {
		cutoffTime = time.Now().AddDate(0, 0, -daysLimit)
	}

	// Extract unique contacts from messages
	contactMap := make(map[string]*contactInfo)
	for _, msg := range messages {
		// Skip if older than cutoff
		if daysLimit > 0 && msg.Timestamp.Before(cutoffTime) {
			continue
		}

		// Skip groups and status broadcasts
		if IsGroupJID(msg.ChatJID) || IsStatusBroadcast(msg.ChatJID) {
			continue
		}

		// Extract phone from JID
		phone := ExtractPhoneFromJID(msg.ChatJID)
		if phone == "" {
			continue
		}

		// Use chatJID as key to avoid duplicates
		if _, exists := contactMap[msg.ChatJID]; !exists {
			name := msg.PushName
			if name == "" {
				name = phone
			}
			contactMap[msg.ChatJID] = &contactInfo{
				phone:      phone,
				name:       name,
				identifier: msg.ChatJID,
			}
		} else if msg.PushName != "" && contactMap[msg.ChatJID].name == contactMap[msg.ChatJID].phone {
			// Update name if we have a better one
			contactMap[msg.ChatJID].name = msg.PushName
		}
	}

	logger.Info().
		Int("uniqueContacts", len(contactMap)).
		Msg("Chatwoot: extracted unique contacts from messages")

	// Create contacts in Chatwoot
	for _, info := range contactMap {
		contact, err := s.client.GetOrCreateContactWithMerge(
			ctx,
			s.cfg.InboxID,
			info.phone,
			info.identifier,
			info.name,
			"",
			false,
			s.cfg.MergeBrPhones,
		)
		if err != nil {
			logger.Warn().Err(err).
				Str("phone", info.phone).
				Msg("Chatwoot: failed to create contact")
			stats.Errors++
			continue
		}

		if contact != nil {
			stats.ContactsCreated++
		}
	}

	logger.Info().
		Int("created", stats.ContactsCreated).
		Int("errors", stats.Errors).
		Msg("Chatwoot: contacts sync completed")

	return stats, nil
}

// SyncMessages synchronizes message history to Chatwoot
func (s *SyncService) SyncMessages(ctx context.Context, daysLimit int) (*SyncStats, error) {
	stats := &SyncStats{}

	logger.Info().
		Str("sessionId", s.sessionID).
		Int("daysLimit", daysLimit).
		Msg("Chatwoot: starting messages sync")

	// Get messages from our database
	limit := 50000 // Max messages to process
	messages, err := s.msgRepo.GetBySession(ctx, s.sessionID, limit, 0)
	if err != nil {
		return stats, fmt.Errorf("failed to get messages: %w", err)
	}

	// Calculate cutoff date
	var cutoffTime time.Time
	if daysLimit > 0 {
		cutoffTime = time.Now().AddDate(0, 0, -daysLimit)
	}

	// Filter messages
	var filteredMessages []model.Message
	for _, msg := range messages {
		// Skip if already synced to Chatwoot
		if msg.CwMsgId != nil && *msg.CwMsgId > 0 {
			stats.MessagesSkipped++
			continue
		}

		// Skip if older than cutoff
		if daysLimit > 0 && msg.Timestamp.Before(cutoffTime) {
			stats.MessagesSkipped++
			continue
		}

		// Skip groups and status broadcasts
		if IsGroupJID(msg.ChatJID) || IsStatusBroadcast(msg.ChatJID) {
			stats.MessagesSkipped++
			continue
		}

		// Skip protocol messages and reactions
		if msg.Type == "protocol" || msg.Type == "reaction" {
			stats.MessagesSkipped++
			continue
		}

		filteredMessages = append(filteredMessages, msg)
	}

	logger.Info().
		Int("totalMessages", len(messages)).
		Int("toSync", len(filteredMessages)).
		Int("skipped", stats.MessagesSkipped).
		Msg("Chatwoot: filtered messages for sync")

	// Group messages by chat
	messagesByChat := make(map[string][]model.Message)
	for _, msg := range filteredMessages {
		messagesByChat[msg.ChatJID] = append(messagesByChat[msg.ChatJID], msg)
	}

	// Process each chat
	conversationCache := make(map[string]int) // chatJID -> conversationID
	for chatJID, chatMessages := range messagesByChat {
		// Sort messages by timestamp (oldest first for import)
		sortMessagesByTimestamp(chatMessages)

		// Get or create contact and conversation
		phone := ExtractPhoneFromJID(chatJID)
		if phone == "" {
			continue
		}

		// Get contact name from first message with pushName
		contactName := phone
		for _, msg := range chatMessages {
			if msg.PushName != "" {
				contactName = msg.PushName
				break
			}
		}

		// Get or create contact
		contact, err := s.client.GetOrCreateContactWithMerge(
			ctx,
			s.cfg.InboxID,
			phone,
			chatJID,
			contactName,
			"",
			false,
			s.cfg.MergeBrPhones,
		)
		if err != nil {
			logger.Warn().Err(err).
				Str("chatJID", chatJID).
				Msg("Chatwoot: failed to get/create contact")
			stats.Errors++
			continue
		}

		// Get or create conversation
		status := "open"
		if s.cfg.StartPending {
			status = "pending"
		}

		conv, err := s.client.GetOrCreateConversation(ctx, contact.ID, s.cfg.InboxID, status, s.cfg.AutoReopen)
		if err != nil {
			logger.Warn().Err(err).
				Int("contactId", contact.ID).
				Msg("Chatwoot: failed to get/create conversation")
			stats.Errors++
			continue
		}

		conversationCache[chatJID] = conv.ID
		stats.ConversationsUsed++

		// Import messages to this conversation
		for _, msg := range chatMessages {
			if err := s.importMessage(ctx, conv.ID, &msg); err != nil {
				logger.Debug().Err(err).
					Str("msgId", msg.MsgId).
					Msg("Chatwoot: failed to import message")
				stats.Errors++
				continue
			}
			stats.MessagesImported++
		}
	}

	logger.Info().
		Int("imported", stats.MessagesImported).
		Int("conversations", stats.ConversationsUsed).
		Int("errors", stats.Errors).
		Msg("Chatwoot: messages sync completed")

	return stats, nil
}

// importMessage imports a single message to Chatwoot
func (s *SyncService) importMessage(ctx context.Context, conversationID int, msg *model.Message) error {
	// Determine message type for Chatwoot
	messageType := "incoming"
	if msg.FromMe {
		messageType = "outgoing"
	}

	// Get content
	content := msg.Content
	if content == "" {
		// Generate placeholder for media messages
		content = s.getMediaPlaceholder(msg)
		if content == "" {
			return nil // Skip empty messages
		}
	}

	// Create message in Chatwoot
	req := &CreateMessageRequest{
		Content:     content,
		MessageType: messageType,
		Private:     false,
	}
	cwMsg, err := s.client.CreateMessage(ctx, conversationID, req)
	if err != nil {
		return err
	}

	// Update our database with Chatwoot IDs
	sourceID := fmt.Sprintf("WAID:%s", msg.MsgId)
	if err := s.msgRepo.UpdateCwFields(ctx, s.sessionID, msg.MsgId, cwMsg.ID, conversationID, sourceID); err != nil {
		logger.Debug().Err(err).
			Str("msgId", msg.MsgId).
			Msg("Chatwoot: failed to update cw fields in DB")
	}

	return nil
}

// getMediaPlaceholder returns a placeholder text for media messages
func (s *SyncService) getMediaPlaceholder(msg *model.Message) string {
	switch msg.Type {
	case "image":
		if msg.Content != "" {
			return fmt.Sprintf("_<Image: %s>_", msg.Content)
		}
		return "_<Image>_"
	case "video":
		if msg.Content != "" {
			return fmt.Sprintf("_<Video: %s>_", msg.Content)
		}
		return "_<Video>_"
	case "audio":
		return "_<Audio>_"
	case "document":
		if msg.Content != "" {
			return fmt.Sprintf("_<Document: %s>_", msg.Content)
		}
		return "_<Document>_"
	case "sticker":
		return "_<Sticker>_"
	case "location":
		return "_<Location>_"
	case "contact":
		return "_<Contact>_"
	default:
		return ""
	}
}

// SyncAll performs a full sync (contacts + messages)
func (s *SyncService) SyncAll(ctx context.Context, daysLimit int) (*SyncStats, error) {
	totalStats := &SyncStats{}

	// Sync contacts first
	contactStats, err := s.SyncContacts(ctx, daysLimit)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot: contacts sync failed")
	} else {
		totalStats.ContactsCreated = contactStats.ContactsCreated
		totalStats.ContactsUpdated = contactStats.ContactsUpdated
		totalStats.ContactsSkipped = contactStats.ContactsSkipped
	}

	// Then sync messages
	msgStats, err := s.SyncMessages(ctx, daysLimit)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot: messages sync failed")
	} else {
		totalStats.MessagesImported = msgStats.MessagesImported
		totalStats.MessagesSkipped = msgStats.MessagesSkipped
		totalStats.ConversationsUsed = msgStats.ConversationsUsed
	}

	totalStats.Errors = contactStats.Errors + msgStats.Errors

	return totalStats, nil
}

// Helper types

type contactInfo struct {
	phone      string
	name       string
	identifier string
}

// sortMessagesByTimestamp sorts messages by timestamp (oldest first)
func sortMessagesByTimestamp(messages []model.Message) {
	for i := 0; i < len(messages)-1; i++ {
		for j := i + 1; j < len(messages); j++ {
			if messages[i].Timestamp.After(messages[j].Timestamp) {
				messages[i], messages[j] = messages[j], messages[i]
			}
		}
	}
}
