package chatwoot

import (
	"bytes"
	"context"
	"fmt"

	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// =============================================================================
// INCOMING MESSAGE PROCESSING (WhatsApp -> Chatwoot)
// =============================================================================

// ProcessIncomingMessage processes a WhatsApp message and sends to Chatwoot
func (s *Service) ProcessIncomingMessage(ctx context.Context, session *model.Session, evt *events.Message) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		logger.Debug().Err(err).Str("sessionId", session.ID).Msg("Chatwoot: error getting config")
		return nil
	}
	if cfg == nil {
		return nil
	}

	remoteJid := evt.Info.Chat.String()

	// Convert @lid JID to standard @s.whatsapp.net JID
	if IsLIDJID(remoteJid) && s.database != nil {
		convertedJid := ConvertLIDToStandardJID(ctx, s.database.Pool, remoteJid)
		if convertedJid != remoteJid {
			logger.Info().
				Str("original", remoteJid).
				Str("converted", convertedJid).
				Msg("Chatwoot: converted LID to standard JID")
			remoteJid = convertedJid
		} else {
			logger.Warn().
				Str("lid", remoteJid).
				Msg("Chatwoot: could not convert LID to PN (not found in whatsmeow_lid_map)")
		}
	}

	if s.ShouldIgnoreJid(cfg, remoteJid) {
		return nil
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	if cfg.InboxID == 0 {
		if err := s.InitInbox(ctx, cfg); err != nil {
			return fmt.Errorf("failed to init inbox: %w", err)
		}
	}

	isGroup := IsGroupJID(remoteJid)
	participantJid := ""
	if isGroup && evt.Info.Sender.String() != "" {
		participantJid = evt.Info.Sender.String()
	}

	convID, err := s.contactManager.GetOrCreateContactAndConversation(
		ctx,
		client,
		cfg,
		remoteJid,
		evt.Info.PushName,
		evt.Info.IsFromMe,
		participantJid,
		s.profilePictureFetcher,
		s.groupInfoFetcher,
		session.Name,
	)
	if err != nil {
		return fmt.Errorf("failed to get/create conversation: %w", err)
	}

	sourceID := fmt.Sprintf("WAID:%s", evt.Info.ID)

	if IsMediaMessage(evt.Message) && s.mediaDownloader != nil {
		return s.processIncomingMediaMessage(ctx, session, evt, client, convID, sourceID, cfg)
	}

	content := s.extractMessageContent(evt)
	if content == "" {
		return nil
	}

	if isGroup && participantJid != "" && !evt.Info.IsFromMe {
		content = s.contactManager.FormatGroupMessage(content, participantJid, evt.Info.PushName)
	}

	msgReq := &CreateMessageRequest{
		Content:     content,
		MessageType: "incoming",
		SourceID:    sourceID,
	}

	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	cwMsg, err := client.CreateMessage(ctx, convID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to create message in chatwoot: %w", err)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, convID, sourceID); err != nil {
			logger.Warn().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update message fields")
		}
	}

	return nil
}

// processIncomingMediaMessage handles media messages (images, videos, documents, etc.)
func (s *Service) processIncomingMediaMessage(ctx context.Context, session *model.Session, evt *events.Message, client *Client, conversationID int, sourceID string, cfg *Config) error {
	mediaInfo := GetMediaInfo(evt.Message)
	if mediaInfo == nil {
		return fmt.Errorf("failed to get media info")
	}

	var contentAttributes map[string]interface{}
	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		contentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	mediaData, err := s.mediaDownloader(ctx, session.Name, evt.Message)
	if err != nil {
		logger.Warn().Err(err).
			Str("session", session.Name).
			Str("messageId", evt.Info.ID).
			Msg("Chatwoot: failed to download media, sending filename as text instead")

		content := mediaInfo.Filename
		if mediaInfo.Caption != "" {
			content = mediaInfo.Caption
		}
		msgReq := &CreateMessageRequest{
			Content:           content,
			MessageType:       "incoming",
			SourceID:          sourceID,
			ContentAttributes: contentAttributes,
		}
		_, err := client.CreateMessage(ctx, conversationID, msgReq)
		return err
	}

	content := mediaInfo.Caption
	cwMsg, err := client.CreateMessageWithAttachmentAndMime(ctx, conversationID, content, "incoming", bytes.NewReader(mediaData), mediaInfo.Filename, mediaInfo.MimeType, contentAttributes)
	if err != nil {
		return fmt.Errorf("failed to upload media to chatwoot: %w", err)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conversationID, sourceID); err != nil {
			logger.Warn().Err(err).
				Str("messageId", evt.Info.ID).
				Int("chatwootMessageId", cwMsg.ID).
				Msg("Chatwoot: failed to save chatwoot message ID for media")
		}
	}

	return nil
}

// =============================================================================
// OUTGOING MESSAGE PROCESSING (WhatsApp direct -> Chatwoot)
// =============================================================================

