package chatwoot

import (
	"context"

	"zpwoot/internal/db"
	cwservice "zpwoot/internal/integrations/chatwoot/service"
	"zpwoot/internal/integrations/webhook"
)

// WebhookProvider implements webhook.ChatwootProvider interface
type WebhookProvider struct {
	repo     *Repository
	database *db.Database
}

// NewWebhookProvider creates a new Chatwoot webhook provider
func NewWebhookProvider(repo *Repository, database *db.Database) *WebhookProvider {
	return &WebhookProvider{repo: repo, database: database}
}

// GetChatwootInfo returns Chatwoot metadata for a session (only if enabled)
func (p *WebhookProvider) GetChatwootInfo(ctx context.Context, sessionID string) *webhook.ChatwootInfo {
	cfg, err := p.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		return nil
	}

	return &webhook.ChatwootInfo{
		Account: cfg.Account,
		InboxID: cfg.InboxID,
	}
}

// GetChatwootInfoForMessage returns Chatwoot metadata including message/conversation IDs
func (p *WebhookProvider) GetChatwootInfoForMessage(ctx context.Context, sessionID, msgID string) *webhook.ChatwootInfo {
	cfg, err := p.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		return nil
	}

	info := &webhook.ChatwootInfo{
		Account: cfg.Account,
		InboxID: cfg.InboxID,
	}

	// Try to get message IDs from database
	if p.database != nil && p.database.Messages != nil && msgID != "" {
		msg, err := p.database.Messages.GetByMsgId(ctx, sessionID, msgID)
		if err == nil && msg != nil {
			if msg.CwMsgId != nil {
				info.MessageID = *msg.CwMsgId
			}
			if msg.CwConvId != nil {
				info.ConversationID = *msg.CwConvId
			}
		}
	}

	return info
}

// WebhookSenderAdapter adapts webhook.Service to cwservice.WebhookSender interface
type WebhookSenderAdapter struct {
	webhookService *webhook.Service
}

// NewWebhookSenderAdapter creates a new adapter for webhook service
func NewWebhookSenderAdapter(ws *webhook.Service) *WebhookSenderAdapter {
	return &WebhookSenderAdapter{webhookService: ws}
}

// SendWithChatwoot implements cwservice.WebhookSender interface
func (a *WebhookSenderAdapter) SendWithChatwoot(ctx context.Context, sessionID, sessionName, event string, rawEvent interface{}, cwInfo *cwservice.ChatwootInfo) {
	var webhookInfo *webhook.ChatwootInfo
	if cwInfo != nil {
		webhookInfo = &webhook.ChatwootInfo{
			Account:        cwInfo.Account,
			InboxID:        cwInfo.InboxID,
			ConversationID: cwInfo.ConversationID,
			MessageID:      cwInfo.MessageID,
		}
	}
	a.webhookService.SendWithChatwoot(ctx, sessionID, sessionName, event, rawEvent, webhookInfo)
}

// SendWithPreserializedJSON implements cwservice.WebhookSender interface (optimized path)
func (a *WebhookSenderAdapter) SendWithPreserializedJSON(ctx context.Context, sessionID, sessionName, event string, eventJSON []byte, cwInfo *cwservice.ChatwootInfo) {
	var webhookInfo *webhook.ChatwootInfo
	if cwInfo != nil {
		webhookInfo = &webhook.ChatwootInfo{
			Account:        cwInfo.Account,
			InboxID:        cwInfo.InboxID,
			ConversationID: cwInfo.ConversationID,
			MessageID:      cwInfo.MessageID,
		}
	}
	a.webhookService.SendWithPreserializedJSON(ctx, sessionID, sessionName, event, eventJSON, webhookInfo)
}
