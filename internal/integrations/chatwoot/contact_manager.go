package chatwoot

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"zpwoot/internal/logger"
)

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

// contactCacheEntry holds cached conversation data with expiry
type contactCacheEntry struct {
	conversationID int
	expiresAt      time.Time
}

// ProfilePictureGetter is a function type for getting profile pictures from WhatsApp
// Note: This must match ProfilePictureFetcher in service.go
type ProfilePictureGetter = func(ctx context.Context, sessionName string, jid string) (string, error)

// GetOrCreateContactAndConversation handles contact and conversation creation with proper caching
// This follows the Evolution API pattern to avoid duplicate conversations
func (cm *ContactManager) GetOrCreateContactAndConversation(
	ctx context.Context,
	client *Client,
	cfg *Config,
	remoteJid string,
	pushName string,
	isFromMe bool,
	participantJid string, // For groups: the actual sender
	getProfilePicture ProfilePictureGetter,
	sessionName string,
) (int, error) {
	isGroup := strings.HasSuffix(remoteJid, "@g.us")
	cacheKey := fmt.Sprintf("%s:%s", cfg.SessionID, remoteJid)

	// Check cache first
	if entry, ok := cm.conversationCache.Load(cacheKey); ok {
		cached := entry.(contactCacheEntry)
		if time.Now().Before(cached.expiresAt) {
			logger.Debug().
				Str("remoteJid", remoteJid).
				Int("conversationId", cached.conversationID).
				Msg("Chatwoot: using cached conversation")
			return cached.conversationID, nil
		}
		// Cache expired, remove it
		cm.conversationCache.Delete(cacheKey)
	}

	// Try to acquire lock to prevent duplicate creation
	lockKey := fmt.Sprintf("lock:%s", cacheKey)
	if _, loaded := cm.conversationLocks.LoadOrStore(lockKey, true); loaded {
		// Another goroutine is creating the conversation, wait and check cache
		for i := 0; i < 50; i++ { // Wait up to 5 seconds
			time.Sleep(100 * time.Millisecond)
			if entry, ok := cm.conversationCache.Load(cacheKey); ok {
				cached := entry.(contactCacheEntry)
				if time.Now().Before(cached.expiresAt) {
					return cached.conversationID, nil
				}
			}
		}
		return 0, fmt.Errorf("timeout waiting for conversation creation")
	}
	defer cm.conversationLocks.Delete(lockKey)

	// Double-check cache after acquiring lock
	if entry, ok := cm.conversationCache.Load(cacheKey); ok {
		cached := entry.(contactCacheEntry)
		if time.Now().Before(cached.expiresAt) {
			return cached.conversationID, nil
		}
	}

	// Extract phone/identifier
	phoneNumber := strings.Split(remoteJid, "@")[0]
	contactName := pushName
	if contactName == "" {
		contactName = phoneNumber
	}

	// Get profile picture if available
	var avatarURL string
	if getProfilePicture != nil && !isFromMe {
		if pic, err := getProfilePicture(ctx, sessionName, phoneNumber); err == nil && pic != "" {
			avatarURL = pic
		}
	}

	// For groups, use the full JID as identifier and add (GROUP) suffix
	var contact *Contact
	var err error

	if isGroup {
		// For groups: use group JID as identifier, fetch group name if available
		groupName := contactName
		if groupName == phoneNumber {
			groupName = fmt.Sprintf("%s (GROUP)", phoneNumber)
		} else {
			groupName = fmt.Sprintf("%s (GROUP)", groupName)
		}

		contact, err = cm.getOrCreateGroupContact(ctx, client, cfg, remoteJid, groupName, avatarURL)
	} else {
		contact, err = cm.getOrCreateIndividualContact(ctx, client, cfg, phoneNumber, remoteJid, contactName, avatarURL)
	}

	if err != nil {
		return 0, fmt.Errorf("failed to get/create contact: %w", err)
	}

	// Get or create conversation
	status := "open"
	if cfg.ConversationPending {
		status = "pending"
	}

	conv, err := client.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, status)
	if err != nil {
		return 0, fmt.Errorf("failed to get/create conversation: %w", err)
	}

	// Cache the conversation
	cm.conversationCache.Store(cacheKey, contactCacheEntry{
		conversationID: conv.ID,
		expiresAt:      time.Now().Add(cm.cacheTTL),
	})

	logger.Debug().
		Str("remoteJid", remoteJid).
		Int("contactId", contact.ID).
		Int("conversationId", conv.ID).
		Bool("isGroup", isGroup).
		Msg("Chatwoot: created/found contact and conversation")

	return conv.ID, nil
}

