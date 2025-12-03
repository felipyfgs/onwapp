package sync

import (
	"encoding/json"
	"fmt"
	"strings"

	"zpwoot/internal/model"
)

// GetMessageContent extracts displayable content from a message
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

// isInteractiveType checks if message type requires special content extraction
func isInteractiveType(msgType string) bool {
	switch msgType {
	case "list", "template", "buttons", "interactive", "button_reply", "button_response":
		return true
	default:
		return false
	}
}

// formatMessageContent formats message content based on type
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

// extractLocationContent extracts location data and creates Google Maps link
func extractLocationContent(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		if msg.Content != "" {
			return "_[📍 Localização]_\n" + msg.Content
		}
		return "_[📍 Localização]_"
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return "_[📍 Localização]_"
	}

	// Try to extract from webMessageInfo or historySyncMsg
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
			return "_[📍 Localização]_\n" + msg.Content
		}
		return "_[📍 Localização]_"
	}

	lat, _ := locationMsg["degreesLatitude"].(float64)
	lng, _ := locationMsg["degreesLongitude"].(float64)
	name, _ := locationMsg["name"].(string)
	address, _ := locationMsg["address"].(string)

	var b strings.Builder
	b.WriteString("_[📍 Localização]_")

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

// extractContactContent extracts contact name and phone from vCard
func extractContactContent(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		if msg.Content != "" {
			return "_[👤 Contato: " + msg.Content + "]_"
		}
		return "_[👤 Contato]_"
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return "_[👤 Contato]_"
	}

	// Try Message.contactMessage first (real-time format)
	var contactMsg map[string]interface{}
	if message, ok := rawEvent["Message"].(map[string]interface{}); ok {
		contactMsg, _ = message["contactMessage"].(map[string]interface{})
	}

	// Try webMessageInfo format
	if contactMsg == nil {
		if webMsgInfo, ok := rawEvent["webMessageInfo"].(map[string]interface{}); ok {
			if message, ok := webMsgInfo["message"].(map[string]interface{}); ok {
				contactMsg, _ = message["contactMessage"].(map[string]interface{})
			}
		}
	}

	// Try historySyncMsg format
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
		return "_[👤 Contato]_"
	}

	displayName, _ := contactMsg["displayName"].(string)
	vcard, _ := contactMsg["vcard"].(string)

	var b strings.Builder
	b.WriteString("_[👤 Contato]_")

	if displayName != "" {
		b.WriteString("\n*")
		b.WriteString(displayName)
		b.WriteString("*")
	}

	// Extract phone from vCard
	if phone := extractPhoneFromVCard(vcard); phone != "" {
		b.WriteString("\n")
		b.WriteString(phone)
	}

	return b.String()
}

// extractContactsArrayContent extracts multiple contacts from contactsArrayMessage
func extractContactsArrayContent(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		if msg.Content != "" {
			return "_[👥 Contatos: " + msg.Content + "]_"
		}
		return "_[👥 Contatos]_"
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return "_[👥 Contatos]_"
	}

	// Try Message.contactsArrayMessage first (real-time format)
	var contactsArray []interface{}
	if message, ok := rawEvent["Message"].(map[string]interface{}); ok {
		if contactsMsg, ok := message["contactsArrayMessage"].(map[string]interface{}); ok {
			contactsArray, _ = contactsMsg["contacts"].([]interface{})
		}
	}

	// Try webMessageInfo format
	if contactsArray == nil {
		if webMsgInfo, ok := rawEvent["webMessageInfo"].(map[string]interface{}); ok {
			if message, ok := webMsgInfo["message"].(map[string]interface{}); ok {
				if contactsMsg, ok := message["contactsArrayMessage"].(map[string]interface{}); ok {
					contactsArray, _ = contactsMsg["contacts"].([]interface{})
				}
			}
		}
	}

	// Try historySyncMsg format
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
		return "_[👥 Contatos]_"
	}

	var b strings.Builder
	b.WriteString("_[👥 Contatos]_")

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

