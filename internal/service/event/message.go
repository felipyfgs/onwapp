package event

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"onwapp/internal/logger"
	"onwapp/internal/model"
)

func (s *Service) handleMessage(ctx context.Context, session *model.Session, e *events.Message) {
	if e.Message.GetSenderKeyDistributionMessage() != nil {
		return
	}

	if reaction := e.Message.GetReactionMessage(); reaction != nil {
		s.handleReaction(ctx, session, e, reaction)
		return
	}

	if proto := e.Message.GetProtocolMessage(); proto != nil {
		s.handleProtocolMessage(ctx, session, e, proto)
		return
	}

	if e.IsEdit {
		s.handleMessageEdit(ctx, session, e)
		return
	}

	msgType, content := s.extractMessageTypeAndContent(e.Message)

	if msgType == "unknown" && content == "" {
		return
	}

	isStatusBroadcast := e.Info.Chat.String() == "status@broadcast"
	logEvent := logger.WPP().Info()
	if isStatusBroadcast {
		logEvent = logger.WPP().Debug()
	}
	logBuilder := logEvent.
		Str("session", session.Session).
		Str("event", "message").
		Str("type", msgType).
		Str("from", e.Info.Sender.String()).
		Str("chat", e.Info.Chat.String()).
		Str("id", e.Info.ID)
	if !isStatusBroadcast {
		logBuilder = logBuilder.Interface("raw", e)
	}
	logBuilder.Msg("Message received")

	rawEvent, _ := json.Marshal(e)

	var deliveredAt *time.Time
	status := model.MessageStatusSent
	if !e.Info.IsFromMe {
		status = model.MessageStatusDelivered
		ts := e.Info.Timestamp
		deliveredAt = &ts
	}

	msg := &model.Message{
		SessionID:    session.ID,
		MsgId:        e.Info.ID,
		ChatJID:      e.Info.Chat.String(),
		SenderJID:    e.Info.Sender.String(),
		Timestamp:    e.Info.Timestamp,
		PushName:     e.Info.PushName,
		SenderAlt:    e.Info.SenderAlt.String(),
		Type:         msgType,
		MediaType:    e.Info.MediaType,
		Category:     e.Info.Category,
		Content:      content,
		FromMe:       e.Info.IsFromMe,
		IsGroup:      e.Info.IsGroup,
		Ephemeral:    e.IsEphemeral,
		ViewOnce:     e.IsViewOnce || e.IsViewOnceV2,
		IsEdit:       false,
		EditTargetID: "",
		QuotedID:     extractQuotedID(e.Message),
		QuotedSender: extractQuotedSender(e.Message),
		Status:       status,
		DeliveredAt:  deliveredAt,
		RawEvent:     rawEvent,
	}

	if _, err := s.database.Messages.Save(ctx, msg); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Str("messageId", e.Info.ID).Msg("Failed to save message")
	}

	// Update conversation timestamp so chat appears at top of list
	if err := s.database.Chats.UpdateConversationTimestamp(ctx, session.ID, e.Info.Chat.String(), e.Info.Timestamp.Unix()); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Str("chat", e.Info.Chat.String()).Msg("Failed to update conversation timestamp")
	}

	// Increment unread count for received messages (not from us)
	if !e.Info.IsFromMe {
		if err := s.database.Chats.IncrementUnreadCount(ctx, session.ID, e.Info.Chat.String()); err != nil {
			logger.WPP().Warn().Err(err).Str("session", session.Session).Str("chat", e.Info.Chat.String()).Msg("Failed to increment unread count")
		}
	}

	if media := s.extractMediaInfo(session.ID, e.Info.ID, e.Message); media != nil {
		if _, err := s.database.Media.Save(ctx, media); err != nil {
			logger.WPP().Warn().Err(err).Str("session", session.Session).Str("messageId", e.Info.ID).Msg("Failed to save media info")
		} else {
			if s.mediaService != nil && session.Client != nil {
				go func(m *model.Media, client *model.Session) {
					downloadCtx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
					defer cancel()

					savedMedia, err := s.database.Media.GetByMsgID(downloadCtx, m.SessionID, m.MsgID)
					if err != nil || savedMedia == nil {
						logger.WPP().Warn().Err(err).Str("msgId", m.MsgID).Msg("Failed to get saved media for download")
						return
					}

					if err := s.mediaService.DownloadAndStore(downloadCtx, client.Client, savedMedia, client.Session); err != nil {
						logger.WPP().Warn().Err(err).Str("msgId", m.MsgID).Msg("Failed to download media to storage")
					}
				}(media, session)
			}
		}
	}

	s.sendWebhook(ctx, session, string(model.EventMessageReceived), e)
}

