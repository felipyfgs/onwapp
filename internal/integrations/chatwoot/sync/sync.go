package sync

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	gosync "sync"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/lib/pq"

	"zpwoot/internal/integrations/chatwoot/client"
	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/integrations/chatwoot/util"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// =============================================================================
// SYNC STATUS MANAGEMENT
// =============================================================================

var (
	syncStatusMap   = make(map[string]*core.SyncStatus)
	syncStatusMutex gosync.RWMutex
)

// GetSyncStatus returns the current sync status for a session
func GetSyncStatus(sessionID string) *core.SyncStatus {
	syncStatusMutex.RLock()
	defer syncStatusMutex.RUnlock()
	if status, ok := syncStatusMap[sessionID]; ok {
		return status
	}
	return &core.SyncStatus{SessionID: sessionID, Status: core.SyncStatusIdle}
}

// SetSyncStatus sets the sync status for a session
func SetSyncStatus(sessionID string, status *core.SyncStatus) {
	syncStatusMutex.Lock()
	defer syncStatusMutex.Unlock()
	syncStatusMap[sessionID] = status
}

// UpdateSyncStats updates the stats for a running sync
func UpdateSyncStats(sessionID string, stats *core.SyncStats) {
	syncStatusMutex.Lock()
	defer syncStatusMutex.Unlock()
	if status, ok := syncStatusMap[sessionID]; ok {
		status.Stats = *stats
	}
}

// =============================================================================
// INTERFACES
// =============================================================================

// MessageRepository interface for accessing message data
type MessageRepository interface {
	GetBySession(ctx context.Context, sessionID string, limit, offset int) ([]model.Message, error)
}

// ContactsGetter interface for getting WhatsApp contacts
type ContactsGetter interface {
	GetAllContacts(ctx context.Context) ([]core.WhatsAppContact, error)
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
	cfg            *core.Config
	client         *client.Client
	msgRepo        MessageRepository
	contactsGetter ContactsGetter
	mediaGetter    MediaGetter
	sessionID      string
	cwDB           *sql.DB
}

