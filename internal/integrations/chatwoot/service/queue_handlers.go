package service

import (
	"context"
	"encoding/json"
	"fmt"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"

	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/logger"
	"onwapp/internal/model"
	"onwapp/internal/queue"
)

func (s *Service) ProcessIncomingFromQueue(ctx context.Context, sessionID string, data *queue.WAToCWMessage) error {
	sessionName := data.SessionName
	if sessionName == "" {
		sessionName = sessionID // Fallback to sessionID if SessionName is not set
	}

	session := &model.Session{
		ID:      sessionID,
		Session: sessionName,
	}

	msg := &waE2E.Message{}
	if err := proto.Unmarshal(data.RawEvent, msg); err != nil {
		return fmt.Errorf("failed to unmarshal protobuf message: %w", err)
	}

	chatJID, err := types.ParseJID(data.ChatJID)
	if err != nil {
		return fmt.Errorf("failed to parse chat JID: %w", err)
	}

	senderJID, _ := types.ParseJID(data.SenderJID)

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

	cwMsgID, cwConvID, cfg, err := s.processIncomingMessageInternal(ctx, session, evt)
	if err != nil {
		return err
	}

	if cfg != nil && cwMsgID > 0 {
		s.sendWebhookWithPreserializedJSON(ctx, session, cfg, data.IsFromMe, data.FullEventJSON, cwMsgID, cwConvID)
	}

	return nil
}

func (s *Service) ProcessOutgoingFromQueue(ctx context.Context, sessionID string, data *queue.WAToCWMessage) error {
	sessionName := data.SessionName
	if sessionName == "" {
		sessionName = sessionID // Fallback to sessionID if SessionName is not set
	}

	session := &model.Session{
		ID:      sessionID,
		Session: sessionName,
	}

	msg := &waE2E.Message{}
	if err := proto.Unmarshal(data.RawEvent, msg); err != nil {
		return fmt.Errorf("failed to unmarshal protobuf message: %w", err)
	}

	chatJID, err := types.ParseJID(data.ChatJID)
	if err != nil {
		return fmt.Errorf("failed to parse chat JID: %w", err)
	}

	senderJID, _ := types.ParseJID(data.SenderJID)

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

	cwMsgID, cwConvID, cfg, err := s.processOutgoingMessageInternal(ctx, session, evt)
	if err != nil {
		return err
	}

	if cfg != nil && cwMsgID > 0 {
		s.sendWebhookWithPreserializedJSON(ctx, session, cfg, data.IsFromMe, data.FullEventJSON, cwMsgID, cwConvID)
	}

	return nil
}

func (s *Service) ProcessReactionFromQueue(ctx context.Context, sessionID string, data *queue.WAToCWReactionMessage) error {
	session := &model.Session{
		ID:      sessionID,
		Session: sessionID,
	}

	return s.ProcessReactionMessage(ctx, session, data.Emoji, data.TargetMsgID, data.ChatJID, data.SenderJID, data.IsFromMe)
}

func (s *Service) ProcessDeleteFromQueue(ctx context.Context, sessionID string, data *queue.WAToCWDeleteMessage) error {
	session := &model.Session{
		ID:      sessionID,
		Session: sessionID,
	}

	return s.ProcessMessageDelete(ctx, session, data.DeletedMsgID)
}