func (s *Service) handleReaction(ctx context.Context, session *model.Session, e *events.Message, reaction *waE2E.ReactionMessage) {
	targetMsgID := reaction.GetKey().GetID()
	emoji := reaction.GetText()
	senderJid := e.Info.Sender.String()
	timestamp := e.Info.Timestamp

	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "reaction").
		Str("target", targetMsgID).
		Str("emoji", emoji).
		Str("from", senderJid).
		Msg("Reaction received")

	action := "add"
	if emoji == "" {
		action = "remove"
	}

	data, _ := json.Marshal(map[string]interface{}{
		"action":    action,
		"emoji":     emoji,
		"timestamp": reaction.GetSenderTimestampMS(),
	})

	update := &model.MessageUpdate{
		SessionID: session.ID,
		MsgID:     targetMsgID,
		Type:      model.UpdateTypeReaction,
		Actor:     senderJid,
		Data:      data,
		EventAt:   timestamp,
	}

	if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
		logger.WPP().Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to save reaction update")
	}

	if emoji != "" {
		if err := s.database.Messages.AddReaction(ctx, session.ID, targetMsgID, emoji, senderJid, timestamp.Unix()); err != nil {
			logger.WPP().Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to add reaction to message")
		}
	} else {
		if err := s.database.Messages.RemoveReaction(ctx, session.ID, targetMsgID, senderJid); err != nil {
			logger.WPP().Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to remove reaction from message")
		}
	}

	s.sendWebhook(ctx, session, string(model.EventMessageReaction), e)
}

func (s *Service) handleProtocolMessage(ctx context.Context, session *model.Session, e *events.Message, proto *waE2E.ProtocolMessage) {
	protoType := proto.GetType()

	if protoType == waE2E.ProtocolMessage_REVOKE {
		targetMsgID := proto.GetKey().GetID()
		senderJid := e.Info.Sender.String()

		logger.WPP().Info().
			Str("session", session.Session).
			Str("event", "message_delete").
			Str("target", targetMsgID).
			Str("from", senderJid).
			Msg("Message deleted")

		data, _ := json.Marshal(map[string]interface{}{
			"deletedBy": senderJid,
			"fromMe":    e.Info.IsFromMe,
		})

		update := &model.MessageUpdate{
			SessionID: session.ID,
			MsgID:     targetMsgID,
			Type:      model.UpdateTypeDelete,
			Actor:     senderJid,
			Data:      data,
			EventAt:   e.Info.Timestamp,
		}

		if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
			logger.WPP().Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to save delete update")
		}

		s.sendWebhook(ctx, session, string(model.EventMessageDeleted), e)
		return
	}

	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "protocol_message").
		Str("type", protoType.String()).
		Interface("raw", e).
		Msg("Protocol message received")
}

func (s *Service) handleMessageEdit(ctx context.Context, session *model.Session, e *events.Message) {
	targetMsgID := e.Info.MsgBotInfo.EditTargetID
	if targetMsgID == "" {
		targetMsgID = e.Info.ID
	}
	senderJid := e.Info.Sender.String()
	msgType, newContent := s.extractMessageTypeAndContent(e.Message)

	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "message_edit").
		Str("target", targetMsgID).
		Str("from", senderJid).
		Str("newContent", newContent).
		Msg("Message edited")

	data, _ := json.Marshal(map[string]interface{}{
		"type":       msgType,
		"newContent": newContent,
		"editMsgId":  e.Info.ID,
	})

	update := &model.MessageUpdate{
		SessionID: session.ID,
		MsgID:     targetMsgID,
		Type:      model.UpdateTypeEdit,
		Actor:     senderJid,
		Data:      data,
		EventAt:   e.Info.Timestamp,
	}

	if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
		logger.WPP().Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to save edit update")
	}

	s.sendWebhook(ctx, session, string(model.EventMessageEdited), e)
}

