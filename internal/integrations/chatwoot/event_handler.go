package chatwoot

import (
	"context"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// EventHandler handles WhatsApp events for Chatwoot integration
type EventHandler struct {
	service *Service
}

// NewEventHandler creates a new Chatwoot event handler
func NewEventHandler(svc *Service) *EventHandler {
	return &EventHandler{service: svc}
}

// HandleEvent processes WhatsApp events and forwards to Chatwoot
func (h *EventHandler) HandleEvent(session *model.Session, evt interface{}) {
	ctx := context.Background()

	switch e := evt.(type) {
	case *events.Message:
		h.handleMessage(ctx, session, e)
	case *events.Receipt:
		h.handleReceipt(ctx, session, e)
	}
}

func (h *EventHandler) handleMessage(ctx context.Context, session *model.Session, evt *events.Message) {
	// Skip sender key distribution messages
	if evt.Message.GetSenderKeyDistributionMessage() != nil {
		return
	}

	// Skip protocol messages (deletes, etc.) but NOT reactions
	if evt.Message.GetProtocolMessage() != nil {
		return
	}

	// Handle reactions separately - process them instead of skipping
	if reaction := evt.Message.GetReactionMessage(); reaction != nil {
		h.handleReactionMessage(ctx, session, evt, reaction)
		return
	}

	// Skip edits
	if evt.IsEdit {
		return
	}

	// Process outgoing messages (from me) - sync to Chatwoot
	if evt.Info.IsFromMe {
		if err := h.service.ProcessOutgoingMessage(ctx, session, evt); err != nil {
			logger.Warn().
				Err(err).
				Str("session", session.Name).
				Str("messageId", evt.Info.ID).
				Msg("Failed to process outgoing message for Chatwoot")
		}
		return
	}

	// Process incoming message
	if err := h.service.ProcessIncomingMessage(ctx, session, evt); err != nil {
		logger.Warn().
			Err(err).
			Str("session", session.Name).
			Str("messageId", evt.Info.ID).
			Msg("Failed to process message for Chatwoot")
	}
}

func (h *EventHandler) handleReceipt(ctx context.Context, session *model.Session, evt *events.Receipt) {
	if err := h.service.ProcessReceipt(ctx, session, evt); err != nil {
		logger.Warn().
			Err(err).
			Str("session", session.Name).
			Msg("Failed to process receipt for Chatwoot")
	}
}

func (h *EventHandler) handleReactionMessage(ctx context.Context, session *model.Session, evt *events.Message, reaction *waE2E.ReactionMessage) {
	emoji := reaction.GetText()
	// Skip empty reactions (reaction removals)
	if emoji == "" {
		return
	}

	targetMsgID := reaction.GetKey().GetID()
	remoteJid := evt.Info.Chat.String()
	senderJid := evt.Info.Sender.String()
	isFromMe := evt.Info.IsFromMe

	if err := h.service.ProcessReactionMessage(ctx, session, emoji, targetMsgID, remoteJid, senderJid, isFromMe); err != nil {
		logger.Warn().
			Err(err).
			Str("session", session.Name).
			Str("emoji", emoji).
			Str("targetMsgId", targetMsgID).
			Bool("isFromMe", isFromMe).
			Msg("Failed to process reaction message for Chatwoot")
	}
}
