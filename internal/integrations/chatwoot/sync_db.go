package chatwoot

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"

	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// ChatwootDBSync handles direct database sync to Chatwoot PostgreSQL
type ChatwootDBSync struct {
	cfg       *Config
	client    *Client
	msgRepo   MessageRepository
	sessionID string
	cwDB      *sql.DB
}

// NewChatwootDBSync creates a new direct database sync service
func NewChatwootDBSync(cfg *Config, msgRepo MessageRepository, sessionID string) (*ChatwootDBSync, error) {
	if cfg.ChatwootDBHost == "" {
		return nil, fmt.Errorf("chatwoot database host not configured")
	}

	port := cfg.ChatwootDBPort
	if port == 0 {
		port = 5432
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
		cfg.ChatwootDBUser,
		cfg.ChatwootDBPass,
		cfg.ChatwootDBHost,
		port,
		cfg.ChatwootDBName,
	)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to chatwoot database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping chatwoot database: %w", err)
	}

	logger.Info().
		Str("host", cfg.ChatwootDBHost).
		Int("port", port).
		Str("database", cfg.ChatwootDBName).
		Msg("Chatwoot: connected to database for direct sync")

	return &ChatwootDBSync{
		cfg:       cfg,
		client:    NewClient(cfg.URL, cfg.Token, cfg.Account),
		msgRepo:   msgRepo,
		sessionID: sessionID,
		cwDB:      db,
	}, nil
}

// Close closes the database connection
func (s *ChatwootDBSync) Close() error {
	if s.cwDB != nil {
		return s.cwDB.Close()
	}
	return nil
}

// getChatwootUser gets the user info from Chatwoot API token
func (s *ChatwootDBSync) getChatwootUser(ctx context.Context) (userID int, userType string, err error) {
	query := `
		SELECT u.id, 'User' as user_type
		FROM users u
		INNER JOIN access_tokens at ON at.owner_id = u.id AND at.owner_type = 'User'
		WHERE at.token = $1
		LIMIT 1
	`
	err = s.cwDB.QueryRowContext(ctx, query, s.cfg.Token).Scan(&userID, &userType)
	if err != nil {
		return 0, "", fmt.Errorf("failed to get chatwoot user: %w", err)
	}
	return userID, userType, nil
}

// getExistingSourceIDs returns set of source_ids that already exist in Chatwoot
func (s *ChatwootDBSync) getExistingSourceIDs(ctx context.Context, messageIDs []string) (map[string]bool, error) {
	existing := make(map[string]bool)
	if len(messageIDs) == 0 {
		return existing, nil
	}

	// Build source_ids with WAID: prefix
	sourceIDs := make([]string, len(messageIDs))
	for i, id := range messageIDs {
		sourceIDs[i] = "WAID:" + id
	}

	// Query in batches
	batchSize := 500
	for i := 0; i < len(sourceIDs); i += batchSize {
		end := i + batchSize
		if end > len(sourceIDs) {
			end = len(sourceIDs)
		}
		batch := sourceIDs[i:end]

		placeholders := make([]string, len(batch))
		args := make([]interface{}, len(batch)+1)
		args[0] = s.cfg.Account
		for j, id := range batch {
			placeholders[j] = fmt.Sprintf("$%d", j+2)
			args[j+1] = id
		}

		query := fmt.Sprintf(`
			SELECT source_id FROM messages 
			WHERE account_id = $1 AND source_id IN (%s)
		`, strings.Join(placeholders, ","))

		rows, err := s.cwDB.QueryContext(ctx, query, args...)
		if err != nil {
			return nil, err
		}

		for rows.Next() {
			var sourceID string
			if err := rows.Scan(&sourceID); err != nil {
				rows.Close()
				return nil, err
			}
			existing[sourceID] = true
		}
		rows.Close()
	}

	return existing, nil
}