func (s *Service) handleReceipt(ctx context.Context, session *model.Session, e *events.Receipt) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "receipt").
		Str("type", string(e.Type)).
		Str("from", e.Sender.String()).
		Str("chat", e.Chat.String()).
		Int("messageCount", len(e.MessageIDs)).
		Msg("Receipt received")

	var status model.MessageStatus
	var updateType model.UpdateType
	switch e.Type {
	case types.ReceiptTypeDelivered:
		status = model.MessageStatusDelivered
		updateType = model.UpdateTypeDelivered
	case types.ReceiptTypeRead:
		status = model.MessageStatusRead
		updateType = model.UpdateTypeRead
	case types.ReceiptTypePlayed:
		status = model.MessageStatusPlayed
		updateType = model.UpdateTypePlayed
	default:
		s.sendWebhook(ctx, session, string(model.EventMessageReceipt), e)
		return
	}

	for _, msgID := range e.MessageIDs {
		if err := s.database.Messages.UpdateStatus(ctx, session.ID, msgID, status); err != nil {
			logger.WPP().Warn().Err(err).
				Str("session", session.Session).
				Str("messageId", msgID).
				Str("status", string(status)).
				Msg("Failed to update message status from receipt")
		}

		data, _ := json.Marshal(map[string]interface{}{
			"chat":      e.Chat.String(),
			"timestamp": e.Timestamp.UnixMilli(),
		})

		update := &model.MessageUpdate{
			SessionID: session.ID,
			MsgID:     msgID,
			Type:      updateType,
			Actor:     e.Sender.String(),
			Data:      data,
			EventAt:   e.Timestamp,
		}

		if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
			logger.WPP().Warn().Err(err).Str("msgId", msgID).Msg("Failed to save receipt update")
		}
	}

	s.sendWebhook(ctx, session, string(model.EventMessageReceipt), e)
}

func (s *Service) handleUndecryptableMessage(ctx context.Context, session *model.Session, e *events.UndecryptableMessage) {
	logger.WPP().Warn().
		Str("session", session.Session).
		Str("event", "undecryptable_message").
		Str("from", e.Info.Sender.String()).
		Str("chat", e.Info.Chat.String()).
		Bool("isUnavailable", e.IsUnavailable).
		Msg("Undecryptable message received")

	s.sendWebhook(ctx, session, string(model.EventMessageUndecryptable), e)
}

func (s *Service) handleMediaRetry(ctx context.Context, session *model.Session, e *events.MediaRetry) {
	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "media_retry").
		Str("messageId", e.MessageID).
		Str("chat", e.ChatID.String()).
		Bool("hasError", e.Error != nil).
		Msg("Media retry response received")

	if s.mediaService != nil && session.Client != nil {
		if err := s.mediaService.HandleMediaRetryResponse(ctx, session.Client, e, session.ID); err != nil {
			logger.WPP().Warn().
				Err(err).
				Str("messageId", e.MessageID).
				Msg("Failed to process media retry response")
		}
	}

	s.sendWebhook(ctx, session, string(model.EventMediaRetry), e)
}

