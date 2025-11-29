package chatwoot

import (
	"context"

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

	// Skip protocol messages (reactions, deletes, etc.)
	if evt.Message.GetProtocolMessage() != nil {
		return
	}

	// Skip reactions
	if evt.Message.GetReactionMessage() != nil {
		return
	}

	// Skip edits
	if evt.IsEdit {
		return
	}

	// Skip outgoing messages (from me)
	if evt.Info.IsFromMe {
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
