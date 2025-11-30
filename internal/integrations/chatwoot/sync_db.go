package chatwoot

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/lib/pq"

	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// MessageRepository interface for accessing message data
type MessageRepository interface {
	GetBySession(ctx context.Context, sessionID string, limit, offset int) ([]model.Message, error)
}

// WhatsAppContact represents a contact from WhatsApp
type WhatsAppContact struct {
	JID          string
	PushName     string
	BusinessName string
	FullName     string
	FirstName    string
}

// ContactsGetter interface for getting WhatsApp contacts
type ContactsGetter interface {
	GetAllContacts(ctx context.Context) ([]WhatsAppContact, error)
	GetProfilePictureURL(ctx context.Context, jid string) (string, error)
}

// SyncStats tracks synchronization statistics
type SyncStats struct {
	ContactsImported  int `json:"contactsImported"`
	ContactsSkipped   int `json:"contactsSkipped"`
	ContactsErrors    int `json:"contactsErrors"`
	MessagesImported  int `json:"messagesImported"`
	MessagesSkipped   int `json:"messagesSkipped"`
	MessagesErrors    int `json:"messagesErrors"`
	ConversationsUsed int `json:"conversationsUsed"`
	Errors            int `json:"errors"`
}

// SyncStatus represents the current sync status
type SyncStatus struct {
	SessionID string     `json:"sessionId"`
	Status    string     `json:"status"` // idle, running, completed, failed
	Type      string     `json:"type"`   // contacts, messages, all
	StartedAt *time.Time `json:"startedAt,omitempty"`
	EndedAt   *time.Time `json:"endedAt,omitempty"`
	Stats     SyncStats  `json:"stats"`
	Error     string     `json:"error,omitempty"`
}

// Global sync status tracking
var (
	syncStatusMap   = make(map[string]*SyncStatus)
	syncStatusMutex sync.RWMutex
)

// GetSyncStatus returns the current sync status for a session
func GetSyncStatus(sessionID string) *SyncStatus {
	syncStatusMutex.RLock()
	defer syncStatusMutex.RUnlock()

	if status, ok := syncStatusMap[sessionID]; ok {
		return status
	}

	return &SyncStatus{
		SessionID: sessionID,
		Status:    "idle",
	}
}

func setSyncStatus(sessionID string, status *SyncStatus) {
	syncStatusMutex.Lock()
	defer syncStatusMutex.Unlock()
	syncStatusMap[sessionID] = status
}

// sortMessagesByTimestamp sorts messages by timestamp ascending
func sortMessagesByTimestamp(messages []model.Message) {
	sort.Slice(messages, func(i, j int) bool {
		return messages[i].Timestamp.Before(messages[j].Timestamp)
	})
}

// contactNameInfo holds name information from various sources
type contactNameInfo struct {
	FullName     string
	FirstName    string
	PushName     string
	BusinessName string
}

// getBestContactName returns the best available name with priority:
// 1. FullName from WhatsApp Contact Store
// 2. FirstName from WhatsApp Contact Store
// 3. PushName (from contact store or message)
// 4. BusinessName from WhatsApp Contact Store
// 5. Phone number (fallback)
func getBestContactName(info *contactNameInfo, phone string) string {
	if info != nil {
		if info.FullName != "" {
			return info.FullName
		}
		if info.FirstName != "" {
			return info.FirstName
		}
		if info.PushName != "" {
			return info.PushName
		}
		if info.BusinessName != "" {
			return info.BusinessName
		}
	}
	return phone
}

// ChatwootDBSync handles direct database sync to Chatwoot PostgreSQL
type ChatwootDBSync struct {
	cfg            *Config
	client         *Client
	msgRepo        MessageRepository
	contactsGetter ContactsGetter
	sessionID      string
	cwDB           *sql.DB
}

// NewChatwootDBSync creates a new direct database sync service
func NewChatwootDBSync(cfg *Config, msgRepo MessageRepository, contactsGetter ContactsGetter, sessionID string) (*ChatwootDBSync, error) {
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
		cfg:            cfg,
		client:         NewClient(cfg.URL, cfg.Token, cfg.Account),
		msgRepo:        msgRepo,
		contactsGetter: contactsGetter,
		sessionID:      sessionID,
		cwDB:           db,
	}, nil
}

