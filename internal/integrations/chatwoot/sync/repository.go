package sync

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"

	"onwapp/internal/integrations/chatwoot/core"
)

// Repository handles all Chatwoot database operations for sync
type Repository struct {
	db               *sql.DB
	accountID        int
	inboxID          int
	importAsResolved bool
}

// NewRepository creates a new sync repository
func NewRepository(db *sql.DB, accountID, inboxID int) *Repository {
	return &Repository{
		db:        db,
		accountID: accountID,
		inboxID:   inboxID,
	}
}

// SetImportAsResolved sets whether new conversations should be created as resolved
func (r *Repository) SetImportAsResolved(resolved bool) {
	r.importAsResolved = resolved
}

// OrphanCleanupResult holds the result of orphan cleanup
type OrphanCleanupResult struct {
	ContactInboxes int `json:"contactInboxes"`
	Conversations  int `json:"conversations"`
	Messages       int `json:"messages"`
}

// OrphanStats holds count of orphan records (for preview before cleanup)
type OrphanStats struct {
	ContactInboxes int  `json:"contactInboxes"`
	Conversations  int  `json:"conversations"`
	Messages       int  `json:"messages"`
	InboxExists    bool `json:"inboxExists"`
}

// GetOrphanStats returns count of orphan records for OUR inbox only (preview before cleanup)
// This is SCOPED to our inbox_id to avoid affecting other integrations
func (r *Repository) GetOrphanStats(ctx context.Context) (*OrphanStats, error) {
	stats := &OrphanStats{}

	// Check if our inbox still exists
	var exists bool
	err := r.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM inboxes WHERE id = $1)`, r.inboxID).Scan(&exists)
	if err != nil {
		return nil, wrapErr("check inbox exists", err)
	}
	stats.InboxExists = exists

	if exists {
		// Inbox exists, no orphans from our inbox
		return stats, nil
	}

	// Count orphan records that were from OUR inbox (now deleted)
	// We can identify them by inbox_id matching our configured inbox

	// Count orphan contact_inboxes from our inbox
	err = r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM contact_inboxes WHERE inbox_id = $1
	`, r.inboxID).Scan(&stats.ContactInboxes)
	if err != nil {
		return nil, wrapErr("count orphan contact_inboxes", err)
	}

	// Count orphan conversations from our inbox
	err = r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM conversations WHERE inbox_id = $1
	`, r.inboxID).Scan(&stats.Conversations)
	if err != nil {
		return nil, wrapErr("count orphan conversations", err)
	}

	// Count orphan messages from our inbox conversations
	err = r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM messages WHERE conversation_id IN (
			SELECT id FROM conversations WHERE inbox_id = $1
		)
	`, r.inboxID).Scan(&stats.Messages)
	if err != nil {
		return nil, wrapErr("count orphan messages", err)
	}

	return stats, nil
}

// CleanOurOrphanRecords removes orphan records ONLY from OUR inbox
// This is safe to call as it won't affect other inboxes in the Chatwoot instance
// Should only be called when our inbox has been deleted
func (r *Repository) CleanOurOrphanRecords(ctx context.Context) (*OrphanCleanupResult, error) {
	result := &OrphanCleanupResult{}

	// First check if inbox exists - if it does, there are no orphans from us
	var exists bool
	err := r.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM inboxes WHERE id = $1)`, r.inboxID).Scan(&exists)
	if err != nil {
		return nil, wrapErr("check inbox exists", err)
	}

	if exists {
		// Inbox exists, nothing to clean
		return result, nil
	}

	// Our inbox was deleted - clean up orphan records that belong to it
	// Order matters due to foreign key constraints: messages -> conversations -> contact_inboxes

	// 1. Delete messages from our inbox's conversations
	res, err := r.db.ExecContext(ctx, `
		DELETE FROM messages WHERE conversation_id IN (
			SELECT id FROM conversations WHERE inbox_id = $1
		)
	`, r.inboxID)
	if err != nil {
		return nil, wrapErr("clean orphan messages", err)
	}
	rows, _ := res.RowsAffected()
	result.Messages = int(rows)

	// 2. Delete conversations from our inbox
	res, err = r.db.ExecContext(ctx, `
		DELETE FROM conversations WHERE inbox_id = $1
	`, r.inboxID)
	if err != nil {
		return nil, wrapErr("clean orphan conversations", err)
	}
	rows, _ = res.RowsAffected()
	result.Conversations = int(rows)

	// 3. Delete contact_inboxes from our inbox
	res, err = r.db.ExecContext(ctx, `
		DELETE FROM contact_inboxes WHERE inbox_id = $1
	`, r.inboxID)
	if err != nil {
		return nil, wrapErr("clean orphan contact_inboxes", err)
	}
	rows, _ = res.RowsAffected()
	result.ContactInboxes = int(rows)

	return result, nil
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
	if errors.Is(err, sql.ErrNoRows) {
		return 0, nil
	}
	if err != nil {
		return 0, wrapErr("get inbox id", err)
	}
	return inboxID, nil
}

// ErrInboxNotFound is returned when the configured inbox doesn't exist
var ErrInboxNotFound = errors.New("inbox not found - it may have been deleted in Chatwoot")

// ValidateInbox checks if the configured inbox still exists
func (r *Repository) ValidateInbox(ctx context.Context) error {
	if r.inboxID == 0 {
		return errors.New("inbox ID not configured")
	}

	var exists bool
	err := r.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM inboxes WHERE id = $1)`, r.inboxID).Scan(&exists)
	if err != nil {
		return wrapErr("validate inbox", err)
	}
	if !exists {
		return ErrInboxNotFound
	}
	return nil
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

		func() {
			defer rows.Close()
			for rows.Next() {
				var sourceID string
				if err := rows.Scan(&sourceID); err != nil {
					continue
				}
				existing[sourceID] = true
			}
			_ = rows.Err()
		}()
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

