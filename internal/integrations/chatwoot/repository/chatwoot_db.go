package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"

	"zpwoot/internal/integrations/chatwoot/core"
)

// ChatwootDBRepository handles all Chatwoot PostgreSQL database operations
type ChatwootDBRepository struct {
	db        *sql.DB
	accountID int
	inboxID   int
}

// NewChatwootDBRepository creates a new Chatwoot DB repository
func NewChatwootDBRepository(db *sql.DB, accountID, inboxID int) *ChatwootDBRepository {
	return &ChatwootDBRepository{
		db:        db,
		accountID: accountID,
		inboxID:   inboxID,
	}
}

// GetUserByToken retrieves the user ID and type from access token
func (r *ChatwootDBRepository) GetUserByToken(ctx context.Context, token string) (userID int, userType string, err error) {
	err = r.db.QueryRowContext(ctx, `
		SELECT u.id, 'User' FROM users u
		INNER JOIN access_tokens at ON at.owner_id = u.id AND at.owner_type = 'User'
		WHERE at.token = $1 LIMIT 1
	`, token).Scan(&userID, &userType)
	return
}

// InboxExists checks if inbox exists
func (r *ChatwootDBRepository) InboxExists(ctx context.Context, inboxID int) bool {
	var id int
	err := r.db.QueryRowContext(ctx, `SELECT id FROM inboxes WHERE id = $1`, inboxID).Scan(&id)
	return err == nil && id > 0
}

// GetExistingSourceIDs returns a set of existing source IDs for deduplication
func (r *ChatwootDBRepository) GetExistingSourceIDs(ctx context.Context, messageIDs []string) (map[string]bool, error) {
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

		rows, err := r.db.QueryContext(ctx,
			`SELECT source_id FROM messages WHERE account_id = $1 AND source_id = ANY($2)`,
			r.accountID, pq.Array(batch))
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

// InsertMessageRequest contains data for inserting a message
type InsertMessageRequest struct {
	Content        string
	ConversationID int
	MessageType    int // 0=incoming, 1=outgoing
	SenderType     string
	SenderID       int
	SourceID       string
	Timestamp      time.Time
}

// InsertMessage inserts a single text message
func (r *ChatwootDBRepository) InsertMessage(ctx context.Context, req *InsertMessageRequest) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO messages (content, processed_message_content, account_id, inbox_id, conversation_id, 
			message_type, private, content_type, sender_type, sender_id, source_id, created_at, updated_at)
		VALUES ($1, $1, $2, $3, $4, $5, FALSE, 0, $6, $7, $8, $9, $9)`,
		req.Content, r.accountID, r.inboxID, req.ConversationID, req.MessageType,
		req.SenderType, req.SenderID, req.SourceID, req.Timestamp)
	return err
}

// UpdateMessageTimestamp updates the created_at/updated_at for a message
func (r *ChatwootDBRepository) UpdateMessageTimestamp(ctx context.Context, messageID int, timestamp time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE messages SET created_at = $1, updated_at = $1 WHERE id = $2`,
		timestamp, messageID)
	return err
}

// UpdateConversationTimestamp updates the last_activity_at for a conversation
func (r *ChatwootDBRepository) UpdateConversationTimestamp(ctx context.Context, conversationID int, timestamp time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE conversations SET last_activity_at = $1, updated_at = $1 WHERE id = $2 AND (last_activity_at IS NULL OR last_activity_at < $1)`,
		timestamp, conversationID)
	return err
}

// ContactIdentifier represents a contact with ID and identifier
type ContactIdentifier struct {
	ID         int
	Identifier string
}

// GetContactsWithoutAvatar returns contacts that don't have an avatar
func (r *ChatwootDBRepository) GetContactsWithoutAvatar(ctx context.Context) ([]ContactIdentifier, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT c.id, c.identifier 
		FROM contacts c
		LEFT JOIN active_storage_attachments asa ON asa.record_type = 'Contact' AND asa.record_id = c.id AND asa.name = 'avatar'
		WHERE c.account_id = $1 
		AND c.identifier IS NOT NULL AND c.identifier != ''
		AND asa.id IS NULL
		ORDER BY c.last_activity_at DESC NULLS LAST`, r.accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []ContactIdentifier
	for rows.Next() {
		var c ContactIdentifier
		if err := rows.Scan(&c.ID, &c.Identifier); err != nil {
			continue
		}
		contacts = append(contacts, c)
	}
	return contacts, rows.Err()
}