// NewChatwootDBSync creates a new direct database sync service
func NewChatwootDBSync(cfg *core.Config, msgRepo MessageRepository, contactsGetter ContactsGetter, mediaGetter MediaGetter, sessionID string) (*ChatwootDBSync, error) {
	if cfg.ChatwootDBHost == "" {
		return nil, core.ErrDBNotConfigured
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

	logger.Debug().
		Str("host", cfg.ChatwootDBHost).
		Str("database", cfg.ChatwootDBName).
		Msg("Chatwoot: connected to database for sync")

	return &ChatwootDBSync{
		cfg:            cfg,
		client:         client.NewClient(cfg.URL, cfg.Token, cfg.Account),
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
func (s *ChatwootDBSync) SyncAll(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	totalStats := &core.SyncStats{}

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
func (s *ChatwootDBSync) SyncContacts(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	stats := &core.SyncStats{}

	logger.Debug().Str("sessionId", s.sessionID).Msg("Chatwoot sync: starting contacts")

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

	logger.Debug().Int("contacts", len(validContacts)).Msg("Chatwoot sync: contacts filtered")

	const batchSize = 3000
	for i := 0; i < len(validContacts); i += batchSize {
		end := minInt(i+batchSize, len(validContacts))
		batch := validContacts[i:end]

		imported, err := s.insertContactsBatch(ctx, batch)
		if err != nil {
			logger.Debug().Err(err).Int("batchStart", i).Msg("Chatwoot sync: batch insert failed")
			stats.ContactsErrors += len(batch)
		} else {
			stats.ContactsImported += imported
		}
		s.updateSyncStats(stats)
	}

	logger.Info().Int("imported", stats.ContactsImported).Msg("Chatwoot sync: contacts completed")

	return stats, nil
}

// SyncMessages synchronizes messages directly to Chatwoot PostgreSQL
func (s *ChatwootDBSync) SyncMessages(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	stats := &core.SyncStats{}

	logger.Debug().Str("sessionId", s.sessionID).Int("daysLimit", daysLimit).Msg("Chatwoot sync: starting messages")

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

	logger.Debug().Int("messages", len(filteredMessages)).Msg("Chatwoot sync: messages filtered")

	sort.Slice(filteredMessages, func(i, j int) bool {
		return filteredMessages[i].Timestamp.Before(filteredMessages[j].Timestamp)
	})

	messagesByChat := s.groupMessagesByChat(filteredMessages)
	waContactsCache := s.loadWhatsAppContactsCache(ctx)

	chatCache, err := s.createContactsAndConversations(ctx, messagesByChat, waContactsCache, stats)
	if err != nil {
		return stats, err
	}

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
				logger.Debug().Err(err).Msg("Chatwoot sync: message batch insert failed")
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

	logger.Info().Int("imported", stats.MessagesImported).Msg("Chatwoot sync: messages completed")

	go s.updateAllContactAvatarsBackground()

	return stats, nil
}

// StartSyncAsync starts sync in background
func (s *ChatwootDBSync) StartSyncAsync(syncType string, daysLimit int) (*core.SyncStatus, error) {
	if current := GetSyncStatus(s.sessionID); current.Status == core.SyncStatusRunning {
		return current, core.ErrSyncInProgress
	}

	startTime := time.Now()
	status := &core.SyncStatus{
		SessionID: s.sessionID,
		Status:    core.SyncStatusRunning,
		Type:      syncType,
		StartedAt: &startTime,
	}
	SetSyncStatus(s.sessionID, status)

	go func() {
		ctx := context.Background()
		var stats *core.SyncStats
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
		finalStatus := &core.SyncStatus{
			SessionID: s.sessionID,
			Type:      syncType,
			StartedAt: &startTime,
			EndedAt:   &endTime,
			Status:    core.SyncStatusCompleted,
		}

		if err != nil {
			finalStatus.Status = core.SyncStatusFailed
			finalStatus.Error = err.Error()
		}
		if stats != nil {
			finalStatus.Stats = *stats
		}

		SetSyncStatus(s.sessionID, finalStatus)
		s.Close()

		logger.Debug().Str("sessionId", s.sessionID).Str("status", finalStatus.Status).Msg("Chatwoot sync: async completed")
	}()

	return status, nil
}

// ResetData deletes all Chatwoot data except the bot contact (id=1)
func (s *ChatwootDBSync) ResetData(ctx context.Context) (*core.ResetStats, error) {
	stats := &core.ResetStats{}

	var inboxID int
	err := s.cwDB.QueryRowContext(ctx, `SELECT id FROM inboxes WHERE id = $1`, s.cfg.InboxID).Scan(&inboxID)
	if err != nil {
		inboxID = 0
	}

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

func (s *ChatwootDBSync) filterValidContacts(contacts []core.WhatsAppContact, stats *core.SyncStats) []core.WhatsAppContact {
	var valid []core.WhatsAppContact
	for _, c := range contacts {
		if util.IsGroupJID(c.JID) || util.IsStatusBroadcast(c.JID) || util.IsNewsletter(c.JID) || util.IsLIDJID(c.JID) {
			stats.ContactsSkipped++
			continue
		}
		if util.ExtractPhoneFromJID(c.JID) == "" {
			stats.ContactsSkipped++
			continue
		}
		valid = append(valid, c)
	}
	return valid
}

func (s *ChatwootDBSync) filterMessages(ctx context.Context, messages []model.Message, daysLimit int, stats *core.SyncStats) ([]model.Message, map[string]bool) {
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

		if util.IsStatusBroadcast(msg.ChatJID) || util.IsNewsletter(msg.ChatJID) || util.IsLIDJID(msg.ChatJID) {
			stats.MessagesSkipped++
			continue
		}

		phone := util.ExtractPhoneFromJID(msg.ChatJID)
		if phone == "" || phone == "0" {
			stats.MessagesSkipped++
			continue
		}

		if msg.Type == "protocol" || msg.Type == "reaction" || msg.Type == "system" {
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

func (s *ChatwootDBSync) loadWhatsAppContactsCache(ctx context.Context) map[string]*core.ContactNameInfo {
	cache := make(map[string]*core.ContactNameInfo)
	if s.contactsGetter == nil {
		return cache
	}

	contacts, err := s.contactsGetter.GetAllContacts(ctx)
	if err != nil {
		return cache
	}

	for _, c := range contacts {
		cache[c.JID] = &core.ContactNameInfo{
			FullName:     c.FullName,
			FirstName:    c.FirstName,
			PushName:     c.PushName,
			BusinessName: c.BusinessName,
		}
	}
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

func (s *ChatwootDBSync) updateSyncStats(stats *core.SyncStats) {
	UpdateSyncStats(s.sessionID, stats)
}

// =============================================================================
// CONTACT/CONVERSATION CREATION
// =============================================================================

func (s *ChatwootDBSync) createContactsAndConversations(ctx context.Context, messagesByChat map[string][]model.Message, waContactsCache map[string]*core.ContactNameInfo, stats *core.SyncStats) (map[string]*core.ChatFKs, error) {
	var phoneDataList []core.PhoneTimestamp

	for chatJID, chatMessages := range messagesByChat {
		isGroup := util.IsGroupJID(chatJID)
		phone := util.ExtractPhoneFromJID(chatJID)
		if phone == "" {
			continue
		}

		var contactName string
		if isGroup {
			contactName = phone + " (GROUP)"
			if s.contactsGetter != nil {
				if groupName, err := s.contactsGetter.GetGroupName(ctx, chatJID); err == nil && groupName != "" {
					contactName = groupName
				}
			}
		} else {
			nameInfo := waContactsCache[chatJID]
			if nameInfo == nil || (nameInfo.FullName == "" && nameInfo.FirstName == "" && nameInfo.PushName == "" && nameInfo.BusinessName == "") {
				for i := len(chatMessages) - 1; i >= 0; i-- {
					if chatMessages[i].PushName != "" && !chatMessages[i].FromMe {
						if nameInfo == nil {
							nameInfo = &core.ContactNameInfo{}
						}
						nameInfo.PushName = chatMessages[i].PushName
						break
					}
				}
			}
			contactName = util.GetBestContactName(nameInfo, phone)
		}

		var firstTS, lastTS int64
		if len(chatMessages) > 0 {
			firstTS = chatMessages[0].Timestamp.Unix()
			lastTS = chatMessages[len(chatMessages)-1].Timestamp.Unix()
		} else {
			firstTS = time.Now().Unix()
			lastTS = firstTS
		}

		phoneValue := "+" + phone
		if isGroup {
			phoneValue = phone
		}

		phoneDataList = append(phoneDataList, core.PhoneTimestamp{
			Phone:      phoneValue,
			FirstTS:    firstTS,
			LastTS:     lastTS,
			Name:       contactName,
			Identifier: chatJID,
			IsGroup:    isGroup,
		})
	}

	logger.Debug().Int("chats", len(phoneDataList)).Msg("Chatwoot sync: creating contacts/conversations")

	chatCacheByPhone := make(map[string]*core.ChatFKs)
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

	chatCache := make(map[string]*core.ChatFKs)
	for _, pd := range phoneDataList {
		if fks, ok := chatCacheByPhone[pd.Phone]; ok {
			chatCache[pd.Identifier] = fks
			stats.ConversationsUsed++
		}
	}

	return chatCache, nil
}

func (s *ChatwootDBSync) createFKsBatch(ctx context.Context, phoneData []core.PhoneTimestamp) (map[string]*core.ChatFKs, error) {
	result := make(map[string]*core.ChatFKs)
	if len(phoneData) == 0 {
		return result, nil
	}

	var values1, values2 []string
	args1 := []interface{}{s.cfg.Account}
	args2 := []interface{}{s.cfg.Account, s.cfg.InboxID}

	for _, pd := range phoneData {
		idx1 := len(args1) + 1
		args1 = append(args1, pd.Phone, pd.Name, pd.Identifier, pd.IsGroup)
		values1 = append(values1, fmt.Sprintf("($%d::text, %d::bigint, %d::bigint, $%d::text, $%d::text, $%d::boolean)",
			idx1, pd.FirstTS, pd.LastTS, idx1+1, idx1+2, idx1+3))

		idx2 := len(args2) + 1
		args2 = append(args2, pd.Phone, pd.Name, pd.Identifier)
		values2 = append(values2, fmt.Sprintf("($%d::text, %d::bigint, %d::bigint, $%d::text, $%d::text)",
			idx2, pd.FirstTS, pd.LastTS, idx2+1, idx2+2))
	}

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
		result[phone] = &core.ChatFKs{ContactID: contactID, ConversationID: conversationID}
	}

	return result, rows.Err()
}

func (s *ChatwootDBSync) insertContactsBatch(ctx context.Context, contacts []core.WhatsAppContact) (int, error) {
	if len(contacts) == 0 {
		return 0, nil
	}

	var values []string
	args := []interface{}{s.cfg.Account}

	for _, c := range contacts {
		phone := util.ExtractPhoneFromJID(c.JID)
		name := util.GetBestContactName(&core.ContactNameInfo{
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

func (s *ChatwootDBSync) insertMessageBatch(ctx context.Context, messages []model.Message, chatCache map[string]*core.ChatFKs, userID int, userType string) (int, error) {
	if len(messages) == 0 {
		return 0, nil
	}

	totalImported := 0
	uploader := client.NewMediaUploader(s.client)

	for _, msg := range messages {
		fks := chatCache[msg.ChatJID]
		if fks == nil {
			continue
		}

		msgType := 0
		senderType := "Contact"
		senderID := fks.ContactID
		if msg.FromMe {
			msgType = 1
			senderType = userType
			senderID = userID
		}

		isMedia := msg.IsMedia() && s.mediaGetter != nil
		var media *model.Media
		if isMedia {
			var err error
			media, err = s.mediaGetter.GetByMsgID(ctx, s.sessionID, msg.MsgId)
			if err != nil || media == nil || media.StorageURL == "" {
				isMedia = false
			}
		}

		if isMedia && media != nil {
			messageType := "incoming"
			if msg.FromMe {
				messageType = "outgoing"
			}

			cwMsg, err := uploader.UploadFromURL(ctx, client.MediaUploadRequest{
				ConversationID: fks.ConversationID,
				MediaURL:       media.StorageURL,
				MediaType:      media.MediaType,
				Filename:       media.FileName,
				MimeType:       media.MimeType,
				Caption:        msg.Content,
				MessageType:    messageType,
				SourceID:       "WAID:" + msg.MsgId,
			})

			if err != nil {
				continue
			}

			if cwMsg != nil && cwMsg.ID > 0 {
				s.cwDB.ExecContext(ctx,
					`UPDATE messages SET created_at = $1, updated_at = $1 WHERE id = $2`,
					msg.Timestamp, cwMsg.ID)
			}
			totalImported++
		} else {
			content := GetMessageContent(&msg)
			if content == "" {
				continue
			}

			_, err := s.cwDB.ExecContext(ctx, `
				INSERT INTO messages (content, processed_message_content, account_id, inbox_id, conversation_id, 
					message_type, private, content_type, sender_type, sender_id, source_id, created_at, updated_at)
				VALUES ($1, $1, $2, $3, $4, $5, FALSE, 0, $6, $7, $8, $9, $9)`,
				content, s.cfg.Account, s.cfg.InboxID, fks.ConversationID, msgType,
				senderType, senderID, "WAID:"+msg.MsgId, msg.Timestamp)

			if err != nil {
				continue
			}
			totalImported++
		}
	}

	if totalImported > 0 {
		s.updateConversationTimestamps(ctx, messages, chatCache)
	}

	return totalImported, nil
}

func (s *ChatwootDBSync) updateConversationTimestamps(ctx context.Context, messages []model.Message, chatCache map[string]*core.ChatFKs) {
	convTimestamps := make(map[int]time.Time)
	for _, msg := range messages {
		if fks := chatCache[msg.ChatJID]; fks != nil {
			if existing, ok := convTimestamps[fks.ConversationID]; !ok || msg.Timestamp.After(existing) {
				convTimestamps[fks.ConversationID] = msg.Timestamp
			}
		}
	}
	for convID, ts := range convTimestamps {
		s.cwDB.ExecContext(ctx,
			`UPDATE conversations SET last_activity_at = $1, updated_at = $1 WHERE id = $2 AND (last_activity_at IS NULL OR last_activity_at < $1)`,
			ts, convID)
	}
}

func (s *ChatwootDBSync) updateContactAvatars(ctx context.Context, chatCache map[string]*core.ChatFKs) {
	if s.contactsGetter == nil || len(chatCache) == 0 {
		return
	}

	updated := 0
	for jid, fks := range chatCache {
		if fks == nil {
			continue
		}

		if s.updateSingleContactAvatar(ctx, jid, fks.ContactID) {
			updated++
		}
	}
}

func (s *ChatwootDBSync) updateSingleContactAvatar(ctx context.Context, jid string, contactID int) bool {
	avatarURL, err := s.contactsGetter.GetProfilePictureURL(ctx, jid)
	if err != nil || avatarURL == "" {
		return false
	}

	_, err = s.client.UpdateContactSilent404(ctx, contactID, map[string]interface{}{
		"avatar_url": avatarURL,
	})
	if err != nil {
		return false
	}

	return true
}

func (s *ChatwootDBSync) updateAllContactAvatarsBackground() {
	if s.contactsGetter == nil {
		return
	}

	port := s.cfg.ChatwootDBPort
	if port == 0 {
		port = 5432
	}
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
		s.cfg.ChatwootDBUser, s.cfg.ChatwootDBPass, s.cfg.ChatwootDBHost, port, s.cfg.ChatwootDBName)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return
	}
	defer db.Close()

	ctx := context.Background()

	rows, err := db.QueryContext(ctx, `
		SELECT c.id, c.identifier 
		FROM contacts c
		LEFT JOIN active_storage_attachments asa ON asa.record_type = 'Contact' AND asa.record_id = c.id AND asa.name = 'avatar'
		WHERE c.account_id = $1 
		AND c.identifier IS NOT NULL AND c.identifier != ''
		AND asa.id IS NULL
		ORDER BY c.last_activity_at DESC NULLS LAST`, s.cfg.Account)
	if err != nil {
		return
	}
	defer rows.Close()

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

	for _, c := range contacts {
		reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)

		avatarURL, err := s.contactsGetter.GetProfilePictureURL(reqCtx, c.Identifier)
		cancel()

		if err != nil || avatarURL == "" {
			continue
		}

		_, err = s.client.UpdateContactSilent404(ctx, c.ID, map[string]interface{}{
			"avatar_url": avatarURL,
		})
		if err != nil {
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}
}

// =============================================================================
// MESSAGE CONTENT EXTRACTION
// =============================================================================

// GetMessageContent extracts displayable content from a message
func GetMessageContent(msg *model.Message) string {
	if msg.Content == "" && len(msg.RawEvent) > 0 {
		if msg.Type == "list" || msg.Type == "template" || msg.Type == "buttons" || msg.Type == "interactive" {
			if content := ExtractInteractiveContent(msg); content != "" {
				return content
			}
		}
	}

	switch msg.Type {
	case "image":
		if msg.Content != "" {
			return "_[Imagem]_\n" + msg.Content
		}
		return "_[Imagem]_"
	case "video":
		if msg.Content != "" {
			return "_[Vídeo]_\n" + msg.Content
		}
		return "_[Vídeo]_"
	case "audio":
		if msg.Content != "" {
			return "_[Áudio]_\n" + msg.Content
		}
		return "_[Áudio]_"
	case "document":
		if msg.Content != "" {
			return "_[Documento: " + msg.Content + "]_"
		}
		return "_[Documento]_"
	case "sticker":
		return "_[Sticker]_"
	case "location":
		return "_[Localização]_"
	case "contact":
		return "_[Contato]_"
	default:
		return msg.Content
	}
}

// ExtractInteractiveContent extracts content from interactive message types
func ExtractInteractiveContent(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		return ""
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return ""
	}

	webMsgInfo, ok := rawEvent["webMessageInfo"].(map[string]interface{})
	if !ok {
		return ""
	}

	message, ok := webMsgInfo["message"].(map[string]interface{})
	if !ok {
		return ""
	}

	switch msg.Type {
	case "list":
		return extractListContent(message)
	case "template":
		return extractTemplateContent(message)
	case "buttons":
		return extractButtonsContent(message)
	case "interactive":
		return extractInteractiveMessageContent(message)
	}

	return ""
}

func extractListContent(message map[string]interface{}) string {
	listMsg, ok := message["listMessage"].(map[string]interface{})
	if !ok {
		return ""
	}

	var b strings.Builder

	if desc, ok := listMsg["description"].(string); ok && desc != "" {
		b.WriteString(desc)
	}

	if sections, ok := listMsg["sections"].([]interface{}); ok {
		for _, sec := range sections {
			section, ok := sec.(map[string]interface{})
			if !ok {
				continue
			}

			if title, ok := section["title"].(string); ok && title != "" {
				b.WriteString("\n\n*")
				b.WriteString(title)
				b.WriteString("*")
			}

			if rows, ok := section["rows"].([]interface{}); ok {
				for _, r := range rows {
					row, ok := r.(map[string]interface{})
					if !ok {
						continue
					}
					title, _ := row["title"].(string)
					desc, _ := row["description"].(string)
					if title != "" {
						b.WriteString("\n• ")
						b.WriteString(title)
						if desc != "" {
							b.WriteString(" - ")
							b.WriteString(desc)
						}
					}
				}
			}
		}
	}

	return strings.TrimSpace(b.String())
}

func extractTemplateContent(message map[string]interface{}) string {
	templateMsg, ok := message["templateMessage"].(map[string]interface{})
	if !ok {
		return ""
	}

	if ht, ok := templateMsg["hydratedTemplate"].(map[string]interface{}); ok {
		if text, ok := ht["hydratedContentText"].(string); ok && text != "" {
			return text
		}
	}

	if format, ok := templateMsg["Format"].(map[string]interface{}); ok {
		if fourRow, ok := format["HydratedFourRowTemplate"].(map[string]interface{}); ok {
			if text, ok := fourRow["hydratedContentText"].(string); ok && text != "" {
				return text
			}
		}
	}

	return ""
}

func extractButtonsContent(message map[string]interface{}) string {
	buttonsMsg, ok := message["buttonsMessage"].(map[string]interface{})
	if !ok {
		return ""
	}
	if text, ok := buttonsMsg["contentText"].(string); ok {
		return text
	}
	return ""
}

func extractInteractiveMessageContent(message map[string]interface{}) string {
	interactiveMsg, ok := message["interactiveMessage"].(map[string]interface{})
	if !ok {
		return ""
	}
	if body, ok := interactiveMsg["body"].(map[string]interface{}); ok {
		if text, ok := body["text"].(string); ok {
			return text
		}
	}
	return ""
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
