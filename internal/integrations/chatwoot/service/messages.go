package service

import (
	"bytes"
	"context"
	"fmt"
	"strings"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"onwapp/internal/integrations/chatwoot/client"
	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/integrations/chatwoot/util"
	"onwapp/internal/logger"
	"onwapp/internal/model"
)

// resolveLIDToStandardJID converts a @lid JID to @s.whatsapp.net JID
// Uses WhatsApp client's native LID store (Client.Store.LIDs.GetPNForLID)
func resolveLIDToStandardJID(ctx context.Context, waClient *whatsmeow.Client, jid string) string {
	if !util.IsLIDJID(jid) {
		return jid
	}

	if waClient == nil || waClient.Store == nil || waClient.Store.LIDs == nil {
		return jid
	}

	lidJID, err := types.ParseJID(jid)
	if err != nil {
		return jid
	}

	pnJID, err := waClient.Store.LIDs.GetPNForLID(ctx, lidJID)
	if err != nil || pnJID.IsEmpty() {
		return jid
	}

	convertedJID := pnJID.String()
	logger.Debug().
		Str("original", jid).
		Str("converted", convertedJID).
		Msg("Chatwoot: resolved LID via WhatsApp client store")
	return convertedJID
}

// =============================================================================
// INCOMING MESSAGE PROCESSING (WhatsApp -> Chatwoot)
// =============================================================================

// ProcessIncomingMessage processes a WhatsApp message and sends to Chatwoot (includes webhook)
func (s *Service) ProcessIncomingMessage(ctx context.Context, session *model.Session, evt *events.Message) error {
	cwMsgID, cwConvID, cfg, err := s.processIncomingMessageInternal(ctx, session, evt)
	if err != nil {
		return err
	}

	// Send webhook with Chatwoot IDs
	if cfg != nil && cwMsgID > 0 {
		s.sendWebhookWithChatwootIds(ctx, session, cfg, evt, cwMsgID, cwConvID)
	}

	return nil
}

