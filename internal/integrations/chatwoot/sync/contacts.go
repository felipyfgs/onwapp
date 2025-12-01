package sync

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/integrations/chatwoot/util"
	"zpwoot/internal/logger"
)

// ContactSyncer handles contact synchronization
type ContactSyncer struct {
	repo           *Repository
	contactsGetter ContactsGetter
	zpPool         *pgxpool.Pool
	sessionID      string
}

// NewContactSyncer creates a new contact syncer
func NewContactSyncer(repo *Repository, contactsGetter ContactsGetter, zpPool *pgxpool.Pool, sessionID string) *ContactSyncer {
	return &ContactSyncer{
		repo:           repo,
		contactsGetter: contactsGetter,
		zpPool:         zpPool,
		sessionID:      sessionID,
	}
}

// Sync synchronizes contacts to Chatwoot
func (s *ContactSyncer) Sync(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	stats := &core.SyncStats{}

	logger.Debug().Str("sessionId", s.sessionID).Msg("Chatwoot sync: starting contacts")

	if s.contactsGetter == nil {
		return stats, ErrContactsGetterNil
	}

	contacts, err := s.contactsGetter.GetAllContacts(ctx)
	if err != nil {
		return stats, wrapErr("get whatsapp contacts", err)
	}

	validContacts := s.filterValidContacts(ctx, contacts, stats)
	if len(validContacts) == 0 {
		logger.Debug().Msg("Chatwoot sync: no valid contacts to sync")
		return stats, nil
	}

	logger.Debug().Int("contacts", len(validContacts)).Msg("Chatwoot sync: contacts filtered")

	if err := s.insertContactsInBatches(ctx, validContacts, stats); err != nil {
		return stats, err
	}

	logger.Info().Int("imported", stats.ContactsImported).Msg("Chatwoot sync: contacts completed")
	return stats, nil
}

// filterValidContacts filters out invalid contacts
func (s *ContactSyncer) filterValidContacts(ctx context.Context, contacts []core.WhatsAppContact, stats *core.SyncStats) []core.WhatsAppContact {
	valid := make([]core.WhatsAppContact, 0, len(contacts)/2)

	for _, c := range contacts {
		if s.shouldSkipContact(c.JID) {
			stats.ContactsSkipped++
			continue
		}

		// Handle LID JIDs - try to resolve to phone number
		if util.IsLIDJID(c.JID) {
			phone := util.ResolveLIDToPhone(ctx, s.zpPool, c.JID)
			if phone == "" {
				stats.ContactsSkipped++
				continue
			}
			c.JID = phone + "@s.whatsapp.net"
		}

		if util.ExtractPhoneFromJID(c.JID) == "" {
			stats.ContactsSkipped++
			continue
		}

		valid = append(valid, c)
	}
	return valid
}

// shouldSkipContact checks if a contact should be skipped
func (s *ContactSyncer) shouldSkipContact(jid string) bool {
	return util.IsGroupJID(jid) || util.IsStatusBroadcast(jid) || util.IsNewsletter(jid)
}

// insertContactsInBatches inserts contacts in batches
func (s *ContactSyncer) insertContactsInBatches(ctx context.Context, contacts []core.WhatsAppContact, stats *core.SyncStats) error {
	for i := 0; i < len(contacts); i += core.ContactBatchSize {
		end := min(i+core.ContactBatchSize, len(contacts))
		batch := contacts[i:end]

		insertData := s.prepareContactsForInsert(batch)
		imported, err := s.repo.UpsertContactsBatch(ctx, insertData)
		if err != nil {
			logger.Warn().Err(err).Int("batchStart", i).Msg("Chatwoot sync: batch insert failed")
			stats.ContactsErrors += len(batch)
		} else {
			stats.ContactsImported += imported
		}

		UpdateSyncStats(s.sessionID, stats)
	}
	return nil
}

// prepareContactsForInsert prepares contacts for database insertion
func (s *ContactSyncer) prepareContactsForInsert(contacts []core.WhatsAppContact) []ContactInsertData {
	data := make([]ContactInsertData, 0, len(contacts))

	for _, c := range contacts {
		phone := util.ExtractPhoneFromJID(c.JID)
		name := util.GetBestContactName(&core.ContactNameInfo{
			FullName:     c.FullName,
			FirstName:    c.FirstName,
			PushName:     c.PushName,
			BusinessName: c.BusinessName,
		}, phone)

		data = append(data, ContactInsertData{
			Name:       name,
			Phone:      "+" + phone,
			Identifier: c.JID,
		})
	}
	return data
}

// LoadWhatsAppContactsCache loads all WhatsApp contacts into a cache map
func (s *ContactSyncer) LoadWhatsAppContactsCache(ctx context.Context) map[string]*core.ContactNameInfo {
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