// UpsertContactsAndConversations creates contacts, contact_inboxes, and conversations in batch
func (r *ChatwootDBRepository) UpsertContactsAndConversations(ctx context.Context, phoneData []core.PhoneTimestamp) (map[string]*core.ChatFKs, error) {
	result := make(map[string]*core.ChatFKs)
	if len(phoneData) == 0 {
		return result, nil
	}

	var values1, values2 []string
	args1 := []interface{}{r.accountID}
	args2 := []interface{}{r.accountID, r.inboxID}

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

	// Step 1: Upsert contacts
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

	if _, err := r.db.ExecContext(ctx, query1, args1...); err != nil {
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

	if _, err := r.db.ExecContext(ctx, query2, args2...); err != nil {
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

	if _, err := r.db.ExecContext(ctx, query3, args2...); err != nil {
		return nil, fmt.Errorf("failed to create conversations: %w", err)
	}

	// Step 4: Query the created FKs
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

	rows, err := r.db.QueryContext(ctx, query4, args2...)
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

// ContactData represents contact data for batch insert
type ContactData struct {
	Name       string
	Phone      string
	Identifier string
}

// InsertContactsBatch inserts contacts in batch
func (r *ChatwootDBRepository) InsertContactsBatch(ctx context.Context, contacts []ContactData) (int, error) {
	if len(contacts) == 0 {
		return 0, nil
	}

	var values []string
	args := []interface{}{r.accountID}

	for _, c := range contacts {
		idx := len(args) + 1
		args = append(args, c.Name, c.Phone, c.Identifier)
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

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, err
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// ResetAllData deletes all Chatwoot data except the bot contact (id=1)
func (r *ChatwootDBRepository) ResetAllData(ctx context.Context) (*core.ResetStats, error) {
	stats := &core.ResetStats{}

	inboxExists := r.InboxExists(ctx, r.inboxID)

	if inboxExists {
		// Delete messages for conversations in this inbox
		result, err := r.db.ExecContext(ctx, `
			DELETE FROM messages WHERE conversation_id IN (
				SELECT id FROM conversations WHERE account_id = $1 AND inbox_id = $2 AND contact_id > 1
			)`, r.accountID, r.inboxID)
		if err != nil {
			return stats, fmt.Errorf("failed to delete messages: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.MessagesDeleted = int(rows)
		}

		// Delete conversations
		result, err = r.db.ExecContext(ctx,
			`DELETE FROM conversations WHERE account_id = $1 AND inbox_id = $2 AND contact_id > 1`,
			r.accountID, r.inboxID)
		if err != nil {
			return stats, fmt.Errorf("failed to delete conversations: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.ConversationsDeleted = int(rows)
		}

		// Delete contact_inboxes
		result, err = r.db.ExecContext(ctx,
			`DELETE FROM contact_inboxes WHERE inbox_id = $1 AND contact_id > 1`,
			r.inboxID)
		if err != nil {
			return stats, fmt.Errorf("failed to delete contact_inboxes: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.ContactInboxDeleted = int(rows)
		}
	} else {
		// Delete messages for all conversations of this account
		result, err := r.db.ExecContext(ctx, `
			DELETE FROM messages WHERE account_id = $1 AND conversation_id IN (
				SELECT id FROM conversations WHERE account_id = $1 AND contact_id > 1
			)`, r.accountID)
		if err != nil {
			return stats, fmt.Errorf("failed to delete messages: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.MessagesDeleted = int(rows)
		}

		// Delete conversations
		result, err = r.db.ExecContext(ctx,
			`DELETE FROM conversations WHERE account_id = $1 AND contact_id > 1`,
			r.accountID)
		if err != nil {
			return stats, fmt.Errorf("failed to delete conversations: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.ConversationsDeleted = int(rows)
		}

		// Delete contact_inboxes
		result, err = r.db.ExecContext(ctx,
			`DELETE FROM contact_inboxes WHERE contact_id IN (SELECT id FROM contacts WHERE account_id = $1 AND id > 1)`,
			r.accountID)
		if err != nil {
			return stats, fmt.Errorf("failed to delete contact_inboxes: %w", err)
		}
		if rows, _ := result.RowsAffected(); rows > 0 {
			stats.ContactInboxDeleted = int(rows)
		}
	}

	// Delete contacts (except bot contact id=1)
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM contacts WHERE account_id = $1 AND id > 1`,
		r.accountID)
	if err != nil {
		return stats, fmt.Errorf("failed to delete contacts: %w", err)
	}
	if rows, _ := result.RowsAffected(); rows > 0 {
		stats.ContactsDeleted = int(rows)
	}

	return stats, nil
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}
