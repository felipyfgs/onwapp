package chatwoot

import (
	"context"

	"zpwoot/internal/integrations/webhook"
)

// WebhookProvider implements webhook.ChatwootProvider interface
type WebhookProvider struct {
	repo *Repository
}

// NewWebhookProvider creates a new Chatwoot webhook provider
func NewWebhookProvider(repo *Repository) *WebhookProvider {
	return &WebhookProvider{repo: repo}
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