// extractMessageTypeAndContent extracts message type and content from a message
func (s *Service) extractMessageTypeAndContent(msg *waE2E.Message) (string, string) {
	if msg == nil {
		return "unknown", ""
	}

	if msg.GetConversation() != "" {
		return "text", msg.GetConversation()
	}

	if ext := msg.GetExtendedTextMessage(); ext != nil {
		return "text", ext.GetText()
	}

	if img := msg.GetImageMessage(); img != nil {
		return "image", img.GetCaption()
	}

	if vid := msg.GetVideoMessage(); vid != nil {
		return "video", vid.GetCaption()
	}

	if msg.GetAudioMessage() != nil {
		return "audio", ""
	}

	if doc := msg.GetDocumentMessage(); doc != nil {
		return "document", doc.GetFileName()
	}

	if msg.GetStickerMessage() != nil {
		return "sticker", ""
	}

	if loc := msg.GetLocationMessage(); loc != nil {
		return "location", fmt.Sprintf("%.6f,%.6f", loc.GetDegreesLatitude(), loc.GetDegreesLongitude())
	}

	if contact := msg.GetContactMessage(); contact != nil {
		return "contact", contact.GetDisplayName()
	}

	if contacts := msg.GetContactsArrayMessage(); contacts != nil {
		contactList := contacts.GetContacts()
		if len(contactList) > 0 {
			return "contacts", contactList[0].GetDisplayName()
		}
		return "contacts", ""
	}

	if reaction := msg.GetReactionMessage(); reaction != nil {
		return "reaction", reaction.GetText()
	}

	if poll := msg.GetPollCreationMessage(); poll != nil {
		return "poll", poll.GetName()
	}

	if proto := msg.GetProtocolMessage(); proto != nil {
		if edited := proto.GetEditedMessage(); edited != nil {
			return s.extractMessageTypeAndContent(edited)
		}
		return "protocol", ""
	}

	if msg.GetButtonsMessage() != nil {
		return "buttons", msg.GetButtonsMessage().GetContentText()
	}
	if msg.GetListMessage() != nil {
		return "list", msg.GetListMessage().GetTitle()
	}

	if tmpl := msg.GetTemplateMessage(); tmpl != nil {
		return "template", ""
	}

	if btnReply := msg.GetTemplateButtonReplyMessage(); btnReply != nil {
		return "button_reply", btnReply.GetSelectedDisplayText()
	}

	if btnResp := msg.GetButtonsResponseMessage(); btnResp != nil {
		return "button_response", btnResp.GetSelectedDisplayText()
	}

	if listResp := msg.GetListResponseMessage(); listResp != nil {
		return "list_response", listResp.GetTitle()
	}

	if interactive := msg.GetInteractiveMessage(); interactive != nil {
		if body := interactive.GetBody(); body != nil {
			return "interactive", body.GetText()
		}
		return "interactive", ""
	}

	if interactiveResp := msg.GetInteractiveResponseMessage(); interactiveResp != nil {
		return "interactive_response", ""
	}

	if msg.GetProductMessage() != nil {
		return "product", ""
	}

	if msg.GetOrderMessage() != nil {
		return "order", ""
	}

	if msg.GetLiveLocationMessage() != nil {
		return "live_location", ""
	}

	if viewOnce := msg.GetViewOnceMessage(); viewOnce != nil {
		return s.extractMessageTypeAndContent(viewOnce.GetMessage())
	}
	if viewOnceV2 := msg.GetViewOnceMessageV2(); viewOnceV2 != nil {
		return s.extractMessageTypeAndContent(viewOnceV2.GetMessage())
	}

	return "unknown", ""
}

// extractMediaInfo extracts media information from a message
func (s *Service) extractMediaInfo(sessionID, msgID string, msg *waE2E.Message) *model.Media {
	if msg == nil {
		return nil
	}

	if img := msg.GetImageMessage(); img != nil {
		return &model.Media{
			SessionID:           sessionID,
			MsgID:               msgID,
			MediaType:           "image",
			MimeType:            img.GetMimetype(),
			FileSize:            int64(img.GetFileLength()),
			Caption:             img.GetCaption(),
			WADirectPath:        img.GetDirectPath(),
			WAMediaKey:          img.GetMediaKey(),
			WAFileSHA256:        img.GetFileSHA256(),
			WAFileEncSHA256:     img.GetFileEncSHA256(),
			WAMediaKeyTimestamp: img.GetMediaKeyTimestamp(),
			Width:               int(img.GetWidth()),
			Height:              int(img.GetHeight()),
		}
	}

	if vid := msg.GetVideoMessage(); vid != nil {
		return &model.Media{
			SessionID:           sessionID,
			MsgID:               msgID,
			MediaType:           "video",
			MimeType:            vid.GetMimetype(),
			FileSize:            int64(vid.GetFileLength()),
			Caption:             vid.GetCaption(),
			WADirectPath:        vid.GetDirectPath(),
			WAMediaKey:          vid.GetMediaKey(),
			WAFileSHA256:        vid.GetFileSHA256(),
			WAFileEncSHA256:     vid.GetFileEncSHA256(),
			WAMediaKeyTimestamp: vid.GetMediaKeyTimestamp(),
			Width:               int(vid.GetWidth()),
			Height:              int(vid.GetHeight()),
			Duration:            int(vid.GetSeconds()),
		}
	}

	if aud := msg.GetAudioMessage(); aud != nil {
		return &model.Media{
			SessionID:           sessionID,
			MsgID:               msgID,
			MediaType:           "audio",
			MimeType:            aud.GetMimetype(),
			FileSize:            int64(aud.GetFileLength()),
			WADirectPath:        aud.GetDirectPath(),
			WAMediaKey:          aud.GetMediaKey(),
			WAFileSHA256:        aud.GetFileSHA256(),
			WAFileEncSHA256:     aud.GetFileEncSHA256(),
			WAMediaKeyTimestamp: aud.GetMediaKeyTimestamp(),
			Duration:            int(aud.GetSeconds()),
		}
	}

	if doc := msg.GetDocumentMessage(); doc != nil {
		return &model.Media{
			SessionID:           sessionID,
			MsgID:               msgID,
			MediaType:           "document",
			MimeType:            doc.GetMimetype(),
			FileSize:            int64(doc.GetFileLength()),
			FileName:            doc.GetFileName(),
			Caption:             doc.GetCaption(),
			WADirectPath:        doc.GetDirectPath(),
			WAMediaKey:          doc.GetMediaKey(),
			WAFileSHA256:        doc.GetFileSHA256(),
			WAFileEncSHA256:     doc.GetFileEncSHA256(),
			WAMediaKeyTimestamp: doc.GetMediaKeyTimestamp(),
		}
	}

	if stk := msg.GetStickerMessage(); stk != nil {
		return &model.Media{
			SessionID:           sessionID,
			MsgID:               msgID,
			MediaType:           "sticker",
			MimeType:            stk.GetMimetype(),
			FileSize:            int64(stk.GetFileLength()),
			WADirectPath:        stk.GetDirectPath(),
			WAMediaKey:          stk.GetMediaKey(),
			WAFileSHA256:        stk.GetFileSHA256(),
			WAFileEncSHA256:     stk.GetFileEncSHA256(),
			WAMediaKeyTimestamp: stk.GetMediaKeyTimestamp(),
			Width:               int(stk.GetWidth()),
			Height:              int(stk.GetHeight()),
		}
	}

	if vo := msg.GetViewOnceMessage(); vo != nil {
		return s.extractMediaInfo(sessionID, msgID, vo.GetMessage())
	}

	if vo2 := msg.GetViewOnceMessageV2(); vo2 != nil {
		return s.extractMediaInfo(sessionID, msgID, vo2.GetMessage())
	}

	return nil
}