// ContactSyncResult holds the result of a contact sync operation
type ContactSyncResult struct {
	Inserted int
	Updated  int
	Skipped  int
}

// UpsertContactsBatch inserts or updates contacts in batch
// Returns accurate counts: inserted (new), updated (changed), skipped (unchanged)
func (r *Repository) UpsertContactsBatch(ctx context.Context, contacts []ContactInsertData) (int, error) {
	result, err := r.UpsertContactsBatchDetailed(ctx, contacts)
	if err != nil {
		return 0, err
	}
	return result.Inserted, nil
}

// UpsertContactsBatchDetailed inserts or updates contacts with detailed stats
func (r *Repository) UpsertContactsBatchDetailed(ctx context.Context, contacts []ContactInsertData) (*ContactSyncResult, error) {
	result := &ContactSyncResult{}
	if len(contacts) == 0 {
		return result, nil
	}

	// Get existing contacts by identifier
	identifiers := make([]string, len(contacts))
	for i, c := range contacts {
		identifiers[i] = c.Identifier
	}
	existing, err := r.getExistingContactIdentifiers(ctx, identifiers)
	if err != nil {
		return nil, err
	}

	// Separate new vs existing
	var newContacts, existingContacts []ContactInsertData
	for _, c := range contacts {
		if existing[c.Identifier] {
			existingContacts = append(existingContacts, c)
		} else {
			newContacts = append(newContacts, c)
		}
	}

	// Insert only new contacts
	if len(newContacts) > 0 {
		inserted, err := r.insertNewContacts(ctx, newContacts)
		if err != nil {
			return nil, err
		}
		result.Inserted = inserted
	}

	// Update existing contacts (only if name changed)
	if len(existingContacts) > 0 {
		updated, err := r.updateExistingContacts(ctx, existingContacts)
		if err != nil {
			return nil, err
		}
		result.Updated = updated
		result.Skipped = len(existingContacts) - updated
	}

	return result, nil
}

