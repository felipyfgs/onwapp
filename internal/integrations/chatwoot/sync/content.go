package sync

import (
	"encoding/json"
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
	case "list", "template", "buttons", "interactive":
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
		return "_[Sticker]_"
	case "location":
		return "_[Localização]_"
	case "contact":
		return "_[Contato]_"
	default:
		return msg.Content
	}
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
