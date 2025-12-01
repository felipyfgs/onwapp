package sync

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"

	"zpwoot/internal/integrations/chatwoot/core"
)

// Repository handles all Chatwoot database operations for sync
type Repository struct {
	db        *sql.DB
	accountID int
	inboxID   int
}

// NewRepository creates a new sync repository
func NewRepository(db *sql.DB, accountID, inboxID int) *Repository {
	return &Repository{
		db:        db,
		accountID: accountID,
		inboxID:   inboxID,
	}
}

// GetChatwootUser gets the user ID and type from the API token
func (r *Repository) GetChatwootUser(ctx context.Context, token string) (userID int, userType string, err error) {
	err = r.db.QueryRowContext(ctx, `
		SELECT u.id, 'User' 
		FROM users u
		INNER JOIN access_tokens at ON at.owner_id = u.id AND at.owner_type = 'User'
		WHERE at.token = $1 
		LIMIT 1
	`, token).Scan(&userID, &userType)
	if err != nil {
		return 0, "", wrapErr("get chatwoot user", err)
	}
	return userID, userType, nil
}

// GetInboxID verifies and returns the inbox ID
func (r *Repository) GetInboxID(ctx context.Context) (int, error) {
	if r.inboxID == 0 {
		return 0, nil
	}

	var inboxID int
	err := r.db.QueryRowContext(ctx, `SELECT id FROM inboxes WHERE id = $1`, r.inboxID).Scan(&inboxID)
	if err != nil {
		return 0, nil
	}
	return inboxID, nil
}

// GetExistingSourceIDs returns a map of existing source IDs
func (r *Repository) GetExistingSourceIDs(ctx context.Context, messageIDs []string) (map[string]bool, error) {
	existing := make(map[string]bool)
	if len(messageIDs) == 0 {
		return existing, nil
	}

	sourceIDs := make([]string, len(messageIDs))
	for i, id := range messageIDs {
		sourceIDs[i] = "WAID:" + id
	}

	for i := 0; i < len(sourceIDs); i += core.QueryBatchSize {
		end := min(i+core.QueryBatchSize, len(sourceIDs))
		batch := sourceIDs[i:end]

		rows, err := r.db.QueryContext(ctx,
			`SELECT source_id FROM messages WHERE account_id = $1 AND source_id = ANY($2)`,
			r.accountID, pq.Array(batch))
		if err != nil {
			return nil, wrapErr("get existing source IDs", err)
		}

		for rows.Next() {
			var sourceID string
			if err := rows.Scan(&sourceID); err != nil {
				continue
			}
			existing[sourceID] = true
		}
		rows.Close()
	}

	return existing, nil
}

// ContactWithoutAvatar represents a contact without avatar
type ContactWithoutAvatar struct {
	ID         int
	Identifier string
}

// GetContactsWithoutAvatar returns contacts that don't have avatars
func (r *Repository) GetContactsWithoutAvatar(ctx context.Context) ([]ContactWithoutAvatar, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT c.id, c.identifier 
		FROM contacts c
		LEFT JOIN active_storage_attachments asa 
			ON asa.record_type = 'Contact' 
			AND asa.record_id = c.id 
			AND asa.name = 'avatar'
		WHERE c.account_id = $1 
			AND c.identifier IS NOT NULL 
			AND c.identifier != ''
			AND asa.id IS NULL
		ORDER BY c.last_activity_at DESC NULLS LAST
	`, r.accountID)
	if err != nil {
		return nil, wrapErr("get contacts without avatar", err)
	}
	defer rows.Close()

	var contacts []ContactWithoutAvatar
	for rows.Next() {
		var c ContactWithoutAvatar
		if err := rows.Scan(&c.ID, &c.Identifier); err != nil {
			continue
		}
		contacts = append(contacts, c)
	}
	return contacts, rows.Err()
}

// UpsertContactsBatch inserts or updates contacts in batch
func (r *Repository) UpsertContactsBatch(ctx context.Context, contacts []ContactInsertData) (int, error) {
	if len(contacts) == 0 {
		return 0, nil
	}

	values := make([]string, 0, len(contacts))
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
			name = CASE 
				WHEN contacts.name = contacts.phone_number 
					OR contacts.name = REPLACE(contacts.phone_number, '+', '') 
					OR contacts.name IS NULL 
					OR contacts.name = ''
				THEN EXCLUDED.name 
				ELSE contacts.name 
			END,
			updated_at = NOW()
	`, strings.Join(values, ", "))

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, wrapErr("upsert contacts batch", err)
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// ContactInsertData holds data for contact insertion
type ContactInsertData struct {
	Name       string
	Phone      string
	Identifier string
}