// getExistingContactIdentifiers returns a map of identifiers that already exist
func (r *Repository) getExistingContactIdentifiers(ctx context.Context, identifiers []string) (map[string]bool, error) {
	existing := make(map[string]bool)
	if len(identifiers) == 0 {
		return existing, nil
	}

	query := `SELECT identifier FROM contacts WHERE account_id = $1 AND identifier = ANY($2)`
	rows, err := r.db.QueryContext(ctx, query, r.accountID, pq.Array(identifiers))
	if err != nil {
		return nil, wrapErr("get existing contacts", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err == nil {
			existing[id] = true
		}
	}
	return existing, rows.Err()
}

// insertNewContacts inserts only new contacts
func (r *Repository) insertNewContacts(ctx context.Context, contacts []ContactInsertData) (int, error) {
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
		ON CONFLICT (identifier, account_id) DO NOTHING
	`, strings.Join(values, ", "))

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, wrapErr("insert new contacts", err)
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// updateExistingContacts updates existing contacts only if name is better
func (r *Repository) updateExistingContacts(ctx context.Context, contacts []ContactInsertData) (int, error) {
	if len(contacts) == 0 {
		return 0, nil
	}

	values := make([]string, 0, len(contacts))
	args := []interface{}{r.accountID}

	for _, c := range contacts {
		idx := len(args) + 1
		args = append(args, c.Name, c.Identifier)
		values = append(values, fmt.Sprintf("($%d, $%d)", idx, idx+1))
	}

	// Only update if current name is just phone number or empty
	query := fmt.Sprintf(`
		WITH new_data AS (
			SELECT name, identifier FROM (VALUES %s) AS t (name, identifier)
		)
		UPDATE contacts c
		SET name = n.name, updated_at = NOW()
		FROM new_data n
		WHERE c.account_id = $1
			AND c.identifier = n.identifier
			AND (c.name = c.phone_number 
				OR c.name = REPLACE(c.phone_number, '+', '') 
				OR c.name IS NULL 
				OR c.name = '')
			AND n.name IS NOT NULL 
			AND n.name != ''
	`, strings.Join(values, ", "))

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, wrapErr("update existing contacts", err)
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// GetContactsCount returns total contacts count in Chatwoot for this account
func (r *Repository) GetContactsCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM contacts WHERE account_id = $1
	`, r.accountID).Scan(&count)
	if err != nil {
		return 0, wrapErr("get contacts count", err)
	}
	return count, nil
}

