package service

import (
	"context"
	"encoding/json"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"

	"zpwoot/internal/logger"
	"zpwoot/internal/model"
	"zpwoot/internal/queue"
)

// EventHandler handles WhatsApp events for Chatwoot integration
type EventHandler struct {
	service       *Service
	queueProducer *queue.Producer
}

// NewEventHandler creates a new Chatwoot event handler
func NewEventHandler(svc *Service) *EventHandler {
	return &EventHandler{service: svc}
}

// SetQueueProducer sets the queue producer for async message processing
func (h *EventHandler) SetQueueProducer(producer *queue.Producer) {
	h.queueProducer = producer
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
	if evt.Message.GetSenderKeyDistributionMessage() != nil {
		return
	}

	if protoMsg := evt.Message.GetProtocolMessage(); protoMsg != nil {
		if protoMsg.GetType() == waE2E.ProtocolMessage_REVOKE {
			h.handleMessageDelete(ctx, session, evt, protoMsg)
		}
		return
	}

	if reaction := evt.Message.GetReactionMessage(); reaction != nil {
		h.handleReactionMessage(ctx, session, evt, reaction)
		return
	}

	if evt.IsEdit {
		return
	}

	// Skip outgoing messages that were just sent from Chatwoot webhook
	// This prevents duplicate processing when emitSentMessageEvent triggers
	if evt.Info.IsFromMe {
		chatJID := evt.Info.Chat.String()
		if IsPendingSentFromChatwoot(session.ID, chatJID) {
			logger.Debug().
				Str("session", session.SessionId).
				Str("messageId", evt.Info.ID).
				Str("chatJid", chatJID).
				Msg("Chatwoot: skipping outgoing message (sent from Chatwoot webhook)")
			return
		}
	}

	// Use queue if available, otherwise process directly
	if h.queueProducer != nil && h.queueProducer.IsConnected() {
		h.enqueueMessage(ctx, session, evt)
		return
	}

	// Fallback to direct processing
	if evt.Info.IsFromMe {
		if err := h.service.ProcessOutgoingMessage(ctx, session, evt); err != nil {
			logger.Warn().
				Err(err).
				Str("session", session.SessionId).
				Str("messageId", evt.Info.ID).
				Msg("Failed to process outgoing message for Chatwoot")
		}
		return
	}

	if err := h.service.ProcessIncomingMessage(ctx, session, evt); err != nil {
		logger.Warn().
			Err(err).
			Str("session", session.SessionId).
			Str("messageId", evt.Info.ID).
			Msg("Failed to process message for Chatwoot")
	}
}

// enqueueMessage serializes and enqueues a WhatsApp message for async processing
func (h *EventHandler) enqueueMessage(ctx context.Context, session *model.Session, evt *events.Message) {
	// Serialize the raw protobuf message for Chatwoot processing
	rawEvent, err := proto.Marshal(evt.Message)
	if err != nil {
		logger.Warn().Err(err).Str("messageId", evt.Info.ID).Msg("Failed to serialize message for queue, falling back to direct processing")
		h.processDirectly(ctx, session, evt)
		return
	}

	// Serialize the full event JSON for webhook payload
	fullEventJSON, err := json.Marshal(evt)
	if err != nil {
		logger.Warn().Err(err).Str("messageId", evt.Info.ID).Msg("Failed to serialize full event JSON")
		fullEventJSON = nil
	}

	isGroup := evt.Info.Chat.Server == "g.us"
	participantID := ""
	if isGroup && evt.Info.Sender.String() != "" {
		participantID = evt.Info.Sender.String()
	}

	queueMsg := &queue.WAToCWMessage{
		MessageID:     evt.Info.ID,
		ChatJID:       evt.Info.Chat.String(),
		SenderJID:     evt.Info.Sender.String(),
		PushName:      evt.Info.PushName,
		IsFromMe:      evt.Info.IsFromMe,
		IsGroup:       isGroup,
		ParticipantID: participantID,
		RawEvent:      rawEvent,
		FullEventJSON: fullEventJSON,
	}

	// Extract content for logging/debugging
	queueMsg.Content = h.service.extractMessageContent(evt)

	msgType := queue.MsgTypeIncoming
	if evt.Info.IsFromMe {
		msgType = queue.MsgTypeOutgoingSent
	}

	if err := h.queueProducer.PublishWAToCW(ctx, session.ID, session.SessionId, msgType, queueMsg); err != nil {
		logger.Warn().
			Err(err).
			Str("session", session.SessionId).
			Str("messageId", evt.Info.ID).
			Msg("Failed to enqueue message, falling back to direct processing")
		h.processDirectly(ctx, session, evt)
		return
	}

	logger.Debug().
		Str("session", session.SessionId).
		Str("messageId", evt.Info.ID).
		Bool("isFromMe", evt.Info.IsFromMe).
		Msg("Message enqueued for Chatwoot processing")
}

// processDirectly processes the message without queue (fallback)
func (h *EventHandler) processDirectly(ctx context.Context, session *model.Session, evt *events.Message) {
	if evt.Info.IsFromMe {
		if err := h.service.ProcessOutgoingMessage(ctx, session, evt); err != nil {
			logger.Warn().
				Err(err).
				Str("session", session.SessionId).
				Str("messageId", evt.Info.ID).
				Msg("Failed to process outgoing message for Chatwoot")
		}
		return
	}

	if err := h.service.ProcessIncomingMessage(ctx, session, evt); err != nil {
		logger.Warn().
			Err(err).
			Str("session", session.SessionId).
			Str("messageId", evt.Info.ID).
			Msg("Failed to process message for Chatwoot")
	}
}

func (h *EventHandler) handleReceipt(ctx context.Context, session *model.Session, evt *events.Receipt) {
	if err := h.service.ProcessReceipt(ctx, session, evt); err != nil {
		logger.Warn().
			Err(err).
			Str("session", session.SessionId).
			Msg("Failed to process receipt for Chatwoot")
	}
}

func (h *EventHandler) handleReactionMessage(ctx context.Context, session *model.Session, evt *events.Message, reaction *waE2E.ReactionMessage) {
	emoji := reaction.GetText()
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
			Str("session", session.SessionId).
			Str("emoji", emoji).
			Str("targetMsgId", targetMsgID).
			Bool("isFromMe", isFromMe).
			Msg("Failed to process reaction message for Chatwoot")
	}
}

func (h *EventHandler) handleMessageDelete(ctx context.Context, session *model.Session, evt *events.Message, proto *waE2E.ProtocolMessage) {
	key := proto.GetKey()
	if key == nil {
		return
	}

	deletedMsgID := key.GetID()
	if deletedMsgID == "" {
		return
	}

	if err := h.service.ProcessMessageDelete(ctx, session, deletedMsgID); err != nil {
		logger.Warn().
			Err(err).
			Str("session", session.SessionId).
			Str("deletedMsgId", deletedMsgID).
			Msg("Failed to process message deletion for Chatwoot")
	}
}
