package chatwoot

import (
	"context"

	"onwapp/internal/db"
	cwservice "onwapp/internal/integrations/chatwoot/service"
	"onwapp/internal/integrations/webhook"
)

type WebhookProvider struct {
	repo     *Repository
	database *db.Database
}

func NewWebhookProvider(repo *Repository, database *db.Database) *WebhookProvider {
	return &WebhookProvider{repo: repo, database: database}
}

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

func (p *WebhookProvider) GetChatwootInfoForMessage(ctx context.Context, sessionID, msgID string) *webhook.ChatwootInfo {
	cfg, err := p.repo.GetEnabledBySessionID(ctx, sessionID)
	if err != nil || cfg == nil {
		return nil
	}

	info := &webhook.ChatwootInfo{
		Account: cfg.Account,
		InboxID: cfg.InboxID,
	}

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

type WebhookSenderAdapter struct {
	webhookService *webhook.Service
}

func NewWebhookSenderAdapter(ws *webhook.Service) *WebhookSenderAdapter {
	return &WebhookSenderAdapter{webhookService: ws}
}

func (a *WebhookSenderAdapter) SendWithChatwoot(ctx context.Context, sessionID, sessionId, event string, rawEvent interface{}, cwInfo *cwservice.ChatwootInfo) {
	var webhookInfo *webhook.ChatwootInfo
	if cwInfo != nil {
		webhookInfo = &webhook.ChatwootInfo{
			Account:        cwInfo.Account,
			InboxID:        cwInfo.InboxID,
			ConversationID: cwInfo.ConversationID,
			MessageID:      cwInfo.MessageID,
		}
	}
	a.webhookService.SendWithChatwoot(ctx, sessionID, sessionId, event, rawEvent, webhookInfo)
}

func (a *WebhookSenderAdapter) SendWithPreserializedJSON(ctx context.Context, sessionID, sessionId, event string, eventJSON []byte, cwInfo *cwservice.ChatwootInfo) {
	var webhookInfo *webhook.ChatwootInfo
	if cwInfo != nil {
		webhookInfo = &webhook.ChatwootInfo{
			Account:        cwInfo.Account,
			InboxID:        cwInfo.InboxID,
			ConversationID: cwInfo.ConversationID,
			MessageID:      cwInfo.MessageID,
		}
	}
	a.webhookService.SendWithPreserializedJSON(ctx, sessionID, sessionId, event, eventJSON, webhookInfo)
}