// GetContactsWithIdentifierCount returns count of contacts with WhatsApp identifier
func (r *Repository) GetContactsWithIdentifierCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM contacts 
		WHERE account_id = $1 
		AND identifier IS NOT NULL 
		AND identifier != ''
		AND identifier LIKE '%@s.whatsapp.net'
	`, r.accountID).Scan(&count)
	if err != nil {
		return 0, wrapErr("get contacts with identifier count", err)
	}
	return count, nil
}

// SyncOverview holds comprehensive sync statistics
type SyncOverview struct {
	Contacts      ContactsOverview      `json:"contacts"`
	Conversations ConversationsOverview `json:"conversations"`
	Messages      MessagesOverview      `json:"messages"`
}

type ContactsOverview struct {
	TotalChatwoot  int `json:"totalChatwoot"`
	WhatsAppSynced int `json:"whatsAppSynced"`
	Groups         int `json:"groups"`
	Private        int `json:"private"`
	WithName       int `json:"withName"`
	WithoutName    int `json:"withoutName"`
}

type ConversationsOverview struct {
	Total        int `json:"total"`
	Open         int `json:"open"`
	Resolved     int `json:"resolved"`
	Pending      int `json:"pending"`
	GroupChats   int `json:"groupChats"`
	PrivateChats int `json:"privateChats"`
}

type MessagesOverview struct {
	Total    int `json:"total"`
	Incoming int `json:"incoming"`
	Outgoing int `json:"outgoing"`
}

// GetSyncOverview returns comprehensive sync statistics
func (r *Repository) GetSyncOverview(ctx context.Context) (*SyncOverview, error) {
	overview := &SyncOverview{}

	// Contacts - detailed breakdown
	if err := r.db.QueryRowContext(ctx, `
		SELECT 
			COUNT(*),
			COUNT(*) FILTER (WHERE identifier LIKE '%@s.whatsapp.net'),
			COUNT(*) FILTER (WHERE identifier LIKE '%@g.us'),
			COUNT(*) FILTER (WHERE identifier LIKE '%@s.whatsapp.net' AND name IS NOT NULL AND name != '' AND name != phone_number AND name != REPLACE(phone_number, '+', '')),
			COUNT(*) FILTER (WHERE identifier LIKE '%@s.whatsapp.net' AND (name IS NULL OR name = '' OR name = phone_number OR name = REPLACE(phone_number, '+', '')))
		FROM contacts 
		WHERE account_id = $1
		AND identifier IS NOT NULL 
		AND identifier != ''
	`, r.accountID).Scan(
		&overview.Contacts.TotalChatwoot,
		&overview.Contacts.Private,
		&overview.Contacts.Groups,
		&overview.Contacts.WithName,
		&overview.Contacts.WithoutName,
	); err != nil {
		return nil, wrapErr("get contacts stats", err)
	}
	overview.Contacts.WhatsAppSynced = overview.Contacts.Private + overview.Contacts.Groups

	// Conversations by status and type
	if r.inboxID > 0 {
		if err := r.db.QueryRowContext(ctx, `
			SELECT 
				COUNT(*),
				COUNT(*) FILTER (WHERE status = 0),
				COUNT(*) FILTER (WHERE status = 1),
				COUNT(*) FILTER (WHERE status = 2),
				COUNT(*) FILTER (WHERE contact_id IN (SELECT id FROM contacts WHERE identifier LIKE '%@g.us')),
				COUNT(*) FILTER (WHERE contact_id IN (SELECT id FROM contacts WHERE identifier LIKE '%@s.whatsapp.net'))
			FROM conversations 
			WHERE account_id = $1 AND inbox_id = $2
		`, r.accountID, r.inboxID).Scan(
			&overview.Conversations.Total,
			&overview.Conversations.Open,
			&overview.Conversations.Resolved,
			&overview.Conversations.Pending,
			&overview.Conversations.GroupChats,
			&overview.Conversations.PrivateChats,
		); err != nil {
			return nil, wrapErr("get conversations stats", err)
		}

		// Messages
		if err := r.db.QueryRowContext(ctx, `
			SELECT 
				COUNT(*),
				COUNT(*) FILTER (WHERE message_type = 0),
				COUNT(*) FILTER (WHERE message_type = 1)
			FROM messages 
			WHERE account_id = $1 
			AND conversation_id IN (SELECT id FROM conversations WHERE inbox_id = $2)
		`, r.accountID, r.inboxID).Scan(
			&overview.Messages.Total,
			&overview.Messages.Incoming,
			&overview.Messages.Outgoing,
		); err != nil {
			return nil, wrapErr("get messages stats", err)
		}
	} else {
		if err := r.db.QueryRowContext(ctx, `
			SELECT 
				COUNT(*),
				COUNT(*) FILTER (WHERE status = 0),
				COUNT(*) FILTER (WHERE status = 1),
				COUNT(*) FILTER (WHERE status = 2),
				COUNT(*) FILTER (WHERE contact_id IN (SELECT id FROM contacts WHERE identifier LIKE '%@g.us')),
				COUNT(*) FILTER (WHERE contact_id IN (SELECT id FROM contacts WHERE identifier LIKE '%@s.whatsapp.net'))
			FROM conversations 
			WHERE account_id = $1
		`, r.accountID).Scan(
			&overview.Conversations.Total,
			&overview.Conversations.Open,
			&overview.Conversations.Resolved,
			&overview.Conversations.Pending,
			&overview.Conversations.GroupChats,
			&overview.Conversations.PrivateChats,
		); err != nil {
			return nil, wrapErr("get conversations stats", err)
		}

		if err := r.db.QueryRowContext(ctx, `
			SELECT 
				COUNT(*),
				COUNT(*) FILTER (WHERE message_type = 0),
				COUNT(*) FILTER (WHERE message_type = 1)
			FROM messages 
			WHERE account_id = $1
		`, r.accountID).Scan(
			&overview.Messages.Total,
			&overview.Messages.Incoming,
			&overview.Messages.Outgoing,
		); err != nil {
			return nil, wrapErr("get messages stats", err)
		}
	}

	return overview, nil
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
	values1 := make([]string, 0, len(phoneData))
	values2 := make([]string, 0, len(phoneData))
	args1 := make([]interface{}, 1, 1+len(phoneData)*4)
	args1[0] = r.accountID
	args2 := make([]interface{}, 2, 2+len(phoneData)*3)
	args2[0] = r.accountID
	args2[1] = r.inboxID

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
	// Step 1: Update identifier for existing contacts matched by phone_number (non-groups only)
	// This prevents creating duplicate contacts when identifier differs but phone is the same
	updateQuery := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT phone_number, identifier, is_group FROM (
				VALUES %s
			) AS t (phone_number, created_at, last_activity_at, contact_name, identifier, is_group)
		)
		UPDATE contacts c
		SET identifier = p.identifier, updated_at = NOW()
		FROM phone_data p
		WHERE c.account_id = $1
			AND NOT p.is_group
			AND c.phone_number = p.phone_number
			AND (c.identifier IS NULL OR c.identifier = '' OR c.identifier != p.identifier)
	`, strings.Join(values, ", "))

	_, _ = r.db.ExecContext(ctx, updateQuery, args...)

	// Step 2: Now do the upsert - existing contacts will match by identifier
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
	// Only create contact_inbox if none exists for that contact+inbox combination
	query := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT identifier FROM (VALUES %s) AS t (phone_number, created_at, last_activity_at, contact_name, identifier)
		),
		contacts_needing_inbox AS (
			SELECT c.id as contact_id
			FROM contacts c
			WHERE c.account_id = $1::integer 
				AND c.identifier IN (SELECT identifier FROM phone_data)
				AND NOT EXISTS (
					SELECT 1 FROM contact_inboxes ci 
					WHERE ci.contact_id = c.id AND ci.inbox_id = $2::integer
				)
		)
		INSERT INTO contact_inboxes (contact_id, inbox_id, source_id, created_at, updated_at)
		SELECT contact_id, $2::integer, gen_random_uuid(), NOW(), NOW()
		FROM contacts_needing_inbox
		ON CONFLICT DO NOTHING
	`, strings.Join(values, ", "))

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return wrapErr("create contact_inboxes", err)
	}
	return nil
}

func (r *Repository) createConversations(ctx context.Context, values []string, args []interface{}) error {
	// Only create conversation if none exists for that contact in that inbox
	// This checks by contact_id + inbox_id, NOT just contact_inbox_id
	// Status: 0=open, 1=resolved
	status := 0
	if r.importAsResolved {
		status = 1
	}
	query := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT identifier FROM (VALUES %s) AS t (phone_number, created_at, last_activity_at, contact_name, identifier)
		),
		contacts_needing_conv AS (
			SELECT DISTINCT ON (c.id) c.id as contact_id, ci.id as contact_inbox_id
			FROM contacts c
			JOIN contact_inboxes ci ON ci.contact_id = c.id AND ci.inbox_id = $2::integer
			WHERE c.account_id = $1::integer 
				AND c.identifier IN (SELECT identifier FROM phone_data)
				AND NOT EXISTS (
					SELECT 1 FROM conversations conv 
					WHERE conv.contact_id = c.id AND conv.inbox_id = $2::integer
				)
			ORDER BY c.id, ci.created_at ASC
		)
		INSERT INTO conversations (account_id, inbox_id, status, contact_id, contact_inbox_id, uuid, last_activity_at, created_at, updated_at)
		SELECT $1::integer, $2::integer, %d, contact_id, contact_inbox_id, gen_random_uuid(), NOW(), NOW(), NOW()
		FROM contacts_needing_conv
		ON CONFLICT DO NOTHING
	`, strings.Join(values, ", "), status)

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return wrapErr("create conversations", err)
	}
	return nil
}