// Close closes the database connection
func (s *ChatwootDBSync) Close() error {
	if s.cwDB != nil {
		return s.cwDB.Close()
	}
	return nil
}

// updateSyncStats updates the sync status with current stats
func (s *ChatwootDBSync) updateSyncStats(stats *SyncStats) {
	syncStatusMutex.Lock()
	defer syncStatusMutex.Unlock()

	if status, ok := syncStatusMap[s.sessionID]; ok {
		status.Stats = *stats
	}
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
// Optimized: uses ANY($1) for efficient array query (Evolution API pattern)
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

	// Use ANY($1) for efficient array query - much faster than IN (...)
	// Process in batches of 10000 to avoid memory issues
	batchSize := 10000
	for i := 0; i < len(sourceIDs); i += batchSize {
		end := i + batchSize
		if end > len(sourceIDs) {
			end = len(sourceIDs)
		}
		batch := sourceIDs[i:end]

		// Use pq.Array for efficient PostgreSQL array handling
		query := `SELECT source_id FROM messages WHERE account_id = $1 AND source_id = ANY($2)`

		rows, err := s.cwDB.QueryContext(ctx, query, s.cfg.Account, pq.Array(batch))
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

// phoneTimestamp holds timestamp range for a phone number
type phoneTimestamp struct {
	phone     string
	firstTS   int64
	lastTS    int64
	name      string
	identifier string
}

// selectOrCreateFksFromChatwoot creates contacts, contact_inboxes, and conversations in a single SQL query
// This follows the Evolution API pattern for efficient bulk import
// Processes in batches of 500 to avoid query size limits
func (s *ChatwootDBSync) selectOrCreateFksFromChatwoot(ctx context.Context, phoneData []phoneTimestamp) (map[string]*chatFKs, error) {
	result := make(map[string]*chatFKs)
	
	if len(phoneData) == 0 {
		return result, nil
	}

	// Process in batches of 500 to avoid PostgreSQL query size limits
	batchSize := 500
	for batchStart := 0; batchStart < len(phoneData); batchStart += batchSize {
		batchEnd := batchStart + batchSize
		if batchEnd > len(phoneData) {
			batchEnd = len(phoneData)
		}
		batch := phoneData[batchStart:batchEnd]

		batchResult, err := s.selectOrCreateFksBatch(ctx, batch)
		if err != nil {
			return nil, err
		}
		for k, v := range batchResult {
			result[k] = v
		}
	}

	return result, nil
}

// selectOrCreateFksBatch processes a single batch of phone data
// Handles ALL cases: new contacts, existing contacts without contact_inbox, and existing complete chains
func (s *ChatwootDBSync) selectOrCreateFksBatch(ctx context.Context, phoneData []phoneTimestamp) (map[string]*chatFKs, error) {
	result := make(map[string]*chatFKs)

	if len(phoneData) == 0 {
		return result, nil
	}

	// Build VALUES clause for phone numbers with timestamps
	var valuesClauses []string
	args := []interface{}{s.cfg.Account, s.cfg.InboxID}
	
	for _, pd := range phoneData {
		baseIdx := len(args) + 1
		args = append(args, pd.phone, pd.name, pd.identifier)
		// Embed timestamps directly in SQL to avoid int64 encoding issues
		valuesClauses = append(valuesClauses, fmt.Sprintf("($%d::text, %d::bigint, %d::bigint, $%d::text, $%d::text)", 
			baseIdx, pd.firstTS, pd.lastTS, baseIdx+1, baseIdx+2))
	}

	// Single CTE query that:
	// 1. Upserts contacts (creates new or updates existing)
	// 2. Creates contact_inboxes for ALL contacts that don't have one (new OR existing)
	// 3. Creates conversations for ALL contact_inboxes that don't have one
	// 4. Returns all FKs for all input phones
	query := fmt.Sprintf(`
		WITH
		phone_data AS (
			SELECT phone_number, created_at, last_activity_at, contact_name, identifier FROM (
				VALUES %s
			) AS t (phone_number, created_at, last_activity_at, contact_name, identifier)
		),

		-- Upsert all contacts (insert new, update name if it was just phone number)
		upserted_contacts AS (
			INSERT INTO contacts (name, phone_number, account_id, identifier, created_at, updated_at)
			SELECT 
				p.contact_name,
				p.phone_number, 
				$1, 
				p.identifier,
				to_timestamp(p.created_at), 
				to_timestamp(p.last_activity_at)
			FROM phone_data AS p
			ON CONFLICT(identifier, account_id) DO UPDATE SET 
				updated_at = EXCLUDED.updated_at,
				name = CASE 
					WHEN contacts.name = contacts.phone_number 
					  OR contacts.name = REPLACE(contacts.phone_number, '+', '')
					  OR contacts.name IS NULL 
					  OR contacts.name = ''
					THEN EXCLUDED.name 
					ELSE contacts.name 
				END
			RETURNING id, phone_number, identifier
		),

		-- Get all contact IDs for the input phones (from upsert or existing)
		all_contacts AS (
			SELECT c.id, c.phone_number, c.identifier
			FROM contacts c
			WHERE c.account_id = $1 
			AND c.identifier IN (SELECT identifier FROM phone_data)
		),

		-- Create contact_inboxes for ALL contacts that don't have one for this inbox
		new_contact_inboxes AS (
			INSERT INTO contact_inboxes (contact_id, inbox_id, source_id, created_at, updated_at)
			SELECT ac.id, $2, gen_random_uuid(), NOW(), NOW()
			FROM all_contacts ac
			WHERE NOT EXISTS (
				SELECT 1 FROM contact_inboxes ci 
				WHERE ci.contact_id = ac.id AND ci.inbox_id = $2
			)
			RETURNING id, contact_id
		),

		-- Get all contact_inbox IDs for these contacts
		all_contact_inboxes AS (
			SELECT ci.id, ci.contact_id
			FROM contact_inboxes ci
			JOIN all_contacts ac ON ac.id = ci.contact_id
			WHERE ci.inbox_id = $2
		),

		-- Create conversations for ALL contact_inboxes that don't have one
		new_conversations AS (
			INSERT INTO conversations (account_id, inbox_id, status, contact_id, contact_inbox_id, uuid, last_activity_at, created_at, updated_at)
			SELECT $1, $2, 0, aci.contact_id, aci.id, gen_random_uuid(), NOW(), NOW(), NOW()
			FROM all_contact_inboxes aci
			WHERE NOT EXISTS (
				SELECT 1 FROM conversations con 
				WHERE con.contact_inbox_id = aci.id
			)
			RETURNING id, contact_id, contact_inbox_id
		),

		-- Get all conversations for these contact_inboxes
		all_conversations AS (
			SELECT con.id, con.contact_id, aci.id as contact_inbox_id
			FROM conversations con
			JOIN all_contact_inboxes aci ON aci.id = con.contact_inbox_id
			WHERE con.account_id = $1 AND con.inbox_id = $2
		)

		-- Return phone -> contact_id -> conversation_id mapping for ALL input phones
		SELECT ac.phone_number, ac.id AS contact_id, aconv.id AS conversation_id
		FROM all_contacts ac
		JOIN all_contact_inboxes aci ON aci.contact_id = ac.id
		JOIN all_conversations aconv ON aconv.contact_inbox_id = aci.id
	`, strings.Join(valuesClauses, ", "))

	rows, err := s.cwDB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to select/create FKs: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var phoneNumber string
		var contactID, conversationID int
		if err := rows.Scan(&phoneNumber, &contactID, &conversationID); err != nil {
			return nil, err
		}
		result[phoneNumber] = &chatFKs{
			contactID:      contactID,
			conversationID: conversationID,
		}
	}

	return result, rows.Err()
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

		// Skip groups, status broadcasts, and newsletters
		if IsGroupJID(msg.ChatJID) || IsStatusBroadcast(msg.ChatJID) || IsNewsletter(msg.ChatJID) {
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

	// Build WhatsApp contacts cache for name lookup (optimized: single load)
	waContactsCache := make(map[string]*contactNameInfo)
	if s.contactsGetter != nil {
		contacts, err := s.contactsGetter.GetAllContacts(ctx)
		if err == nil {
			for _, c := range contacts {
				waContactsCache[c.JID] = &contactNameInfo{
					FullName:     c.FullName,
					FirstName:    c.FirstName,
					PushName:     c.PushName,
					BusinessName: c.BusinessName,
				}
			}
			logger.Info().Int("count", len(waContactsCache)).Msg("Chatwoot DB: loaded WhatsApp contacts cache")
		} else {
			logger.Warn().Err(err).Msg("Chatwoot DB: failed to load WhatsApp contacts cache")
		}
	}

	// Prepare phone data for bulk contact/conversation creation (Evolution API pattern)
	var phoneDataList []phoneTimestamp
	for chatJID, chatMessages := range messagesByChat {
		phone := ExtractPhoneFromJID(chatJID)
		if phone == "" {
			continue
		}

		// Get name from WhatsApp Contact Store or messages
		nameInfo := waContactsCache[chatJID]
		if nameInfo == nil || (nameInfo.FullName == "" && nameInfo.FirstName == "" && nameInfo.PushName == "" && nameInfo.BusinessName == "") {
			for i := len(chatMessages) - 1; i >= 0; i-- {
				msg := chatMessages[i]
				if msg.PushName != "" && !msg.FromMe {
					if nameInfo == nil {
						nameInfo = &contactNameInfo{}
					}
					nameInfo.PushName = msg.PushName
					break
				}
			}
		}
		contactName := getBestContactName(nameInfo, phone)

		// Get first and last message timestamps
		var firstTS, lastTS int64
		if len(chatMessages) > 0 {
			firstTS = chatMessages[0].Timestamp.Unix()
			lastTS = chatMessages[len(chatMessages)-1].Timestamp.Unix()
		} else {
			firstTS = time.Now().Unix()
			lastTS = firstTS
		}

		phoneDataList = append(phoneDataList, phoneTimestamp{
			phone:      "+" + phone,
			firstTS:    firstTS,
			lastTS:     lastTS,
			name:       contactName,
			identifier: chatJID,
		})
	}

	logger.Info().Int("chats", len(phoneDataList)).Msg("Chatwoot DB: creating contacts/conversations in single query")

	// Create all contacts and conversations in a single SQL query (Evolution API pattern)
	chatCacheByPhone, err := s.selectOrCreateFksFromChatwoot(ctx, phoneDataList)
	if err != nil {
		logger.Error().Err(err).Msg("Chatwoot DB: failed to create contacts/conversations")
		return stats, err
	}

	// Build chatCache by JID
	chatCache := make(map[string]*chatFKs)
	for _, pd := range phoneDataList {
		if fks, ok := chatCacheByPhone[pd.phone]; ok {
			chatCache[pd.identifier] = fks
			stats.ConversationsUsed++
		}
	}

	logger.Info().Int("conversations", stats.ConversationsUsed).Msg("Chatwoot DB: contacts/conversations created")

	// Insert messages in batches directly to PostgreSQL
	// Batch size 4000 like Evolution API for maximum performance
	batchSize := 4000
	var batch []model.Message
	totalMsgs := len(filteredMessages)

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

			// Update status for real-time monitoring
			s.updateSyncStats(stats)
			logger.Info().
				Int("imported", stats.MessagesImported).
				Int("total", totalMsgs).
				Msg("Chatwoot DB: messages sync progress")
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
		s.updateSyncStats(stats)
	}

	logger.Info().
		Int("imported", stats.MessagesImported).
		Int("conversations", stats.ConversationsUsed).
		Int("errors", stats.Errors).
		Msg("Chatwoot DB: messages sync completed")

	return stats, nil
}

// insertMessageBatch inserts a batch of messages directly to Chatwoot PostgreSQL
// chatFKs holds foreign keys for a chat
type chatFKs struct {
	contactID      int
	conversationID int
}

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

	// Update last_activity_at for conversations that received new messages
	if rowsAffected > 0 {
		conversationIDs := make(map[int]time.Time)
		for _, msg := range messages {
			if fks := chatCache[msg.ChatJID]; fks != nil {
				if existing, ok := conversationIDs[fks.conversationID]; !ok || msg.Timestamp.After(existing) {
					conversationIDs[fks.conversationID] = msg.Timestamp
				}
			}
		}
		for convID, lastActivity := range conversationIDs {
			_, _ = s.cwDB.ExecContext(ctx, 
				`UPDATE conversations SET last_activity_at = $1, updated_at = $1 
				 WHERE id = $2 AND (last_activity_at IS NULL OR last_activity_at < $1)`,
				lastActivity, convID)
		}
	}

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

// SyncContacts synchronizes contacts to Chatwoot using direct PostgreSQL INSERT (batch)
func (s *ChatwootDBSync) SyncContacts(ctx context.Context, daysLimit int) (*SyncStats, error) {
	stats := &SyncStats{}

	logger.Info().
		Str("sessionId", s.sessionID).
		Msg("Chatwoot DB: starting contacts sync (direct SQL batch)")

	if s.contactsGetter == nil {
		return stats, fmt.Errorf("contacts getter not available")
	}

	contacts, err := s.contactsGetter.GetAllContacts(ctx)
	if err != nil {
		return stats, fmt.Errorf("failed to get contacts from WhatsApp: %w", err)
	}

	logger.Info().Int("totalContacts", len(contacts)).Msg("Chatwoot DB: retrieved contacts from WhatsApp")

	// Filter valid contacts
	var validContacts []WhatsAppContact
	for _, contact := range contacts {
		if IsGroupJID(contact.JID) || IsStatusBroadcast(contact.JID) || IsNewsletter(contact.JID) || strings.HasSuffix(contact.JID, "@lid") {
			stats.ContactsSkipped++
			continue
		}
		phone := ExtractPhoneFromJID(contact.JID)
		if phone == "" {
			stats.ContactsSkipped++
			continue
		}
		validContacts = append(validContacts, contact)
	}

	logger.Info().
		Int("validContacts", len(validContacts)).
		Int("skipped", stats.ContactsSkipped).
		Msg("Chatwoot DB: filtered contacts for sync")

	if len(validContacts) == 0 {
		return stats, nil
	}

	// Process in batches of 3000 contacts via direct SQL INSERT (Evolution API uses 3000)
	batchSize := 3000
	totalContacts := len(validContacts)

	for batchStart := 0; batchStart < totalContacts; batchStart += batchSize {
		batchEnd := batchStart + batchSize
		if batchEnd > totalContacts {
			batchEnd = totalContacts
		}
		batch := validContacts[batchStart:batchEnd]

		imported, err := s.insertContactsBatch(ctx, batch)
		if err != nil {
			logger.Warn().Err(err).Int("batchStart", batchStart).Msg("Chatwoot DB: batch insert failed")
			stats.ContactsErrors += len(batch)
		} else {
			stats.ContactsImported += imported
		}

		// Update status after each batch for real-time monitoring
		s.updateSyncStats(stats)
		logger.Info().
			Int("progress", batchEnd).
			Int("total", totalContacts).
			Int("imported", stats.ContactsImported).
			Msg("Chatwoot DB: contacts sync progress")
	}

	logger.Info().
		Int("imported", stats.ContactsImported).
		Int("skipped", stats.ContactsSkipped).
		Int("errors", stats.ContactsErrors).
		Msg("Chatwoot DB: contacts sync completed")

	return stats, nil
}

// insertContactsBatch inserts/updates contacts ONLY (no contact_inbox or conversation)
// Contact_inbox and conversation are created by SyncMessages when there are actual messages
func (s *ChatwootDBSync) insertContactsBatch(ctx context.Context, contacts []WhatsAppContact) (int, error) {
	if len(contacts) == 0 {
		return 0, nil
	}

	// Build VALUES clause
	var valuesClauses []string
	args := []interface{}{s.cfg.Account}

	for i, contact := range contacts {
		phone := ExtractPhoneFromJID(contact.JID)
		nameInfo := &contactNameInfo{
			FullName:     contact.FullName,
			FirstName:    contact.FirstName,
			PushName:     contact.PushName,
			BusinessName: contact.BusinessName,
		}
		name := getBestContactName(nameInfo, phone)

		baseIdx := len(args) + 1
		args = append(args, name, "+"+phone, contact.JID)
		valuesClauses = append(valuesClauses, fmt.Sprintf("($%d, $%d, $%d)", baseIdx, baseIdx+1, baseIdx+2))

		if i < 3 {
			logger.Debug().
				Str("name", name).
				Str("phone", phone).
				Str("jid", contact.JID).
				Msg("Chatwoot DB: syncing contact")
		}
	}

	// Simple upsert: insert new contacts or update name if it was just phone number
	query := fmt.Sprintf(`
		INSERT INTO contacts (name, phone_number, account_id, identifier, created_at, updated_at)
		SELECT name, phone_number, $1, identifier, NOW(), NOW()
		FROM (VALUES %s) AS t (name, phone_number, identifier)
		ON CONFLICT (identifier, account_id) DO UPDATE SET
			name = CASE 
				WHEN contacts.name = contacts.phone_number 
				  OR contacts.name = REPLACE(contacts.phone_number, '+', '')
				  OR contacts.name IS NULL 
				  OR contacts.name = ''
				THEN EXCLUDED.name 
				ELSE contacts.name 
			END,
			updated_at = NOW()
	`, strings.Join(valuesClauses, ", "))

	result, err := s.cwDB.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to sync contacts batch: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	return int(rowsAffected), nil
}

// SyncAll performs full sync (contacts + messages)
func (s *ChatwootDBSync) SyncAll(ctx context.Context, daysLimit int) (*SyncStats, error) {
	totalStats := &SyncStats{}

	contactStats, err := s.SyncContacts(ctx, daysLimit)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot DB: contacts sync failed")
	} else if contactStats != nil {
		totalStats.ContactsImported = contactStats.ContactsImported
		totalStats.ContactsSkipped = contactStats.ContactsSkipped
		totalStats.ContactsErrors = contactStats.ContactsErrors
	}

	msgStats, err := s.SyncMessages(ctx, daysLimit)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot DB: messages sync failed")
	} else if msgStats != nil {
		totalStats.MessagesImported = msgStats.MessagesImported
		totalStats.MessagesSkipped = msgStats.MessagesSkipped
		totalStats.MessagesErrors = msgStats.MessagesErrors
		totalStats.ConversationsUsed = msgStats.ConversationsUsed
		totalStats.Errors = msgStats.Errors
	}

	return totalStats, nil
}

