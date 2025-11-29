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
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

type EventService struct {
	database       *db.Database
	webhookService WebhookSender
}

func NewEventService(database *db.Database, webhookService WebhookSender) *EventService {
	return &EventService{
		database:       database,
		webhookService: webhookService,
	}
}

func (s *EventService) HandleEvent(session *model.Session, evt interface{}) {
	ctx := context.Background()

	// Log and handle based on event type
	switch e := evt.(type) {
	// Connection events
	case *events.Connected:
		s.handleConnected(ctx, session)
	case *events.Disconnected:
		s.handleDisconnected(ctx, session)
	case *events.LoggedOut:
		s.handleLoggedOut(ctx, session, e)
	case *events.ConnectFailure:
		s.handleConnectFailure(ctx, session, e)
	case *events.StreamReplaced:
		s.handleStreamReplaced(ctx, session, e)
	case *events.StreamError:
		s.handleStreamError(ctx, session, e)
	case *events.TemporaryBan:
		s.handleTemporaryBan(ctx, session, e)
	case *events.ClientOutdated:
		s.handleClientOutdated(ctx, session, e)
	case *events.KeepAliveTimeout:
		s.handleKeepAliveTimeout(ctx, session, e)
	case *events.KeepAliveRestored:
		s.handleKeepAliveRestored(ctx, session, e)
	case *events.PairSuccess:
		s.handlePairSuccess(ctx, session, e)
	case *events.PairError:
		s.handlePairError(ctx, session, e)

	// Message events
	case *events.Message:
		s.handleMessage(ctx, session, e)
	case *events.Receipt:
		s.handleReceipt(ctx, session, e)
	case *events.UndecryptableMessage:
		s.handleUndecryptableMessage(ctx, session, e)
	case *events.MediaRetry:
		s.handleMediaRetry(ctx, session, e)

	// Presence events
	case *events.Presence:
		s.handlePresence(ctx, session, e)
	case *events.ChatPresence:
		s.handleChatPresence(ctx, session, e)

	// Sync events
	case *events.HistorySync:
		s.handleHistorySync(ctx, session, e)
	case *events.OfflineSyncPreview:
		s.handleOfflineSyncPreview(ctx, session, e)
	case *events.OfflineSyncCompleted:
		s.handleOfflineSyncCompleted(ctx, session, e)
	case *events.AppState:
		s.handleAppState(ctx, session, e)
	case *events.AppStateSyncComplete:
		s.handleAppStateSyncComplete(ctx, session, e)

	// Contact events
	case *events.PushName:
		s.handlePushName(ctx, session, e)
	case *events.Picture:
		s.handlePicture(ctx, session, e)
	case *events.Contact:
		s.handleContact(ctx, session, e)
	case *events.BusinessName:
		s.handleBusinessName(ctx, session, e)

	// Call events
	case *events.CallOffer:
		s.handleCallOffer(ctx, session, e)
	case *events.CallOfferNotice:
		s.handleCallOfferNotice(ctx, session, e)
	case *events.CallAccept:
		s.handleCallAccept(ctx, session, e)
	case *events.CallPreAccept:
		s.handleCallPreAccept(ctx, session, e)
	case *events.CallReject:
		s.handleCallReject(ctx, session, e)
	case *events.CallTerminate:
		s.handleCallTerminate(ctx, session, e)
	case *events.CallTransport:
		s.handleCallTransport(ctx, session, e)
	case *events.CallRelayLatency:
		s.handleCallRelayLatency(ctx, session, e)

	// Group events
	case *events.GroupInfo:
		s.handleGroupInfo(ctx, session, e)
	case *events.JoinedGroup:
		s.handleJoinedGroup(ctx, session, e)

	// Privacy events
	case *events.IdentityChange:
		s.handleIdentityChange(ctx, session, e)
	case *events.PrivacySettings:
		s.handlePrivacySettings(ctx, session, e)
	case *events.Blocklist:
		s.handleBlocklist(ctx, session, e)

	// Newsletter events
	case *events.NewsletterJoin:
		s.handleNewsletterJoin(ctx, session, e)
	case *events.NewsletterLeave:
		s.handleNewsletterLeave(ctx, session, e)
	case *events.NewsletterMuteChange:
		s.handleNewsletterMuteChange(ctx, session, e)
	case *events.NewsletterLiveUpdate:
		s.handleNewsletterLiveUpdate(ctx, session, e)

	// Chat management events (AppState)
	case *events.Mute:
		s.handleMute(ctx, session, e)
	case *events.Archive:
		s.handleArchive(ctx, session, e)
	case *events.Pin:
		s.handlePin(ctx, session, e)
	case *events.Star:
		s.handleStar(ctx, session, e)
	case *events.DeleteForMe:
		s.handleDeleteForMe(ctx, session, e)
	case *events.DeleteChat:
		s.handleDeleteChat(ctx, session, e)
	case *events.ClearChat:
		s.handleClearChat(ctx, session, e)
	case *events.MarkChatAsRead:
		s.handleMarkChatAsRead(ctx, session, e)
	case *events.LabelEdit:
		s.handleLabelEdit(ctx, session, e)
	case *events.LabelAssociationChat:
		s.handleLabelAssociationChat(ctx, session, e)

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

	s.sendWebhook(ctx, session, string(model.EventSessionConnected), nil)
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

	s.sendWebhook(ctx, session, string(model.EventSessionDisconnected), nil)
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

	s.sendWebhook(ctx, session, string(model.EventSessionLoggedOut), e)
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
		QuotedID:     e.Info.MsgMetaInfo.TargetID,
		QuotedSender: e.Info.MsgMetaInfo.TargetSender.String(),
		Status:       status,
		DeliveredAt:  deliveredAt,
		RawEvent:     rawEvent,
	}

	if _, err := s.database.Messages.Save(ctx, msg); err != nil {
		logger.Warn().Err(err).Str("session", session.Name).Str("messageId", e.Info.ID).Msg("Failed to save message")
	}

	s.sendWebhook(ctx, session, string(model.EventMessageReceived), e)
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

	// Determine action (add or remove)
	action := "add"
	if emoji == "" {
		action = "remove"
	}

	// Save to MessageUpdate
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

	s.sendWebhook(ctx, session, string(model.EventMessageReaction), e)
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
			SessionID: session.ID,
			MsgID:     targetMsgID,
			Type:      model.UpdateTypeDelete,
			Actor:     senderJid,
			Data:      data,
			EventAt:   e.Info.Timestamp,
		}

		if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
			logger.Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to save delete update")
		}

		s.sendWebhook(ctx, session, string(model.EventMessageDeleted), e)
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
		SessionID: session.ID,
		MsgID:     targetMsgID,
		Type:      model.UpdateTypeEdit,
		Actor:     senderJid,
		Data:      data,
		EventAt:   e.Info.Timestamp,
	}

	if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
		logger.Warn().Err(err).Str("msgId", targetMsgID).Msg("Failed to save edit update")
	}

	s.sendWebhook(ctx, session, string(model.EventMessageEdited), e)
}