// extractButtonReplyContent extracts content from button reply messages
func extractButtonReplyContent(msg *model.Message) string {
	// Button replies usually have the selected button text in Content
	if msg.Content != "" {
		return "_[🔘 Resposta]_ " + msg.Content
	}

	if len(msg.RawEvent) == 0 {
		return "_[🔘 Resposta]_"
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return "_[🔘 Resposta]_"
	}

	// Try to extract selected display text from various formats
	var selectedText string

	// Real-time format
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

	// History sync format
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
		return "_[🔘 Resposta]_ " + selectedText
	}

	return "_[🔘 Resposta]_"
}

// extractPhoneFromVCard extracts phone number from vCard string
func extractPhoneFromVCard(vcard string) string {
	if vcard == "" {
		return ""
	}

	lines := strings.Split(vcard, "\n")
	for _, line := range lines {
		// Look for TEL lines: item1.TEL;waid=559992166318:+55 99 9216-6318
		if strings.Contains(line, "TEL") && strings.Contains(line, ":") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				return strings.TrimSpace(parts[1])
			}
		}
	}
	return ""
}

// formatFloat formats float to string
func formatFloat(f float64) string {
	return fmt.Sprintf("%.6f", f)
}

// formatMediaContent formats media type label with optional caption
func formatMediaContent(label, caption string) string {
	if caption != "" {
		return "_[" + label + "]_\n" + caption
	}
	return "_[" + label + "]_"
}

// ExtractInteractiveContent extracts content from interactive message types
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

// extractMessageFromRawEvent extracts the message object from raw event
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

// extractListContent extracts content from list messages
func extractListContent(message map[string]interface{}) string {
	listMsg, ok := message["listMessage"].(map[string]interface{})
	if !ok {
		return ""
	}

	var b strings.Builder

	if desc, ok := listMsg["description"].(string); ok && desc != "" {
		b.WriteString(desc)
	}

	sections, ok := listMsg["sections"].([]interface{})
	if !ok {
		return strings.TrimSpace(b.String())
	}

	for _, sec := range sections {
		section, ok := sec.(map[string]interface{})
		if !ok {
			continue
		}

		if title, ok := section["title"].(string); ok && title != "" {
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

// extractTemplateContent extracts content from template messages
func extractTemplateContent(message map[string]interface{}) string {
	templateMsg, ok := message["templateMessage"].(map[string]interface{})
	if !ok {
		return ""
	}

	// Try hydratedTemplate first
	if ht, ok := templateMsg["hydratedTemplate"].(map[string]interface{}); ok {
		if text, ok := ht["hydratedContentText"].(string); ok && text != "" {
			return text
		}
	}

	// Try Format > HydratedFourRowTemplate
	if format, ok := templateMsg["Format"].(map[string]interface{}); ok {
		if fourRow, ok := format["HydratedFourRowTemplate"].(map[string]interface{}); ok {
			if text, ok := fourRow["hydratedContentText"].(string); ok && text != "" {
				return text
			}
		}
	}

	return ""
}

// extractButtonsContent extracts content from buttons messages
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

// extractInteractiveMessageContent extracts content from interactive messages
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

// ExtractQuotedID extracts the quoted message ID (stanzaID) from rawEvent
func ExtractQuotedID(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		return ""
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return ""
	}

	// Try history sync format first
	if stanzaID := extractStanzaIDFromHistorySync(rawEvent); stanzaID != "" {
		return stanzaID
	}

	// Try real-time event format
	if stanzaID := extractStanzaIDFromRealtime(rawEvent); stanzaID != "" {
		return stanzaID
	}

	return ""
}

// extractStanzaIDFromHistorySync extracts stanzaID from history sync rawEvent
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

	// Check all message types that can have contextInfo
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

// extractStanzaIDFromRealtime extracts stanzaID from real-time event rawEvent
func extractStanzaIDFromRealtime(rawEvent map[string]interface{}) string {
	// Real-time events may have Info.QuotedID or similar structure
	if info, ok := rawEvent["Info"].(map[string]interface{}); ok {
		if quotedID, ok := info["QuotedID"].(string); ok && quotedID != "" {
			return quotedID
		}
	}
	return ""
}