// extractQuotedID extracts the quoted message ID from ContextInfo.StanzaID
func extractQuotedID(msg *waE2E.Message) string {
	if msg == nil {
		return ""
	}

	var ctxInfo *waE2E.ContextInfo

	if ext := msg.GetExtendedTextMessage(); ext != nil {
		ctxInfo = ext.GetContextInfo()
	} else if img := msg.GetImageMessage(); img != nil {
		ctxInfo = img.GetContextInfo()
	} else if vid := msg.GetVideoMessage(); vid != nil {
		ctxInfo = vid.GetContextInfo()
	} else if aud := msg.GetAudioMessage(); aud != nil {
		ctxInfo = aud.GetContextInfo()
	} else if doc := msg.GetDocumentMessage(); doc != nil {
		ctxInfo = doc.GetContextInfo()
	} else if stk := msg.GetStickerMessage(); stk != nil {
		ctxInfo = stk.GetContextInfo()
	} else if contact := msg.GetContactMessage(); contact != nil {
		ctxInfo = contact.GetContextInfo()
	} else if contacts := msg.GetContactsArrayMessage(); contacts != nil {
		ctxInfo = contacts.GetContextInfo()
	}

	if ctxInfo != nil {
		return ctxInfo.GetStanzaID()
	}
	return ""
}

// extractQuotedSender extracts the quoted message sender from ContextInfo.Participant
func extractQuotedSender(msg *waE2E.Message) string {
	if msg == nil {
		return ""
	}

	var ctxInfo *waE2E.ContextInfo

	if ext := msg.GetExtendedTextMessage(); ext != nil {
		ctxInfo = ext.GetContextInfo()
	} else if img := msg.GetImageMessage(); img != nil {
		ctxInfo = img.GetContextInfo()
	} else if vid := msg.GetVideoMessage(); vid != nil {
		ctxInfo = vid.GetContextInfo()
	} else if aud := msg.GetAudioMessage(); aud != nil {
		ctxInfo = aud.GetContextInfo()
	} else if doc := msg.GetDocumentMessage(); doc != nil {
		ctxInfo = doc.GetContextInfo()
	} else if stk := msg.GetStickerMessage(); stk != nil {
		ctxInfo = stk.GetContextInfo()
	} else if contact := msg.GetContactMessage(); contact != nil {
		ctxInfo = contact.GetContextInfo()
	} else if contacts := msg.GetContactsArrayMessage(); contacts != nil {
		ctxInfo = contacts.GetContextInfo()
	}

	if ctxInfo != nil {
		return ctxInfo.GetParticipant()
	}
	return ""
}