// CreateContactsAndConversations creates contacts, contact_inboxes, and conversations in batch
func (r *Repository) CreateContactsAndConversations(ctx context.Context, phoneData []core.PhoneTimestamp) (map[string]*core.ChatFKs, error) {
	result := make(map[string]*core.ChatFKs)
	if len(phoneData) == 0 {
		return result, nil
	}

	// Build query values
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
	if err := r.upsertContactsWithTimestamp(ctx, values1, args1); err != nil {
		return nil, err
	}

	// Step 2: Create contact_inboxes
	if err := r.createContactInboxes(ctx, values2, args2); err != nil {
		return nil, err
	}

	// Step 3: Create conversations
	if err := r.createConversations(ctx, values2, args2); err != nil {
		return nil, err
	}

	// Step 4: Query FKs
	return r.queryFKs(ctx, values2, args2)
}

func (r *Repository) upsertContactsWithTimestamp(ctx context.Context, values []string, args []interface{}) error {
	query := fmt.Sprintf(`
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
	`, strings.Join(values, ", "))

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return wrapErr("upsert contacts with timestamp", err)
	}
	return nil
}

func (r *Repository) createContactInboxes(ctx context.Context, values []string, args []interface{}) error {
	query := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT identifier FROM (VALUES %s) AS t (phone_number, created_at, last_activity_at, contact_name, identifier)
		)
		INSERT INTO contact_inboxes (contact_id, inbox_id, source_id, created_at, updated_at)
		SELECT c.id, $2::integer, gen_random_uuid(), NOW(), NOW()
		FROM contacts c
		WHERE c.account_id = $1::integer AND c.identifier IN (SELECT identifier FROM phone_data)
		AND NOT EXISTS (SELECT 1 FROM contact_inboxes ci WHERE ci.contact_id = c.id AND ci.inbox_id = $2::integer)
		ON CONFLICT DO NOTHING
	`, strings.Join(values, ", "))

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return wrapErr("create contact_inboxes", err)
	}
	return nil
}

func (r *Repository) createConversations(ctx context.Context, values []string, args []interface{}) error {
	query := fmt.Sprintf(`
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
	`, strings.Join(values, ", "))

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return wrapErr("create conversations", err)
	}
	return nil
}

func (r *Repository) queryFKs(ctx context.Context, values []string, args []interface{}) (map[string]*core.ChatFKs, error) {
	result := make(map[string]*core.ChatFKs)

	query := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT phone_number, identifier FROM (VALUES %s) AS t (phone_number, created_at, last_activity_at, contact_name, identifier)
		)
		SELECT pd.phone_number, c.id AS contact_id, conv.id AS conversation_id
		FROM phone_data pd
		JOIN contacts c ON c.identifier = pd.identifier AND c.account_id = $1::integer
		JOIN contact_inboxes ci ON ci.contact_id = c.id AND ci.inbox_id = $2::integer
		JOIN conversations conv ON conv.contact_inbox_id = ci.id
	`, strings.Join(values, ", "))

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, wrapErr("query FKs", err)
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

