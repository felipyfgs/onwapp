package chatwoot

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"zpwoot/internal/logger"
)

// QuotedMessageInfo holds information about a quoted message for WhatsApp
type QuotedMessageInfo struct {
	MsgId     string `json:"msgId"`
	ChatJID   string `json:"chatJid"`
	SenderJID string `json:"senderJid"`
	Content   string `json:"content"`
	FromMe    bool   `json:"fromMe"`
}

// SessionEventPayload represents data to send back to handler for WhatsApp sending
type SessionEventPayload struct {
	ChatJid     string       `json:"chatJid"`
	Content     string       `json:"content"`
	Attachments []Attachment `json:"attachments,omitempty"`
	Timestamp   time.Time    `json:"timestamp"`
}

// HandleWebhook processes incoming webhooks from Chatwoot
func (s *Service) HandleWebhook(ctx context.Context, sessionID string, payload *WebhookPayload) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		return fmt.Errorf("chatwoot not enabled for session: %s", sessionID)
	}

	switch payload.Event {
	case "message_created":
		return s.handleMessageCreated(ctx, sessionID, cfg, payload)
	case "message_updated":
		return s.handleMessageUpdated(ctx, sessionID, cfg, payload)
	case "conversation_status_changed":
		return s.handleConversationStatusChanged(ctx, sessionID, cfg, payload)
	default:
		logger.Debug().Str("event", payload.Event).Msg("Unhandled Chatwoot webhook event")
	}

	return nil
}

func (s *Service) handleMessageCreated(ctx context.Context, sessionID string, cfg *Config, payload *WebhookPayload) error {
	if payload.MessageType != "outgoing" {
		return nil
	}

	if payload.Private {
		return nil
	}

	// Skip messages with WAID: source_id - these are imported from WhatsApp, not user-created
	if payload.SourceID != "" && strings.HasPrefix(payload.SourceID, "WAID:") {
		logger.Debug().
			Str("sourceId", payload.SourceID).
			Int("msgId", payload.ID).
			Msg("Chatwoot: skipping imported message (has WAID source_id)")
		return nil
	}

	// Also check in conversation messages list
	if payload.Conversation != nil && len(payload.Conversation.Messages) > 0 {
		for _, msg := range payload.Conversation.Messages {
			if msg.SourceID != "" && strings.HasPrefix(msg.SourceID, "WAID:") && msg.ID == payload.ID {
				return nil
			}
		}
	}

	if payload.Conversation == nil || payload.Conversation.Meta == nil || payload.Conversation.Meta.Sender == nil {
		return fmt.Errorf("missing conversation metadata")
	}

	chatJid := payload.Conversation.Meta.Sender.Identifier
	if chatJid == "" {
		phoneNumber := strings.TrimPrefix(payload.Conversation.Meta.Sender.PhoneNumber, "+")
		chatJid = JIDToWhatsApp(phoneNumber)
	}

	content := payload.Content
	if cfg.SignAgent && payload.Sender != nil && payload.Sender.AvailableName != "" {
		delimiter := cfg.SignSeparator
		if delimiter == "" {
			delimiter = "\n"
		}
		delimiter = strings.ReplaceAll(delimiter, "\\n", "\n")
		content = fmt.Sprintf("*%s:*%s%s", payload.Sender.AvailableName, delimiter, content)
	}

	content = s.convertMarkdown(content)

	_ = chatJid
	_ = content

	return nil
}

func (s *Service) handleMessageUpdated(ctx context.Context, sessionID string, cfg *Config, payload *WebhookPayload) error {
	return nil
}

func (s *Service) handleConversationStatusChanged(ctx context.Context, sessionID string, cfg *Config, payload *WebhookPayload) error {
	return nil
}

// GetWebhookDataForSending extracts data from webhook for sending via WhatsApp
// The signMsg signature is applied here for outgoing messages (like Evolution API)
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

	chatJid = payload.Conversation.Meta.Sender.Identifier
	if chatJid == "" {
		phoneNumber := strings.TrimPrefix(payload.Conversation.Meta.Sender.PhoneNumber, "+")
		chatJid = JIDToWhatsApp(phoneNumber)
	}

	content = s.convertMarkdown(payload.Content)

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

// ParseWebhookPayload parses raw JSON into WebhookPayload
func ParseWebhookPayload(data []byte) (*WebhookPayload, error) {
	var payload WebhookPayload
	if err := json.Unmarshal(data, &payload); err != nil {
		return nil, err
	}
	return &payload, nil
}

// convertMarkdown converts Chatwoot markdown to WhatsApp format
func (s *Service) convertMarkdown(content string) string {
	content = strings.ReplaceAll(content, "**", "§BOLD§")
	content = strings.ReplaceAll(content, "*", "_")
	content = strings.ReplaceAll(content, "§BOLD§", "*")
	content = strings.ReplaceAll(content, "~~", "~")
	return content
}
