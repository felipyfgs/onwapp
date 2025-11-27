package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/proto/waHistorySync"
	"go.mau.fi/whatsmeow/proto/waWeb"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

type EventService struct {
	database       *db.Database
	webhookService *WebhookService
}

func NewEventService(database *db.Database, webhookService *WebhookService) *EventService {
	return &EventService{
		database:       database,
		webhookService: webhookService,
	}
}

func (s *EventService) HandleEvent(session *model.Session, evt interface{}) {
	ctx := context.Background()

	// Log and handle based on event type
	switch e := evt.(type) {
	case *events.Connected:
		s.handleConnected(ctx, session)
	case *events.Disconnected:
		s.handleDisconnected(ctx, session)
	case *events.LoggedOut:
		s.handleLoggedOut(ctx, session, e)
	case *events.Message:
		s.handleMessage(ctx, session, e)
	case *events.Receipt:
		s.handleReceipt(ctx, session, e)
	case *events.Presence:
		s.handlePresence(ctx, session, e)
	case *events.ChatPresence:
		s.handleChatPresence(ctx, session, e)
	case *events.HistorySync:
		s.handleHistorySync(ctx, session, e)
	case *events.PushName:
		s.handlePushName(ctx, session, e)
	case *events.CallOffer:
		s.handleCallOffer(ctx, session, e)
	case *events.CallAccept:
		s.handleCallAccept(ctx, session, e)
	case *events.CallTerminate:
		s.handleCallTerminate(ctx, session, e)
	case *events.GroupInfo:
		s.handleGroupInfo(ctx, session, e)
	case *events.JoinedGroup:
		s.handleJoinedGroup(ctx, session, e)
	case *events.Picture:
		s.handlePicture(ctx, session, e)
	case *events.IdentityChange:
		s.handleIdentityChange(ctx, session, e)
	case *events.PrivacySettings:
		s.handlePrivacySettings(ctx, session, e)
	case *events.OfflineSyncPreview:
		s.handleOfflineSyncPreview(ctx, session, e)
	case *events.OfflineSyncCompleted:
		s.handleOfflineSyncCompleted(ctx, session, e)
	case *events.Blocklist:
		s.handleBlocklist(ctx, session, e)
	case *events.NewsletterJoin:
		s.handleNewsletterJoin(ctx, session, e)
	case *events.NewsletterLeave:
		s.handleNewsletterLeave(ctx, session, e)
	case *events.NewsletterMuteChange:
		s.handleNewsletterMuteChange(ctx, session, e)
	case *events.NewsletterLiveUpdate:
		s.handleNewsletterLiveUpdate(ctx, session, e)
	default:
		logger.Debug().
			Str("session", session.Name).
			Str("event_type", fmt.Sprintf("%T", evt)).
			Msg("Unhandled event type")
	}
}

// Connection events

func (s *EventService) handleConnected(ctx context.Context, session *model.Session) {
	session.SetStatus(model.StatusConnected)
	session.SetQR("")

	logger.Info().
		Str("session", session.Name).
		Str("event", "connected").
		Msg("Session connected")

	if session.Client.Store.ID != nil {
		jid := session.Client.Store.ID.String()
		phone := session.Client.Store.ID.User
		if err := s.database.Sessions.UpdateJID(ctx, session.Name, jid, phone); err != nil {
			logger.Error().Err(err).Str("session", session.Name).Msg("Failed to update session JID/phone")
		}
	}

	if err := s.database.Sessions.UpdateStatus(ctx, session.Name, "connected"); err != nil {
		logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, "session.connected", nil)
}

func (s *EventService) handleDisconnected(ctx context.Context, session *model.Session) {
	session.SetStatus(model.StatusDisconnected)

	logger.Info().
		Str("session", session.Name).
		Str("event", "disconnected").
		Msg("Session disconnected")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Name, "disconnected"); err != nil {
		logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, "session.disconnected", nil)
}

func (s *EventService) handleLoggedOut(ctx context.Context, session *model.Session, e *events.LoggedOut) {
	session.SetStatus(model.StatusDisconnected)

	logger.Info().
		Str("session", session.Name).
		Str("event", "logged_out").
		Str("reason", e.Reason.String()).
		Msg("Session logged out")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Name, "disconnected"); err != nil {
		logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, "session.logged_out", e)
}

// Message events