// processIncomingMessageInternal processes a WhatsApp message and returns Chatwoot IDs (no webhook)
func (s *Service) processIncomingMessageInternal(ctx context.Context, session *model.Session, evt *events.Message) (cwMsgID int, cwConvID int, cfg *core.Config, err error) {
	cfg, err = s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		logger.Debug().Err(err).Str("sessionId", session.ID).Msg("Chatwoot: error getting config")
		return 0, 0, nil, nil
	}
	if cfg == nil {
		return 0, 0, nil, nil
	}

	// Prevent duplicate processing with in-memory lock
	cacheKey := fmt.Sprintf("in:%d:%s", cfg.InboxID, evt.Info.ID)
	if !TryAcquireMsgProcessing(cacheKey) {
		logger.Debug().Str("msgId", evt.Info.ID).Int("inboxId", cfg.InboxID).Msg("Chatwoot: skipping duplicate incoming processing")
		return 0, 0, nil, nil
	}
	defer ReleaseMsgProcessing(cacheKey)

	remoteJid := evt.Info.Chat.String()

	// Resolve LID to standard JID using WhatsApp client's native store
	remoteJid = resolveLIDToStandardJID(ctx, session.Client, remoteJid)

	if s.ShouldIgnoreJid(cfg, remoteJid) {
		return 0, 0, nil, nil
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)

	if cfg.InboxID == 0 {
		if initErr := s.InitInbox(ctx, cfg); initErr != nil {
			return 0, 0, nil, fmt.Errorf("failed to init inbox: %w", initErr)
		}
	}

	isGroup := util.IsGroupJID(remoteJid)
	participantJid := ""
	if isGroup && evt.Info.Sender.String() != "" {
		participantJid = evt.Info.Sender.String()
	}

	// Create contact name fetcher using whatsmeow's native ContactStore
	var contactNameFetcher ContactNameFetcher
	if session.Client != nil && session.Client.Store != nil && session.Client.Store.Contacts != nil {
		contactNameFetcher = func(ctx context.Context, jid string) string {
			parsedJID, parseErr := types.ParseJID(jid)
			if parseErr != nil {
				return ""
			}
			contact, contactErr := session.Client.Store.Contacts.GetContact(ctx, parsedJID)
			if contactErr != nil || !contact.Found {
				return ""
			}
			// Return best available name: FullName > FirstName > PushName > BusinessName
			if contact.FullName != "" {
				return contact.FullName
			}
			if contact.FirstName != "" {
				return contact.FirstName
			}
			if contact.PushName != "" {
				return contact.PushName
			}
			return contact.BusinessName
		}
	}

	convID, err := s.contactManager.GetOrCreateContactAndConversation(
		ctx,
		c,
		cfg,
		remoteJid,
		evt.Info.PushName,
		evt.Info.IsFromMe,
		participantJid,
		s.profilePictureFetcher,
		s.groupInfoFetcher,
		contactNameFetcher,
		session.Session,
	)
	if err != nil {
		return 0, 0, nil, fmt.Errorf("failed to get/create conversation: %w", err)
	}

	sourceID := fmt.Sprintf("WAID:%s", evt.Info.ID)

	if util.IsMediaMessage(evt.Message) && s.mediaDownloader != nil {
		return s.processIncomingMediaMessageInternal(ctx, session, evt, c, convID, sourceID, cfg)
	}

	content := s.extractMessageContent(evt)
	if content == "" {
		return 0, 0, nil, nil
	}

	if isGroup && participantJid != "" && !evt.Info.IsFromMe {
		content = s.contactManager.FormatGroupMessage(content, participantJid, evt.Info.PushName)
	}

	msgTimestamp := evt.Info.Timestamp
	msgReq := &client.CreateMessageRequest{
		Content:     content,
		MessageType: "incoming",
		SourceID:    sourceID,
		CreatedAt:   &msgTimestamp,
	}

	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	cwMsg, err := c.CreateMessage(ctx, convID, msgReq)
	if err != nil {
		if core.IsNotFoundError(err) {
			s.HandleConversationNotFound(ctx, session.ID, convID)
		}
		return 0, 0, nil, fmt.Errorf("failed to create message in chatwoot: %w", err)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, convID, sourceID); err != nil {
			logger.Debug().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update message fields")
		}
		return cwMsg.ID, convID, cfg, nil
	}

	return 0, convID, cfg, nil
}

// processIncomingMediaMessageInternal handles media messages and returns Chatwoot IDs (no webhook)
func (s *Service) processIncomingMediaMessageInternal(ctx context.Context, session *model.Session, evt *events.Message, c *client.Client, conversationID int, sourceID string, cfg *core.Config) (cwMsgID int, cwConvID int, retCfg *core.Config, err error) {
	mediaInfo := util.GetMediaInfo(evt.Message)
	if mediaInfo == nil {
		return 0, 0, nil, fmt.Errorf("failed to get media info")
	}

	var contentAttributes map[string]interface{}
	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		contentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	mediaData, err := s.mediaDownloader(ctx, session.Session, evt.Message)
	if err != nil {
		logger.Debug().Err(err).
			Str("session", session.Session).
			Str("messageId", evt.Info.ID).
			Msg("Chatwoot: failed to download media, sending filename as text")

		content := mediaInfo.Filename
		if mediaInfo.Caption != "" {
			content = mediaInfo.Caption
		}
		msgTimestamp := evt.Info.Timestamp
		msgReq := &client.CreateMessageRequest{
			Content:           content,
			MessageType:       "incoming",
			SourceID:          sourceID,
			ContentAttributes: contentAttributes,
			CreatedAt:         &msgTimestamp,
		}
		cwMsg, createErr := c.CreateMessage(ctx, conversationID, msgReq)
		if createErr != nil {
			return 0, conversationID, cfg, createErr
		}
		if cwMsg != nil {
			return cwMsg.ID, conversationID, cfg, nil
		}
		return 0, conversationID, cfg, nil
	}

	content := mediaInfo.Caption
	msgTimestamp := evt.Info.Timestamp
	cwMsg, createErr := c.CreateMessageWithAttachmentAndMimeAndTime(ctx, conversationID, content, "incoming", bytes.NewReader(mediaData), mediaInfo.Filename, mediaInfo.MimeType, contentAttributes, &msgTimestamp)
	if createErr != nil {
		if core.IsNotFoundError(createErr) {
			s.HandleConversationNotFound(ctx, session.ID, conversationID)
		}
		return 0, 0, nil, fmt.Errorf("failed to upload media to chatwoot: %w", createErr)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conversationID, sourceID); err != nil {
			logger.Debug().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update media message fields")
		}
		return cwMsg.ID, conversationID, cfg, nil
	}

	return 0, conversationID, cfg, nil
}

