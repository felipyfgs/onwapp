package sync

import (
	"context"

	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/logger"
)

type DataResetter struct {
	repo *Repository
}

func NewDataResetter(repo *Repository) *DataResetter {
	return &DataResetter{
		repo: repo,
	}
}

func (r *DataResetter) Reset(ctx context.Context) (*core.ResetStats, error) {
	stats := &core.ResetStats{}

	inboxID, _ := r.repo.GetInboxID(ctx)

	messagesDeleted, err := r.repo.DeleteMessages(ctx, inboxID)
	if err != nil {
		return stats, err
	}
	stats.MessagesDeleted = messagesDeleted

	conversationsDeleted, err := r.repo.DeleteConversations(ctx, inboxID)
	if err != nil {
		return stats, err
	}
	stats.ConversationsDeleted = conversationsDeleted

	contactInboxDeleted, err := r.repo.DeleteContactInboxes(ctx, inboxID)
	if err != nil {
		return stats, err
	}
	stats.ContactInboxDeleted = contactInboxDeleted

	contactsDeleted, err := r.repo.DeleteContacts(ctx)
	if err != nil {
		return stats, err
	}
	stats.ContactsDeleted = contactsDeleted

	logger.Chatwoot().Info().
		Int("contacts", stats.ContactsDeleted).
		Int("conversations", stats.ConversationsDeleted).
		Int("messages", stats.MessagesDeleted).
		Int("contactInboxes", stats.ContactInboxDeleted).
		Msg("Chatwoot DB: reset completed")

	return stats, nil
}
