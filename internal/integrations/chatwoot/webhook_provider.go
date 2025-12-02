package chatwoot

import (
	"context"

	"zpwoot/internal/db"
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
