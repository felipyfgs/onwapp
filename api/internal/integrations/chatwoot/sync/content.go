package sync

import (
	"encoding/json"
	"fmt"
	"strings"

	"onwapp/internal/model"
)

const (
	msgLocation = "_[📍 Localização]_"
	msgContact  = "_[👤 Contato]_"
	msgContacts = "_[👥 Contatos]_"
	msgResponse = "_[🔘 Resposta]_"
)

func GetMessageContent(msg *model.Message) string {
	if msg.Content == "" && len(msg.RawEvent) > 0 {
		if isInteractiveType(msg.Type) {
			if content := ExtractInteractiveContent(msg); content != "" {
				return content
			}
		}
	}

	return formatMessageContent(msg)
}

func isInteractiveType(msgType string) bool {
	switch msgType {
	case "list", "template", "buttons", "interactive", "button_reply", "button_response":
		return true
	default:
		return false
	}
}

func formatMessageContent(msg *model.Message) string {
	switch msg.Type {
	case "image":
		return formatMediaContent("Imagem", msg.Content)
	case "video":
		return formatMediaContent("Vídeo", msg.Content)
	case "audio":
		return formatMediaContent("Áudio", msg.Content)
	case "document":
		if msg.Content != "" {
			return "_[Documento: " + msg.Content + "]_"
		}
		return "_[Documento]_"
	case "sticker":
		return "_[🎨 Sticker]_"
	case "location":
		return extractLocationContent(msg)
	case "contact":
		return extractContactContent(msg)
	case "contacts":
		return extractContactsArrayContent(msg)
	case "button_reply", "button_response":
		return extractButtonReplyContent(msg)
	case "system":
		return "" // Skip system messages
	default:
		return msg.Content
	}
}

func extractLocationContent(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		if msg.Content != "" {
			return msgLocation + "\n" + msg.Content
		}
		return msgLocation
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return msgLocation
	}

	var locationMsg map[string]interface{}

	if webMsgInfo, ok := rawEvent["webMessageInfo"].(map[string]interface{}); ok {
		if message, ok := webMsgInfo["message"].(map[string]interface{}); ok {
			locationMsg, _ = message["locationMessage"].(map[string]interface{})
		}
	}

	if locationMsg == nil {
		if historySync, ok := rawEvent["historySyncMsg"].(map[string]interface{}); ok {
			if msgWrapper, ok := historySync["message"].(map[string]interface{}); ok {
				if message, ok := msgWrapper["message"].(map[string]interface{}); ok {
					locationMsg, _ = message["locationMessage"].(map[string]interface{})
				}
			}
		}
	}

	if locationMsg == nil {
		if msg.Content != "" {
			return msgLocation + "\n" + msg.Content
		}
		return msgLocation
	}

	lat, _ := locationMsg["degreesLatitude"].(float64)
	lng, _ := locationMsg["degreesLongitude"].(float64)
	name, _ := locationMsg["name"].(string)
	address, _ := locationMsg["address"].(string)

	var b strings.Builder
	b.WriteString(msgLocation)

	if name != "" {
		b.WriteString("\n*")
		b.WriteString(name)
		b.WriteString("*")
	}
	if address != "" {
		b.WriteString("\n")
		b.WriteString(address)
	}

	if lat != 0 || lng != 0 {
		b.WriteString("\nhttps://maps.google.com/?q=")
		b.WriteString(strings.TrimRight(strings.TrimRight(formatFloat(lat), "0"), "."))
		b.WriteString(",")
		b.WriteString(strings.TrimRight(strings.TrimRight(formatFloat(lng), "0"), "."))
	}

	return b.String()
}

func extractContactContent(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		if msg.Content != "" {
			return "_[👤 Contato: " + msg.Content + "]_"
		}
		return msgContact
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return msgContact
	}

	var contactMsg map[string]interface{}
	if message, ok := rawEvent["Message"].(map[string]interface{}); ok {
		contactMsg, _ = message["contactMessage"].(map[string]interface{})
	}

	if contactMsg == nil {
		if webMsgInfo, ok := rawEvent["webMessageInfo"].(map[string]interface{}); ok {
			if message, ok := webMsgInfo["message"].(map[string]interface{}); ok {
				contactMsg, _ = message["contactMessage"].(map[string]interface{})
			}
		}
	}

	if contactMsg == nil {
		if historySync, ok := rawEvent["historySyncMsg"].(map[string]interface{}); ok {
			if msgWrapper, ok := historySync["message"].(map[string]interface{}); ok {
				if message, ok := msgWrapper["message"].(map[string]interface{}); ok {
					contactMsg, _ = message["contactMessage"].(map[string]interface{})
				}
			}
		}
	}

	if contactMsg == nil {
		if msg.Content != "" {
			return "_[👤 Contato: " + msg.Content + "]_"
		}
		return msgContact
	}

	displayName, _ := contactMsg["displayName"].(string)
	vcard, _ := contactMsg["vcard"].(string)

	var b strings.Builder
	b.WriteString(msgContact)

	if displayName != "" {
		b.WriteString("\n*")
		b.WriteString(displayName)
		b.WriteString("*")
	}

	if phone := extractPhoneFromVCard(vcard); phone != "" {
		b.WriteString("\n")
		b.WriteString(phone)
	}

	return b.String()
}