// InsertMessage inserts a single message
func (r *Repository) InsertMessage(ctx context.Context, msg MessageInsertData) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO messages (content, processed_message_content, account_id, inbox_id, conversation_id, 
			message_type, private, content_type, sender_type, sender_id, source_id, created_at, updated_at)
		VALUES ($1, $1, $2, $3, $4, $5, FALSE, 0, $6, $7, $8, $9, $9)`,
		msg.Content, r.accountID, r.inboxID, msg.ConversationID, msg.MessageType,
		msg.SenderType, msg.SenderID, msg.SourceID, msg.Timestamp)
	if err != nil {
		return wrapErr("insert message", err)
	}
	return nil
}

// MessageInsertData holds data for message insertion
type MessageInsertData struct {
	Content        string
	ConversationID int
	MessageType    int
	SenderType     string
	SenderID       int
	SourceID       string
	Timestamp      time.Time
}

// UpdateMessageTimestamp updates the timestamp of a message
func (r *Repository) UpdateMessageTimestamp(ctx context.Context, messageID int, timestamp time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE messages SET created_at = $1, updated_at = $1 WHERE id = $2`,
		timestamp, messageID)
	if err != nil {
		return wrapErr("update message timestamp", err)
	}
	return nil
}

// UpdateConversationTimestamp updates the last_activity_at for a conversation
func (r *Repository) UpdateConversationTimestamp(ctx context.Context, conversationID int, timestamp time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE conversations SET last_activity_at = $1, updated_at = $1 WHERE id = $2 AND (last_activity_at IS NULL OR last_activity_at < $1)`,
		timestamp, conversationID)
	if err != nil {
		return wrapErr("update conversation timestamp", err)
	}
	return nil
}

// UpdateConversationTimestamps updates timestamps for multiple conversations (best-effort)
func (r *Repository) UpdateConversationTimestamps(ctx context.Context, timestamps map[int]time.Time) {
	for convID, ts := range timestamps {
		_ = r.UpdateConversationTimestamp(ctx, convID, ts)
	}
}

// DeleteMessages deletes messages for the account
func (r *Repository) DeleteMessages(ctx context.Context, inboxID int) (int, error) {
	var query string
	var args []interface{}

	if inboxID > 0 {
		query = `DELETE FROM messages WHERE conversation_id IN (
			SELECT id FROM conversations WHERE account_id = $1 AND inbox_id = $2 AND contact_id > 1
		)`
		args = []interface{}{r.accountID, inboxID}
	} else {
		query = `DELETE FROM messages WHERE account_id = $1 AND conversation_id IN (
			SELECT id FROM conversations WHERE account_id = $1 AND contact_id > 1
		)`
		args = []interface{}{r.accountID}
	}

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, wrapErr("delete messages", err)
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// DeleteConversations deletes conversations for the account
func (r *Repository) DeleteConversations(ctx context.Context, inboxID int) (int, error) {
	var query string
	var args []interface{}

	if inboxID > 0 {
		query = `DELETE FROM conversations WHERE account_id = $1 AND inbox_id = $2 AND contact_id > 1`
		args = []interface{}{r.accountID, inboxID}
	} else {
		query = `DELETE FROM conversations WHERE account_id = $1 AND contact_id > 1`
		args = []interface{}{r.accountID}
	}

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, wrapErr("delete conversations", err)
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// DeleteContactInboxes deletes contact_inboxes for the account
func (r *Repository) DeleteContactInboxes(ctx context.Context, inboxID int) (int, error) {
	var query string
	var args []interface{}

	if inboxID > 0 {
		query = `DELETE FROM contact_inboxes WHERE inbox_id = $1 AND contact_id > 1`
		args = []interface{}{inboxID}
	} else {
		query = `DELETE FROM contact_inboxes WHERE contact_id IN (
			SELECT id FROM contacts WHERE account_id = $1 AND id > 1
		)`
		args = []interface{}{r.accountID}
	}

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, wrapErr("delete contact_inboxes", err)
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// DeleteContacts deletes contacts for the account
func (r *Repository) DeleteContacts(ctx context.Context) (int, error) {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM contacts WHERE account_id = $1 AND id > 1`,
		r.accountID)
	if err != nil {
		return 0, wrapErr("delete contacts", err)
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}
