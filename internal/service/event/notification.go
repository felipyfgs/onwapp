package event

import (
	"context"

	"go.mau.fi/whatsmeow/types/events"

	"onwapp/internal/logger"
	"onwapp/internal/model"
)

// Call events

func (s *Service) handleCallOffer(ctx context.Context, session *model.Session, e *events.CallOffer) {
	logger.Info().
		Str("session", session.Session).
		Str("event", "call_offer").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Call offer received")

	s.sendWebhook(ctx, session, string(model.EventCallOffer), e)
}

func (s *Service) handleCallOfferNotice(ctx context.Context, session *model.Session, e *events.CallOfferNotice) {
	logger.Info().
		Str("session", session.Session).
		Str("event", "call_offer_notice").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Str("media", e.Media).
		Str("type", e.Type).
		Msg("Call offer notice received")

	s.sendWebhook(ctx, session, string(model.EventCallOfferNotice), e)
}

func (s *Service) handleCallAccept(ctx context.Context, session *model.Session, e *events.CallAccept) {
	logger.Info().
		Str("session", session.Session).
		Str("event", "call_accept").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Call accepted")

	s.sendWebhook(ctx, session, string(model.EventCallAccept), e)
}

func (s *Service) handleCallPreAccept(ctx context.Context, session *model.Session, e *events.CallPreAccept) {
	logger.Info().
		Str("session", session.Session).
		Str("event", "call_pre_accept").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Call pre-accepted")

	s.sendWebhook(ctx, session, string(model.EventCallPreAccept), e)
}

func (s *Service) handleCallReject(ctx context.Context, session *model.Session, e *events.CallReject) {
	logger.Info().
		Str("session", session.Session).
		Str("event", "call_reject").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Call rejected")

	s.sendWebhook(ctx, session, string(model.EventCallReject), e)
}

func (s *Service) handleCallTerminate(ctx context.Context, session *model.Session, e *events.CallTerminate) {
	logger.Info().
		Str("session", session.Session).
		Str("event", "call_terminate").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Str("reason", e.Reason).
		Msg("Call terminated")

	s.sendWebhook(ctx, session, string(model.EventCallTerminate), e)
}

func (s *Service) handleCallTransport(ctx context.Context, session *model.Session, e *events.CallTransport) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "call_transport").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Call transport")

	s.sendWebhook(ctx, session, string(model.EventCallTransport), e)
}

func (s *Service) handleCallRelayLatency(ctx context.Context, session *model.Session, e *events.CallRelayLatency) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "call_relay_latency").
		Str("callId", e.CallID).
		Msg("Call relay latency")

	s.sendWebhook(ctx, session, string(model.EventCallRelayLatency), e)
}

// Group events

func (s *Service) handleGroupInfo(ctx context.Context, session *model.Session, e *events.GroupInfo) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "group_info").
		Str("group", e.JID.String()).
		Str("notify", e.Notify).
		Msg("Group info changed")

	s.sendWebhook(ctx, session, string(model.EventGroupUpdate), e)
}

func (s *Service) handleJoinedGroup(ctx context.Context, session *model.Session, e *events.JoinedGroup) {
	logger.Info().
		Str("session", session.Session).
		Str("event", "joined_group").
		Str("group", e.JID.String()).
		Str("name", e.GroupInfo.GroupName.Name).
		Msg("Joined group")

	s.sendWebhook(ctx, session, string(model.EventGroupJoined), e)
}

// Newsletter events

func (s *Service) handleNewsletterJoin(ctx context.Context, session *model.Session, e *events.NewsletterJoin) {
	logger.Info().
		Str("session", session.Session).
		Str("event", "newsletter_join").
		Str("id", e.ID.String()).
		Msg("Newsletter joined")
}

func (s *Service) handleNewsletterLeave(ctx context.Context, session *model.Session, e *events.NewsletterLeave) {
	logger.Info().
		Str("session", session.Session).
		Str("event", "newsletter_leave").
		Str("id", e.ID.String()).
		Msg("Newsletter left")
}

func (s *Service) handleNewsletterMuteChange(ctx context.Context, session *model.Session, e *events.NewsletterMuteChange) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "newsletter_mute_change").
		Str("id", e.ID.String()).
		Msg("Newsletter mute changed")
}

func (s *Service) handleNewsletterLiveUpdate(ctx context.Context, session *model.Session, e *events.NewsletterLiveUpdate) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "newsletter_live_update").
		Str("id", e.JID.String()).
		Msg("Newsletter live update")
}

// Contact events

func (s *Service) handlePushName(ctx context.Context, session *model.Session, e *events.PushName) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "push_name").
		Str("jid", e.JID.String()).
		Str("oldName", e.OldPushName).
		Str("newName", e.NewPushName).
		Msg("Push name changed")

	s.sendWebhook(ctx, session, string(model.EventContactPushName), e)
}

func (s *Service) handlePicture(ctx context.Context, session *model.Session, e *events.Picture) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "picture").
		Str("jid", e.JID.String()).
		Bool("removed", e.Remove).
		Msg("Picture changed")

	s.sendWebhook(ctx, session, string(model.EventContactPicture), e)
}

func (s *Service) handleContact(ctx context.Context, session *model.Session, e *events.Contact) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "contact").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Contact updated")

	s.sendWebhook(ctx, session, string(model.EventContactUpdate), e)
}

func (s *Service) handleBusinessName(ctx context.Context, session *model.Session, e *events.BusinessName) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "business_name").
		Str("jid", e.JID.String()).
		Str("oldName", e.OldBusinessName).
		Str("newName", e.NewBusinessName).
		Msg("Business name changed")

	s.sendWebhook(ctx, session, string(model.EventContactBusinessName), e)
}

// Privacy events

func (s *Service) handleIdentityChange(ctx context.Context, session *model.Session, e *events.IdentityChange) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "identity_change").
		Str("jid", e.JID.String()).
		Bool("implicit", e.Implicit).
		Msg("Identity changed")
}

func (s *Service) handlePrivacySettings(ctx context.Context, session *model.Session, e *events.PrivacySettings) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "privacy_settings").
		Msg("Privacy settings changed")
}

func (s *Service) handleBlocklist(ctx context.Context, session *model.Session, e *events.Blocklist) {
	logger.Debug().
		Str("session", session.Session).
		Str("event", "blocklist").
		Str("action", string(e.Action)).
		Int("count", len(e.Changes)).
		Msg("Blocklist changed")
}