func RegisterQueueHandlers(queueSvc *queue.Service, chatwootSvc *Service) {
	if queueSvc == nil || !queueSvc.IsEnabled() {
		return
	}

	queueSvc.RegisterHandler(queue.MsgTypeIncoming, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.WAToCWMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal WAToCWMessage: %w", err)
		}

		logger.Chatwoot().Debug().
			Str("sessionId", msg.SessionID).
			Str("messageId", data.MessageID).
			Msg("Processing incoming message from queue")

		return chatwootSvc.ProcessIncomingFromQueue(ctx, msg.SessionID, &data)
	})

	queueSvc.RegisterHandler(queue.MsgTypeOutgoingSent, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.WAToCWMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal WAToCWMessage: %w", err)
		}

		logger.Chatwoot().Debug().
			Str("sessionId", msg.SessionID).
			Str("messageId", data.MessageID).
			Msg("Processing outgoing message from queue")

		return chatwootSvc.ProcessOutgoingFromQueue(ctx, msg.SessionID, &data)
	})

	queueSvc.RegisterHandler(queue.MsgTypeReaction, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.WAToCWReactionMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal WAToCWReactionMessage: %w", err)
		}

		logger.Chatwoot().Debug().
			Str("sessionId", msg.SessionID).
			Str("emoji", data.Emoji).
			Str("targetMsgId", data.TargetMsgID).
			Msg("Processing reaction from queue")

		return chatwootSvc.ProcessReactionFromQueue(ctx, msg.SessionID, &data)
	})

	queueSvc.RegisterHandler(queue.MsgTypeDelete, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.WAToCWDeleteMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal WAToCWDeleteMessage: %w", err)
		}

		logger.Chatwoot().Debug().
			Str("sessionId", msg.SessionID).
			Str("deletedMsgId", data.DeletedMsgID).
			Msg("Processing message deletion from queue")

		return chatwootSvc.ProcessDeleteFromQueue(ctx, msg.SessionID, &data)
	})

	logger.Chatwoot().Info().Msg("Registered WhatsApp -> Chatwoot queue handlers")
}

func RegisterCWToWAQueueHandlers(queueSvc *queue.Service, handler CWToWAHandler) {
	if queueSvc == nil || !queueSvc.IsEnabled() {
		return
	}

	queueSvc.RegisterHandler(queue.MsgTypeSendText, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.CWToWAMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal CWToWAMessage: %w", err)
		}

		cacheKey := fmt.Sprintf("cw2wa:text:%s:%d", msg.SessionID, data.ChatwootMsgID)
		if !TryAcquireCWToWAProcessing(cacheKey) {
			logger.Chatwoot().Debug().
				Str("sessionId", msg.SessionID).
				Int("cwMsgId", data.ChatwootMsgID).
				Msg("Chatwoot->WhatsApp: skipping duplicate text (already processed or processing)")
			return nil
		}

		logger.Chatwoot().Debug().
			Str("sessionId", msg.SessionID).
			Str("chatJid", data.ChatJID).
			Int("cwMsgId", data.ChatwootMsgID).
			Msg("Processing Chatwoot->WhatsApp message from queue")

		return handler.SendToWhatsAppFromQueue(ctx, msg.SessionID, &data)
	})

	queueSvc.RegisterHandler(queue.MsgTypeSendMedia, func(ctx context.Context, msg *queue.QueueMessage) error {
		var data queue.CWToWAMessage
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return fmt.Errorf("failed to unmarshal CWToWAMessage: %w", err)
		}

		cacheKey := fmt.Sprintf("cw2wa:media:%s:%d", msg.SessionID, data.ChatwootMsgID)
		if !TryAcquireCWToWAProcessing(cacheKey) {
			logger.Chatwoot().Debug().
				Str("sessionId", msg.SessionID).
				Int("cwMsgId", data.ChatwootMsgID).
				Int("attachments", len(data.Attachments)).
				Msg("Chatwoot->WhatsApp: skipping duplicate media (already processed or processing)")
			return nil
		}

		logger.Chatwoot().Debug().
			Str("sessionId", msg.SessionID).
			Str("chatJid", data.ChatJID).
			Int("attachments", len(data.Attachments)).
			Msg("Processing Chatwoot->WhatsApp media from queue")

		return handler.SendToWhatsAppFromQueue(ctx, msg.SessionID, &data)
	})

	logger.Chatwoot().Info().Msg("Registered Chatwoot -> WhatsApp queue handlers")
}

type CWToWAHandler interface {
	SendToWhatsAppFromQueue(ctx context.Context, sessionID string, data *queue.CWToWAMessage) error
}

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
