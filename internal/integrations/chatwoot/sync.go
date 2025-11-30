package chatwoot

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/lib/pq"

	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// =============================================================================
// INTERFACES
// =============================================================================

// MessageRepository interface for accessing message data
type MessageRepository interface {
	GetBySession(ctx context.Context, sessionID string, limit, offset int) ([]model.Message, error)
}

// ContactsGetter interface for getting WhatsApp contacts
type ContactsGetter interface {
	GetAllContacts(ctx context.Context) ([]WhatsAppContact, error)
	GetProfilePictureURL(ctx context.Context, jid string) (string, error)
	GetGroupName(ctx context.Context, groupJID string) (string, error)
}

// MediaGetter interface for getting media info by message ID
type MediaGetter interface {
	GetByMsgID(ctx context.Context, sessionID, msgID string) (*model.Media, error)
}

// =============================================================================
// CHATWOOT DB SYNC SERVICE
// =============================================================================

// ChatwootDBSync handles direct database sync to Chatwoot PostgreSQL
type ChatwootDBSync struct {
	cfg            *Config
	client         *Client
	msgRepo        MessageRepository
	contactsGetter ContactsGetter
	mediaGetter    MediaGetter
	sessionID      string
	cwDB           *sql.DB
}

// NewChatwootDBSync creates a new direct database sync service
func NewChatwootDBSync(cfg *Config, msgRepo MessageRepository, contactsGetter ContactsGetter, mediaGetter MediaGetter, sessionID string) (*ChatwootDBSync, error) {
	if cfg.ChatwootDBHost == "" {
		return nil, fmt.Errorf("chatwoot database host not configured")
	}

	port := cfg.ChatwootDBPort
	if port == 0 {
		port = 5432
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
		cfg.ChatwootDBUser, cfg.ChatwootDBPass, cfg.ChatwootDBHost, port, cfg.ChatwootDBName)

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
		mediaGetter:    mediaGetter,
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

// =============================================================================
// SYNC OPERATIONS
// =============================================================================

// SyncAll performs full sync (contacts + messages)
func (s *ChatwootDBSync) SyncAll(ctx context.Context, daysLimit int) (*SyncStats, error) {
	totalStats := &SyncStats{}

	if contactStats, err := s.SyncContacts(ctx, daysLimit); err != nil {
		logger.Warn().Err(err).Msg("Chatwoot DB: contacts sync failed")
	} else if contactStats != nil {
		totalStats.ContactsImported = contactStats.ContactsImported
		totalStats.ContactsSkipped = contactStats.ContactsSkipped
		totalStats.ContactsErrors = contactStats.ContactsErrors
	}

	if msgStats, err := s.SyncMessages(ctx, daysLimit); err != nil {
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

// SyncContacts synchronizes contacts to Chatwoot using direct PostgreSQL INSERT
func (s *ChatwootDBSync) SyncContacts(ctx context.Context, daysLimit int) (*SyncStats, error) {
	stats := &SyncStats{}

	logger.Info().Str("sessionId", s.sessionID).Msg("Chatwoot DB: starting contacts sync")

	if s.contactsGetter == nil {
		return stats, fmt.Errorf("contacts getter not available")
	}

	contacts, err := s.contactsGetter.GetAllContacts(ctx)
	if err != nil {
		return stats, fmt.Errorf("failed to get contacts from WhatsApp: %w", err)
	}

	validContacts := s.filterValidContacts(contacts, stats)
	if len(validContacts) == 0 {
		return stats, nil
	}

	logger.Info().
		Int("valid", len(validContacts)).
		Int("skipped", stats.ContactsSkipped).
		Msg("Chatwoot DB: filtered contacts for sync")

	const batchSize = 3000
	for i := 0; i < len(validContacts); i += batchSize {
		end := minInt(i+batchSize, len(validContacts))
		batch := validContacts[i:end]

		imported, err := s.insertContactsBatch(ctx, batch)
		if err != nil {
			logger.Warn().Err(err).Int("batchStart", i).Msg("Chatwoot DB: batch insert failed")
			stats.ContactsErrors += len(batch)
		} else {
			stats.ContactsImported += imported
		}
		s.updateSyncStats(stats)
	}

	logger.Info().
		Int("imported", stats.ContactsImported).
		Int("errors", stats.ContactsErrors).
		Msg("Chatwoot DB: contacts sync completed")

	return stats, nil
}

// SyncMessages synchronizes messages directly to Chatwoot PostgreSQL
func (s *ChatwootDBSync) SyncMessages(ctx context.Context, daysLimit int) (*SyncStats, error) {
	stats := &SyncStats{}

	logger.Info().Str("sessionId", s.sessionID).Int("daysLimit", daysLimit).Msg("Chatwoot DB: starting messages sync")

	userID, userType, err := s.getChatwootUser(ctx)
	if err != nil {
		return stats, fmt.Errorf("failed to get chatwoot user: %w", err)
	}

	messages, err := s.msgRepo.GetBySession(ctx, s.sessionID, 50000, 0)
	if err != nil {
		return stats, fmt.Errorf("failed to get messages: %w", err)
	}

	filteredMessages, existingSourceIDs := s.filterMessages(ctx, messages, daysLimit, stats)
	if len(filteredMessages) == 0 {
		return stats, nil
	}

	logger.Info().
		Int("total", len(messages)).
		Int("toSync", len(filteredMessages)).
		Int("skipped", stats.MessagesSkipped).
		Msg("Chatwoot DB: filtered messages")

	sort.Slice(filteredMessages, func(i, j int) bool {
		return filteredMessages[i].Timestamp.Before(filteredMessages[j].Timestamp)
	})

	messagesByChat := s.groupMessagesByChat(filteredMessages)
	waContactsCache := s.loadWhatsAppContactsCache(ctx)

	chatCache, err := s.createContactsAndConversations(ctx, messagesByChat, waContactsCache, stats)
	if err != nil {
		return stats, err
	}

	// Update contact avatars via API (DB insert doesn't handle avatars)
	s.updateContactAvatars(ctx, chatCache)

	const batchSize = 4000
	var batch []model.Message

	for _, msg := range filteredMessages {
		if chatCache[msg.ChatJID] == nil {
			continue
		}
		if existingSourceIDs["WAID:"+msg.MsgId] {
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
			s.updateSyncStats(stats)
		}
	}

	if len(batch) > 0 {
		imported, err := s.insertMessageBatch(ctx, batch, chatCache, userID, userType)
		if err != nil {
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

	// Start background avatar sync for contacts without conversations
	go s.updateAllContactAvatarsBackground()

	return stats, nil
}

// StartSyncAsync starts sync in background
func (s *ChatwootDBSync) StartSyncAsync(syncType string, daysLimit int) (*SyncStatus, error) {
	if current := GetSyncStatus(s.sessionID); current.Status == SyncStatusRunning {
		return current, ErrSyncInProgress
	}

	startTime := time.Now()
	status := &SyncStatus{
		SessionID: s.sessionID,
		Status:    SyncStatusRunning,
		Type:      syncType,
		StartedAt: &startTime,
	}
	SetSyncStatus(s.sessionID, status)

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
			Status:    SyncStatusCompleted,
		}

		if err != nil {
			finalStatus.Status = SyncStatusFailed
			finalStatus.Error = err.Error()
		}
		if stats != nil {
			finalStatus.Stats = *stats
		}

		SetSyncStatus(s.sessionID, finalStatus)
		s.Close()

		logger.Info().
			Str("sessionId", s.sessionID).
			Str("status", finalStatus.Status).
			Msg("Chatwoot DB: async sync completed")
	}()

	return status, nil
}

// ResetData deletes all Chatwoot data except the bot contact (id=1)
func (s *ChatwootDBSync) ResetData(ctx context.Context) (*ResetStats, error) {
	stats := &ResetStats{}

	var inboxID int
	err := s.cwDB.QueryRowContext(ctx, `SELECT id FROM inboxes WHERE id = $1`, s.cfg.InboxID).Scan(&inboxID)
	if err != nil {
		inboxID = 0
	}

	// Delete in order respecting FK constraints
	if inboxID > 0 {
		result, err := s.cwDB.ExecContext(ctx, `DELETE FROM messages WHERE conversation_id IN (
			SELECT id FROM conversations WHERE account_id = $1 AND inbox_id = $2 AND contact_id > 1
		)`, s.cfg.Account, inboxID)
		if err != nil {
			return stats, fmt.Errorf("failed to delete messages: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.MessagesDeleted = int(rows)
		}

		result, err = s.cwDB.ExecContext(ctx, `DELETE FROM conversations WHERE account_id = $1 AND inbox_id = $2 AND contact_id > 1`, s.cfg.Account, inboxID)
		if err != nil {
			return stats, fmt.Errorf("failed to delete conversations: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.ConversationsDeleted = int(rows)
		}

		result, err = s.cwDB.ExecContext(ctx, `DELETE FROM contact_inboxes WHERE inbox_id = $1 AND contact_id > 1`, inboxID)
		if err != nil {
			return stats, fmt.Errorf("failed to delete contact_inboxes: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.ContactInboxDeleted = int(rows)
		}
	} else {
		result, err := s.cwDB.ExecContext(ctx, `DELETE FROM messages WHERE account_id = $1 AND conversation_id IN (
			SELECT id FROM conversations WHERE account_id = $1 AND contact_id > 1
		)`, s.cfg.Account)
		if err != nil {
			return stats, fmt.Errorf("failed to delete messages: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.MessagesDeleted = int(rows)
		}

		result, err = s.cwDB.ExecContext(ctx, `DELETE FROM conversations WHERE account_id = $1 AND contact_id > 1`, s.cfg.Account)
		if err != nil {
			return stats, fmt.Errorf("failed to delete conversations: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.ConversationsDeleted = int(rows)
		}

		result, err = s.cwDB.ExecContext(ctx, `DELETE FROM contact_inboxes WHERE contact_id IN (SELECT id FROM contacts WHERE account_id = $1 AND id > 1)`, s.cfg.Account)
		if err != nil {
			return stats, fmt.Errorf("failed to delete contact_inboxes: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.ContactInboxDeleted = int(rows)
		}
	}

	result, err := s.cwDB.ExecContext(ctx, `DELETE FROM contacts WHERE account_id = $1 AND id > 1`, s.cfg.Account)
	if err != nil {
		return stats, fmt.Errorf("failed to delete contacts: %w", err)
	}
	if rows, _ := result.RowsAffected(); rows > 0 {
		stats.ContactsDeleted = int(rows)
	}

	logger.Info().
		Int("contacts", stats.ContactsDeleted).
		Int("conversations", stats.ConversationsDeleted).
		Int("messages", stats.MessagesDeleted).
		Int("contactInboxes", stats.ContactInboxDeleted).
		Msg("Chatwoot DB: reset completed")

	return stats, nil
}

// =============================================================================
// FILTERING HELPERS
// =============================================================================

func (s *ChatwootDBSync) filterValidContacts(contacts []WhatsAppContact, stats *SyncStats) []WhatsAppContact {
	var valid []WhatsAppContact
	for _, c := range contacts {
		if IsGroupJID(c.JID) || IsStatusBroadcast(c.JID) || IsNewsletter(c.JID) || strings.HasSuffix(c.JID, "@lid") {
			stats.ContactsSkipped++
			continue
		}
		if ExtractPhoneFromJID(c.JID) == "" {
			stats.ContactsSkipped++
			continue
		}
		valid = append(valid, c)
	}
	return valid
}

func (s *ChatwootDBSync) filterMessages(ctx context.Context, messages []model.Message, daysLimit int, stats *SyncStats) ([]model.Message, map[string]bool) {
	var cutoffTime time.Time
	if daysLimit > 0 {
		cutoffTime = time.Now().AddDate(0, 0, -daysLimit)
	}

	var messageIDs []string
	for _, msg := range messages {
		messageIDs = append(messageIDs, msg.MsgId)
	}
	existingSourceIDs, _ := s.getExistingSourceIDs(ctx, messageIDs)

	var filtered []model.Message
	for _, msg := range messages {
		sourceID := "WAID:" + msg.MsgId

		if existingSourceIDs[sourceID] {
			stats.MessagesSkipped++
			continue
		}

		if msg.CwMsgId != nil && *msg.CwMsgId > 0 {
			stats.MessagesSkipped++
			continue
		}

		if daysLimit > 0 && msg.Timestamp.Before(cutoffTime) {
			stats.MessagesSkipped++
			continue
		}

		if IsStatusBroadcast(msg.ChatJID) || IsNewsletter(msg.ChatJID) {
			stats.MessagesSkipped++
			continue
		}

		if msg.Type == "protocol" || msg.Type == "reaction" {
			stats.MessagesSkipped++
			continue
		}

		filtered = append(filtered, msg)
	}

	return filtered, existingSourceIDs
}

func (s *ChatwootDBSync) groupMessagesByChat(messages []model.Message) map[string][]model.Message {
	result := make(map[string][]model.Message)
	for _, msg := range messages {
		result[msg.ChatJID] = append(result[msg.ChatJID], msg)
	}
	return result
}

func (s *ChatwootDBSync) loadWhatsAppContactsCache(ctx context.Context) map[string]*contactNameInfo {
	cache := make(map[string]*contactNameInfo)
	if s.contactsGetter == nil {
		return cache
	}

	contacts, err := s.contactsGetter.GetAllContacts(ctx)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot DB: failed to load contacts cache")
		return cache
	}

	for _, c := range contacts {
		cache[c.JID] = &contactNameInfo{
			FullName:     c.FullName,
			FirstName:    c.FirstName,
			PushName:     c.PushName,
			BusinessName: c.BusinessName,
		}
	}
	logger.Info().Int("count", len(cache)).Msg("Chatwoot DB: loaded contacts cache")
	return cache
}

// =============================================================================
// DATABASE HELPERS
// =============================================================================

func (s *ChatwootDBSync) getChatwootUser(ctx context.Context) (int, string, error) {
	var userID int
	var userType string
	err := s.cwDB.QueryRowContext(ctx, `
		SELECT u.id, 'User' FROM users u
		INNER JOIN access_tokens at ON at.owner_id = u.id AND at.owner_type = 'User'
		WHERE at.token = $1 LIMIT 1
	`, s.cfg.Token).Scan(&userID, &userType)
	return userID, userType, err
}

func (s *ChatwootDBSync) getExistingSourceIDs(ctx context.Context, messageIDs []string) (map[string]bool, error) {
	existing := make(map[string]bool)
	if len(messageIDs) == 0 {
		return existing, nil
	}

	sourceIDs := make([]string, len(messageIDs))
	for i, id := range messageIDs {
		sourceIDs[i] = "WAID:" + id
	}

	const batchSize = 10000
	for i := 0; i < len(sourceIDs); i += batchSize {
		end := minInt(i+batchSize, len(sourceIDs))
		batch := sourceIDs[i:end]

		rows, err := s.cwDB.QueryContext(ctx,
			`SELECT source_id FROM messages WHERE account_id = $1 AND source_id = ANY($2)`,
			s.cfg.Account, pq.Array(batch))
		if err != nil {
			return nil, err
		}

		for rows.Next() {
			var sourceID string
			rows.Scan(&sourceID)
			existing[sourceID] = true
		}
		rows.Close()
	}

	return existing, nil
}

func (s *ChatwootDBSync) updateSyncStats(stats *SyncStats) {
	UpdateSyncStats(s.sessionID, stats)
}

// =============================================================================
// CONTACT/CONVERSATION CREATION
// =============================================================================

func (s *ChatwootDBSync) createContactsAndConversations(ctx context.Context, messagesByChat map[string][]model.Message, waContactsCache map[string]*contactNameInfo, stats *SyncStats) (map[string]*chatFKs, error) {
	var phoneDataList []phoneTimestamp

	for chatJID, chatMessages := range messagesByChat {
		isGroup := IsGroupJID(chatJID)
		phone := ExtractPhoneFromJID(chatJID)
		if phone == "" {
			continue
		}

		var contactName string
		if isGroup {
			// For groups: fetch name from WhatsApp
			contactName = phone + " (GROUP)"
			if s.contactsGetter != nil {
				if groupName, err := s.contactsGetter.GetGroupName(ctx, chatJID); err == nil && groupName != "" {
					contactName = groupName
				}
			}
		} else {
			// For individual contacts
			nameInfo := waContactsCache[chatJID]
			if nameInfo == nil || (nameInfo.FullName == "" && nameInfo.FirstName == "" && nameInfo.PushName == "" && nameInfo.BusinessName == "") {
				for i := len(chatMessages) - 1; i >= 0; i-- {
					if chatMessages[i].PushName != "" && !chatMessages[i].FromMe {
						if nameInfo == nil {
							nameInfo = &contactNameInfo{}
						}
						nameInfo.PushName = chatMessages[i].PushName
						break
					}
				}
			}
			contactName = GetBestContactName(nameInfo, phone)
		}

		var firstTS, lastTS int64
		if len(chatMessages) > 0 {
			firstTS = chatMessages[0].Timestamp.Unix()
			lastTS = chatMessages[len(chatMessages)-1].Timestamp.Unix()
		} else {
			firstTS = time.Now().Unix()
			lastTS = firstTS
		}

		// For groups, use the full JID as phone (Chatwoot uses it as identifier)
		phoneValue := "+" + phone
		if isGroup {
			phoneValue = phone // Don't add + for groups
		}

		phoneDataList = append(phoneDataList, phoneTimestamp{
			phone:      phoneValue,
			firstTS:    firstTS,
			lastTS:     lastTS,
			name:       contactName,
			identifier: chatJID,
			isGroup:    isGroup,
		})
	}

	logger.Info().Int("chats", len(phoneDataList)).Msg("Chatwoot DB: creating contacts/conversations")

	chatCacheByPhone := make(map[string]*chatFKs)
	const batchSize = 500
	for i := 0; i < len(phoneDataList); i += batchSize {
		end := minInt(i+batchSize, len(phoneDataList))
		batch := phoneDataList[i:end]

		result, err := s.createFKsBatch(ctx, batch)
		if err != nil {
			return nil, err
		}
		for k, v := range result {
			chatCacheByPhone[k] = v
		}
	}

	chatCache := make(map[string]*chatFKs)
	for _, pd := range phoneDataList {
		if fks, ok := chatCacheByPhone[pd.phone]; ok {
			chatCache[pd.identifier] = fks
			stats.ConversationsUsed++
		}
	}

	logger.Info().Int("conversations", stats.ConversationsUsed).Msg("Chatwoot DB: contacts/conversations created")
	return chatCache, nil
}

func (s *ChatwootDBSync) createFKsBatch(ctx context.Context, phoneData []phoneTimestamp) (map[string]*chatFKs, error) {
	result := make(map[string]*chatFKs)
	if len(phoneData) == 0 {
		return result, nil
	}

	var values1, values2 []string
	args1 := []interface{}{s.cfg.Account}
	args2 := []interface{}{s.cfg.Account, s.cfg.InboxID}

	for _, pd := range phoneData {
		idx1 := len(args1) + 1
		args1 = append(args1, pd.phone, pd.name, pd.identifier, pd.isGroup)
		values1 = append(values1, fmt.Sprintf("($%d::text, %d::bigint, %d::bigint, $%d::text, $%d::text, $%d::boolean)",
			idx1, pd.firstTS, pd.lastTS, idx1+1, idx1+2, idx1+3))

		idx2 := len(args2) + 1
		args2 = append(args2, pd.phone, pd.name, pd.identifier)
		values2 = append(values2, fmt.Sprintf("($%d::text, %d::bigint, %d::bigint, $%d::text, $%d::text)",
			idx2, pd.firstTS, pd.lastTS, idx2+1, idx2+2))
	}

	// Step 1: Upsert contacts (phone_number = NULL for groups to avoid e164 validation)
	query1 := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT phone_number, created_at, last_activity_at, contact_name, identifier, is_group FROM (
				VALUES %s
			) AS t (phone_number, created_at, last_activity_at, contact_name, identifier, is_group)
		)
		INSERT INTO contacts (name, phone_number, account_id, identifier, created_at, updated_at)
		SELECT p.contact_name, CASE WHEN p.is_group THEN NULL ELSE p.phone_number END, $1, p.identifier, to_timestamp(p.created_at), to_timestamp(p.last_activity_at)
		FROM phone_data AS p
		ON CONFLICT(identifier, account_id) DO UPDATE SET 
			updated_at = EXCLUDED.updated_at,
			name = CASE WHEN contacts.name = contacts.phone_number OR contacts.name = REPLACE(contacts.phone_number, '+', '') OR contacts.name IS NULL OR contacts.name = ''
				THEN EXCLUDED.name ELSE contacts.name END
	`, strings.Join(values1, ", "))

	if _, err := s.cwDB.ExecContext(ctx, query1, args1...); err != nil {
		return nil, fmt.Errorf("failed to upsert contacts: %w", err)
	}

	// Step 2: Create contact_inboxes
	query2 := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT identifier FROM (VALUES %s) AS t (phone_number, created_at, last_activity_at, contact_name, identifier)
		)
		INSERT INTO contact_inboxes (contact_id, inbox_id, source_id, created_at, updated_at)
		SELECT c.id, $2::integer, gen_random_uuid(), NOW(), NOW()
		FROM contacts c
		WHERE c.account_id = $1::integer AND c.identifier IN (SELECT identifier FROM phone_data)
		AND NOT EXISTS (SELECT 1 FROM contact_inboxes ci WHERE ci.contact_id = c.id AND ci.inbox_id = $2::integer)
		ON CONFLICT DO NOTHING
	`, strings.Join(values2, ", "))

	if _, err := s.cwDB.ExecContext(ctx, query2, args2...); err != nil {
		return nil, fmt.Errorf("failed to create contact_inboxes: %w", err)
	}

	// Step 3: Create conversations
	query3 := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT identifier FROM (VALUES %s) AS t (phone_number, created_at, last_activity_at, contact_name, identifier)
		)
		INSERT INTO conversations (account_id, inbox_id, status, contact_id, contact_inbox_id, uuid, last_activity_at, created_at, updated_at)
		SELECT $1::integer, $2::integer, 0, ci.contact_id, ci.id, gen_random_uuid(), NOW(), NOW(), NOW()
		FROM contact_inboxes ci
		JOIN contacts c ON c.id = ci.contact_id
		WHERE ci.inbox_id = $2::integer AND c.account_id = $1::integer AND c.identifier IN (SELECT identifier FROM phone_data)
		AND NOT EXISTS (SELECT 1 FROM conversations con WHERE con.contact_inbox_id = ci.id)
		ON CONFLICT DO NOTHING
	`, strings.Join(values2, ", "))

	if _, err := s.cwDB.ExecContext(ctx, query3, args2...); err != nil {
		return nil, fmt.Errorf("failed to create conversations: %w", err)
	}

	// Step 4: Query all FKs
	query4 := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT phone_number, identifier FROM (VALUES %s) AS t (phone_number, created_at, last_activity_at, contact_name, identifier)
		)
		SELECT pd.phone_number, c.id AS contact_id, conv.id AS conversation_id
		FROM phone_data pd
		JOIN contacts c ON c.identifier = pd.identifier AND c.account_id = $1::integer
		JOIN contact_inboxes ci ON ci.contact_id = c.id AND ci.inbox_id = $2::integer
		JOIN conversations conv ON conv.contact_inbox_id = ci.id
	`, strings.Join(values2, ", "))

	rows, err := s.cwDB.QueryContext(ctx, query4, args2...)
	if err != nil {
		return nil, fmt.Errorf("failed to query FKs: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var phone string
		var contactID, conversationID int
		if err := rows.Scan(&phone, &contactID, &conversationID); err != nil {
			return nil, err
		}
		result[phone] = &chatFKs{contactID: contactID, conversationID: conversationID}
	}

	return result, rows.Err()
}

func (s *ChatwootDBSync) insertContactsBatch(ctx context.Context, contacts []WhatsAppContact) (int, error) {
	if len(contacts) == 0 {
		return 0, nil
	}

	var values []string
	args := []interface{}{s.cfg.Account}

	for _, c := range contacts {
		phone := ExtractPhoneFromJID(c.JID)
		name := GetBestContactName(&contactNameInfo{
			FullName: c.FullName, FirstName: c.FirstName, PushName: c.PushName, BusinessName: c.BusinessName,
		}, phone)

		idx := len(args) + 1
		args = append(args, name, "+"+phone, c.JID)
		values = append(values, fmt.Sprintf("($%d, $%d, $%d)", idx, idx+1, idx+2))
	}

	query := fmt.Sprintf(`
		INSERT INTO contacts (name, phone_number, account_id, identifier, created_at, updated_at)
		SELECT name, phone_number, $1, identifier, NOW(), NOW()
		FROM (VALUES %s) AS t (name, phone_number, identifier)
		ON CONFLICT (identifier, account_id) DO UPDATE SET
			name = CASE WHEN contacts.name = contacts.phone_number OR contacts.name = REPLACE(contacts.phone_number, '+', '') OR contacts.name IS NULL OR contacts.name = ''
				THEN EXCLUDED.name ELSE contacts.name END,
			updated_at = NOW()
	`, strings.Join(values, ", "))

	result, err := s.cwDB.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, err
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// =============================================================================
// MESSAGE INSERTION
// =============================================================================

func (s *ChatwootDBSync) insertMessageBatch(ctx context.Context, messages []model.Message, chatCache map[string]*chatFKs, userID int, userType string) (int, error) {
	if len(messages) == 0 {
		return 0, nil
	}

	totalImported := 0
	uploader := NewMediaUploader(s.client)

	// Process messages ONE BY ONE in chronological order to maintain correct ID sequence
	for _, msg := range messages {
		fks := chatCache[msg.ChatJID]
		if fks == nil {
			continue
		}

		// Determine message type and sender
		msgType := 0 // incoming
		senderType := "Contact"
		senderID := fks.contactID
		if msg.FromMe {
			msgType = 1 // outgoing
			senderType = userType
			senderID = userID
		}

		// Check if it's a media message with available URL
		isMedia := msg.IsMedia() && s.mediaGetter != nil
		var media *model.Media
		if isMedia {
			var err error
			media, err = s.mediaGetter.GetByMsgID(ctx, s.sessionID, msg.MsgId)
			if err != nil || media == nil || media.StorageURL == "" {
				isMedia = false // Fall back to text if no media URL
			}
		}

		if isMedia && media != nil {
			// Upload media via API (to save in app/storage/) then fix timestamp
			messageType := "incoming"
			if msg.FromMe {
				messageType = "outgoing"
			}

			cwMsg, err := uploader.UploadFromURL(ctx, MediaUploadRequest{
				ConversationID: fks.conversationID,
				MediaURL:       media.StorageURL,
				MediaType:      media.MediaType,
				Filename:       media.FileName,
				MimeType:       media.MimeType,
				Caption:        msg.Content,
				MessageType:    messageType,
				SourceID:       "WAID:" + msg.MsgId, // Prevents webhook from sending to WhatsApp
			})

			if err != nil {
				logger.Warn().Err(err).Str("msgId", msg.MsgId).Msg("Chatwoot sync: media upload failed")
				continue
			}

			// Fix timestamp in DB (API ignores created_at for multipart)
			if cwMsg != nil && cwMsg.ID > 0 {
				s.cwDB.ExecContext(ctx,
					`UPDATE messages SET created_at = $1, updated_at = $1 WHERE id = $2`,
					msg.Timestamp, cwMsg.ID)
			}
			totalImported++
		} else {
			// Insert text message directly
			content := GetMessageContent(&msg)
			if content == "" {
				continue
			}

			_, err := s.cwDB.ExecContext(ctx, `
				INSERT INTO messages (content, processed_message_content, account_id, inbox_id, conversation_id, 
					message_type, private, content_type, sender_type, sender_id, source_id, created_at, updated_at)
				VALUES ($1, $1, $2, $3, $4, $5, FALSE, 0, $6, $7, $8, $9, $9)`,
				content, s.cfg.Account, s.cfg.InboxID, fks.conversationID, msgType,
				senderType, senderID, "WAID:"+msg.MsgId, msg.Timestamp)

			if err != nil {
				logger.Warn().Err(err).Str("msgId", msg.MsgId).Msg("Chatwoot sync: text insert failed")
				continue
			}
			totalImported++
		}
	}

	// Update conversation timestamps
	if totalImported > 0 {
		s.updateConversationTimestamps(ctx, messages, chatCache)
	}

	return totalImported, nil
}

// updateConversationTimestamps updates last_activity_at for conversations
func (s *ChatwootDBSync) updateConversationTimestamps(ctx context.Context, messages []model.Message, chatCache map[string]*chatFKs) {
	convTimestamps := make(map[int]time.Time)
	for _, msg := range messages {
		if fks := chatCache[msg.ChatJID]; fks != nil {
			if existing, ok := convTimestamps[fks.conversationID]; !ok || msg.Timestamp.After(existing) {
				convTimestamps[fks.conversationID] = msg.Timestamp
			}
		}
	}
	for convID, ts := range convTimestamps {
		s.cwDB.ExecContext(ctx,
			`UPDATE conversations SET last_activity_at = $1, updated_at = $1 WHERE id = $2 AND (last_activity_at IS NULL OR last_activity_at < $1)`,
			ts, convID)
	}
}

// updateContactAvatars fetches avatars from WhatsApp and updates contacts via API
// Priority: contacts with conversations first, then all others in background
func (s *ChatwootDBSync) updateContactAvatars(ctx context.Context, chatCache map[string]*chatFKs) {
	if s.contactsGetter == nil || len(chatCache) == 0 {
		return
	}

	logger.Info().Int("contacts", len(chatCache)).Msg("Chatwoot DB: updating avatars for conversation contacts")

	updated := 0
	for jid, fks := range chatCache {
		if fks == nil {
			continue
		}

		if s.updateSingleContactAvatar(ctx, jid, fks.contactID) {
			updated++
		}
	}

	if updated > 0 {
		logger.Info().Int("updated", updated).Msg("Chatwoot DB: conversation contact avatars updated")
	}
}

// updateSingleContactAvatar updates avatar for a single contact
func (s *ChatwootDBSync) updateSingleContactAvatar(ctx context.Context, jid string, contactID int) bool {
	avatarURL, err := s.contactsGetter.GetProfilePictureURL(ctx, jid)
	if err != nil || avatarURL == "" {
		return false
	}

	// Update via API (works for both individual contacts and groups without phone_number)
	_, err = s.client.UpdateContact(ctx, contactID, map[string]interface{}{
		"avatar_url": avatarURL,
	})
	if err != nil {
		logger.Debug().Err(err).Int("contactId", contactID).Msg("Chatwoot sync: avatar update failed")
		return false
	}

	logger.Debug().Int("contactId", contactID).Msg("Chatwoot sync: avatar updated")
	return true
}

// updateAllContactAvatarsBackground syncs avatars for all contacts without avatar in background
func (s *ChatwootDBSync) updateAllContactAvatarsBackground() {
	if s.contactsGetter == nil {
		return
	}

	// Create own database connection (main one is closed after sync)
	port := s.cfg.ChatwootDBPort
	if port == 0 {
		port = 5432
	}
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
		s.cfg.ChatwootDBUser, s.cfg.ChatwootDBPass, s.cfg.ChatwootDBHost, port, s.cfg.ChatwootDBName)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot sync: failed to connect for background avatar sync")
		return
	}
	defer db.Close()

	ctx := context.Background()

	// Get all contacts without avatar, ordered by last activity
	rows, err := db.QueryContext(ctx, `
		SELECT c.id, c.identifier 
		FROM contacts c
		LEFT JOIN active_storage_attachments asa ON asa.record_type = 'Contact' AND asa.record_id = c.id AND asa.name = 'avatar'
		WHERE c.account_id = $1 
		AND c.identifier IS NOT NULL AND c.identifier != ''
		AND asa.id IS NULL
		ORDER BY c.last_activity_at DESC NULLS LAST`, s.cfg.Account)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot sync: failed to query contacts for background avatar sync")
		return
	}
	defer rows.Close()

	// Count total contacts
	var contacts []struct {
		ID         int
		Identifier string
	}
	for rows.Next() {
		var c struct {
			ID         int
			Identifier string
		}
		if err := rows.Scan(&c.ID, &c.Identifier); err != nil {
			continue
		}
		contacts = append(contacts, c)
	}
	rows.Close()

	total := len(contacts)
	logger.Info().Int("total", total).Msg("Chatwoot sync: starting background avatar sync")

	updated := 0
	errors := 0
	for i, c := range contacts {
		// Create context with timeout for each request
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)

		avatarURL, err := s.contactsGetter.GetProfilePictureURL(reqCtx, c.Identifier)
		cancel()

		if err != nil || avatarURL == "" {
			errors++
			continue
		}

		_, err = s.client.UpdateContact(ctx, c.ID, map[string]interface{}{
			"avatar_url": avatarURL,
		})
		if err != nil {
			errors++
			continue
		}

		updated++

		// Log progress every 100 contacts
		if (i+1)%100 == 0 {
			logger.Info().Int("progress", i+1).Int("total", total).Int("updated", updated).Msg("Chatwoot sync: avatar sync progress")
		}

		// Rate limit: 100ms between requests
		time.Sleep(100 * time.Millisecond)
	}

	logger.Info().
		Int("updated", updated).
		Int("errors", errors).
		Int("total", total).
		Msg("Chatwoot sync: background avatar sync completed")
}

// =============================================================================
// UTILITY
// =============================================================================

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}