// sendWebhookWithChatwootIds sends a webhook notification with Chatwoot message and conversation IDs
func (s *Service) sendWebhookWithChatwootIds(ctx context.Context, session *model.Session, cfg *core.Config, evt *events.Message, cwMsgID, cwConvID int) {
	if s.webhookSender == nil {
		return
	}

	event := "message.received"
	if evt.Info.IsFromMe {
		event = "message.sent"
	}

	cwInfo := &ChatwootInfo{
		Account:        cfg.Account,
		InboxID:        cfg.InboxID,
		ConversationID: cwConvID,
		MessageID:      cwMsgID,
	}

	s.webhookSender.SendWithChatwoot(ctx, session.ID, session.Session, event, evt, cwInfo)
}

// sendWebhookWithPreserializedJSON sends webhook using pre-serialized JSON (optimized for queue processing)
func (s *Service) sendWebhookWithPreserializedJSON(ctx context.Context, session *model.Session, cfg *core.Config, isFromMe bool, fullEventJSON []byte, cwMsgID, cwConvID int) {
	if s.webhookSender == nil || len(fullEventJSON) == 0 {
		return
	}

	event := "message.received"
	if isFromMe {
		event = "message.sent"
	}

	cwInfo := &ChatwootInfo{
		Account:        cfg.Account,
		InboxID:        cfg.InboxID,
		ConversationID: cwConvID,
		MessageID:      cwMsgID,
	}

	s.webhookSender.SendWithPreserializedJSON(ctx, session.ID, session.Session, event, fullEventJSON, cwInfo)
}

// =============================================================================
// OUTGOING MESSAGE PROCESSING (WhatsApp direct -> Chatwoot)
// =============================================================================

// ProcessOutgoingMessage processes outgoing messages sent directly from WhatsApp (includes webhook)
func (s *Service) ProcessOutgoingMessage(ctx context.Context, session *model.Session, evt *events.Message) error {
	cwMsgID, cwConvID, cfg, err := s.processOutgoingMessageInternal(ctx, session, evt)
	if err != nil {
		return err
	}

	// Send webhook with Chatwoot IDs
	if cfg != nil && cwMsgID > 0 {
		s.sendWebhookWithChatwootIds(ctx, session, cfg, evt, cwMsgID, cwConvID)
	}

	return nil
}

