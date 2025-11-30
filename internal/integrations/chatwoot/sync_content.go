package chatwoot

import (
	"encoding/json"
	"strings"

	"zpwoot/internal/model"
)

// GetMessageContent extracts displayable content from a message
func GetMessageContent(msg *model.Message) string {
	if msg.Content == "" && len(msg.RawEvent) > 0 {
		if msg.Type == "list" || msg.Type == "template" || msg.Type == "buttons" || msg.Type == "interactive" {
			if content := ExtractInteractiveContent(msg); content != "" {
				return content
			}
		}
	}

	switch msg.Type {
	case "image":
		if msg.Content != "" {
			return "_[Imagem]_\n" + msg.Content
		}
		return "_[Imagem]_"
	case "video":
		if msg.Content != "" {
			return "_[Vídeo]_\n" + msg.Content
		}
		return "_[Vídeo]_"
	case "audio":
		if msg.Content != "" {
			return "_[Áudio]_\n" + msg.Content
		}
		return "_[Áudio]_"
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

// ExtractInteractiveContent extracts content from interactive message types
func ExtractInteractiveContent(msg *model.Message) string {
	if len(msg.RawEvent) == 0 {
		return ""
	}

	var rawEvent map[string]interface{}
	if err := json.Unmarshal(msg.RawEvent, &rawEvent); err != nil {
		return ""
	}

	webMsgInfo, ok := rawEvent["webMessageInfo"].(map[string]interface{})
	if !ok {
		return ""
	}

	message, ok := webMsgInfo["message"].(map[string]interface{})
	if !ok {
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
	}

	return ""
}

func extractListContent(message map[string]interface{}) string {
	listMsg, ok := message["listMessage"].(map[string]interface{})
	if !ok {
		return ""
	}

	var b strings.Builder

	if desc, ok := listMsg["description"].(string); ok && desc != "" {
		b.WriteString(desc)
	}

	if sections, ok := listMsg["sections"].([]interface{}); ok {
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

			if rows, ok := section["rows"].([]interface{}); ok {
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
