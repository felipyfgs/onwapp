package service

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"zpwoot/internal/integrations/chatwoot/client"
	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/integrations/chatwoot/util"
	"zpwoot/internal/logger"
)

// ProfilePictureFetcher is a function type for getting profile pictures from WhatsApp
type ProfilePictureFetcher func(ctx context.Context, sessionName string, jid string) (string, error)

// GroupInfoFetcher is a function type for getting group metadata from WhatsApp
type GroupInfoFetcher func(ctx context.Context, sessionName string, groupJid string) (string, error)

// ContactManager handles contact and conversation management with caching
type ContactManager struct {
	conversationCache sync.Map // map[cacheKey]conversationID
	conversationLocks sync.Map // map[lockKey]bool
	cacheTTL          time.Duration
}

// NewContactManager creates a new contact manager
func NewContactManager() *ContactManager {
	return &ContactManager{
		cacheTTL: 8 * time.Hour,
	}
}

// GetOrCreateContactAndConversation handles contact and conversation creation with proper caching
// Note: We cache ContactID (not ConversationID) to ensure autoReopen is always checked
func (cm *ContactManager) GetOrCreateContactAndConversation(
	ctx context.Context,
	c *client.Client,
	cfg *core.Config,
	remoteJid string,
	pushName string,
	isFromMe bool,
	participantJid string,
	getProfilePicture ProfilePictureFetcher,
	getGroupInfo GroupInfoFetcher,
	sessionName string,
) (int, error) {
	isGroup := strings.HasSuffix(remoteJid, "@g.us")
	cacheKey := fmt.Sprintf("%s:%s", cfg.SessionID, remoteJid)

	var contactID int
	var needsContactLookup bool = true

	// Check cache for contactID (not conversationID)
	if entry, ok := cm.conversationCache.Load(cacheKey); ok {
		cached := entry.(core.ContactCacheEntry)
		if time.Now().Before(cached.ExpiresAt) {
			contactID = cached.ContactID
			needsContactLookup = false
		} else {
			cm.conversationCache.Delete(cacheKey)
		}
	}

	// If we need to look up contact, use locking to prevent duplicate creation
	if needsContactLookup {
		lockKey := fmt.Sprintf("lock:%s", cacheKey)
		if _, loaded := cm.conversationLocks.LoadOrStore(lockKey, true); loaded {
			// Another goroutine is creating the contact, wait for it
			for i := 0; i < 50; i++ {
				time.Sleep(100 * time.Millisecond)
				if entry, ok := cm.conversationCache.Load(cacheKey); ok {
					cached := entry.(core.ContactCacheEntry)
					if time.Now().Before(cached.ExpiresAt) {
						contactID = cached.ContactID
						needsContactLookup = false
						break
					}
				}
			}
			if needsContactLookup {
				return 0, core.ErrConversationTimeout
			}
		} else {
			defer cm.conversationLocks.Delete(lockKey)

			// Double-check cache after acquiring lock
			if entry, ok := cm.conversationCache.Load(cacheKey); ok {
				cached := entry.(core.ContactCacheEntry)
				if time.Now().Before(cached.ExpiresAt) {
					contactID = cached.ContactID
					needsContactLookup = false
				}
			}
		}
	}

	// Create/get contact if not cached
	if needsContactLookup {
		phoneNumber := util.ExtractPhoneFromJID(remoteJid)

		var contact *core.Contact
		var err error

		if isGroup {
			groupName := fmt.Sprintf("%s (GROUP)", phoneNumber)

			if getGroupInfo != nil {
				if name, err := getGroupInfo(ctx, sessionName, remoteJid); err == nil && name != "" {
					groupName = fmt.Sprintf("%s (GROUP)", name)
					logger.Debug().
						Str("groupJid", remoteJid).
						Str("groupName", name).
						Msg("Chatwoot: got group name from WhatsApp")
				} else if err != nil {
					logger.Debug().
						Err(err).
						Str("groupJid", remoteJid).
						Msg("Chatwoot: failed to get group name, using fallback")
				}
			}

			var avatarURL string
			if getProfilePicture != nil {
				if pic, err := getProfilePicture(ctx, sessionName, remoteJid); err == nil && pic != "" {
					avatarURL = pic
				}
			}

			contact, err = cm.getOrCreateGroupContact(ctx, c, cfg, remoteJid, groupName, avatarURL)
		} else {
			contactName := pushName
			if contactName == "" {
				contactName = phoneNumber
			}

			var avatarURL string
			if getProfilePicture != nil && !isFromMe {
				if pic, err := getProfilePicture(ctx, sessionName, phoneNumber); err == nil && pic != "" {
					avatarURL = pic
				}
			}

			contact, err = cm.getOrCreateIndividualContact(ctx, c, cfg, phoneNumber, remoteJid, contactName, avatarURL)
		}

		if err != nil {
			return 0, fmt.Errorf("failed to get/create contact: %w", err)
		}

		contactID = contact.ID

		// Cache the contactID (not conversationID)
		cm.conversationCache.Store(cacheKey, core.ContactCacheEntry{
			ContactID: contactID,
			ExpiresAt: time.Now().Add(cm.cacheTTL),
		})
	}

	// ALWAYS call GetOrCreateConversation to check status and autoReopen if needed
	status := "open"
	if cfg.StartPending {
		status = "pending"
	}

	conv, err := c.GetOrCreateConversation(ctx, contactID, cfg.InboxID, status, cfg.AutoReopen)
	if err != nil {
		return 0, fmt.Errorf("failed to get/create conversation: %w", err)
	}

	return conv.ID, nil
}