// getOrCreateContactAndConversation ensures contact and conversation exist
func (s *ChatwootDBSync) getOrCreateContactAndConversation(ctx context.Context, phone, jid, name string) (contactID, conversationID int, err error) {
	// Use the API client to get/create contact
	contact, err := s.client.GetOrCreateContactWithMerge(
		ctx,
		s.cfg.InboxID,
		phone,
		jid,
		name,
		"",
		false,
		s.cfg.MergeBrPhones,
	)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get/create contact: %w", err)
	}

	// Get or create conversation
	status := "open"
	if s.cfg.StartPending {
		status = "pending"
	}

	conv, err := s.client.GetOrCreateConversation(ctx, contact.ID, s.cfg.InboxID, status, s.cfg.AutoReopen)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get/create conversation: %w", err)
	}

	return contact.ID, conv.ID, nil
}

// SyncMessages synchronizes messages directly to Chatwoot PostgreSQL with original timestamps
func (s *ChatwootDBSync) SyncMessages(ctx context.Context, daysLimit int) (*SyncStats, error) {
	stats := &SyncStats{}

	logger.Info().
		Str("sessionId", s.sessionID).
		Int("daysLimit", daysLimit).
		Msg("Chatwoot DB: starting direct messages sync")

	// Get chatwoot user for outgoing messages
	userID, userType, err := s.getChatwootUser(ctx)
	if err != nil {
		return stats, fmt.Errorf("failed to get chatwoot user: %w", err)
	}

	logger.Debug().
		Int("userId", userID).
		Str("userType", userType).
		Msg("Chatwoot DB: got user for outgoing messages")

	// Get messages from our database
	limit := 50000
	messages, err := s.msgRepo.GetBySession(ctx, s.sessionID, limit, 0)
	if err != nil {
		return stats, fmt.Errorf("failed to get messages: %w", err)
	}

	// Calculate cutoff date
	var cutoffTime time.Time
	if daysLimit > 0 {
		cutoffTime = time.Now().AddDate(0, 0, -daysLimit)
	}

	// Collect message IDs to check for existing
	var messageIDs []string
	for _, msg := range messages {
		messageIDs = append(messageIDs, msg.MsgId)
	}

	// Get existing source_ids to avoid duplicates
	existingSourceIDs, err := s.getExistingSourceIDs(ctx, messageIDs)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot DB: failed to check existing messages")
	}

	// Filter messages
	var filteredMessages []model.Message
	for _, msg := range messages {
		sourceID := "WAID:" + msg.MsgId

		// Skip if already exists in Chatwoot
		if existingSourceIDs[sourceID] {
			stats.MessagesSkipped++
			continue
		}

		// Skip if already synced (has cwMsgId)
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
		Msg("Chatwoot DB: filtered messages for sync")

	if len(filteredMessages) == 0 {
		return stats, nil
	}

	// Sort all messages by timestamp (oldest first)
	sortMessagesByTimestamp(filteredMessages)

	// Group messages by chat
	messagesByChat := make(map[string][]model.Message)
	for _, msg := range filteredMessages {
		messagesByChat[msg.ChatJID] = append(messagesByChat[msg.ChatJID], msg)
	}

	// Cache for contact/conversation IDs
	type chatFKs struct {
		contactID      int
		conversationID int
	}
	chatCache := make(map[string]*chatFKs)

	// Get/create contacts and conversations first
	for chatJID, chatMessages := range messagesByChat {
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

		contactID, conversationID, err := s.getOrCreateContactAndConversation(ctx, phone, chatJID, contactName)
		if err != nil {
			logger.Warn().Err(err).Str("chatJID", chatJID).Msg("Chatwoot DB: failed to get/create contact/conversation")
			stats.Errors++
			continue
		}

		chatCache[chatJID] = &chatFKs{
			contactID:      contactID,
			conversationID: conversationID,
		}
		stats.ConversationsUsed++
	}

	// Insert messages in batches directly to PostgreSQL
	batchSize := 100
	var batch []model.Message

	for _, msg := range filteredMessages {
		fks := chatCache[msg.ChatJID]
		if fks == nil {
			continue
		}

		batch = append(batch, msg)

		if len(batch) >= batchSize {
			imported, err := s.insertMessageBatch(ctx, batch, chatCache, userID, userType)
			if err != nil {
				logger.Warn().Err(err).Msg("Chatwoot DB: batch insert failed")
				stats.Errors += len(batch)
			} else {
				stats.MessagesImported += imported
			}
			batch = nil
		}
	}

	// Insert remaining messages
	if len(batch) > 0 {
		imported, err := s.insertMessageBatch(ctx, batch, chatCache, userID, userType)
		if err != nil {
			logger.Warn().Err(err).Msg("Chatwoot DB: final batch insert failed")
			stats.Errors += len(batch)
		} else {
			stats.MessagesImported += imported
		}
	}

	logger.Info().
		Int("imported", stats.MessagesImported).
		Int("conversations", stats.ConversationsUsed).
		Int("errors", stats.Errors).
		Msg("Chatwoot DB: messages sync completed")

	return stats, nil
}

