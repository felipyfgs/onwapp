package util

import (
	"strings"

	"go.mau.fi/whatsmeow/types"
)

func ParsePhoneJID(phone string) (types.JID, error) {
	if len(phone) > 0 && phone[0] == '+' {
		phone = phone[1:]
	}
	return types.ParseJID(phone + "@s.whatsapp.net")
}

func ParseGroupJID(groupID string) (types.JID, error) {
	if strings.HasSuffix(groupID, "@g.us") {
		return types.ParseJID(groupID)
	}
	return types.ParseJID(groupID + "@g.us")
}

func ParseNewsletterJID(newsletterID string) (types.JID, error) {
	if strings.HasSuffix(newsletterID, "@newsletter") {
		return types.ParseJID(newsletterID)
	}
	return types.ParseJID(newsletterID + "@newsletter")
}

func ParseRecipientJID(jidStr string) (types.JID, error) {
	if strings.HasSuffix(jidStr, "@g.us") ||
		strings.HasSuffix(jidStr, "@s.whatsapp.net") ||
		strings.HasSuffix(jidStr, "@newsletter") ||
		strings.HasSuffix(jidStr, "@lid") ||
		strings.HasSuffix(jidStr, "@broadcast") {
		return types.ParseJID(jidStr)
	}

	if len(jidStr) > 0 && jidStr[0] == '+' {
		jidStr = jidStr[1:]
	}

	return types.ParseJID(jidStr + "@s.whatsapp.net")
}

func IsGroupJID(jidStr string) bool {
	return strings.HasSuffix(jidStr, "@g.us")
}

func IsStatusBroadcast(jidStr string) bool {
	return jidStr == "status@broadcast"
}