func (s *EventService) handleMessage(ctx context.Context, session *model.Session, e *events.Message) {
	// Skip sender key distribution messages (encryption protocol)
	if e.Message.GetSenderKeyDistributionMessage() != nil {
		return
	}

	// Handle reactions - save to MessageUpdate
	if reaction := e.Message.GetReactionMessage(); reaction != nil {
		s.handleReaction(ctx, session, e, reaction)
		return
	}

	// Handle protocol messages (revoke/delete)
	if proto := e.Message.GetProtocolMessage(); proto != nil {
		s.handleProtocolMessage(ctx, session, e, proto)
		return
	}

	// Handle edits
	if e.IsEdit {
		s.handleMessageEdit(ctx, session, e)
		return
	}

	// Regular message
	msgType, content := s.extractMessageTypeAndContent(e.Message)
	
	// Skip unknown messages with no content
	if msgType == "unknown" && content == "" {
		return
	}

	logger.Info().
		Str("session", session.Name).
		Str("event", "message").
		Str("type", msgType).
		Str("from", e.Info.Sender.String()).
		Str("chat", e.Info.Chat.String()).
		Str("id", e.Info.ID).
		Interface("raw", e).
		Msg("Message received")

	rawEvent, _ := json.Marshal(e)

	status := model.MessageStatusSent
	if !e.Info.IsFromMe {
		status = model.MessageStatusDelivered
	}

	msg := &model.Message{
		SessionID:    session.ID,
		MessageID:    e.Info.ID,
		ChatJID:      e.Info.Chat.String(),
		SenderJID:    e.Info.Sender.String(),
		Timestamp:    e.Info.Timestamp,
		PushName:     e.Info.PushName,
		SenderAlt:    e.Info.SenderAlt.String(),
		Type:         msgType,
		MediaType:    e.Info.MediaType,
		Category:     e.Info.Category,
		Content:      content,
		IsFromMe:     e.Info.IsFromMe,
		IsGroup:      e.Info.IsGroup,
		IsEphemeral:  e.IsEphemeral,
		IsViewOnce:   e.IsViewOnce || e.IsViewOnceV2,
		IsEdit:       false,
		EditTargetID: "",
		QuotedID:     e.Info.MsgMetaInfo.TargetID,
		QuotedSender: e.Info.MsgMetaInfo.TargetSender.String(),
		Status:       status,
		RawEvent:     rawEvent,
	}

	if _, err := s.database.Messages.Save(ctx, msg); err != nil {
		logger.Warn().Err(err).Str("session", session.Name).Str("messageId", e.Info.ID).Msg("Failed to save message")
	}

	s.sendWebhook(ctx, session, "message.received", e)
}

func (s *EventService) handleReaction(ctx context.Context, session *model.Session, e *events.Message, reaction *waE2E.ReactionMessage) {
	targetMsgID := reaction.GetKey().GetID()
	emoji := reaction.GetText()
	senderJid := e.Info.Sender.String()
	timestamp := e.Info.Timestamp

	logger.Info().
		Str("session", session.Name).
		Str("event", "reaction").
		Str("target", targetMsgID).
		Str("emoji", emoji).
		Str("from", senderJid).
		Msg("Reaction received")

	// Determine update type
	updateType := model.UpdateTypeReactionAdd
	if emoji == "" {
		updateType = model.UpdateTypeReactionRemove
	}

	// Save to MessageUpdate
	data, _ := json.Marshal(map[string]interface{}{
		"emoji":     emoji,
		"timestamp": reaction.GetSenderTimestampMS(),
	})

	update := &model.MessageUpdate{
		MsgID:   targetMsgID,
		Type:    updateType,
		Actor:   senderJid,
		Data:    data,
		EventAt: timestamp,
	}

	if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
		logger.Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to save reaction update")
	}

	// Update Message.reactions
	if emoji != "" {
		if err := s.database.Messages.AddReaction(ctx, session.ID, targetMsgID, emoji, senderJid, timestamp.Unix()); err != nil {
			logger.Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to add reaction to message")
		}
	} else {
		if err := s.database.Messages.RemoveReaction(ctx, session.ID, targetMsgID, senderJid); err != nil {
			logger.Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to remove reaction from message")
		}
	}

	s.sendWebhook(ctx, session, "message.reaction", e)
}