func (s *EventService) handleReceipt(ctx context.Context, session *model.Session, e *events.Receipt) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "receipt").
		Str("type", string(e.Type)).
		Str("from", e.Sender.String()).
		Str("chat", e.Chat.String()).
		Int("messageCount", len(e.MessageIDs)).
		Msg("Receipt received")

	// Map receipt type to message status and update type
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
		// Unknown receipt type, just send webhook
		s.sendWebhook(ctx, session, string(model.EventMessageReceipt), e)
		return
	}

	// Update status and save event for each message
	for _, msgID := range e.MessageIDs {
		// Update message status
		if err := s.database.Messages.UpdateStatus(ctx, session.ID, msgID, status); err != nil {
			logger.Warn().Err(err).
				Str("session", session.Name).
				Str("messageId", msgID).
				Str("status", string(status)).
				Msg("Failed to update message status from receipt")
		}

		// Save to MessageUpdates for history tracking
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
			logger.Warn().Err(err).Str("msgId", msgID).Msg("Failed to save receipt update")
		}
	}

	s.sendWebhook(ctx, session, string(model.EventMessageReceipt), e)
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

	s.sendWebhook(ctx, session, string(model.EventPresenceUpdate), e)
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

	s.sendWebhook(ctx, session, string(model.EventChatPresence), e)
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
				SessionID: session.ID,
				MsgId:     key.GetID(),
				ChatJID:   chatJID,
				SenderJID: senderJID,
				Timestamp: timestamp,
				PushName:  webMsg.GetPushName(),
				Type:      msgType,
				Content:   content,
				FromMe:    key.GetFromMe(),
				IsGroup:   isGroup,
				Ephemeral: webMsg.GetEphemeralDuration() > 0,
				Status:    status,
				RawEvent:  rawEvent,
				Reactions: reactionsJSON,
			}

			allMessages = append(allMessages, msg)

			// Save reactions to MessageUpdates for history tracking
			if len(webMsg.GetReactions()) > 0 {
				s.saveHistoryReactions(ctx, session.ID, key.GetID(), webMsg.GetReactions())
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
	s.sendWebhook(ctx, session, string(model.EventHistorySync), e)
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

func (s *EventService) saveHistoryReactions(ctx context.Context, sessionID, msgID string, reactions []*waWeb.Reaction) {
	for _, r := range reactions {
		if r.GetKey() == nil || r.GetText() == "" {
			continue
		}

		senderJid := r.GetKey().GetRemoteJID()
		timestamp := time.UnixMilli(r.GetSenderTimestampMS())

		data, _ := json.Marshal(map[string]interface{}{
			"action":    "add",
			"emoji":     r.GetText(),
			"timestamp": r.GetSenderTimestampMS(),
			"source":    "history_sync",
		})

		update := &model.MessageUpdate{
			SessionID: sessionID,
			MsgID:     msgID,
			Type:      model.UpdateTypeReaction,
			Actor:     senderJid,
			Data:      data,
			EventAt:   timestamp,
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

	s.sendWebhook(ctx, session, string(model.EventContactPushName), e)
}

func (s *EventService) handlePicture(ctx context.Context, session *model.Session, e *events.Picture) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "picture").
		Str("jid", e.JID.String()).
		Bool("removed", e.Remove).
		Msg("Picture changed")

	s.sendWebhook(ctx, session, string(model.EventContactPicture), e)
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

	s.sendWebhook(ctx, session, string(model.EventCallOffer), e)
}

func (s *EventService) handleCallAccept(ctx context.Context, session *model.Session, e *events.CallAccept) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "call_accept").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Event: Call accepted")

	s.sendWebhook(ctx, session, string(model.EventCallAccept), e)
}