func (r *Repository) queryFKs(ctx context.Context, values []string, args []interface{}) (map[string]*core.ChatFKs, error) {
	result := make(map[string]*core.ChatFKs)

	// Query existing conversations by contact_id + inbox_id
	// If multiple conversations exist, prefer the one with most messages (or oldest)
	query := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT phone_number, identifier FROM (VALUES %s) AS t (phone_number, created_at, last_activity_at, contact_name, identifier)
		),
		contact_convs AS (
			SELECT DISTINCT ON (c.id) 
				pd.phone_number,
				c.id AS contact_id, 
				conv.id AS conversation_id
			FROM phone_data pd
			JOIN contacts c ON c.identifier = pd.identifier AND c.account_id = $1::integer
			JOIN conversations conv ON conv.contact_id = c.id AND conv.inbox_id = $2::integer
			ORDER BY c.id, conv.created_at ASC
		)
		SELECT phone_number, contact_id, conversation_id FROM contact_convs
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
	Content             string
	ConversationID      int
	MessageType         int
	SenderType          string
	SenderID            int
	SourceID            string
	Timestamp           time.Time
	InReplyToExternalID string
}

// InsertMessagesBatch inserts multiple messages in a single query (bulk INSERT)
// Note: Chatwoot's messages table doesn't have a UNIQUE constraint on source_id,
// so we filter duplicates beforehand using GetExistingSourceIDs
func (r *Repository) InsertMessagesBatch(ctx context.Context, messages []MessageInsertData) (int, error) {
	if len(messages) == 0 {
		return 0, nil
	}

	values := make([]string, 0, len(messages))
	args := make([]interface{}, 2, 2+len(messages)*7)
	args[0] = r.accountID
	args[1] = r.inboxID

	for _, msg := range messages {
		idx := len(args) + 1
		args = append(args, msg.Content, msg.ConversationID, msg.MessageType, msg.SenderType, msg.SenderID, msg.SourceID, msg.Timestamp)
		values = append(values, fmt.Sprintf("($%d, $%d, $1, $2, $%d, $%d, FALSE, 0, $%d, $%d, $%d, $%d, $%d, NULL, NULL)",
			idx, idx, idx+1, idx+2, idx+3, idx+4, idx+5, idx+6, idx+6))
	}

	query := fmt.Sprintf(`
		INSERT INTO messages (content, processed_message_content, account_id, inbox_id, conversation_id, 
			message_type, private, content_type, sender_type, sender_id, source_id, created_at, updated_at,
			content_attributes, external_source_ids)
		VALUES %s
	`, strings.Join(values, ", "))

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, wrapErr("insert messages batch", err)
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// GetInsertedMessageIDs returns a map of source_id -> chatwoot_id for the given source IDs
func (r *Repository) GetInsertedMessageIDs(ctx context.Context, sourceIDs []string) (map[string]int, error) {
	if len(sourceIDs) == 0 {
		return nil, nil
	}

	// Build placeholders for IN clause
	placeholders := make([]string, len(sourceIDs))
	args := make([]interface{}, len(sourceIDs)+1)
	args[0] = r.inboxID
	for i, sid := range sourceIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+2)
		args[i+1] = sid
	}

	query := fmt.Sprintf(`
		SELECT id, source_id FROM messages 
		WHERE inbox_id = $1 AND source_id IN (%s)
	`, strings.Join(placeholders, ", "))

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, wrapErr("get inserted message IDs", err)
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var id int
		var sourceID string
		if err := rows.Scan(&id, &sourceID); err != nil {
			continue
		}
		result[sourceID] = id
	}
	return result, rows.Err()
}