// processOutgoingMessageInternal processes outgoing messages and returns Chatwoot IDs (no webhook)
func (s *Service) processOutgoingMessageInternal(ctx context.Context, session *model.Session, evt *events.Message) (cwMsgID int, cwConvID int, cfg *core.Config, err error) {
	cfg, err = s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		return 0, 0, nil, nil
	}
	if cfg == nil {
		return 0, 0, nil, nil
	}

	// Prevent duplicate processing with in-memory lock
	cacheKey := fmt.Sprintf("out:%d:%s", cfg.InboxID, evt.Info.ID)
	if !TryAcquireMsgProcessing(cacheKey) {
		logger.Debug().Str("msgId", evt.Info.ID).Int("inboxId", cfg.InboxID).Msg("Chatwoot: skipping duplicate outgoing processing")
		return 0, 0, nil, nil
	}
	defer ReleaseMsgProcessing(cacheKey)

	remoteJid := evt.Info.Chat.String()

	// Resolve LID to standard JID using WhatsApp client's native store
	remoteJid = resolveLIDToStandardJID(ctx, session.Client, remoteJid)

	if s.ShouldIgnoreJid(cfg, remoteJid) {
		return 0, 0, nil, nil
	}

	sourceID := fmt.Sprintf("WAID:%s", evt.Info.ID)

	if s.database != nil {
		existingMsg, _ := s.database.Messages.GetByMsgId(ctx, session.ID, evt.Info.ID)
		if existingMsg != nil && existingMsg.CwMsgId != nil && *existingMsg.CwMsgId > 0 {
			return 0, 0, nil, nil
		}
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)

	if cfg.InboxID == 0 {
		if initErr := s.InitInbox(ctx, cfg); initErr != nil {
			return 0, 0, nil, fmt.Errorf("failed to init inbox: %w", initErr)
		}
	}

	isGroup := util.IsGroupJID(remoteJid)
	phoneNumber := util.ExtractPhoneFromJID(remoteJid)

	contact, err := c.GetOrCreateContactWithMerge(ctx, cfg.InboxID, phoneNumber, remoteJid, phoneNumber, "", isGroup, cfg.MergeBrPhones)
	if err != nil {
		return 0, 0, nil, fmt.Errorf("failed to get/create contact: %w", err)
	}

	conv, err := c.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, "open", cfg.AutoReopen)
	if err != nil {
		return 0, 0, nil, fmt.Errorf("failed to get/create conversation: %w", err)
	}

	// Handle media messages (audio, image, video, document, sticker)
	if util.IsMediaMessage(evt.Message) && s.mediaDownloader != nil {
		return s.processOutgoingMediaMessageInternal(ctx, session, evt, c, conv.ID, sourceID, cfg)
	}

	content := s.extractMessageContent(evt)
	if content == "" {
		return 0, 0, nil, nil
	}

	msgTimestamp := evt.Info.Timestamp
	msgReq := &client.CreateMessageRequest{
		Content:     content,
		MessageType: "outgoing",
		SourceID:    sourceID,
		CreatedAt:   &msgTimestamp,
	}

	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	cwMsg, err := c.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		if core.IsNotFoundError(err) {
			s.HandleConversationNotFound(ctx, session.ID, conv.ID)
		}
		return 0, 0, nil, fmt.Errorf("failed to create outgoing message in chatwoot: %w", err)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conv.ID, sourceID); err != nil {
			logger.Debug().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update outgoing message fields")
		}
		return cwMsg.ID, conv.ID, cfg, nil
	}

	return 0, conv.ID, cfg, nil
}

// processOutgoingMediaMessageInternal handles outgoing media messages and returns Chatwoot IDs (no webhook)
func (s *Service) processOutgoingMediaMessageInternal(ctx context.Context, session *model.Session, evt *events.Message, c *client.Client, conversationID int, sourceID string, cfg *core.Config) (cwMsgID int, cwConvID int, retCfg *core.Config, err error) {
	mediaInfo := util.GetMediaInfo(evt.Message)
	if mediaInfo == nil {
		return 0, 0, nil, fmt.Errorf("failed to get media info")
	}

	var contentAttributes map[string]interface{}
	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		contentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	mediaData, err := s.mediaDownloader(ctx, session.Session, evt.Message)
	if err != nil {
		logger.Debug().Err(err).
			Str("session", session.Session).
			Str("messageId", evt.Info.ID).
			Msg("Chatwoot: failed to download outgoing media, sending filename as text")

		content := mediaInfo.Filename
		if mediaInfo.Caption != "" {
			content = mediaInfo.Caption
		}
		msgTimestamp := evt.Info.Timestamp
		msgReq := &client.CreateMessageRequest{
			Content:           content,
			MessageType:       "outgoing",
			SourceID:          sourceID,
			ContentAttributes: contentAttributes,
			CreatedAt:         &msgTimestamp,
		}
		cwMsg, createErr := c.CreateMessage(ctx, conversationID, msgReq)
		if createErr != nil {
			return 0, conversationID, cfg, createErr
		}
		if cwMsg != nil {
			return cwMsg.ID, conversationID, cfg, nil
		}
		return 0, conversationID, cfg, nil
	}

	content := mediaInfo.Caption
	msgTimestamp := evt.Info.Timestamp
	cwMsg, createErr := c.CreateMessageWithAttachmentAndMimeAndTime(ctx, conversationID, content, "outgoing", bytes.NewReader(mediaData), mediaInfo.Filename, mediaInfo.MimeType, contentAttributes, &msgTimestamp)
	if createErr != nil {
		if core.IsNotFoundError(createErr) {
			s.HandleConversationNotFound(ctx, session.ID, conversationID)
		}
		return 0, 0, nil, fmt.Errorf("failed to upload outgoing media to chatwoot: %w", createErr)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conversationID, sourceID); err != nil {
			logger.Debug().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update outgoing media message fields")
		}
		return cwMsg.ID, conversationID, cfg, nil
	}

	return 0, conversationID, cfg, nil
}

