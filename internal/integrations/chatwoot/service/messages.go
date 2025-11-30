package service

import (
	"bytes"
	"context"
	"fmt"

	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/integrations/chatwoot/client"
	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/integrations/chatwoot/util"
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

	if util.IsLIDJID(remoteJid) && s.database != nil {
		convertedJid := util.ConvertLIDToStandardJID(ctx, s.database.Pool, remoteJid)
		if convertedJid != remoteJid {
			logger.Debug().
				Str("original", remoteJid).
				Str("converted", convertedJid).
				Msg("Chatwoot: converted LID to standard JID")
			remoteJid = convertedJid
		}
	}

	if s.ShouldIgnoreJid(cfg, remoteJid) {
		return nil
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)

	if cfg.InboxID == 0 {
		if err := s.InitInbox(ctx, cfg); err != nil {
			return fmt.Errorf("failed to init inbox: %w", err)
		}
	}

	isGroup := util.IsGroupJID(remoteJid)
	participantJid := ""
	if isGroup && evt.Info.Sender.String() != "" {
		participantJid = evt.Info.Sender.String()
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
		session.Name,
	)
	if err != nil {
		return fmt.Errorf("failed to get/create conversation: %w", err)
	}

	sourceID := fmt.Sprintf("WAID:%s", evt.Info.ID)

	if util.IsMediaMessage(evt.Message) && s.mediaDownloader != nil {
		return s.processIncomingMediaMessage(ctx, session, evt, c, convID, sourceID, cfg)
	}

	content := s.extractMessageContent(evt)
	if content == "" {
		return nil
	}

	if isGroup && participantJid != "" && !evt.Info.IsFromMe {
		content = s.contactManager.FormatGroupMessage(content, participantJid, evt.Info.PushName)
	}

	msgReq := &client.CreateMessageRequest{
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

	cwMsg, err := c.CreateMessage(ctx, convID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to create message in chatwoot: %w", err)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, convID, sourceID); err != nil {
			logger.Debug().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update message fields")
		}
	}

	return nil
}

// processIncomingMediaMessage handles media messages (images, videos, documents, etc.)
func (s *Service) processIncomingMediaMessage(ctx context.Context, session *model.Session, evt *events.Message, c *client.Client, conversationID int, sourceID string, cfg *core.Config) error {
	mediaInfo := util.GetMediaInfo(evt.Message)
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
		logger.Debug().Err(err).
			Str("session", session.Name).
			Str("messageId", evt.Info.ID).
			Msg("Chatwoot: failed to download media, sending filename as text")

		content := mediaInfo.Filename
		if mediaInfo.Caption != "" {
			content = mediaInfo.Caption
		}
		msgReq := &client.CreateMessageRequest{
			Content:           content,
			MessageType:       "incoming",
			SourceID:          sourceID,
			ContentAttributes: contentAttributes,
		}
		_, err := c.CreateMessage(ctx, conversationID, msgReq)
		return err
	}

	content := mediaInfo.Caption
	cwMsg, err := c.CreateMessageWithAttachmentAndMime(ctx, conversationID, content, "incoming", bytes.NewReader(mediaData), mediaInfo.Filename, mediaInfo.MimeType, contentAttributes)
	if err != nil {
		return fmt.Errorf("failed to upload media to chatwoot: %w", err)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conversationID, sourceID); err != nil {
			logger.Debug().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update media message fields")
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

	if util.IsLIDJID(remoteJid) && s.database != nil {
		convertedJid := util.ConvertLIDToStandardJID(ctx, s.database.Pool, remoteJid)
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

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)

	if cfg.InboxID == 0 {
		if err := s.InitInbox(ctx, cfg); err != nil {
			return fmt.Errorf("failed to init inbox: %w", err)
		}
	}

	isGroup := util.IsGroupJID(remoteJid)
	phoneNumber := util.ExtractPhoneFromJID(remoteJid)

	contact, err := c.GetOrCreateContact(ctx, cfg.InboxID, phoneNumber, remoteJid, phoneNumber, "", isGroup)
	if err != nil {
		return fmt.Errorf("failed to get/create contact: %w", err)
	}

	conv, err := c.GetOrCreateConversation(ctx, contact.ID, cfg.InboxID, "open", cfg.AutoReopen)
	if err != nil {
		return fmt.Errorf("failed to get/create conversation: %w", err)
	}

	msgReq := &client.CreateMessageRequest{
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

	cwMsg, err := c.CreateMessage(ctx, conv.ID, msgReq)
	if err != nil {
		return fmt.Errorf("failed to create outgoing message in chatwoot: %w", err)
	}

	if cwMsg != nil && s.database != nil {
		if err := s.database.Messages.UpdateCwFields(ctx, session.ID, evt.Info.ID, cwMsg.ID, conv.ID, sourceID); err != nil {
			logger.Debug().Err(err).Str("messageId", evt.Info.ID).Msg("Chatwoot: failed to update outgoing message fields")
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

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)

	isGroup := util.IsGroupJID(remoteJid)
	phoneNumber := util.ExtractPhoneFromJID(remoteJid)
	senderPhone := util.ExtractPhoneFromJID(senderJid)
	contactName := senderPhone

	contact, err := c.GetOrCreateContact(ctx, cfg.InboxID, phoneNumber, remoteJid, contactName, "", isGroup)
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
	if err != nil || msg == nil || msg.CwConvId == nil || *msg.CwConvId == 0 {
		return nil
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)
	if cfg.InboxID == 0 {
		return nil
	}

	inbox, err := c.GetInbox(ctx, cfg.InboxID)
	if err != nil || inbox.InboxIdentifier == "" {
		return nil
	}

	conv, contactSourceID, err := c.GetConversationWithContactInbox(ctx, *msg.CwConvId)
	if err != nil {
		return nil
	}
	_ = conv

	if contactSourceID == "" {
		return nil
	}

	if err := c.UpdateLastSeen(ctx, inbox.InboxIdentifier, contactSourceID, *msg.CwConvId); err != nil {
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
	if err != nil || cfg == nil {
		return nil
	}

	msg, err := s.database.Messages.GetByMsgId(ctx, session.ID, messageID)
	if err != nil || msg == nil || msg.CwMsgId == nil || msg.CwConvId == nil {
		return nil
	}

	c := client.NewClient(cfg.URL, cfg.Token, cfg.Account)

	if err := c.DeleteMessage(ctx, *msg.CwConvId, *msg.CwMsgId); err != nil {
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
func (s *Service) extractReplyInfo(ctx context.Context, sessionID string, evt *events.Message) *core.ReplyInfo {
	if s.database == nil {
		return nil
	}

	msg := evt.Message
	if msg == nil {
		return nil
	}

	var stanzaID string

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

	return &core.ReplyInfo{
		CwMsgId:           *originalMsg.CwMsgId,
		WhatsAppMessageID: stanzaID,
	}
}