// insertMessageBatch inserts a batch of messages directly to Chatwoot PostgreSQL
func (s *ChatwootDBSync) insertMessageBatch(ctx context.Context, messages []model.Message, chatCache map[string]*chatFKs, userID int, userType string) (int, error) {
	if len(messages) == 0 {
		return 0, nil
	}

	// Build INSERT query
	query := `
		INSERT INTO messages 
		(content, processed_message_content, account_id, inbox_id, conversation_id, 
		 message_type, private, content_type, sender_type, sender_id, source_id, 
		 created_at, updated_at)
		VALUES 
	`

	var values []string
	var args []interface{}
	argIndex := 1

	for _, msg := range messages {
		fks := chatCache[msg.ChatJID]
		if fks == nil {
			continue
		}

		content := s.getMessageContent(&msg)
		if content == "" {
			continue
		}

		// message_type: 0 = incoming, 1 = outgoing
		messageType := 0
		senderType := "Contact"
		senderID := fks.contactID
		if msg.FromMe {
			messageType = 1
			senderType = userType
			senderID = userID
		}

		sourceID := "WAID:" + msg.MsgId
		timestamp := msg.Timestamp

		values = append(values, fmt.Sprintf(
			"($%d, $%d, $%d, $%d, $%d, $%d, FALSE, 0, $%d, $%d, $%d, $%d, $%d)",
			argIndex, argIndex+1, argIndex+2, argIndex+3, argIndex+4,
			argIndex+5, argIndex+6, argIndex+7, argIndex+8, argIndex+9, argIndex+10,
		))

		args = append(args,
			content,                // $1 content
			content,                // $2 processed_message_content
			s.cfg.Account,          // $3 account_id
			s.cfg.InboxID,          // $4 inbox_id
			fks.conversationID,     // $5 conversation_id
			messageType,            // $6 message_type
			senderType,             // $7 sender_type
			senderID,               // $8 sender_id
			sourceID,               // $9 source_id
			timestamp,              // $10 created_at
			timestamp,              // $11 updated_at
		)
		argIndex += 11
	}

	if len(values) == 0 {
		return 0, nil
	}

	query += strings.Join(values, ", ")

	result, err := s.cwDB.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to insert messages: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	return int(rowsAffected), nil
}

// getMessageContent extracts message content or generates placeholder
func (s *ChatwootDBSync) getMessageContent(msg *model.Message) string {
	if msg.Content != "" {
		return msg.Content
	}

	// Generate placeholder for media messages
	switch msg.Type {
	case "image":
		return "_[Imagem]_"
	case "video":
		return "_[Vídeo]_"
	case "audio":
		return "_[Áudio]_"
	case "document":
		return "_[Documento]_"
	case "sticker":
		return "_[Sticker]_"
	case "location":
		return "_[Localização]_"
	case "contact":
		return "_[Contato]_"
	default:
		return ""
	}
}