// =============================================================================
// REACTION PROCESSING
// =============================================================================

// ProcessReactionMessage handles reaction events from WhatsApp
func (s *Service) ProcessReactionMessage(ctx context.Context, session *model.Session, emoji, targetMsgID, remoteJid, senderJid string, isFromMe bool) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		logger.Debug().Err(err).Str("sessionId", session.ID).Msg("Chatwoot: config not found")
		return nil
	}
	if cfg == nil {
		return nil
	}

	if cfg.InboxID == 0 {
		return nil
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)

	isGroup := util.IsGroupJID(remoteJid)
	phoneNumber := util.ExtractPhoneFromJID(remoteJid)
	senderPhone := util.ExtractPhoneFromJID(senderJid)
	contactName := senderPhone

	contact, err := c.GetOrCreateContactWithMerge(ctx, cfg.InboxID, phoneNumber, remoteJid, contactName, "", isGroup, cfg.MergeBrPhones)
	if err != nil {
		return fmt.Errorf("failed to get/create contact for reaction: %w", err)
	}

	status := "open"
	if cfg.StartPending {
		status = "pending"
	}

	conv, err := c.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, status, cfg.AutoReopen)
	if err != nil {
		return fmt.Errorf("failed to get/create conversation for reaction: %w", err)
	}

	var inReplyTo *int
	var inReplyToExternalID string

	if s.database != nil {
		originalMsg, msgErr := s.database.Messages.GetByMsgId(ctx, session.ID, targetMsgID)
		if msgErr == nil && originalMsg != nil && originalMsg.CwMsgId != nil {
			inReplyTo = originalMsg.CwMsgId
			inReplyToExternalID = targetMsgID
		}
	}

	messageType := "incoming"
	if isFromMe {
		messageType = "outgoing"
	}

	msgReq := &client.CreateMessageRequest{
		Content:     emoji,
		MessageType: messageType,
	}

	if inReplyTo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             *inReplyTo,
			"in_reply_to_external_id": inReplyToExternalID,
		}
	}

	_, err = c.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		if core.IsNotFoundError(err) {
			s.HandleConversationNotFound(ctx, session.ID, conv.ID)
		}
		return fmt.Errorf("failed to send reaction to chatwoot: %w", err)
	}

	return nil
}

// =============================================================================
// RECEIPT PROCESSING
// =============================================================================

// ProcessReceipt handles message receipt (delivered/read) events
func (s *Service) ProcessReceipt(ctx context.Context, session *model.Session, evt *events.Receipt) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		logger.Debug().Err(err).Str("sessionId", session.ID).Msg("Chatwoot: config not found")
		return nil
	}
	if cfg == nil {
		return nil
	}

	if evt.Type == types.ReceiptTypeRead {
		for _, msgID := range evt.MessageIDs {
			if err := s.HandleMessageRead(ctx, session, msgID); err != nil {
				logger.Debug().Err(err).Str("messageId", msgID).Msg("Chatwoot: failed to process read receipt")
			}
		}
	}

	return nil
}