func (s *EventService) handleProtocolMessage(ctx context.Context, session *model.Session, e *events.Message, proto *waE2E.ProtocolMessage) {
	protoType := proto.GetType()

	// Handle message revoke (delete)
	if protoType == waE2E.ProtocolMessage_REVOKE {
		targetMsgID := proto.GetKey().GetID()
		senderJid := e.Info.Sender.String()

		logger.Info().
			Str("session", session.Name).
			Str("event", "message_delete").
			Str("target", targetMsgID).
			Str("from", senderJid).
			Msg("Message deleted")

		data, _ := json.Marshal(map[string]interface{}{
			"deletedBy": senderJid,
			"fromMe":    e.Info.IsFromMe,
		})

		update := &model.MessageUpdate{
			MsgID:   targetMsgID,
			Type:    model.UpdateTypeDelete,
			Actor:   senderJid,
			Data:    data,
			EventAt: e.Info.Timestamp,
		}

		if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
			logger.Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to save delete update")
		}

		s.sendWebhook(ctx, session, "message.deleted", e)
		return
	}

	// Log other protocol messages
	logger.Info().
		Str("session", session.Name).
		Str("event", "protocol_message").
		Str("type", protoType.String()).
		Interface("raw", e).
		Msg("Protocol message received")
}

func (s *EventService) handleMessageEdit(ctx context.Context, session *model.Session, e *events.Message) {
	targetMsgID := e.Info.MsgBotInfo.EditTargetID
	if targetMsgID == "" {
		targetMsgID = e.Info.ID
	}
	senderJid := e.Info.Sender.String()
	msgType, newContent := s.extractMessageTypeAndContent(e.Message)

	logger.Info().
		Str("session", session.Name).
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
		MsgID:   targetMsgID,
		Type:    model.UpdateTypeEdit,
		Actor:   senderJid,
		Data:    data,
		EventAt: e.Info.Timestamp,
	}

	if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
		logger.Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to save edit update")
	}

	s.sendWebhook(ctx, session, "message.edited", e)
}

func (s *EventService) handleReceipt(ctx context.Context, session *model.Session, e *events.Receipt) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "receipt").
		Str("type", string(e.Type)).
		Str("from", e.Sender.String()).
		Str("chat", e.Chat.String()).
		Interface("raw", e).
		Msg("Receipt received")

	s.sendWebhook(ctx, session, "message.receipt", e)
}

// Presence events

func (s *EventService) handlePresence(ctx context.Context, session *model.Session, e *events.Presence) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "presence").
		Str("from", e.From.String()).
		Bool("unavailable", e.Unavailable).
		Time("lastSeen", e.LastSeen).
		Msg("Presence update")

	s.sendWebhook(ctx, session, "presence.update", e)
}

func (s *EventService) handleChatPresence(ctx context.Context, session *model.Session, e *events.ChatPresence) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "chat_presence").
		Str("chat", e.Chat.String()).
		Str("sender", e.Sender.String()).
		Str("state", string(e.State)).
		Str("media", string(e.Media)).
		Msg("Chat presence")

	s.sendWebhook(ctx, session, "chat.presence", e)
}

// Sync events