// StartSyncAsync starts sync in background
func (s *ChatwootDBSync) StartSyncAsync(syncType string, daysLimit int) (*SyncStatus, error) {
	currentStatus := GetSyncStatus(s.sessionID)
	if currentStatus.Status == "running" {
		return currentStatus, fmt.Errorf("sync already in progress")
	}

	startTime := time.Now()
	status := &SyncStatus{
		SessionID: s.sessionID,
		Status:    "running",
		Type:      syncType,
		StartedAt: &startTime,
		Stats:     SyncStats{},
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

		endTime := time.Now()
		finalStatus := &SyncStatus{
			SessionID: s.sessionID,
			Type:      syncType,
			StartedAt: &startTime,
			EndedAt:   &endTime,
		}

		if err != nil {
			finalStatus.Status = "failed"
			finalStatus.Error = err.Error()
		} else {
			finalStatus.Status = "completed"
		}

		if stats != nil {
			finalStatus.Stats = *stats
		}

		setSyncStatus(s.sessionID, finalStatus)

		// Close DB connection
		s.Close()

		logger.Info().
			Str("sessionId", s.sessionID).
			Str("type", syncType).
			Str("status", finalStatus.Status).
			Msg("Chatwoot DB: async sync completed")
	}()

	return status, nil
}
