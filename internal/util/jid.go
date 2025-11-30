package util

import (
	"strings"

	"go.mau.fi/whatsmeow/types"
)

// ParsePhoneJID parses a phone number and returns a WhatsApp JID
func ParsePhoneJID(phone string) (types.JID, error) {
	if len(phone) > 0 && phone[0] == '+' {
		phone = phone[1:]
	}
	return types.ParseJID(phone + "@s.whatsapp.net")
}

// ParseGroupJID parses a group ID and returns a WhatsApp group JID
func ParseGroupJID(groupID string) (types.JID, error) {
	if strings.HasSuffix(groupID, "@g.us") {
		return types.ParseJID(groupID)
	}
	return types.ParseJID(groupID + "@g.us")
}

// ParseNewsletterJID parses a newsletter ID and returns a WhatsApp newsletter JID
func ParseNewsletterJID(newsletterID string) (types.JID, error) {
	if strings.HasSuffix(newsletterID, "@newsletter") {
		return types.ParseJID(newsletterID)
	}
	return types.ParseJID(newsletterID + "@newsletter")
}

// ParseRecipientJID intelligently parses a JID string.
// It detects the type based on suffix and parses accordingly:
// - @g.us -> group
// - @s.whatsapp.net -> individual contact
// - @newsletter -> newsletter
// - @lid -> linked ID
// - No suffix -> assumes individual contact (adds @s.whatsapp.net)
func ParseRecipientJID(jidStr string) (types.JID, error) {
	// Already has a valid suffix - parse directly
	if strings.HasSuffix(jidStr, "@g.us") ||
		strings.HasSuffix(jidStr, "@s.whatsapp.net") ||
		strings.HasSuffix(jidStr, "@newsletter") ||
		strings.HasSuffix(jidStr, "@lid") ||
		strings.HasSuffix(jidStr, "@broadcast") {
		return types.ParseJID(jidStr)
	}

	// Remove leading + from phone numbers
	if len(jidStr) > 0 && jidStr[0] == '+' {
		jidStr = jidStr[1:]
	}

	// Default to individual contact
	return types.ParseJID(jidStr + "@s.whatsapp.net")
}

// IsGroupJID checks if a JID string represents a group
func IsGroupJID(jidStr string) bool {
	return strings.HasSuffix(jidStr, "@g.us")
}

// IsStatusBroadcast checks if a JID string is a status broadcast
func IsStatusBroadcast(jidStr string) bool {
	return jidStr == "status@broadcast"
}