// HandleMessageRead processes read receipts and updates Chatwoot last_seen
func (s *Service) HandleMessageRead(ctx context.Context, session *model.Session, messageID string) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		logger.Debug().Err(err).Str("sessionId", session.ID).Msg("Chatwoot: config not found")
		return nil
	}
	if cfg == nil {
		return nil
	}

	msg, err := s.database.Messages.GetByMsgId(ctx, session.ID, messageID)
	if err != nil {
		logger.Debug().Err(err).Str("messageId", messageID).Msg("Chatwoot: message not found")
		return nil
	}
	if msg == nil || msg.CwConvId == nil || *msg.CwConvId == 0 {
		return nil
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)
	if cfg.InboxID == 0 {
		return nil
	}

	inbox, err := c.GetInbox(ctx, cfg.InboxID)
	if err != nil {
		logger.Debug().Err(err).Int("inboxId", cfg.InboxID).Msg("Chatwoot: inbox not found")
		return nil
	}
	if inbox.InboxIdentifier == "" {
		return nil
	}

	conv, contactSourceID, err := c.GetConversationWithContactInbox(ctx, *msg.CwConvId)
	if err != nil {
		if core.IsNotFoundError(err) {
			s.HandleConversationNotFound(ctx, session.ID, *msg.CwConvId)
		}
		logger.Debug().Err(err).Int("convId", *msg.CwConvId).Msg("Chatwoot: conversation not found")
		return nil
	}
	_ = conv

	if contactSourceID == "" {
		return nil
	}

	if err := c.UpdateLastSeen(ctx, inbox.InboxIdentifier, contactSourceID, *msg.CwConvId); err != nil {
		if core.IsNotFoundError(err) {
			s.HandleConversationNotFound(ctx, session.ID, *msg.CwConvId)
			return nil
		}
		logger.Debug().Err(err).Int("conversationId", *msg.CwConvId).Msg("Chatwoot: failed to update last_seen")
		return err
	}

	return nil
}

// =============================================================================
// MESSAGE DELETE PROCESSING
// =============================================================================

// ProcessMessageDelete handles message deletion from WhatsApp
func (s *Service) ProcessMessageDelete(ctx context.Context, session *model.Session, messageID string) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		logger.Debug().Err(err).Str("sessionId", session.ID).Msg("Chatwoot: config not found")
		return nil
	}
	if cfg == nil {
		return nil
	}

	msg, err := s.database.Messages.GetByMsgId(ctx, session.ID, messageID)
	if err != nil {
		logger.Debug().Err(err).Str("messageId", messageID).Msg("Chatwoot: message not found")
		return nil
	}
	if msg == nil || msg.CwMsgId == nil || msg.CwConvId == nil {
		return nil
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)

	if err := c.DeleteMessage(ctx, *msg.CwConvId, *msg.CwMsgId); err != nil {
		if core.IsNotFoundError(err) {
			s.HandleConversationNotFound(ctx, session.ID, *msg.CwConvId)
			_ = s.database.Messages.Delete(ctx, session.ID, messageID)
			return nil
		}
		return fmt.Errorf("failed to delete message from Chatwoot: %w", err)
	}

	_ = s.database.Messages.Delete(ctx, session.ID, messageID)

	return nil
}

// =============================================================================
// CONTENT EXTRACTION
// =============================================================================