func extractContactsArrayContent(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		if msg.Content != "" {
			return "_[👥 Contatos: " + msg.Content + "]_"
		}
		return msgContacts
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return msgContacts
	}

	var contactsArray []interface{}
	if message, ok := rawEvent["Message"].(map[string]interface{}); ok {
		if contactsMsg, ok := message["contactsArrayMessage"].(map[string]interface{}); ok {
			contactsArray, _ = contactsMsg["contacts"].([]interface{})
		}
	}

	if contactsArray == nil {
		if webMsgInfo, ok := rawEvent["webMessageInfo"].(map[string]interface{}); ok {
			if message, ok := webMsgInfo["message"].(map[string]interface{}); ok {
				if contactsMsg, ok := message["contactsArrayMessage"].(map[string]interface{}); ok {
					contactsArray, _ = contactsMsg["contacts"].([]interface{})
				}
			}
		}
	}

	if contactsArray == nil {
		if historySync, ok := rawEvent["historySyncMsg"].(map[string]interface{}); ok {
			if msgWrapper, ok := historySync["message"].(map[string]interface{}); ok {
				if message, ok := msgWrapper["message"].(map[string]interface{}); ok {
					if contactsMsg, ok := message["contactsArrayMessage"].(map[string]interface{}); ok {
						contactsArray, _ = contactsMsg["contacts"].([]interface{})
					}
				}
			}
		}
	}

	if len(contactsArray) == 0 {
		if msg.Content != "" {
			return "_[👥 Contatos: " + msg.Content + "]_"
		}
		return msgContacts
	}

	var b strings.Builder
	b.WriteString(msgContacts)

	for _, c := range contactsArray {
		contact, ok := c.(map[string]interface{})
		if !ok {
			continue
		}

		displayName, _ := contact["displayName"].(string)
		vcard, _ := contact["vcard"].(string)

		if displayName != "" {
			b.WriteString("\n• *")
			b.WriteString(displayName)
			b.WriteString("*")
		}

		if phone := extractPhoneFromVCard(vcard); phone != "" {
			b.WriteString(" - ")
			b.WriteString(phone)
		}
	}

	return b.String()
}

func extractButtonReplyContent(msg *model.Message) string {
	if msg.Content != "" {
		return msgResponse + " " + msg.Content
	}

	if len(msg.RawEvent) == 0 {
		return msgResponse
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return msgResponse
	}

	var selectedText string

	if message, ok := rawEvent["Message"].(map[string]interface{}); ok {
		if btnReply, ok := message["templateButtonReplyMessage"].(map[string]interface{}); ok {
			selectedText, _ = btnReply["selectedDisplayText"].(string)
		}
		if btnReply, ok := message["buttonsResponseMessage"].(map[string]interface{}); ok {
			if response, ok := btnReply["Response"].(map[string]interface{}); ok {
				selectedText, _ = response["SelectedDisplayText"].(string)
			}
		}
	}

	if selectedText == "" {
		if historySync, ok := rawEvent["historySyncMsg"].(map[string]interface{}); ok {
			if msgWrapper, ok := historySync["message"].(map[string]interface{}); ok {
				if message, ok := msgWrapper["message"].(map[string]interface{}); ok {
					if btnReply, ok := message["templateButtonReplyMessage"].(map[string]interface{}); ok {
						selectedText, _ = btnReply["selectedDisplayText"].(string)
					}
					if btnReply, ok := message["buttonsResponseMessage"].(map[string]interface{}); ok {
						if response, ok := btnReply["Response"].(map[string]interface{}); ok {
							selectedText, _ = response["SelectedDisplayText"].(string)
						}
					}
				}
			}
		}
	}

	if selectedText != "" {
		return msgResponse + " " + selectedText
	}

	return msgResponse
}

func extractPhoneFromVCard(vcard string) string {
	if vcard == "" {
		return ""
	}

	lines := strings.Split(vcard, "\n")
	for _, line := range lines {
		if strings.Contains(line, "TEL") && strings.Contains(line, ":") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				return strings.TrimSpace(parts[1])
			}
		}
	}
	return ""
}

func formatFloat(f float64) string {
	return fmt.Sprintf("%.6f", f)
}

func formatMediaContent(label, caption string) string {
	if caption != "" {
		return "_[" + label + "]_\n" + caption
	}
	return "_[" + label + "]_"
}

func ExtractInteractiveContent(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		return ""
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return ""
	}

	message := extractMessageFromRawEvent(rawEvent)
	if message == nil {
		return ""
	}

	switch msg.Type {
	case "list":
		return extractListContent(message)
	case "template":
		return extractTemplateContent(message)
	case "buttons":
		return extractButtonsContent(message)
	case "interactive":
		return extractInteractiveMessageContent(message)
	default:
		return ""
	}
}