func (s *EventService) handleHistorySync(ctx context.Context, session *model.Session, e *events.HistorySync) {
	syncType := e.Data.GetSyncType().String()
	chunkOrder := e.Data.GetChunkOrder()
	progress := e.Data.GetProgress()
	conversations := e.Data.GetConversations()

	logger.Info().
		Str("session", session.Name).
		Str("event", "history_sync").
		Str("syncType", syncType).
		Uint32("chunkOrder", chunkOrder).
		Uint32("progress", progress).
		Int("conversations", len(conversations)).
		Msg("History sync received")

	// Skip non-message sync types
	if e.Data.GetSyncType() == waHistorySync.HistorySync_PUSH_NAME {
		s.handlePushNameSync(ctx, session, e.Data.GetPushnames())
		return
	}

	// Process conversations and their messages
	var allMessages []*model.Message
	totalMsgs := 0

	for _, conv := range conversations {
		chatJID := conv.GetID()
		msgs := conv.GetMessages()
		totalMsgs += len(msgs)

		for _, histMsg := range msgs {
			webMsg := histMsg.GetMessage()
			if webMsg == nil {
				continue
			}

			// Extract message key
			key := webMsg.GetKey()
			if key == nil || key.GetID() == "" {
				continue
			}

			// Skip system messages (messageStubType) - they have no useful content
			if webMsg.GetMessageStubType() != 0 {
				continue
			}

			// Skip sender key distribution messages (encryption protocol)
			if webMsg.GetMessage() != nil && webMsg.GetMessage().GetSenderKeyDistributionMessage() != nil {
				continue
			}

			// Determine message type and content
			msgType, content := s.extractMessageTypeAndContent(webMsg.GetMessage())
			
			// Skip unknown messages with no content
			if msgType == "unknown" && content == "" {
				continue
			}

			// Determine sender JID
			senderJID := key.GetRemoteJID()
			if key.GetParticipant() != "" {
				senderJID = key.GetParticipant()
			}

			// Convert timestamp (Unix seconds)
			timestamp := time.Unix(int64(webMsg.GetMessageTimestamp()), 0)

			// Determine if it's a group chat
			isGroup := strings.HasSuffix(chatJID, "@g.us")

			// Serialize raw message data
			rawEvent, _ := json.Marshal(map[string]interface{}{
				"historySyncMsg": histMsg,
				"webMessageInfo": webMsg,
				"syncType":       syncType,
				"chunkOrder":     chunkOrder,
			})

			// Determine status
			status := model.MessageStatusSent
			if !key.GetFromMe() {
				status = model.MessageStatusDelivered
			}

			// Extract reactions from history
			var reactionsJSON []byte
			if reactions := webMsg.GetReactions(); len(reactions) > 0 {
				reactionsJSON = s.buildReactionsJSON(reactions)
			}

			msg := &model.Message{
				SessionID:   session.ID,
				MessageID:   key.GetID(),
				ChatJID:     chatJID,
				SenderJID:   senderJID,
				Timestamp:   timestamp,
				PushName:    webMsg.GetPushName(),
				Type:        msgType,
				Content:     content,
				IsFromMe:    key.GetFromMe(),
				IsGroup:     isGroup,
				IsEphemeral: webMsg.GetEphemeralDuration() > 0,
				Status:      status,
				RawEvent:    rawEvent,
				Reactions:   reactionsJSON,
			}

			allMessages = append(allMessages, msg)

			// Save reactions to MessageUpdates for history tracking
			if len(webMsg.GetReactions()) > 0 {
				s.saveHistoryReactions(ctx, key.GetID(), webMsg.GetReactions())
			}
		}
	}

	// Batch save messages
	if len(allMessages) > 0 {
		saved, err := s.database.Messages.SaveBatch(ctx, allMessages)
		if err != nil {
			logger.Error().
				Err(err).
				Str("session", session.Name).
				Int("total", len(allMessages)).
				Msg("Failed to save history sync messages")
		} else {
			logger.Info().
				Str("session", session.Name).
				Str("syncType", syncType).
				Uint32("chunkOrder", chunkOrder).
				Int("totalMessages", totalMsgs).
				Int("processed", len(allMessages)).
				Int("saved", saved).
				Int("skipped", len(allMessages)-saved).
				Msg("History sync messages saved")
		}
	}

	// Send webhook
	s.sendWebhook(ctx, session, "history.sync", e)
}

func (s *EventService) buildReactionsJSON(reactions []*waWeb.Reaction) []byte {
	if len(reactions) == 0 {
		return nil
	}

	var reactionsList []map[string]interface{}
	for _, r := range reactions {
		if r.GetKey() == nil {
			continue
		}
		reactionsList = append(reactionsList, map[string]interface{}{
			"emoji":     r.GetText(),
			"senderJid": r.GetKey().GetRemoteJID(),
			"timestamp": r.GetSenderTimestampMS(),
		})
	}

	if len(reactionsList) == 0 {
		return nil
	}

	data, _ := json.Marshal(reactionsList)
	return data
}

func (s *EventService) saveHistoryReactions(ctx context.Context, msgID string, reactions []*waWeb.Reaction) {
	for _, r := range reactions {
		if r.GetKey() == nil || r.GetText() == "" {
			continue
		}

		senderJid := r.GetKey().GetRemoteJID()
		timestamp := time.UnixMilli(r.GetSenderTimestampMS())

		data, _ := json.Marshal(map[string]interface{}{
			"emoji":     r.GetText(),
			"timestamp": r.GetSenderTimestampMS(),
			"source":    "history_sync",
		})

		update := &model.MessageUpdate{
			MsgID:   msgID,
			Type:    model.UpdateTypeReactionAdd,
			Actor:   senderJid,
			Data:    data,
			EventAt: timestamp,
		}

		if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
			logger.Warn().Err(err).Str("msgId", msgID).Msg("Failed to save history reaction")
		}
	}
}

