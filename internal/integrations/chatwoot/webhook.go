package chatwoot

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"zpwoot/internal/logger"
)

// =============================================================================
// WEBHOOK PARSING
// =============================================================================

// ParseWebhookPayload parses raw JSON into WebhookPayload
func ParseWebhookPayload(data []byte) (*WebhookPayload, error) {
	var payload WebhookPayload
	if err := json.Unmarshal(data, &payload); err != nil {
		return nil, err
	}
	return &payload, nil
}

// =============================================================================
// WEBHOOK PROCESSING (Chatwoot -> WhatsApp)
// =============================================================================

// GetWebhookDataForSending extracts data from webhook for sending via WhatsApp
func (s *Service) GetWebhookDataForSending(ctx context.Context, sessionID string, payload *WebhookPayload) (chatJid, content string, attachments []Attachment, err error) {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		return "", "", nil, fmt.Errorf("chatwoot not enabled")
	}

	isOutgoing := payload.MessageType == "outgoing" || payload.MessageType == "1"
	if !isOutgoing || payload.Private {
		return "", "", nil, nil
	}

	// Skip messages with WAID: source_id - these are imported from WhatsApp
	if payload.SourceID != "" && strings.HasPrefix(payload.SourceID, "WAID:") {
		logger.Debug().
			Str("sourceId", payload.SourceID).
			Int("msgId", payload.ID).
			Msg("Chatwoot: skipping imported message in GetWebhookDataForSending")
		return "", "", nil, nil
	}

	// Also check in conversation messages list
	if payload.Conversation != nil && len(payload.Conversation.Messages) > 0 {
		for _, msg := range payload.Conversation.Messages {
			if strings.HasPrefix(msg.SourceID, "WAID:") && msg.ID == payload.ID {
				return "", "", nil, nil
			}
		}
	}

	if payload.Conversation == nil || payload.Conversation.Meta == nil || payload.Conversation.Meta.Sender == nil {
		return "", "", nil, fmt.Errorf("missing conversation metadata")
	}

	// Debug: log sender info to understand what we're getting
	sender := payload.Conversation.Meta.Sender
	logger.Debug().
		Str("identifier", sender.Identifier).
		Str("phoneNumber", sender.PhoneNumber).
		Str("name", sender.Name).
		Int("conversationId", payload.Conversation.ID).
		Msg("Chatwoot: sender info from webhook")

	chatJid = payload.Conversation.Meta.Sender.Identifier
	if chatJid == "" {
		phoneNumber := strings.TrimPrefix(payload.Conversation.Meta.Sender.PhoneNumber, "+")
		chatJid = JIDToWhatsApp(phoneNumber)
	}

	content = s.ConvertMarkdown(payload.Content)

	// Add agent signature to content sent to WhatsApp (like Evolution API signMsg)
	if cfg.SignAgent && payload.Sender != nil {
		senderName := payload.Sender.AvailableName
		if senderName == "" {
			senderName = payload.Sender.Name
		}

		if senderName != "" {
			delimiter := cfg.SignSeparator
			if delimiter == "" {
				delimiter = "\n"
			}
			delimiter = strings.ReplaceAll(delimiter, "\\n", "\n")
			content = fmt.Sprintf("*%s:*%s%s", senderName, delimiter, content)
		}
	}

	attachments = payload.Attachments

	return chatJid, content, attachments, nil
}

// GetQuotedMessage finds the original message being replied to from Chatwoot
func (s *Service) GetQuotedMessage(ctx context.Context, sessionID string, payload *WebhookPayload) *QuotedMessageInfo {
	if s.database == nil {
		return nil
	}

	if payload.ContentAttrs == nil {
		return nil
	}

	inReplyTo, ok := payload.ContentAttrs["in_reply_to"]
	if !ok || inReplyTo == nil {
		return nil
	}

	var chatwootMsgID int
	switch v := inReplyTo.(type) {
	case float64:
		chatwootMsgID = int(v)
	case int:
		chatwootMsgID = v
	case int64:
		chatwootMsgID = int(v)
	default:
		return nil
	}

	msg, err := s.database.Messages.GetByCwMsgId(ctx, sessionID, chatwootMsgID)
	if err != nil || msg == nil {
		return nil
	}

	return &QuotedMessageInfo{
		MsgId:     msg.MsgId,
		ChatJID:   msg.ChatJID,
		SenderJID: msg.SenderJID,
		Content:   msg.Content,
		FromMe:    msg.FromMe,
	}
}