func extractMessageFromRawEvent(rawEvent map[string]interface{}) map[string]interface{} {
	webMsgInfo, ok := rawEvent["webMessageInfo"].(map[string]interface{})
	if !ok {
		return nil
	}

	message, ok := webMsgInfo["message"].(map[string]interface{})
	if !ok {
		return nil
	}
	return message
}

func extractListContent(message map[string]interface{}) string {
	listMsg, ok := message["listMessage"].(map[string]interface{})
	if !ok {
		return ""
	}

	var b strings.Builder

	if desc, descOk := listMsg["description"].(string); descOk && desc != "" {
		b.WriteString(desc)
	}

	sections, secOk := listMsg["sections"].([]interface{})
	if !secOk {
		return strings.TrimSpace(b.String())
	}

	for _, sec := range sections {
		section, sectionOk := sec.(map[string]interface{})
		if !sectionOk {
			continue
		}

		if title, titleOk := section["title"].(string); titleOk && title != "" {
			b.WriteString("\n\n*")
			b.WriteString(title)
			b.WriteString("*")
		}

		rows, ok := section["rows"].([]interface{})
		if !ok {
			continue
		}

		for _, r := range rows {
			row, ok := r.(map[string]interface{})
			if !ok {
				continue
			}

			title, _ := row["title"].(string)
			desc, _ := row["description"].(string)
			if title != "" {
				b.WriteString("\n• ")
				b.WriteString(title)
				if desc != "" {
					b.WriteString(" - ")
					b.WriteString(desc)
				}
			}
		}
	}

	return strings.TrimSpace(b.String())
}

func extractTemplateContent(message map[string]interface{}) string {
	templateMsg, ok := message["templateMessage"].(map[string]interface{})
	if !ok {
		return ""
	}

	if ht, ok := templateMsg["hydratedTemplate"].(map[string]interface{}); ok {
		if text, ok := ht["hydratedContentText"].(string); ok && text != "" {
			return text
		}
	}

	if format, ok := templateMsg["Format"].(map[string]interface{}); ok {
		if fourRow, ok := format["HydratedFourRowTemplate"].(map[string]interface{}); ok {
			if text, ok := fourRow["hydratedContentText"].(string); ok && text != "" {
				return text
			}
		}
	}

	return ""
}

func extractButtonsContent(message map[string]interface{}) string {
	buttonsMsg, ok := message["buttonsMessage"].(map[string]interface{})
	if !ok {
		return ""
	}

	if text, ok := buttonsMsg["contentText"].(string); ok {
		return text
	}
	return ""
}

func extractInteractiveMessageContent(message map[string]interface{}) string {
	interactiveMsg, ok := message["interactiveMessage"].(map[string]interface{})
	if !ok {
		return ""
	}

	if body, ok := interactiveMsg["body"].(map[string]interface{}); ok {
		if text, ok := body["text"].(string); ok {
			return text
		}
	}
	return ""
}

func ExtractQuotedID(msg *model.Message) string {
	if msg.QuotedID != "" {
		return msg.QuotedID
	}

	if len(msg.RawEvent) == 0 {
		return ""
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return ""
	}

	if stanzaID := extractStanzaIDFromHistorySync(rawEvent); stanzaID != "" {
		return stanzaID
	}

	if stanzaID := extractStanzaIDFromRealtime(rawEvent); stanzaID != "" {
		return stanzaID
	}

	return ""
}

func extractStanzaIDFromHistorySync(rawEvent map[string]interface{}) string {
	historySync, ok := rawEvent["historySyncMsg"].(map[string]interface{})
	if !ok {
		return ""
	}

	msgWrapper, ok := historySync["message"].(map[string]interface{})
	if !ok {
		return ""
	}

	message, ok := msgWrapper["message"].(map[string]interface{})
	if !ok {
		return ""
	}

	messageTypes := []string{
		"extendedTextMessage",
		"imageMessage",
		"videoMessage",
		"audioMessage",
		"documentMessage",
		"stickerMessage",
		"contactMessage",
		"locationMessage",
	}

	for _, msgType := range messageTypes {
		if typedMsg, ok := message[msgType].(map[string]interface{}); ok {
			if ctxInfo, ok := typedMsg["contextInfo"].(map[string]interface{}); ok {
				if stanzaID, ok := ctxInfo["stanzaID"].(string); ok && stanzaID != "" {
					return stanzaID
				}
			}
		}
	}

	return ""
}

func extractStanzaIDFromRealtime(rawEvent map[string]interface{}) string {
	if info, ok := rawEvent["Info"].(map[string]interface{}); ok {
		if quotedID, ok := info["QuotedID"].(string); ok && quotedID != "" {
			return quotedID
		}
	}
	return ""
}
