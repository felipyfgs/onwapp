package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/integrations/chatwoot/util"
	"zpwoot/internal/logger"
)

// =============================================================================
// WEBHOOK DTOs
// =============================================================================

// WebhookPayload represents incoming webhook from Chatwoot
type WebhookPayload struct {
	Event        string                 `json:"event"`
	ID           int                    `json:"id,omitempty"`
	Content      string                 `json:"content,omitempty"`
	MessageType  string                 `json:"message_type,omitempty"`
	ContentType  string                 `json:"content_type,omitempty"`
	ContentAttrs map[string]interface{} `json:"content_attributes,omitempty"`
	Private      bool                   `json:"private,omitempty"`
	SourceID     string                 `json:"source_id,omitempty"`
	Conversation *WebhookConversation   `json:"conversation,omitempty"`
	Sender       *core.Sender           `json:"sender,omitempty"`
	Inbox        *core.Inbox            `json:"inbox,omitempty"`
	Account      *core.Account          `json:"account,omitempty"`
	Attachments  []core.Attachment      `json:"attachments,omitempty"`
}

// WebhookConversation represents conversation data in webhook payload
type WebhookConversation struct {
	ID           int                `json:"id"`
	InboxID      int                `json:"inbox_id,omitempty"`
	Status       string             `json:"status,omitempty"`
	Messages     []core.Message     `json:"messages,omitempty"`
	Meta         *ConversationMeta  `json:"meta,omitempty"`
	ContactInbox *core.ContactInbox `json:"contact_inbox,omitempty"`
}

// ConversationMeta represents metadata in conversation
type ConversationMeta struct {
	Sender *core.Contact `json:"sender,omitempty"`
}

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
func (s *Service) GetWebhookDataForSending(ctx context.Context, sessionID string, payload *WebhookPayload) (chatJid, content string, attachments []core.Attachment, err error) {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		return "", "", nil, core.ErrNotEnabled
	}

	isOutgoing := payload.MessageType == "outgoing" || payload.MessageType == "1"
	if !isOutgoing || payload.Private {
		return "", "", nil, nil
	}

	if payload.SourceID != "" && strings.HasPrefix(payload.SourceID, "WAID:") {
		logger.Debug().
			Str("sourceId", payload.SourceID).
			Int("msgId", payload.ID).
			Msg("Chatwoot: skipping imported message in GetWebhookDataForSending")
		return "", "", nil, nil
	}

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
		chatJid = util.JIDToWhatsApp(phoneNumber)
	}

	content = s.ConvertMarkdown(payload.Content)

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
func (s *Service) GetQuotedMessage(ctx context.Context, sessionID string, payload *WebhookPayload) *core.QuotedMessageInfo {
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

	return &core.QuotedMessageInfo{
		MsgId:     msg.MsgId,
		ChatJID:   msg.ChatJID,
		SenderJID: msg.SenderJID,
		Content:   msg.Content,
		FromMe:    msg.FromMe,
	}
}