// ProcessOutgoingMessage processes outgoing messages sent directly from WhatsApp
func (s *Service) ProcessOutgoingMessage(ctx context.Context, session *model.Session, evt *events.Message) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil {
		return nil
	}
	if cfg == nil {
		return nil
	}

	remoteJid := evt.Info.Chat.String()

	if IsLIDJID(remoteJid) && s.database != nil {
		convertedJid := ConvertLIDToStandardJID(ctx, s.database.Pool, remoteJid)
		if convertedJid != remoteJid {
			remoteJid = convertedJid
		}
	}

	if s.ShouldIgnoreJid(cfg, remoteJid) {
		return nil
	}

	content := s.extractMessageContent(evt)
	if content == "" {
		return nil
	}

	sourceID := fmt.Sprintf("WAID:%s", evt.Info.ID)

	if s.database != nil {
		existingMsg, _ := s.database.Messages.GetByMsgId(ctx, session.ID, evt.Info.ID)
		if existingMsg != nil && existingMsg.CwMsgId != nil && *existingMsg.CwMsgId > 0 {
			return nil
		}
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	if cfg.InboxID == 0 {
		if err := s.InitInbox(ctx, cfg); err != nil {
			return fmt.Errorf("failed to init inbox: %w", err)
		}
	}

	isGroup := IsGroupJID(remoteJid)
	phoneNumber := ExtractPhoneFromJID(remoteJid)

	contact, err := client.GetOrCreateContact(ctx, cfg.InboxID, phoneNumber, remoteJid, phoneNumber, "", isGroup)
	if err != nil {
		return fmt.Errorf("failed to get/create contact: %w", err)
	}

	conv, err := client.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, "open", cfg.AutoReopen)
	if err != nil {
		return fmt.Errorf("failed to get/create conversation: %w", err)
	}

	msgReq := &CreateMessageRequest{
		Content:     content,
		MessageType: "outgoing",
		SourceID:    sourceID,
	}

	if replyInfo := s.extractReplyInfo(ctx, session.ID, evt); replyInfo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             replyInfo.CwMsgId,
			"in_reply_to_external_id": replyInfo.WhatsAppMessageID,
		}
	}

	cwMsg, err := client.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to create outgoing message in chatwoot: %w", err)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conv.ID, sourceID); err != nil {
			logger.Warn().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update outgoing message fields")
		}
	}

	return nil
}

// =============================================================================
// REACTION PROCESSING
// =============================================================================

// ProcessReactionMessage handles reaction events from WhatsApp
func (s *Service) ProcessReactionMessage(ctx context.Context, session *model.Session, emoji, targetMsgID, remoteJid, senderJid string, isFromMe bool) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil || cfg == nil {
		return nil
	}

	if cfg.InboxID == 0 {
		return nil
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	isGroup := IsGroupJID(remoteJid)
	phoneNumber := ExtractPhoneFromJID(remoteJid)
	senderPhone := ExtractPhoneFromJID(senderJid)
	contactName := senderPhone

	contact, err := client.GetOrCreateContact(ctx, cfg.InboxID, phoneNumber, remoteJid, contactName, "", isGroup)
	if err != nil {
		return fmt.Errorf("failed to get/create contact for reaction: %w", err)
	}

	status := "open"
	if cfg.StartPending {
		status = "pending"
	}

	conv, err := client.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, status, cfg.AutoReopen)
	if err != nil {
		return fmt.Errorf("failed to get/create conversation for reaction: %w", err)
	}

	var inReplyTo *int
	var inReplyToExternalID string

	if s.database != nil {
		originalMsg, err := s.database.Messages.GetByMsgId(ctx, session.ID, targetMsgID)
		if err == nil && originalMsg != nil && originalMsg.CwMsgId != nil {
			inReplyTo = originalMsg.CwMsgId
			inReplyToExternalID = targetMsgID
		}
	}

	messageType := "incoming"
	if isFromMe {
		messageType = "outgoing"
	}

	msgReq := &CreateMessageRequest{
		Content:     emoji,
		MessageType: messageType,
	}

	if inReplyTo != nil {
		msgReq.ContentAttributes = map[string]interface{}{
			"in_reply_to":             *inReplyTo,
			"in_reply_to_external_id": inReplyToExternalID,
		}
	}

	_, err = client.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
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
	if err != nil || cfg == nil {
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
	if err != nil || cfg == nil {
		return nil
	}

	msg, err := s.database.Messages.GetByMsgId(ctx, session.ID, messageID)
	if err != nil || msg == nil {
		logger.Debug().Str("messageId", messageID).Msg("Chatwoot: message not found for read receipt")
		return nil
	}

	if msg.CwConvId == nil || *msg.CwConvId == 0 {
		logger.Debug().Str("messageId", messageID).Msg("Chatwoot: message has no conversation ID")
		return nil
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	if cfg.InboxID == 0 {
		logger.Debug().Msg("Chatwoot: inbox ID not set")
		return nil
	}

	inbox, err := client.GetInbox(ctx, cfg.InboxID)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot: failed to get inbox")
		return nil
	}

	if inbox.InboxIdentifier == "" {
		logger.Debug().Msg("Chatwoot: inbox_identifier not available")
		return nil
	}

	conv, contactSourceID, err := client.GetConversationWithContactInbox(ctx, *msg.CwConvId)
	if err != nil {
		logger.Warn().Err(err).Int("conversationId", *msg.CwConvId).Msg("Chatwoot: failed to get conversation")
		return nil
	}

	logger.Debug().
		Int("conversationId", *msg.CwConvId).
		Str("contactSourceID", contactSourceID).
		Str("inboxIdentifier", inbox.InboxIdentifier).
		Interface("convID", conv.ID).
		Msg("Chatwoot: read receipt debug info")

	if contactSourceID == "" {
		logger.Debug().Int("conversationId", *msg.CwConvId).Msg("Chatwoot: contact_source_id not found")
		return nil
	}

	if err := client.UpdateLastSeen(ctx, inbox.InboxIdentifier, contactSourceID, *msg.CwConvId); err != nil {
		logger.Warn().Err(err).
			Int("conversationId", *msg.CwConvId).
			Str("inboxIdentifier", inbox.InboxIdentifier).
			Msg("Chatwoot: failed to update last_seen")
		return err
	}

	logger.Info().
		Str("session", session.Name).
		Str("messageId", messageID).
		Int("conversationId", *msg.CwConvId).
		Msg("Chatwoot: updated last_seen (read receipt)")

	return nil
}

