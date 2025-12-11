package event

import (
	"context"

	"go.mau.fi/whatsmeow/types/events"

	"onwapp/internal/logger"
	"onwapp/internal/model"
)

func (s *Service) handlePresence(ctx context.Context, session *model.Session, e *events.Presence) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "presence").
		Str("from", e.From.String()).
		Bool("unavailable", e.Unavailable).
		Time("lastSeen", e.LastSeen).
		Msg("Presence update")

	s.sendWebhook(ctx, session, string(model.EventPresenceUpdate), e)
}

func (s *Service) handleChatPresence(ctx context.Context, session *model.Session, e *events.ChatPresence) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "chat_presence").
		Str("chat", e.Chat.String()).
		Str("sender", e.Sender.String()).
		Str("state", string(e.State)).
		Str("media", string(e.Media)).
		Msg("Chat presence")

	s.sendWebhook(ctx, session, string(model.EventChatPresence), e)
}

func (s *Service) handleMute(ctx context.Context, session *model.Session, e *events.Mute) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "mute").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat mute changed")

	s.sendWebhook(ctx, session, string(model.EventChatMute), e)
}

func (s *Service) handleArchive(ctx context.Context, session *model.Session, e *events.Archive) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "archive").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat archive changed")

	s.sendWebhook(ctx, session, string(model.EventChatArchive), e)
}

func (s *Service) handlePin(ctx context.Context, session *model.Session, e *events.Pin) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "pin").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat pin changed")

	s.sendWebhook(ctx, session, string(model.EventChatPin), e)
}

func (s *Service) handleStar(ctx context.Context, session *model.Session, e *events.Star) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "star").
		Str("chat", e.ChatJID.String()).
		Str("message", e.MessageID).
		Time("timestamp", e.Timestamp).
		Msg("Message star changed")

	s.sendWebhook(ctx, session, string(model.EventChatStar), e)
}

func (s *Service) handleDeleteForMe(ctx context.Context, session *model.Session, e *events.DeleteForMe) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "delete_for_me").
		Str("chat", e.ChatJID.String()).
		Str("message", e.MessageID).
		Time("timestamp", e.Timestamp).
		Msg("Message deleted for me")

	s.sendWebhook(ctx, session, string(model.EventChatDeleteForMe), e)
}

func (s *Service) handleDeleteChat(ctx context.Context, session *model.Session, e *events.DeleteChat) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "delete_chat").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat deleted")

	s.sendWebhook(ctx, session, string(model.EventChatDelete), e)
}

func (s *Service) handleClearChat(ctx context.Context, session *model.Session, e *events.ClearChat) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "clear_chat").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat cleared")

	s.sendWebhook(ctx, session, string(model.EventChatClear), e)
}

func (s *Service) handleMarkChatAsRead(ctx context.Context, session *model.Session, e *events.MarkChatAsRead) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "mark_chat_as_read").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat marked as read")

	s.sendWebhook(ctx, session, string(model.EventChatMarkAsRead), e)
}

func (s *Service) handleLabelEdit(ctx context.Context, session *model.Session, e *events.LabelEdit) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "label_edit").
		Time("timestamp", e.Timestamp).
		Msg("Label edited")

	s.sendWebhook(ctx, session, string(model.EventLabelEdit), e)
}

func (s *Service) handleLabelAssociationChat(ctx context.Context, session *model.Session, e *events.LabelAssociationChat) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "label_association_chat").
		Str("jid", e.JID.String()).
		Str("labelID", e.LabelID).
		Time("timestamp", e.Timestamp).
		Msg("Label association changed")

	s.sendWebhook(ctx, session, string(model.EventLabelAssociation), e)
}
