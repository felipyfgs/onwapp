package service

import (
	"context"
	"encoding/json"
	"fmt"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"

	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
	"zpwoot/internal/queue"
)

// ProcessIncomingFromQueue processes an incoming message from the queue
func (s *Service) ProcessIncomingFromQueue(ctx context.Context, sessionID, sessionName string, data *queue.WAToCWMessage) error {
	session := &model.Session{
		ID:   sessionID,
		Name: sessionName,
	}

	// Deserialize the raw protobuf message
	msg := &waE2E.Message{}
	if err := proto.Unmarshal(data.RawEvent, msg); err != nil {
		return fmt.Errorf("failed to unmarshal protobuf message: %w", err)
	}

	// Parse JIDs
	chatJID, err := types.ParseJID(data.ChatJID)
	if err != nil {
		return fmt.Errorf("failed to parse chat JID: %w", err)
	}

	senderJID, _ := types.ParseJID(data.SenderJID)

	// Reconstruct the event
	evt := &events.Message{
		Info: types.MessageInfo{
			MessageSource: types.MessageSource{
				Chat:     chatJID,
				Sender:   senderJID,
				IsFromMe: data.IsFromMe,
				IsGroup:  data.IsGroup,
			},
			ID:       data.MessageID,
			PushName: data.PushName,
		},
		Message: msg,
	}

	return s.ProcessIncomingMessage(ctx, session, evt)
}

// ProcessOutgoingFromQueue processes an outgoing message from the queue
func (s *Service) ProcessOutgoingFromQueue(ctx context.Context, sessionID, sessionName string, data *queue.WAToCWMessage) error {
	session := &model.Session{
		ID:   sessionID,
		Name: sessionName,
	}

	// Deserialize the raw protobuf message
	msg := &waE2E.Message{}
	if err := proto.Unmarshal(data.RawEvent, msg); err != nil {
		return fmt.Errorf("failed to unmarshal protobuf message: %w", err)
	}

	// Parse JIDs
	chatJID, err := types.ParseJID(data.ChatJID)
	if err != nil {
		return fmt.Errorf("failed to parse chat JID: %w", err)
	}

	senderJID, _ := types.ParseJID(data.SenderJID)

	// Reconstruct the event
	evt := &events.Message{
		Info: types.MessageInfo{
			MessageSource: types.MessageSource{
				Chat:     chatJID,
				Sender:   senderJID,
				IsFromMe: data.IsFromMe,
				IsGroup:  data.IsGroup,
			},
			ID:       data.MessageID,
			PushName: data.PushName,
		},
		Message: msg,
	}

	return s.ProcessOutgoingMessage(ctx, session, evt)
}

// ProcessReactionFromQueue processes a reaction message from the queue
func (s *Service) ProcessReactionFromQueue(ctx context.Context, sessionID, sessionName string, data *queue.WAToCWReactionMessage) error {
	session := &model.Session{
		ID:   sessionID,
		Name: sessionName,
	}

	return s.ProcessReactionMessage(ctx, session, data.Emoji, data.TargetMsgID, data.ChatJID, data.SenderJID, data.IsFromMe)
}

// ProcessDeleteFromQueue processes a message deletion from the queue
func (s *Service) ProcessDeleteFromQueue(ctx context.Context, sessionID, sessionName string, data *queue.WAToCWDeleteMessage) error {
	session := &model.Session{
		ID:   sessionID,
		Name: sessionName,
	}

	return s.ProcessMessageDelete(ctx, session, data.DeletedMsgID)
}