// =============================================================================
// MESSAGE DELETE PROCESSING
// =============================================================================

// ProcessMessageDelete handles message deletion from WhatsApp
func (s *Service) ProcessMessageDelete(ctx context.Context, session *model.Session, messageID string) error {
	cfg, err := s.repo.GetEnabledBySessionID(ctx, session.ID)
	if err != nil || cfg == nil {
		return nil
	}

	msg, err := s.database.Messages.GetByMsgId(ctx, session.ID, messageID)
	if err != nil || msg == nil {
		logger.Debug().Str("messageId", messageID).Msg("Chatwoot: message not found for deletion")
		return nil
	}

	if msg.CwMsgId == nil || msg.CwConvId == nil {
		logger.Debug().Str("messageId", messageID).Msg("Chatwoot: message has no Chatwoot IDs")
		return nil
	}

	client := NewClient(cfg.URL, cfg.Token, cfg.Account)

	if err := client.DeleteMessage(ctx, *msg.CwConvId, *msg.CwMsgId); err != nil {
		return fmt.Errorf("failed to delete message from Chatwoot: %w", err)
	}

	if err := s.database.Messages.Delete(ctx, session.ID, messageID); err != nil {
		logger.Warn().Err(err).Str("messageId", messageID).Msg("Chatwoot: failed to delete message from database")
	}

	logger.Info().
		Str("session", session.Name).
		Str("messageId", messageID).
		Int("chatwootMsgId", *msg.CwMsgId).
		Msg("Chatwoot: message deleted from Chatwoot")

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
		return fmt.Sprintf("👤 Contact: %s", contact.GetDisplayName())
	}

	if msg.GetStickerMessage() != nil {
		return "🎨 Sticker"
	}

	if msg.GetAudioMessage() != nil {
		return "🎵 Audio"
	}

	return ""
}

// extractReplyInfo extracts reply/quote information from a WhatsApp message
func (s *Service) extractReplyInfo(ctx context.Context, sessionID string, evt *events.Message) *ReplyInfo {
	if s.database == nil {
		return nil
	}

	msg := evt.Message
	if msg == nil {
		return nil
	}

	var stanzaID string

	// Check all message types for context info
	if ext := msg.GetExtendedTextMessage(); ext != nil {
		if ctx := ext.GetContextInfo(); ctx != nil {
			stanzaID = ctx.GetStanzaID()
		}
	}
	if stanzaID == "" {
		if img := msg.GetImageMessage(); img != nil {
			if ctx := img.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}
	if stanzaID == "" {
		if vid := msg.GetVideoMessage(); vid != nil {
			if ctx := vid.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}
	if stanzaID == "" {
		if aud := msg.GetAudioMessage(); aud != nil {
			if ctx := aud.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}
	if stanzaID == "" {
		if doc := msg.GetDocumentMessage(); doc != nil {
			if ctx := doc.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}
	if stanzaID == "" {
		if stk := msg.GetStickerMessage(); stk != nil {
			if ctx := stk.GetContextInfo(); ctx != nil {
				stanzaID = ctx.GetStanzaID()
			}
		}
	}

	if stanzaID == "" {
		return nil
	}

	originalMsg, err := s.database.Messages.GetByMsgId(ctx, sessionID, stanzaID)
	if err != nil || originalMsg == nil {
		return nil
	}

	if originalMsg.CwMsgId == nil || *originalMsg.CwMsgId == 0 {
		return nil
	}

	return &ReplyInfo{
		CwMsgId:           *originalMsg.CwMsgId,
		WhatsAppMessageID: stanzaID,
	}
}