func (s *EventService) extractMessageTypeAndContent(msg *waE2E.Message) (string, string) {
	if msg == nil {
		return "unknown", ""
	}

	// Texto simples
	if msg.GetConversation() != "" {
		return "text", msg.GetConversation()
	}

	// Texto estendido (com links, menções, etc.)
	if ext := msg.GetExtendedTextMessage(); ext != nil {
		return "text", ext.GetText()
	}

	// Imagem
	if img := msg.GetImageMessage(); img != nil {
		return "image", img.GetCaption()
	}

	// Vídeo
	if vid := msg.GetVideoMessage(); vid != nil {
		return "video", vid.GetCaption()
	}

	// Áudio
	if msg.GetAudioMessage() != nil {
		return "audio", ""
	}

	// Documento
	if doc := msg.GetDocumentMessage(); doc != nil {
		return "document", doc.GetFileName()
	}

	// Sticker
	if msg.GetStickerMessage() != nil {
		return "sticker", ""
	}

	// Localização
	if loc := msg.GetLocationMessage(); loc != nil {
		return "location", fmt.Sprintf("%.6f,%.6f", loc.GetDegreesLatitude(), loc.GetDegreesLongitude())
	}

	// Contato
	if contact := msg.GetContactMessage(); contact != nil {
		return "contact", contact.GetDisplayName()
	}

	// Reação
	if reaction := msg.GetReactionMessage(); reaction != nil {
		return "reaction", reaction.GetText()
	}

	// Enquete
	if poll := msg.GetPollCreationMessage(); poll != nil {
		return "poll", poll.GetName()
	}

	// Protocol message (edição, deleção, etc.)
	if proto := msg.GetProtocolMessage(); proto != nil {
		// Mensagem editada
		if edited := proto.GetEditedMessage(); edited != nil {
			return s.extractMessageTypeAndContent(edited)
		}
		return "protocol", ""
	}

	// Botões / Lista interativa
	if msg.GetButtonsMessage() != nil {
		return "buttons", msg.GetButtonsMessage().GetContentText()
	}
	if msg.GetListMessage() != nil {
		return "list", msg.GetListMessage().GetTitle()
	}

	// Template
	if tmpl := msg.GetTemplateMessage(); tmpl != nil {
		return "template", ""
	}

	// Resposta de botão template
	if btnReply := msg.GetTemplateButtonReplyMessage(); btnReply != nil {
		return "button_reply", btnReply.GetSelectedDisplayText()
	}

	// Resposta de botão normal
	if btnResp := msg.GetButtonsResponseMessage(); btnResp != nil {
		return "button_response", btnResp.GetSelectedDisplayText()
	}

	// Resposta de lista
	if listResp := msg.GetListResponseMessage(); listResp != nil {
		return "list_response", listResp.GetTitle()
	}

	// Mensagem interativa
	if interactive := msg.GetInteractiveMessage(); interactive != nil {
		if body := interactive.GetBody(); body != nil {
			return "interactive", body.GetText()
		}
		return "interactive", ""
	}

	// Resposta interativa
	if interactiveResp := msg.GetInteractiveResponseMessage(); interactiveResp != nil {
		return "interactive_response", ""
	}

	// Produto/Catálogo
	if msg.GetProductMessage() != nil {
		return "product", ""
	}

	// Pedido
	if msg.GetOrderMessage() != nil {
		return "order", ""
	}

	// Live location
	if msg.GetLiveLocationMessage() != nil {
		return "live_location", ""
	}

	// View once (imagem/video que desaparece)
	if viewOnce := msg.GetViewOnceMessage(); viewOnce != nil {
		return s.extractMessageTypeAndContent(viewOnce.GetMessage())
	}
	if viewOnceV2 := msg.GetViewOnceMessageV2(); viewOnceV2 != nil {
		return s.extractMessageTypeAndContent(viewOnceV2.GetMessage())
	}

	return "unknown", ""
}

func (s *EventService) handlePushNameSync(ctx context.Context, session *model.Session, pushnames []*waHistorySync.Pushname) {
	if len(pushnames) == 0 {
		return
	}

	logger.Info().
		Str("session", session.Name).
		Int("count", len(pushnames)).
		Msg("Push name sync received")

	for _, pn := range pushnames {
		logger.Debug().
			Str("session", session.Name).
			Str("jid", pn.GetID()).
			Str("pushName", pn.GetPushname()).
			Msg("Push name synced")
	}
}

