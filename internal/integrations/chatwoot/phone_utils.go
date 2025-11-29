package chatwoot

import (
	"fmt"
	"strings"
)

// ExtractPhoneFromJID extracts the phone number from a WhatsApp JID
// Handles both individual (@s.whatsapp.net) and group (@g.us) JIDs
// Also removes device suffix (e.g., "559984059035:2" -> "559984059035")
func ExtractPhoneFromJID(jid string) string {
	phone := strings.Split(jid, "@")[0]
	if colonIdx := strings.Index(phone, ":"); colonIdx > 0 {
		phone = phone[:colonIdx]
	}
	return phone
}

// IsGroupJID checks if the JID is a group JID
func IsGroupJID(jid string) bool {
	return strings.HasSuffix(jid, "@g.us")
}

// IsStatusBroadcast checks if the JID is a status broadcast (WhatsApp Stories)
func IsStatusBroadcast(jid string) bool {
	return jid == "status@broadcast"
}

// FormatPhoneE164 formats a phone number with + prefix for E164 format
func FormatPhoneE164(phone string) string {
	phone = strings.TrimPrefix(phone, "+")
	return "+" + phone
}

// FormatPhoneDisplay formats a phone number for human-readable display
// Brazilian numbers get special formatting: +55 (XX) XXXXX-XXXX
func FormatPhoneDisplay(phone string) string {
	phone = strings.TrimPrefix(phone, "+")

	// Brazilian 13-digit format (with 9): +55 (XX) 9XXXX-XXXX
	if len(phone) == 13 && strings.HasPrefix(phone, "55") {
		return fmt.Sprintf("+%s (%s) %s-%s",
			phone[0:2],
			phone[2:4],
			phone[4:9],
			phone[9:13])
	}

	// Brazilian 12-digit format (without 9): +55 (XX) XXXX-XXXX
	if len(phone) == 12 && strings.HasPrefix(phone, "55") {
		return fmt.Sprintf("+%s (%s) %s-%s",
			phone[0:2],
			phone[2:4],
			phone[4:8],
			phone[8:12])
	}

	return fmt.Sprintf("+%s", phone)
}

// JIDToWhatsApp converts a phone number to WhatsApp individual JID
func JIDToWhatsApp(phone string) string {
	phone = strings.TrimPrefix(phone, "+")
	return phone + "@s.whatsapp.net"
}

// StripJIDSuffix removes @s.whatsapp.net or @g.us suffix from JID
func StripJIDSuffix(jid string) string {
	if idx := strings.Index(jid, "@"); idx > 0 {
		return jid[:idx]
	}
	return jid
}
