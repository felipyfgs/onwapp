package service

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"onwapp/internal/integrations/chatwoot/client"
	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/integrations/chatwoot/util"
	"onwapp/internal/logger"
)

type ProfilePictureFetcher func(ctx context.Context, sessionId string, jid string) (string, error)

type GroupInfoFetcher func(ctx context.Context, sessionId string, groupJid string) (string, error)

type ContactNameFetcher func(ctx context.Context, jid string) string

type ContactManager struct {
	conversationCache sync.Map
	conversationLocks sync.Map
	cacheTTL          time.Duration
}

func NewContactManager() *ContactManager {
	return &ContactManager{
		cacheTTL: 8 * time.Hour,
	}
}

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
	getContactName ContactNameFetcher,
	sessionId string,
) (int, error) {
	isGroup := strings.HasSuffix(remoteJid, "@g.us")
	cacheKey := fmt.Sprintf("%s:%s", cfg.SessionID, remoteJid)

	var contactID int
	var needsContactLookup bool = true
	var usedCache bool = false

	if entry, ok := cm.conversationCache.Load(cacheKey); ok {
		cached := entry.(core.ContactCacheEntry)
		if time.Now().Before(cached.ExpiresAt) {
			contactID = cached.ContactID
			needsContactLookup = false
			usedCache = true
		} else {
			cm.conversationCache.Delete(cacheKey)
		}
	}

	if needsContactLookup {
		lockKey := fmt.Sprintf("lock:%s", cacheKey)
		if _, loaded := cm.conversationLocks.LoadOrStore(lockKey, true); loaded {
			for i := 0; i < 50; i++ {
				time.Sleep(100 * time.Millisecond)
				if entry, ok := cm.conversationCache.Load(cacheKey); ok {
					cached := entry.(core.ContactCacheEntry)
					if time.Now().Before(cached.ExpiresAt) {
						contactID = cached.ContactID
						needsContactLookup = false
						usedCache = true
						break
					}
				}
			}
			if needsContactLookup {
				return 0, core.ErrConversationTimeout
			}
		} else {
			defer cm.conversationLocks.Delete(lockKey)

			if entry, ok := cm.conversationCache.Load(cacheKey); ok {
				cached := entry.(core.ContactCacheEntry)
				if time.Now().Before(cached.ExpiresAt) {
					contactID = cached.ContactID
					needsContactLookup = false
					usedCache = true
				}
			}
		}
	}

	if needsContactLookup {
		phoneNumber := util.ExtractPhoneFromJID(remoteJid)

		var contact *core.Contact
		var err error

		if isGroup {
			groupName := fmt.Sprintf("%s (GROUP)", phoneNumber)

			if getGroupInfo != nil {
				if name, groupErr := getGroupInfo(ctx, sessionId, remoteJid); groupErr == nil && name != "" {
					groupName = fmt.Sprintf("%s (GROUP)", name)
					logger.Chatwoot().Debug().
						Str("groupJid", remoteJid).
						Str("groupName", name).
						Msg("Chatwoot: got group name from WhatsApp")
				} else if groupErr != nil {
					logger.Chatwoot().Debug().
						Err(groupErr).
						Str("groupJid", remoteJid).
						Msg("Chatwoot: failed to get group name, using fallback")
				}
			}

			var avatarURL string
			if getProfilePicture != nil {
				if pic, picErr := getProfilePicture(ctx, sessionId, remoteJid); picErr == nil && pic != "" {
					avatarURL = pic
				}
			}

			contact, err = cm.getOrCreateGroupContact(ctx, c, cfg, remoteJid, groupName, avatarURL)
		} else {
			contactName := ""
			if getContactName != nil {
				contactName = getContactName(ctx, remoteJid)
			}
			if contactName == "" && pushName != "" {
				contactName = pushName
			}
			if contactName == "" {
				contactName = phoneNumber
			}

			var avatarURL string
			if getProfilePicture != nil && !isFromMe {
				if pic, picErr := getProfilePicture(ctx, sessionId, phoneNumber); picErr == nil && pic != "" {
					avatarURL = pic
				}
			}

			contact, err = cm.getOrCreateIndividualContact(ctx, c, cfg, phoneNumber, remoteJid, contactName, avatarURL)
		}

		if err != nil {
			return 0, fmt.Errorf("failed to get/create contact: %w", err)
		}

		contactID = contact.ID

		cm.conversationCache.Store(cacheKey, core.ContactCacheEntry{
			ContactID: contactID,
			ExpiresAt: time.Now().Add(cm.cacheTTL),
		})
	}

	if usedCache && !isGroup && !isFromMe {
		bestName := ""
		if getContactName != nil {
			bestName = getContactName(ctx, remoteJid)
		}
		if bestName == "" && pushName != "" {
			bestName = pushName
		}
		if bestName != "" {
			go cm.maybeUpdateContactName(context.Background(), c, contactID, bestName)
		}
	}

	status := "open"
	if cfg.StartPending {
		status = "pending"
	}

	conv, err := c.GetOrCreateConversation(ctx, contactID, cfg.InboxID, status, cfg.AutoReopen)
	if err != nil {
		if usedCache && core.IsNotFoundError(err) {
			logger.Chatwoot().Info().
				Str("cacheKey", cacheKey).
				Int("contactId", contactID).
				Msg("Chatwoot: cached contact not found (404), invalidating cache and recreating")

			cm.conversationCache.Delete(cacheKey)

			return cm.GetOrCreateContactAndConversation(
				ctx, c, cfg, remoteJid, pushName, isFromMe,
				participantJid, getProfilePicture, getGroupInfo, getContactName, sessionId,
			)
		}
		return 0, fmt.Errorf("failed to get/create conversation: %w", err)
	}

	return conv.ID, nil
}

func (cm *ContactManager) maybeUpdateContactName(ctx context.Context, c *client.Client, contactID int, pushName string) {
	contact, err := c.GetContact(ctx, contactID)
	if err != nil {
		if core.IsNotFoundError(err) {
			logger.Chatwoot().Debug().Int("contactId", contactID).Msg("Chatwoot: contact not found (404), skipping name update")
			return
		}
		logger.Chatwoot().Debug().Err(err).Int("contactId", contactID).Msg("Chatwoot: failed to get contact for name update")
		return
	}

	if contact != nil && pushName != "" && contact.Name != pushName {
		currentName := contact.Name
		isPhoneNumber := strings.HasPrefix(currentName, "+") ||
			(len(currentName) > 8 && isNumeric(currentName))

		if isPhoneNumber {
			if _, err := c.UpdateContact(ctx, contactID, map[string]interface{}{
				"name": pushName,
			}); err != nil {
				logger.Chatwoot().Debug().Err(err).Int("contactId", contactID).Msg("Chatwoot: failed to update contact name")
			} else {
				logger.Chatwoot().Info().
					Int("contactId", contactID).
					Str("oldName", currentName).
					Str("newName", pushName).
					Msg("Chatwoot: updated contact name from pushName")
			}
		}
	}
}

func isNumeric(s string) bool {
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

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
			logger.Chatwoot().Warn().Err(err).
				Int("contactId", contact.ID).
				Msg("Chatwoot: failed to update contact")
		}
	}

	return contact, nil
}

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
			logger.Chatwoot().Warn().Err(err).
				Int("contactId", contact.ID).
				Msg("Chatwoot: failed to update group name")
		}
	}

	return contact, nil
}

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

func (cm *ContactManager) InvalidateCache(sessionID, remoteJid string) {
	cacheKey := fmt.Sprintf("%s:%s", sessionID, remoteJid)
	cm.conversationCache.Delete(cacheKey)
}