func (s *EventService) handleCallTerminate(ctx context.Context, session *model.Session, e *events.CallTerminate) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "call_terminate").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Str("reason", e.Reason).
		Msg("Event: Call terminated")

	s.sendWebhook(ctx, session, string(model.EventCallTerminate), e)
}

// Group events

func (s *EventService) handleGroupInfo(ctx context.Context, session *model.Session, e *events.GroupInfo) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "group_info").
		Str("group", e.JID.String()).
		Str("notify", e.Notify).
		Msg("Event: Group info changed")

	s.sendWebhook(ctx, session, string(model.EventGroupUpdate), e)
}

func (s *EventService) handleJoinedGroup(ctx context.Context, session *model.Session, e *events.JoinedGroup) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "joined_group").
		Str("group", e.JID.String()).
		Str("name", e.GroupInfo.GroupName.Name).
		Msg("Event: Joined group")

	s.sendWebhook(ctx, session, string(model.EventGroupJoined), e)
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

// New connection event handlers

func (s *EventService) handleConnectFailure(ctx context.Context, session *model.Session, e *events.ConnectFailure) {
	session.SetStatus(model.StatusDisconnected)

	logger.Error().
		Str("session", session.Name).
		Str("event", "connect_failure").
		Int("reason", int(e.Reason)).
		Str("message", e.Message).
		Msg("Connection failed")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Name, "disconnected"); err != nil {
		logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventConnectFailure), e)
}

func (s *EventService) handleStreamReplaced(ctx context.Context, session *model.Session, e *events.StreamReplaced) {
	session.SetStatus(model.StatusDisconnected)

	logger.Warn().
		Str("session", session.Name).
		Str("event", "stream_replaced").
		Msg("Stream replaced by another connection")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Name, "disconnected"); err != nil {
		logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventStreamReplaced), e)
}

func (s *EventService) handleStreamError(ctx context.Context, session *model.Session, e *events.StreamError) {
	logger.Error().
		Str("session", session.Name).
		Str("event", "stream_error").
		Str("code", e.Code).
		Msg("Stream error")

	s.sendWebhook(ctx, session, string(model.EventStreamError), e)
}

func (s *EventService) handleTemporaryBan(ctx context.Context, session *model.Session, e *events.TemporaryBan) {
	session.SetStatus(model.StatusDisconnected)

	logger.Error().
		Str("session", session.Name).
		Str("event", "temporary_ban").
		Int("code", int(e.Code)).
		Dur("expire", e.Expire).
		Msg("Temporarily banned")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Name, "banned"); err != nil {
		logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventTemporaryBan), e)
}

