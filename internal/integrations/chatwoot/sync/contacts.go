package sync

import (
	"context"

	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/integrations/chatwoot/util"
	"onwapp/internal/logger"
)

// ContactSyncer handles contact synchronization
type ContactSyncer struct {
	repo           *Repository
	contactsGetter ContactsGetter
	lidResolver    util.LIDResolver
	sessionID      string
}

// NewContactSyncer creates a new contact syncer
func NewContactSyncer(repo *Repository, contactsGetter ContactsGetter, lidResolver util.LIDResolver, sessionID string) *ContactSyncer {
	return &ContactSyncer{
		repo:           repo,
		contactsGetter: contactsGetter,
		lidResolver:    lidResolver,
		sessionID:      sessionID,
	}
}

// Sync synchronizes contacts to Chatwoot
func (s *ContactSyncer) Sync(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	stats := &core.SyncStats{
		ContactDetails: &core.ContactSyncDetails{},
	}

	logger.Chatwoot().Debug().Str("sessionId", s.sessionID).Msg("Chatwoot sync: starting contacts")

	if s.contactsGetter == nil {
		return stats, ErrContactsGetterNil
	}

	contacts, err := s.contactsGetter.GetAllContacts(ctx)
	if err != nil {
		return stats, wrapErr("get whatsapp contacts", err)
	}

	stats.ContactDetails.TotalWhatsApp = len(contacts)

	validContacts := s.filterValidContacts(ctx, contacts, stats)
	if len(validContacts) == 0 {
		logger.Chatwoot().Debug().Msg("Chatwoot sync: no valid contacts to sync")
		return stats, nil
	}

	logger.Chatwoot().Debug().Int("contacts", len(validContacts)).Msg("Chatwoot sync: contacts filtered")

	if err := s.insertContactsInBatches(ctx, validContacts, stats); err != nil {
		return stats, err
	}

	logger.Chatwoot().Info().
		Int("imported", stats.ContactsImported).
		Int("skipped", stats.ContactsSkipped).
		Int("errors", stats.ContactsErrors).
		Msg("Chatwoot sync: contacts completed")
	return stats, nil
}

// filterValidContacts filters out invalid contacts and deduplicates by JID
// Only includes contacts that are saved in agenda (have a name) or have message history
func (s *ContactSyncer) filterValidContacts(ctx context.Context, contacts []core.WhatsAppContact, stats *core.SyncStats) []core.WhatsAppContact {
	valid := make([]core.WhatsAppContact, 0, len(contacts)/2)
	seen := make(map[string]bool)
	details := stats.ContactDetails

	for _, c := range contacts {
		// Check for groups, status, newsletters
		if util.IsGroupJID(c.JID) {
			details.Groups++
			stats.ContactsSkipped++
			continue
		}
		if util.IsStatusBroadcast(c.JID) {
			details.StatusBroadcast++
			stats.ContactsSkipped++
			continue
		}
		if util.IsNewsletter(c.JID) {
			details.Newsletters++
			stats.ContactsSkipped++
			continue
		}

		// Handle LID JIDs - try to resolve to phone number
		if util.IsLIDJID(c.JID) {
			phone := util.ResolveLIDToPhone(ctx, s.lidResolver, c.JID)
			if phone == "" {
				details.LidContacts++
				stats.ContactsSkipped++
				continue
			}
			c.JID = phone + "@s.whatsapp.net"
		}

		if util.ExtractPhoneFromJID(c.JID) == "" {
			details.InvalidPhone++
			stats.ContactsSkipped++
			continue
		}

		// Only sync contacts that are saved in agenda (have FullName or BusinessName)
		// PushName alone is not enough - it's just the name the user set on their WhatsApp
		// FullName/FirstName indicates the contact is saved in your phone's agenda
		// BusinessName indicates it's a verified business contact
		if !s.isContactSaved(c) {
			details.NotInAgenda++
			stats.ContactsSkipped++
			continue
		}

		// Deduplicate by JID (can happen after LID conversion)
		if seen[c.JID] {
			stats.ContactsSkipped++
			continue
		}
		seen[c.JID] = true

		// Track type of contact being imported
		if c.BusinessName != "" {
			details.BusinessContacts++
		} else {
			details.SavedContacts++
		}

		valid = append(valid, c)
	}
	return valid
}

// isContactSaved checks if a contact is saved in the phone's agenda
// A contact is considered "saved" if:
// - It has a FullName that is different from PushName (indicating it was saved with a custom name)
// - OR it has a FirstName (indicates explicit save with first/last name split)
// - OR it has a BusinessName (verified business account)
// PushName alone doesn't count as it's just the user's WhatsApp display name
func (s *ContactSyncer) isContactSaved(c core.WhatsAppContact) bool {
	// BusinessName always counts (verified business)
	if c.BusinessName != "" {
		return true
	}

	// FirstName indicates contact was saved with first/last name split
	if c.FirstName != "" {
		return true
	}

	// FullName must exist AND be different from PushName to count as "saved"
	// If FullName == PushName, it was likely auto-filled, not explicitly saved
	if c.FullName != "" && c.FullName != c.PushName {
		return true
	}

	return false
}

// insertContactsInBatches inserts contacts in batches with accurate stats
func (s *ContactSyncer) insertContactsInBatches(ctx context.Context, contacts []core.WhatsAppContact, stats *core.SyncStats) error {
	details := stats.ContactDetails

	for i := 0; i < len(contacts); i += core.ContactBatchSize {
		end := min(i+core.ContactBatchSize, len(contacts))
		batch := contacts[i:end]

		insertData := s.prepareContactsForInsert(batch)
		result, err := s.repo.UpsertContactsBatchDetailed(ctx, insertData)
		if err != nil {
			logger.Chatwoot().Warn().Err(err).Int("batchStart", i).Msg("Chatwoot sync: batch insert failed")
			stats.ContactsErrors += len(batch)
		} else {
			stats.ContactsImported += result.Inserted
			// Track already existing contacts
			alreadyExisted := result.Skipped + result.Updated
			stats.ContactsSkipped += alreadyExisted
			details.AlreadyExists += alreadyExisted
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
