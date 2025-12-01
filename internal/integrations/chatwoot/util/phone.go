package util

import (
	"context"
	"fmt"
	"strings"

	"zpwoot/internal/integrations/chatwoot/core"
)

// LIDResolver interface for resolving LID to phone number
// Implemented by ContactRepository
type LIDResolver interface {
	ResolveLIDToPhone(ctx context.Context, lidNumber string) string
}

// =============================================================================
// JID EXTRACTION & VALIDATION
// =============================================================================

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

// IsNewsletter checks if the JID is a WhatsApp newsletter/channel
func IsNewsletter(jid string) bool {
	return strings.HasSuffix(jid, "@newsletter")
}

// IsLIDJID checks if the JID is a LID (Linked ID) JID
func IsLIDJID(jid string) bool {
	return strings.HasSuffix(jid, "@lid")
}

// =============================================================================
// PHONE FORMATTING
// =============================================================================

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

// =============================================================================
// BRAZILIAN PHONE NUMBER HANDLING
// =============================================================================

// GetAlternateBrazilianNumber returns the alternate format for Brazilian numbers
// +55XX9XXXXXXXX (13 digits) <-> +55XXXXXXXXXX (12 digits)
func GetAlternateBrazilianNumber(phone string) string {
	phone = strings.TrimPrefix(phone, "+")

	// 13 digits with 9 -> remove 9 to get 12 digits
	if len(phone) == 13 && strings.HasPrefix(phone, "55") {
		// +55 XX 9XXXX XXXX -> +55 XX XXXX XXXX
		return "+" + phone[:4] + phone[5:]
	}

	// 12 digits without 9 -> add 9 to get 13 digits
	if len(phone) == 12 && strings.HasPrefix(phone, "55") {
		// +55 XX XXXX XXXX -> +55 XX 9XXXX XXXX
		return "+" + phone[:4] + "9" + phone[4:]
	}

	return ""
}

// =============================================================================
// LID RESOLUTION
// =============================================================================

// ResolveLIDToPhone resolves a LID to phone number using the LIDResolver interface
// Returns the phone number if found, or empty string if not found
func ResolveLIDToPhone(ctx context.Context, resolver LIDResolver, lid string) string {
	if resolver == nil {
		return ""
	}

	// Extract LID number from JID (remove @lid suffix)
	lidNum := strings.TrimSuffix(lid, "@lid")
	if colonIdx := strings.Index(lidNum, ":"); colonIdx > 0 {
		lidNum = lidNum[:colonIdx]
	}

	return resolver.ResolveLIDToPhone(ctx, lidNum)
}

// ResolveJIDToPhone resolves any JID type to phone number
// For @lid JIDs, uses the LIDResolver interface
// For @s.whatsapp.net JIDs, extracts directly
// For groups, returns empty
func ResolveJIDToPhone(ctx context.Context, resolver LIDResolver, jid string) string {
	if IsGroupJID(jid) || IsStatusBroadcast(jid) || IsNewsletter(jid) {
		return ""
	}

	if IsLIDJID(jid) {
		return ResolveLIDToPhone(ctx, resolver, jid)
	}

	return ExtractPhoneFromJID(jid)
}

// ConvertLIDToStandardJID converts a @lid JID to @s.whatsapp.net JID
// Returns the original JID if conversion not possible
func ConvertLIDToStandardJID(ctx context.Context, resolver LIDResolver, jid string) string {
	if !IsLIDJID(jid) {
		return jid
	}

	phone := ResolveLIDToPhone(ctx, resolver, jid)
	if phone == "" {
		return jid
	}

	return phone + "@s.whatsapp.net"
}

// =============================================================================
// CONTACT NAME HELPERS
// =============================================================================

// GetBestContactName returns the best available name for a contact
func GetBestContactName(info *core.ContactNameInfo, phone string) string {
	if info != nil {
		if info.FullName != "" {
			return info.FullName
		}
		if info.FirstName != "" {
			return info.FirstName
		}
		if info.PushName != "" {
			return info.PushName
		}
		if info.BusinessName != "" {
			return info.BusinessName
		}
	}
	return phone
}