func (s *EventService) handleClientOutdated(ctx context.Context, session *model.Session, e *events.ClientOutdated) {
	session.SetStatus(model.StatusDisconnected)

	logger.Error().
		Str("session", session.Name).
		Str("event", "client_outdated").
		Msg("Client version outdated")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Name, "outdated"); err != nil {
		logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventClientOutdated), e)
}

func (s *EventService) handleKeepAliveTimeout(ctx context.Context, session *model.Session, e *events.KeepAliveTimeout) {
	logger.Warn().
		Str("session", session.Name).
		Str("event", "keepalive_timeout").
		Int("errorCount", e.ErrorCount).
		Time("lastSuccess", e.LastSuccess).
		Msg("Keep alive timeout")

	s.sendWebhook(ctx, session, string(model.EventKeepAliveTimeout), e)
}

func (s *EventService) handleKeepAliveRestored(ctx context.Context, session *model.Session, e *events.KeepAliveRestored) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "keepalive_restored").
		Msg("Keep alive restored")

	s.sendWebhook(ctx, session, string(model.EventKeepAliveRestored), e)
}

func (s *EventService) handlePairSuccess(ctx context.Context, session *model.Session, e *events.PairSuccess) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "pair_success").
		Str("jid", e.ID.String()).
		Str("platform", e.Platform).
		Str("businessName", e.BusinessName).
		Msg("Pairing successful")

	s.sendWebhook(ctx, session, string(model.EventPairSuccess), e)
}

func (s *EventService) handlePairError(ctx context.Context, session *model.Session, e *events.PairError) {
	logger.Error().
		Str("session", session.Name).
		Str("event", "pair_error").
		Str("id", e.ID.String()).
		Str("businessName", e.BusinessName).
		Msg("Pairing error")

	s.sendWebhook(ctx, session, string(model.EventPairError), e)
}

// New message event handlers

func (s *EventService) handleUndecryptableMessage(ctx context.Context, session *model.Session, e *events.UndecryptableMessage) {
	logger.Warn().
		Str("session", session.Name).
		Str("event", "undecryptable_message").
		Str("from", e.Info.Sender.String()).
		Str("chat", e.Info.Chat.String()).
		Bool("isUnavailable", e.IsUnavailable).
		Msg("Undecryptable message received")

	s.sendWebhook(ctx, session, string(model.EventMessageUndecryptable), e)
}

func (s *EventService) handleMediaRetry(ctx context.Context, session *model.Session, e *events.MediaRetry) {
	logger.Debug().
		Str("session", session.Name).
		Str("event", "media_retry").
		Str("messageId", e.MessageID).
		Str("chat", e.ChatID.String()).
		Msg("Media retry request")

	s.sendWebhook(ctx, session, string(model.EventMediaRetry), e)
}

// New sync event handlers

func (s *EventService) handleAppState(ctx context.Context, session *model.Session, e *events.AppState) {
	logger.Debug().
		Str("session", session.Name).
		Str("event", "app_state").
		Strs("index", e.Index).
		Msg("App state received")

	s.sendWebhook(ctx, session, string(model.EventAppStateSync), e)
}

func (s *EventService) handleAppStateSyncComplete(ctx context.Context, session *model.Session, e *events.AppStateSyncComplete) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "app_state_sync_complete").
		Str("name", string(e.Name)).
		Msg("App state sync complete")

	s.sendWebhook(ctx, session, string(model.EventAppStateSyncComplete), e)
}

// New contact event handlers

func (s *EventService) handleContact(ctx context.Context, session *model.Session, e *events.Contact) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "contact").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Contact updated")

	s.sendWebhook(ctx, session, string(model.EventContactUpdate), e)
}

func (s *EventService) handleBusinessName(ctx context.Context, session *model.Session, e *events.BusinessName) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "business_name").
		Str("jid", e.JID.String()).
		Str("oldName", e.OldBusinessName).
		Str("newName", e.NewBusinessName).
		Msg("Business name changed")

	s.sendWebhook(ctx, session, string(model.EventContactBusinessName), e)
}

// New call event handlers

func (s *EventService) handleCallOfferNotice(ctx context.Context, session *model.Session, e *events.CallOfferNotice) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "call_offer_notice").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Str("media", e.Media).
		Str("type", e.Type).
		Msg("Call offer notice received")

	s.sendWebhook(ctx, session, string(model.EventCallOfferNotice), e)
}

