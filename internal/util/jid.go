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