// getOrCreateIndividualContact handles individual (non-group) contacts
func (cm *ContactManager) getOrCreateIndividualContact(
	ctx context.Context,
	client *Client,
	cfg *Config,
	phoneNumber string,
	remoteJid string,
	name string,
	avatarURL string,
) (*Contact, error) {
	// Try to find existing contact
	contact, err := client.GetOrCreateContact(ctx, cfg.InboxID, phoneNumber, remoteJid, name, avatarURL, false)
	if err != nil {
		return nil, err
	}

	// Check if we need to update the contact
	needsUpdate := false
	updateData := make(map[string]interface{})

	// Update name if it was just the phone number
	if contact.Name == phoneNumber && name != phoneNumber && name != "" {
		updateData["name"] = name
		needsUpdate = true
	}

	// Update avatar if we have a new one
	if avatarURL != "" && contact.Thumbnail != avatarURL {
		updateData["avatar_url"] = avatarURL
		needsUpdate = true
	}

	// Update identifier if different (for @lid addresses)
	if contact.Identifier != remoteJid && remoteJid != "" {
		updateData["identifier"] = remoteJid
		needsUpdate = true
	}

	if needsUpdate {
		if _, err := client.UpdateContact(ctx, contact.ID, updateData); err != nil {
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
	client *Client,
	cfg *Config,
	groupJid string,
	groupName string,
	avatarURL string,
) (*Contact, error) {
	// For groups, use the full JID as both phone and identifier
	contact, err := client.GetOrCreateContact(ctx, cfg.InboxID, groupJid, groupJid, groupName, avatarURL, true)
	if err != nil {
		return nil, err
	}

	// Update name if needed
	if contact.Name != groupName && groupName != "" {
		if _, err := client.UpdateContact(ctx, contact.ID, map[string]interface{}{
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

	// Extract phone number from participant JID
	phone := strings.Split(participantJid, "@")[0]
	phone = strings.Split(phone, ":")[0] // Remove device suffix

	// Format phone number for display
	formattedPhone := formatPhoneNumber(phone)

	// Build participant info
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

// formatPhoneNumber formats a phone number for display
func formatPhoneNumber(phone string) string {
	// Brazilian number format: +55 (XX) XXXXX-XXXX
	if len(phone) == 13 && strings.HasPrefix(phone, "55") {
		return fmt.Sprintf("+%s (%s) %s-%s",
			phone[0:2],  // country code
			phone[2:4],  // area code
			phone[4:9],  // first part
			phone[9:13]) // second part
	}
	if len(phone) == 12 && strings.HasPrefix(phone, "55") {
		return fmt.Sprintf("+%s (%s) %s-%s",
			phone[0:2],  // country code
			phone[2:4],  // area code
			phone[4:8],  // first part
			phone[8:12]) // second part
	}
	return fmt.Sprintf("+%s", phone)
}

// MergeBrazilianContacts handles Brazilian phone number merging (8 vs 9 digits)
func (cm *ContactManager) MergeBrazilianContacts(ctx context.Context, client *Client, contacts []*Contact) error {
	if len(contacts) != 2 {
		return nil
	}

	// Find the 13-digit (with 9) and 12-digit (without 9) numbers
	var baseContact, mergeContact *Contact
	for _, c := range contacts {
		phone := strings.TrimPrefix(c.PhoneNumber, "+")
		if len(phone) == 13 {
			baseContact = c
		} else if len(phone) == 12 {
			mergeContact = c
		}
	}

	if baseContact == nil || mergeContact == nil {
		return nil
	}

	return client.MergeContacts(ctx, baseContact.ID, mergeContact.ID)
}