func (s *EventService) handleCallPreAccept(ctx context.Context, session *model.Session, e *events.CallPreAccept) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "call_pre_accept").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Call pre-accepted")

	s.sendWebhook(ctx, session, string(model.EventCallPreAccept), e)
}

func (s *EventService) handleCallReject(ctx context.Context, session *model.Session, e *events.CallReject) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "call_reject").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Call rejected")

	s.sendWebhook(ctx, session, string(model.EventCallReject), e)
}

func (s *EventService) handleCallTransport(ctx context.Context, session *model.Session, e *events.CallTransport) {
	logger.Debug().
		Str("session", session.Name).
		Str("event", "call_transport").
		Str("from", e.CallCreator.String()).
		Str("callId", e.CallID).
		Msg("Call transport")

	s.sendWebhook(ctx, session, string(model.EventCallTransport), e)
}

func (s *EventService) handleCallRelayLatency(ctx context.Context, session *model.Session, e *events.CallRelayLatency) {
	logger.Debug().
		Str("session", session.Name).
		Str("event", "call_relay_latency").
		Str("callId", e.CallID).
		Msg("Call relay latency")

	s.sendWebhook(ctx, session, string(model.EventCallRelayLatency), e)
}

// Chat management event handlers (AppState)

func (s *EventService) handleMute(ctx context.Context, session *model.Session, e *events.Mute) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "mute").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat mute changed")

	s.sendWebhook(ctx, session, string(model.EventChatMute), e)
}

func (s *EventService) handleArchive(ctx context.Context, session *model.Session, e *events.Archive) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "archive").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat archive changed")

	s.sendWebhook(ctx, session, string(model.EventChatArchive), e)
}

func (s *EventService) handlePin(ctx context.Context, session *model.Session, e *events.Pin) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "pin").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat pin changed")

	s.sendWebhook(ctx, session, string(model.EventChatPin), e)
}

func (s *EventService) handleStar(ctx context.Context, session *model.Session, e *events.Star) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "star").
		Str("chat", e.ChatJID.String()).
		Str("message", e.MessageID).
		Time("timestamp", e.Timestamp).
		Msg("Message star changed")

	s.sendWebhook(ctx, session, string(model.EventChatStar), e)
}

func (s *EventService) handleDeleteForMe(ctx context.Context, session *model.Session, e *events.DeleteForMe) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "delete_for_me").
		Str("chat", e.ChatJID.String()).
		Str("message", e.MessageID).
		Time("timestamp", e.Timestamp).
		Msg("Message deleted for me")

	s.sendWebhook(ctx, session, string(model.EventChatDeleteForMe), e)
}

func (s *EventService) handleDeleteChat(ctx context.Context, session *model.Session, e *events.DeleteChat) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "delete_chat").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat deleted")

	s.sendWebhook(ctx, session, string(model.EventChatDelete), e)
}

func (s *EventService) handleClearChat(ctx context.Context, session *model.Session, e *events.ClearChat) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "clear_chat").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat cleared")

	s.sendWebhook(ctx, session, string(model.EventChatClear), e)
}

func (s *EventService) handleMarkChatAsRead(ctx context.Context, session *model.Session, e *events.MarkChatAsRead) {
	logger.Debug().
		Str("session", session.Name).
		Str("event", "mark_chat_as_read").
		Str("jid", e.JID.String()).
		Time("timestamp", e.Timestamp).
		Msg("Chat marked as read")

	s.sendWebhook(ctx, session, string(model.EventChatMarkAsRead), e)
}

func (s *EventService) handleLabelEdit(ctx context.Context, session *model.Session, e *events.LabelEdit) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "label_edit").
		Time("timestamp", e.Timestamp).
		Msg("Label edited")

	s.sendWebhook(ctx, session, string(model.EventLabelEdit), e)
}

func (s *EventService) handleLabelAssociationChat(ctx context.Context, session *model.Session, e *events.LabelAssociationChat) {
	logger.Info().
		Str("session", session.Name).
		Str("event", "label_association_chat").
		Str("jid", e.JID.String()).
		Str("labelID", e.LabelID).
		Time("timestamp", e.Timestamp).
		Msg("Label association changed")

	s.sendWebhook(ctx, session, string(model.EventLabelAssociation), e)
}

// Helper

func (s *EventService) sendWebhook(ctx context.Context, session *model.Session, event string, rawEvent interface{}) {
	if s.webhookService != nil {
		s.webhookService.Send(ctx, session.ID, session.Name, event, rawEvent)
	}
}