// extractMessageContent extracts text content from WhatsApp message
func (s *Service) extractMessageContent(evt *events.Message) string {
	msg := evt.Message
	if msg == nil {
		return ""
	}

	if msg.GetConversation() != "" {
		return msg.GetConversation()
	}
	if ext := msg.GetExtendedTextMessage(); ext != nil {
		return ext.GetText()
	}

	if img := msg.GetImageMessage(); img != nil {
		return img.GetCaption()
	}
	if vid := msg.GetVideoMessage(); vid != nil {
		return vid.GetCaption()
	}
	if doc := msg.GetDocumentMessage(); doc != nil {
		return doc.GetCaption()
	}

	if loc := msg.GetLocationMessage(); loc != nil {
		return fmt.Sprintf("📍 Location: https://www.google.com/maps?q=%f,%f",
			loc.GetDegreesLatitude(), loc.GetDegreesLongitude())
	}

	if contact := msg.GetContactMessage(); contact != nil {
		return formatContactMessage(contact)
	}

	if contacts := msg.GetContactsArrayMessage(); contacts != nil {
		return formatContactsArrayMessage(contacts)
	}

	if msg.GetStickerMessage() != nil {
		return "🎨 Sticker"
	}

	if msg.GetAudioMessage() != nil {
		return "🎵 Audio"
	}

	return ""
}

// contextExtractor extracts ContextInfo from a message type
type contextExtractor func(*waE2E.Message) *waE2E.ContextInfo

// contextExtractors defines all message types that can have ContextInfo
var contextExtractors = []contextExtractor{
	func(m *waE2E.Message) *waE2E.ContextInfo {
		if ext := m.GetExtendedTextMessage(); ext != nil {
			return ext.GetContextInfo()
		}
		return nil
	},
	func(m *waE2E.Message) *waE2E.ContextInfo {
		if img := m.GetImageMessage(); img != nil {
			return img.GetContextInfo()
		}
		return nil
	},
	func(m *waE2E.Message) *waE2E.ContextInfo {
		if vid := m.GetVideoMessage(); vid != nil {
			return vid.GetContextInfo()
		}
		return nil
	},
	func(m *waE2E.Message) *waE2E.ContextInfo {
		if aud := m.GetAudioMessage(); aud != nil {
			return aud.GetContextInfo()
		}
		return nil
	},
	func(m *waE2E.Message) *waE2E.ContextInfo {
		if doc := m.GetDocumentMessage(); doc != nil {
			return doc.GetContextInfo()
		}
		return nil
	},
	func(m *waE2E.Message) *waE2E.ContextInfo {
		if stk := m.GetStickerMessage(); stk != nil {
			return stk.GetContextInfo()
		}
		return nil
	},
	func(m *waE2E.Message) *waE2E.ContextInfo {
		if contact := m.GetContactMessage(); contact != nil {
			return contact.GetContextInfo()
		}
		return nil
	},
	func(m *waE2E.Message) *waE2E.ContextInfo {
		if contacts := m.GetContactsArrayMessage(); contacts != nil {
			return contacts.GetContextInfo()
		}
		return nil
	},
}

