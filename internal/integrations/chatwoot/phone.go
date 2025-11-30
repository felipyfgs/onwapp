package chatwoot

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

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

// StripJIDSuffix removes @s.whatsapp.net or @g.us suffix from JID
func StripJIDSuffix(jid string) string {
	if idx := strings.Index(jid, "@"); idx > 0 {
		return jid[:idx]
	}
	return jid
}

// =============================================================================
// PHONE FORMATTING
// =============================================================================

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

// IsBrazilianNumber checks if a phone number is Brazilian
func IsBrazilianNumber(phone string) bool {
	phone = strings.TrimPrefix(phone, "+")
	return strings.HasPrefix(phone, "55")
}

// =============================================================================
// LID RESOLUTION
// =============================================================================

// ResolveLIDToPhone resolves a LID to phone number using whatsmeow_lid_map table
// Returns the phone number if found, or empty string if not found
func ResolveLIDToPhone(ctx context.Context, pool *pgxpool.Pool, lid string) string {
	if pool == nil {
		return ""
	}

	// Extract LID number from JID (remove @lid suffix)
	lidNum := strings.TrimSuffix(lid, "@lid")
	if colonIdx := strings.Index(lidNum, ":"); colonIdx > 0 {
		lidNum = lidNum[:colonIdx]
	}

	var phone string
	err := pool.QueryRow(ctx, `SELECT pn FROM whatsmeow_lid_map WHERE lid = $1`, lidNum).Scan(&phone)
	if err != nil {
		return ""
	}
	return phone
}

// ResolveJIDToPhone resolves any JID type to phone number
// For @lid JIDs, uses the whatsmeow_lid_map table
// For @s.whatsapp.net JIDs, extracts directly
// For groups, returns empty
func ResolveJIDToPhone(ctx context.Context, pool *pgxpool.Pool, jid string) string {
	if IsGroupJID(jid) || IsStatusBroadcast(jid) || IsNewsletter(jid) {
		return ""
	}

	if IsLIDJID(jid) {
		return ResolveLIDToPhone(ctx, pool, jid)
	}

	return ExtractPhoneFromJID(jid)
}

// ConvertLIDToStandardJID converts a @lid JID to @s.whatsapp.net JID
// Returns the original JID if conversion not possible
func ConvertLIDToStandardJID(ctx context.Context, pool *pgxpool.Pool, jid string) string {
	if !IsLIDJID(jid) {
		return jid
	}

	phone := ResolveLIDToPhone(ctx, pool, jid)
	if phone == "" {
		return jid
	}

	return phone + "@s.whatsapp.net"
}

// =============================================================================
// CONTACT NAME HELPERS
// =============================================================================

// GetBestContactName returns the best available name for a contact
func GetBestContactName(info *contactNameInfo, phone string) string {
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