// getOrCreateIndividualContact handles individual (non-group) contacts
func (cm *ContactManager) getOrCreateIndividualContact(
	ctx context.Context,
	c *client.Client,
	cfg *core.Config,
	phoneNumber string,
	remoteJid string,
	name string,
	avatarURL string,
) (*core.Contact, error) {
	contact, err := c.GetOrCreateContactWithMerge(ctx, cfg.InboxID, phoneNumber, remoteJid, name, avatarURL, false, cfg.MergeBrPhones)
	if err != nil {
		return nil, err
	}

	needsUpdate := false
	updateData := make(map[string]interface{})

	if contact.Name == phoneNumber && name != phoneNumber && name != "" {
		updateData["name"] = name
		needsUpdate = true
	}

	if avatarURL != "" && contact.Thumbnail != avatarURL {
		updateData["avatar_url"] = avatarURL
		needsUpdate = true
	}

	if contact.Identifier != remoteJid && remoteJid != "" {
		updateData["identifier"] = remoteJid
		needsUpdate = true
	}

	if needsUpdate {
		if _, err := c.UpdateContact(ctx, contact.ID, updateData); err != nil {
			logger.Warn().Err(err).
				Int("contactId", contact.ID).
				Msg("Chatwoot: failed to update contact")
		}
	}

	return contact, nil
}

// getOrCreateGroupContact handles group contacts
func (cm *ContactManager) getOrCreateGroupContact(
	ctx context.Context,
	c *client.Client,
	cfg *core.Config,
	groupJid string,
	groupName string,
	avatarURL string,
) (*core.Contact, error) {
	contact, err := c.GetOrCreateContact(ctx, cfg.InboxID, groupJid, groupJid, groupName, avatarURL, true)
	if err != nil {
		return nil, err
	}

	if contact.Name != groupName && groupName != "" {
		if _, err := c.UpdateContact(ctx, contact.ID, map[string]interface{}{
			"name": groupName,
		}); err != nil {
			logger.Warn().Err(err).
				Int("contactId", contact.ID).
				Msg("Chatwoot: failed to update group name")
		}
	}

	return contact, nil
}

// FormatGroupMessage formats a message from a group to show participant info
func (cm *ContactManager) FormatGroupMessage(content string, participantJid string, pushName string) string {
	if participantJid == "" {
		return content
	}

	phone := util.ExtractPhoneFromJID(participantJid)
	formattedPhone := util.FormatPhoneDisplay(phone)

	var participantInfo string
	if pushName != "" && pushName != phone {
		participantInfo = fmt.Sprintf("**%s - %s:**", formattedPhone, pushName)
	} else {
		participantInfo = fmt.Sprintf("**%s:**", formattedPhone)
	}

	if content != "" {
		return fmt.Sprintf("%s\n\n%s", participantInfo, content)
	}
	return participantInfo
}

// InvalidateCache removes a conversation from cache
func (cm *ContactManager) InvalidateCache(sessionID, remoteJid string) {
	cacheKey := fmt.Sprintf("%s:%s", sessionID, remoteJid)
	cm.conversationCache.Delete(cacheKey)
}
