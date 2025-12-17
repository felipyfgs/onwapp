package util

import (
	"context"
	"fmt"
	"strings"

	"onwapp/internal/integrations/chatwoot/core"
)

type LIDResolver interface {
	ResolveLIDToPhone(ctx context.Context, lidNumber string) string
}

func ExtractPhoneFromJID(jid string) string {
	phone := strings.Split(jid, "@")[0]
	if colonIdx := strings.Index(phone, ":"); colonIdx > 0 {
		phone = phone[:colonIdx]
	}
	return phone
}

func IsGroupJID(jid string) bool {
	return strings.HasSuffix(jid, "@g.us")
}

func IsStatusBroadcast(jid string) bool {
	return jid == "status@broadcast"
}

func IsNewsletter(jid string) bool {
	return strings.HasSuffix(jid, "@newsletter")
}

func IsLIDJID(jid string) bool {
	return strings.HasSuffix(jid, "@lid")
}

func FormatPhoneDisplay(phone string) string {
	phone = strings.TrimPrefix(phone, "+")

	if len(phone) == 13 && strings.HasPrefix(phone, "55") {
		return fmt.Sprintf("+%s (%s) %s-%s",
			phone[0:2],
			phone[2:4],
			phone[4:9],
			phone[9:13])
	}

	if len(phone) == 12 && strings.HasPrefix(phone, "55") {
		return fmt.Sprintf("+%s (%s) %s-%s",
			phone[0:2],
			phone[2:4],
			phone[4:8],
			phone[8:12])
	}

	return fmt.Sprintf("+%s", phone)
}

func JIDToWhatsApp(phone string) string {
	phone = strings.TrimPrefix(phone, "+")
	return phone + "@s.whatsapp.net"
}

func GetAlternateBrazilianNumber(phone string) string {
	phone = strings.TrimPrefix(phone, "+")

	if len(phone) == 13 && strings.HasPrefix(phone, "55") {
		return "+" + phone[:4] + phone[5:]
	}

	if len(phone) == 12 && strings.HasPrefix(phone, "55") {
		return "+" + phone[:4] + "9" + phone[4:]
	}

	return ""
}

func GetBrazilianPhoneVariants(phone string) []string {
	phone = strings.TrimPrefix(phone, "+")
	variants := []string{"+" + phone}

	if !strings.HasPrefix(phone, "55") {
		return variants
	}

	if len(phone) == 13 {
		withoutNine := "+" + phone[:4] + phone[5:]
		variants = append(variants, withoutNine)
	} else if len(phone) == 12 {
		withNine := "+" + phone[:4] + "9" + phone[4:]
		variants = append(variants, withNine)
	}

	return variants
}

func ResolveLIDToPhone(ctx context.Context, resolver LIDResolver, lid string) string {
	if resolver == nil {
		return ""
	}

	lidNum := strings.TrimSuffix(lid, "@lid")
	if colonIdx := strings.Index(lidNum, ":"); colonIdx > 0 {
		lidNum = lidNum[:colonIdx]
	}

	return resolver.ResolveLIDToPhone(ctx, lidNum)
}

func ResolveJIDToPhone(ctx context.Context, resolver LIDResolver, jid string) string {
	if IsGroupJID(jid) || IsStatusBroadcast(jid) || IsNewsletter(jid) {
		return ""
	}

	if IsLIDJID(jid) {
		return ResolveLIDToPhone(ctx, resolver, jid)
	}

	return ExtractPhoneFromJID(jid)
}

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