// ResolveQuotedMessages updates content_attributes for messages with quoted references
// It resolves in_reply_to_external_id to find the actual message ID
func (r *Repository) ResolveQuotedMessages(ctx context.Context, quotedRefs map[string]string) (int, error) {
	if len(quotedRefs) == 0 {
		return 0, nil
	}

	// quotedRefs is map[source_id]quoted_source_id
	// We need to update messages where source_id matches and set content_attributes
	// with both in_reply_to (resolved message.id) and in_reply_to_external_id

	var totalUpdated int
	for sourceID, quotedSourceID := range quotedRefs {
		// Find the quoted message ID
		var quotedMsgID int
		err := r.db.QueryRowContext(ctx,
			`SELECT id FROM messages WHERE source_id = $1 AND inbox_id = $2 LIMIT 1`,
			quotedSourceID, r.inboxID).Scan(&quotedMsgID)
		if err != nil {
			// Quoted message not found, skip
			continue
		}

		// Update the message with resolved content_attributes
		// Chatwoot stores content_attributes as a JSON string (not object), so we need to double-encode
		innerJSON := fmt.Sprintf(`{"in_reply_to":%d,"in_reply_to_external_id":null}`, quotedMsgID)
		result, err := r.db.ExecContext(ctx,
			`UPDATE messages SET content_attributes = to_json($1::text) WHERE source_id = $2 AND inbox_id = $3`,
			innerJSON, sourceID, r.inboxID)
		if err != nil {
			continue
		}
		affected, _ := result.RowsAffected()
		totalUpdated += int(affected)
	}

	return totalUpdated, nil
}

// UpdateConversationTimestampsBatch updates timestamps for multiple conversations in a single query
func (r *Repository) UpdateConversationTimestampsBatch(ctx context.Context, timestamps map[int]time.Time) error {
	if len(timestamps) == 0 {
		return nil
	}

	values := make([]string, 0, len(timestamps))
	args := make([]interface{}, 0, len(timestamps)*2)

	for convID, ts := range timestamps {
		idx := len(args) + 1
		args = append(args, convID, ts)
		values = append(values, fmt.Sprintf("($%d::integer, $%d::timestamp)", idx, idx+1))
	}

	query := fmt.Sprintf(`
		UPDATE conversations c
		SET last_activity_at = v.ts, updated_at = v.ts
		FROM (VALUES %s) AS v(id, ts)
		WHERE c.id = v.id AND (c.last_activity_at IS NULL OR c.last_activity_at < v.ts)
	`, strings.Join(values, ", "))

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return wrapErr("update conversation timestamps batch", err)
	}
	return nil
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