func (s *EventService) handleOfflineSyncPreview(ctx context.Context, session *model.Session, e *events.OfflineSyncPreview) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "offline_sync_preview").
		Int("messages", e.Messages).
		Int("receipts", e.Receipts).
		Int("notifications", e.Notifications).
		Msg("Offline sync preview")
}

func (s *EventService) handleOfflineSyncCompleted(ctx context.Context, session *model.Session, e *events.OfflineSyncCompleted) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "offline_sync_completed").
		Int("count", e.Count).
		Msg("Offline sync completed")
}

// Contact events

func (s *EventService) handlePushName(ctx context.Context, session *model.Session, e *events.PushName) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "push_name").
		Str("jid", e.JID.String()).
		Str("oldName", e.OldPushName).
		Str("newName", e.NewPushName).
		Msg("Push name changed")

	s.sendWebhook(ctx, session, "contact.push_name", e)
}

func (s *EventService) handlePicture(ctx context.Context, session *model.Session, e *events.Picture) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "picture").
		Str("jid", e.JID.String()).
		Bool("removed", e.Remove).
		Msg("Picture changed")

	s.sendWebhook(ctx, session, "contact.picture", e)
}

func (s *EventService) handleIdentityChange(ctx context.Context, session *model.Session, e *events.IdentityChange) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "identity_change").
		Str("jid", e.JID.String()).
		Bool("implicit", e.Implicit).
		Msg("Identity changed")
}

func (s *EventService) handleBlocklist(ctx context.Context, session *model.Session, e *events.Blocklist) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "blocklist").
		Str("action", string(e.Action)).
		Int("count", len(e.Changes)).
		Msg("Event: Blocklist changed")
}

// Call events

func (s *EventService) handleCallOffer(ctx context.Context, session *model.Session, e *events.CallOffer) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "call_offer").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Event: Call offer received")

	s.sendWebhook(ctx, session, "call.offer", e)
}

func (s *EventService) handleCallAccept(ctx context.Context, session *model.Session, e *events.CallAccept) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "call_accept").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Event: Call accepted")

	s.sendWebhook(ctx, session, "call.accept", e)
}

func (s *EventService) handleCallTerminate(ctx context.Context, session *model.Session, e *events.CallTerminate) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "call_terminate").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Str("reason", e.Reason).
		Msg("Event: Call terminated")

	s.sendWebhook(ctx, session, "call.terminate", e)
}

// Group events

func (s *EventService) handleGroupInfo(ctx context.Context, session *model.Session, e *events.GroupInfo) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "group_info").
		Str("group", e.JID.String()).
		Str("notify", e.Notify).
		Msg("Event: Group info changed")

	s.sendWebhook(ctx, session, "group.update", e)
}

func (s *EventService) handleJoinedGroup(ctx context.Context, session *model.Session, e *events.JoinedGroup) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "joined_group").
		Str("group", e.JID.String()).
		Str("name", e.GroupInfo.GroupName.Name).
		Msg("Event: Joined group")

	s.sendWebhook(ctx, session, "group.joined", e)
}

// Privacy events

func (s *EventService) handlePrivacySettings(ctx context.Context, session *model.Session, e *events.PrivacySettings) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "privacy_settings").
		Msg("Event: Privacy settings changed")
}

// Newsletter events

func (s *EventService) handleNewsletterJoin(ctx context.Context, session *model.Session, e *events.NewsletterJoin) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "newsletter_join").
		Str("id", e.ID.String()).
		Msg("Event: Newsletter joined")
}

func (s *EventService) handleNewsletterLeave(ctx context.Context, session *model.Session, e *events.NewsletterLeave) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "newsletter_leave").
		Str("id", e.ID.String()).
		Msg("Event: Newsletter left")
}

func (s *EventService) handleNewsletterMuteChange(ctx context.Context, session *model.Session, e *events.NewsletterMuteChange) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "newsletter_mute_change").
		Str("id", e.ID.String()).
		Msg("Event: Newsletter mute changed")
}

func (s *EventService) handleNewsletterLiveUpdate(ctx context.Context, session *model.Session, e *events.NewsletterLiveUpdate) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "newsletter_live_update").
		Str("id", e.JID.String()).
		Msg("Event: Newsletter live update")
}

// Helper

func (s *EventService) sendWebhook(ctx context.Context, session *model.Session, event string, rawEvent interface{}) {
	if s.webhookService != nil {
		s.webhookService.Send(ctx, session.ID, session.Name, event, rawEvent)
	}
}