// extractReplyInfo extracts reply/quote information from a WhatsApp message
func (s *Service) extractReplyInfo(ctx context.Context, sessionID string, evt *events.Message) *core.ReplyInfo {
	if s.database == nil || evt.Message == nil {
		return nil
	}

	var stanzaID string
	var foundExtractor string

	// Debug: Check each extractor explicitly for contact messages
	if contact := evt.Message.GetContactMessage(); contact != nil {
		if ctxInfo := contact.GetContextInfo(); ctxInfo != nil {
			logger.Debug().
				Str("messageId", evt.Info.ID).
				Str("stanzaId", ctxInfo.GetStanzaID()).
				Str("participant", ctxInfo.GetParticipant()).
				Bool("hasContextInfo", true).
				Msg("ContactMessage ContextInfo details")
			if id := ctxInfo.GetStanzaID(); id != "" {
				stanzaID = id
				foundExtractor = "ContactMessage"
			}
		} else {
			logger.Debug().
				Str("messageId", evt.Info.ID).
				Bool("hasContextInfo", false).
				Msg("ContactMessage has no ContextInfo")
		}
	}

	if contacts := evt.Message.GetContactsArrayMessage(); contacts != nil {
		if ctxInfo := contacts.GetContextInfo(); ctxInfo != nil {
			logger.Debug().
				Str("messageId", evt.Info.ID).
				Str("stanzaId", ctxInfo.GetStanzaID()).
				Str("participant", ctxInfo.GetParticipant()).
				Bool("hasContextInfo", true).
				Msg("ContactsArrayMessage ContextInfo details")
			if stanzaID == "" {
				if id := ctxInfo.GetStanzaID(); id != "" {
					stanzaID = id
					foundExtractor = "ContactsArrayMessage"
				}
			}
		} else {
			logger.Debug().
				Str("messageId", evt.Info.ID).
				Bool("hasContextInfo", false).
				Msg("ContactsArrayMessage has no ContextInfo")
		}
	}

	// If not found in contact messages, try other extractors
	if stanzaID == "" {
		for i, extract := range contextExtractors {
			if ctxInfo := extract(evt.Message); ctxInfo != nil {
				if id := ctxInfo.GetStanzaID(); id != "" {
					stanzaID = id
					foundExtractor = fmt.Sprintf("extractor[%d]", i)
					break
				}
			}
		}
	}

	if stanzaID == "" {
		return nil
	}

	logger.Debug().
		Str("messageId", evt.Info.ID).
		Str("stanzaId", stanzaID).
		Str("extractor", foundExtractor).
		Msg("Found quote StanzaID")

	originalMsg, err := s.database.Messages.GetByMsgId(ctx, sessionID, stanzaID)
	if err != nil {
		logger.Debug().
			Err(err).
			Str("messageId", evt.Info.ID).
			Str("stanzaId", stanzaID).
			Msg("Failed to get original message for quote")
		return nil
	}

	if originalMsg == nil {
		logger.Debug().
			Str("messageId", evt.Info.ID).
			Str("stanzaId", stanzaID).
			Msg("Original message not found in database")
		return nil
	}

	if originalMsg.CwMsgId == nil || *originalMsg.CwMsgId == 0 {
		logger.Debug().
			Str("messageId", evt.Info.ID).
			Str("stanzaId", stanzaID).
			Str("originalMsgId", originalMsg.MsgId).
			Msg("Original message has no CwMsgId yet (race condition?)")
		return nil
	}

	logger.Debug().
		Str("messageId", evt.Info.ID).
		Str("stanzaId", stanzaID).
		Int("cwMsgId", *originalMsg.CwMsgId).
		Msg("Quote info extracted successfully")

	return &core.ReplyInfo{
		CwMsgId:           *originalMsg.CwMsgId,
		WhatsAppMessageID: stanzaID,
	}
}

// =============================================================================
// CONTACT MESSAGE FORMATTING
// =============================================================================

// formatContactMessage formats a single contact message with vCard details
func formatContactMessage(contact *waE2E.ContactMessage) string {
	name := contact.GetDisplayName()
	vcard := contact.GetVcard()

	phones := util.ParseVCardPhones(vcard)
	emails := util.ParseVCardEmails(vcard)
	org := util.ParseVCardOrg(vcard)

	logger.Debug().
		Str("name", name).
		Strs("phones", phones).
		Strs("emails", emails).
		Str("org", org).
		Msg("Parsed contact vCard")

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**👤 %s**", name))

	for _, phone := range phones {
		sb.WriteString(fmt.Sprintf("\n📱 `%s`", phone))
	}

	for _, email := range emails {
		sb.WriteString(fmt.Sprintf("\n📧 %s", email))
	}

	if org != "" {
		sb.WriteString(fmt.Sprintf("\n🏢 _%s_", org))
	}

	return sb.String()
}

// formatContactsArrayMessage formats multiple contacts
func formatContactsArrayMessage(contacts *waE2E.ContactsArrayMessage) string {
	contactList := contacts.GetContacts()
	if len(contactList) == 0 {
		return "👥 Contacts: (empty)"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**👥 %d Contact(s)**", len(contactList)))

	for i, contact := range contactList {
		if i > 0 {
			sb.WriteString("\n\n---\n")
		} else {
			sb.WriteString("\n")
		}
		sb.WriteString(formatContactMessage(contact))
	}

	return sb.String()
}