// TouchInboxConversations updates updated_at on all inbox conversations to invalidate Chatwoot cache
func (r *Repository) TouchInboxConversations(ctx context.Context) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE conversations SET updated_at = NOW() WHERE inbox_id = $1`,
		r.inboxID)
	if err != nil {
		return wrapErr("touch inbox conversations", err)
	}
	return nil
}

// UpdateConversationTimestamps updates timestamps for multiple conversations (best-effort)
func (r *Repository) UpdateConversationTimestamps(ctx context.Context, timestamps map[int]time.Time) {
	for convID, ts := range timestamps {
		_ = r.UpdateConversationTimestamp(ctx, convID, ts)
	}
}

// FixConversationCreatedAt updates conversation and contact_inbox created_at to match oldest message
// This is needed because Chatwoot UI ignores messages with created_at before conversation/contact_inbox creation
// Uses CTE for better performance (avoids correlated subquery per row)
func (r *Repository) FixConversationCreatedAt(ctx context.Context) (int, error) {
	// Fix conversations using CTE (more efficient than correlated subquery)
	result, err := r.db.ExecContext(ctx, `
		WITH oldest_messages AS (
			SELECT m.conversation_id, MIN(m.created_at) as oldest_at
			FROM messages m
			JOIN conversations c ON c.id = m.conversation_id
			WHERE c.account_id = $1 AND c.inbox_id = $2
			GROUP BY m.conversation_id
		)
		UPDATE conversations c
		SET created_at = om.oldest_at
		FROM oldest_messages om
		WHERE c.id = om.conversation_id
			AND c.account_id = $1
			AND c.inbox_id = $2
			AND om.oldest_at < c.created_at
	`, r.accountID, r.inboxID)
	if err != nil {
		return 0, wrapErr("fix conversation created_at", err)
	}
	rows, _ := result.RowsAffected()

	// Fix contact_inboxes to match conversation created_at
	_, _ = r.db.ExecContext(ctx, `
		UPDATE contact_inboxes ci
		SET created_at = c.created_at
		FROM conversations c
		WHERE c.contact_inbox_id = ci.id
			AND c.account_id = $1
			AND c.inbox_id = $2
			AND ci.created_at > c.created_at
	`, r.accountID, r.inboxID)

	return int(rows), nil
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

// ResolveAllConversations sets all open and pending conversations to resolved status
// Chatwoot status: 0=open, 1=resolved, 2=pending
func (r *Repository) ResolveAllConversations(ctx context.Context) (int, error) {
	var query string
	var args []interface{}

	if r.inboxID > 0 {
		// Resolve both open (0) and pending (2) conversations
		query = `UPDATE conversations SET status = 1, updated_at = NOW() 
			WHERE account_id = $1 AND inbox_id = $2 AND status IN (0, 2)`
		args = []interface{}{r.accountID, r.inboxID}
	} else {
		// Resolve both open (0) and pending (2) conversations from ALL inboxes
		query = `UPDATE conversations SET status = 1, updated_at = NOW() 
			WHERE account_id = $1 AND status IN (0, 2)`
		args = []interface{}{r.accountID}
	}

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, wrapErr("resolve all conversations", err)
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// GetOpenConversationsCount returns count of open conversations
func (r *Repository) GetOpenConversationsCount(ctx context.Context) (int, error) {
	var count int
	var query string
	var args []interface{}

	if r.inboxID > 0 {
		query = `SELECT COUNT(*) FROM conversations WHERE account_id = $1 AND inbox_id = $2 AND status = 0`
		args = []interface{}{r.accountID, r.inboxID}
	} else {
		query = `SELECT COUNT(*) FROM conversations WHERE account_id = $1 AND status = 0`
		args = []interface{}{r.accountID}
	}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(&count)
	if err != nil {
		return 0, wrapErr("get open conversations count", err)
	}
	return count, nil
}

// UpdateMessageTimestampsBatch updates timestamps for multiple messages in a single query
func (r *Repository) UpdateMessageTimestampsBatch(ctx context.Context, timestamps map[int]time.Time) error {
	if len(timestamps) == 0 {
		return nil
	}

	values := make([]string, 0, len(timestamps))
	args := make([]interface{}, 0, len(timestamps)*2)

	for msgID, ts := range timestamps {
		idx := len(args) + 1
		args = append(args, msgID, ts)
		values = append(values, fmt.Sprintf("($%d::integer, $%d::timestamp)", idx, idx+1))
	}

	query := fmt.Sprintf(`
		UPDATE messages m
		SET created_at = v.ts, updated_at = v.ts
		FROM (VALUES %s) AS v(id, ts)
		WHERE m.id = v.id
	`, strings.Join(values, ", "))

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return wrapErr("update message timestamps batch", err)
	}
	return nil
}

// CreateContactsAndConversationsOptimized creates contacts, contact_inboxes, and conversations
// in a single optimized transaction using CTEs
func (r *Repository) CreateContactsAndConversationsOptimized(ctx context.Context, phoneData []core.PhoneTimestamp) (map[string]*core.ChatFKs, error) {
	result := make(map[string]*core.ChatFKs)
	if len(phoneData) == 0 {
		return result, nil
	}

	// Build VALUES clause
	values := make([]string, 0, len(phoneData))
	args := make([]interface{}, 2, 2+len(phoneData)*6)
	args[0] = r.accountID
	args[1] = r.inboxID

	for _, pd := range phoneData {
		idx := len(args) + 1
		args = append(args, pd.Phone, pd.Name, pd.Identifier, pd.IsGroup, pd.FirstTS, pd.LastTS)
		values = append(values, fmt.Sprintf("($%d::text, $%d::text, $%d::text, $%d::boolean, $%d::bigint, $%d::bigint)",
			idx, idx+1, idx+2, idx+3, idx+4, idx+5))
	}

	status := 0
	if r.importAsResolved {
		status = 1
	}

	// Single query with CTEs for all operations
	query := fmt.Sprintf(`
		WITH phone_data AS (
			SELECT phone_number, contact_name, identifier, is_group, first_ts, last_ts 
			FROM (VALUES %s) AS t (phone_number, contact_name, identifier, is_group, first_ts, last_ts)
		),
		-- Update existing contacts by phone (non-groups) to set identifier
		updated_contacts AS (
			UPDATE contacts c
			SET identifier = p.identifier, updated_at = NOW()
			FROM phone_data p
			WHERE c.account_id = $1
				AND NOT p.is_group
				AND c.phone_number = p.phone_number
				AND (c.identifier IS NULL OR c.identifier = '' OR c.identifier != p.identifier)
			RETURNING c.id, c.identifier
		),
		-- Upsert contacts
		upserted_contacts AS (
			INSERT INTO contacts (name, phone_number, account_id, identifier, created_at, updated_at)
			SELECT 
				p.contact_name, 
				CASE WHEN p.is_group THEN NULL ELSE p.phone_number END, 
				$1, 
				p.identifier, 
				to_timestamp(p.first_ts), 
				to_timestamp(p.last_ts)
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
			RETURNING id, identifier
		),
		-- Get all contact IDs (both updated and upserted)
		all_contacts AS (
			SELECT id, identifier FROM upserted_contacts
			UNION
			SELECT id, identifier FROM contacts WHERE account_id = $1 AND identifier IN (SELECT identifier FROM phone_data)
		),
		-- Create contact_inboxes for contacts that don't have one
		new_contact_inboxes AS (
			INSERT INTO contact_inboxes (contact_id, inbox_id, source_id, created_at, updated_at)
			SELECT DISTINCT ac.id, $2::integer, gen_random_uuid(), NOW(), NOW()
			FROM all_contacts ac
			WHERE NOT EXISTS (
				SELECT 1 FROM contact_inboxes ci 
				WHERE ci.contact_id = ac.id AND ci.inbox_id = $2::integer
			)
			ON CONFLICT DO NOTHING
			RETURNING id, contact_id
		),
		-- Get all contact_inbox IDs
		all_contact_inboxes AS (
			SELECT ci.id, ci.contact_id
			FROM contact_inboxes ci
			JOIN all_contacts ac ON ac.id = ci.contact_id
			WHERE ci.inbox_id = $2::integer
		),
		-- Create conversations for contacts that don't have one
		new_conversations AS (
			INSERT INTO conversations (account_id, inbox_id, status, contact_id, contact_inbox_id, uuid, last_activity_at, created_at, updated_at)
			SELECT DISTINCT ON (aci.contact_id) 
				$1::integer, $2::integer, %d, aci.contact_id, aci.id, gen_random_uuid(), NOW(), NOW(), NOW()
			FROM all_contact_inboxes aci
			WHERE NOT EXISTS (
				SELECT 1 FROM conversations conv 
				WHERE conv.contact_id = aci.contact_id AND conv.inbox_id = $2::integer
			)
			ORDER BY aci.contact_id, aci.id ASC
			ON CONFLICT DO NOTHING
			RETURNING id, contact_id
		)
		-- Return final mapping: phone -> contact_id, conversation_id
		SELECT DISTINCT ON (c.id) 
			pd.phone_number,
			c.id AS contact_id, 
			conv.id AS conversation_id
		FROM phone_data pd
		JOIN contacts c ON c.identifier = pd.identifier AND c.account_id = $1::integer
		JOIN conversations conv ON conv.contact_id = c.id AND conv.inbox_id = $2::integer
		ORDER BY c.id, conv.created_at ASC
	`, strings.Join(values, ", "), status)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, wrapErr("create contacts and conversations optimized", err)
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