// SyncContacts synchronizes contacts to Chatwoot
func (s *ChatwootDBSync) SyncContacts(ctx context.Context, daysLimit int) (*SyncStats, error) {
	stats := &SyncStats{}

	logger.Info().
		Str("sessionId", s.sessionID).
		Int("daysLimit", daysLimit).
		Msg("Chatwoot DB: starting contacts sync")

	// Get messages from our database to extract contacts
	limit := 10000
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
		if daysLimit > 0 && msg.Timestamp.Before(cutoffTime) {
			continue
		}

		if IsGroupJID(msg.ChatJID) || IsStatusBroadcast(msg.ChatJID) {
			continue
		}

		phone := ExtractPhoneFromJID(msg.ChatJID)
		if phone == "" {
			continue
		}

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
			contactMap[msg.ChatJID].name = msg.PushName
		}
	}

	logger.Info().
		Int("uniqueContacts", len(contactMap)).
		Msg("Chatwoot DB: extracted unique contacts")

	// Create contacts via API
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
		Msg("Chatwoot DB: contacts sync completed")

	return stats, nil
}

// SyncAll performs full sync (contacts + messages)
func (s *ChatwootDBSync) SyncAll(ctx context.Context, daysLimit int) (*SyncStats, error) {
	totalStats := &SyncStats{}

	contactStats, err := s.SyncContacts(ctx, daysLimit)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot DB: contacts sync failed")
	} else {
		totalStats.ContactsCreated = contactStats.ContactsCreated
		totalStats.ContactsUpdated = contactStats.ContactsUpdated
		totalStats.ContactsSkipped = contactStats.ContactsSkipped
	}

	msgStats, err := s.SyncMessages(ctx, daysLimit)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot DB: messages sync failed")
	} else {
		totalStats.MessagesImported = msgStats.MessagesImported
		totalStats.MessagesSkipped = msgStats.MessagesSkipped
		totalStats.ConversationsUsed = msgStats.ConversationsUsed
	}

	if contactStats != nil {
		totalStats.Errors += contactStats.Errors
	}
	if msgStats != nil {
		totalStats.Errors += msgStats.Errors
	}

	return totalStats, nil
}

// StartSyncAsync starts sync in background
func (s *ChatwootDBSync) StartSyncAsync(syncType string, daysLimit int) (*SyncStatus, error) {
	currentStatus := GetSyncStatus(s.sessionID)
	if currentStatus.InProgress {
		return currentStatus, fmt.Errorf("sync already in progress")
	}

	startTime := time.Now().Format(time.RFC3339)
	status := &SyncStatus{
		SessionID:  s.sessionID,
		InProgress: true,
		Type:       syncType,
		StartedAt:  startTime,
		Stats: &SyncStats{
			Status:    "running",
			StartedAt: startTime,
		},
	}
	setSyncStatus(s.sessionID, status)

	go func() {
		ctx := context.Background()
		var stats *SyncStats
		var err error

		switch syncType {
		case "contacts":
			stats, err = s.SyncContacts(ctx, daysLimit)
		case "messages":
			stats, err = s.SyncMessages(ctx, daysLimit)
		default:
			stats, err = s.SyncAll(ctx, daysLimit)
		}

		completedTime := time.Now().Format(time.RFC3339)
		finalStatus := &SyncStatus{
			SessionID:  s.sessionID,
			InProgress: false,
			Type:       syncType,
			StartedAt:  startTime,
		}

		if err != nil {
			finalStatus.Error = err.Error()
			if stats != nil {
				stats.Status = "failed"
				stats.CompletedAt = completedTime
				finalStatus.Stats = stats
			}
		} else {
			stats.Status = "completed"
			stats.CompletedAt = completedTime
			stats.StartedAt = startTime
			finalStatus.Stats = stats
		}

		setSyncStatus(s.sessionID, finalStatus)

		// Close DB connection
		s.Close()

		logger.Info().
			Str("sessionId", s.sessionID).
			Str("type", syncType).
			Str("status", stats.Status).
			Int("messagesImported", stats.MessagesImported).
			Int("contactsCreated", stats.ContactsCreated).
			Msg("Chatwoot DB: async sync completed")
	}()

	return status, nil
}