// RegisterQueueHandlers registers all queue handlers for WhatsApp -> Chatwoot messages
func RegisterQueueHandlers(queueSvc *queue.Service, chatwootSvc *Service) {
	if queueSvc == nil || !queueSvc.IsEnabled() {
		return
	}

	// Handler for incoming messages (WhatsApp -> Chatwoot)
	queueSvc.RegisterHandler(queue.MsgTypeIncoming, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.WAToCWMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal WAToCWMessage: %w", err)
		}

		logger.Debug().
			Str("sessionId", msg.SessionID).
			Str("messageId", data.MessageID).
			Msg("Processing incoming message from queue")

		return chatwootSvc.ProcessIncomingFromQueue(ctx, msg.SessionID, msg.SessionName, &data)
	})

	// Handler for outgoing messages sent directly from WhatsApp
	queueSvc.RegisterHandler(queue.MsgTypeOutgoingSent, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.WAToCWMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal WAToCWMessage: %w", err)
		}

		logger.Debug().
			Str("sessionId", msg.SessionID).
			Str("messageId", data.MessageID).
			Msg("Processing outgoing message from queue")

		return chatwootSvc.ProcessOutgoingFromQueue(ctx, msg.SessionID, msg.SessionName, &data)
	})

	// Handler for reactions
	queueSvc.RegisterHandler(queue.MsgTypeReaction, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.WAToCWReactionMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal WAToCWReactionMessage: %w", err)
		}

		logger.Debug().
			Str("sessionId", msg.SessionID).
			Str("emoji", data.Emoji).
			Str("targetMsgId", data.TargetMsgID).
			Msg("Processing reaction from queue")

		return chatwootSvc.ProcessReactionFromQueue(ctx, msg.SessionID, msg.SessionName, &data)
	})

	// Handler for message deletions
	queueSvc.RegisterHandler(queue.MsgTypeDelete, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.WAToCWDeleteMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal WAToCWDeleteMessage: %w", err)
		}

		logger.Debug().
			Str("sessionId", msg.SessionID).
			Str("deletedMsgId", data.DeletedMsgID).
			Msg("Processing message deletion from queue")

		return chatwootSvc.ProcessDeleteFromQueue(ctx, msg.SessionID, msg.SessionName, &data)
	})

	logger.Info().Msg("Registered WhatsApp -> Chatwoot queue handlers")
}

// RegisterCWToWAQueueHandlers registers queue handlers for Chatwoot -> WhatsApp messages
func RegisterCWToWAQueueHandlers(queueSvc *queue.Service, handler CWToWAHandler) {
	if queueSvc == nil || !queueSvc.IsEnabled() {
		return
	}

	// Handler for sending messages to WhatsApp
	queueSvc.RegisterHandler(queue.MsgTypeSendText, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.CWToWAMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal CWToWAMessage: %w", err)
		}

		logger.Debug().
			Str("sessionId", msg.SessionID).
			Str("chatJid", data.ChatJID).
			Int("cwMsgId", data.ChatwootMsgID).
			Msg("Processing Chatwoot->WhatsApp message from queue")

		return handler.SendToWhatsAppFromQueue(ctx, msg.SessionID, msg.SessionName, &data)
	})

	// Handler for sending media to WhatsApp
	queueSvc.RegisterHandler(queue.MsgTypeSendMedia, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.CWToWAMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal CWToWAMessage: %w", err)
		}

		logger.Debug().
			Str("sessionId", msg.SessionID).
			Str("chatJid", data.ChatJID).
			Int("attachments", len(data.Attachments)).
			Msg("Processing Chatwoot->WhatsApp media from queue")

		return handler.SendToWhatsAppFromQueue(ctx, msg.SessionID, msg.SessionName, &data)
	})

	logger.Info().Msg("Registered Chatwoot -> WhatsApp queue handlers")
}

// CWToWAHandler interface for handling Chatwoot -> WhatsApp messages
type CWToWAHandler interface {
	SendToWhatsAppFromQueue(ctx context.Context, sessionID, sessionName string, data *queue.CWToWAMessage) error
}

// QuotedMessageFromQueue converts queue QuotedInfo to core QuotedMessageInfo
func QuotedMessageFromQueue(qi *queue.QuotedInfo) *core.QuotedMessageInfo {
	if qi == nil {
		return nil
	}
	return &core.QuotedMessageInfo{
		MsgId:     qi.MsgID,
		ChatJID:   qi.ChatJID,
		SenderJID: qi.SenderJID,
		Content:   qi.Content,
		FromMe:    qi.FromMe,
	}
}
