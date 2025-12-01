package sync

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/integrations/chatwoot/client"
	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/integrations/chatwoot/util"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// MessageSyncer handles message synchronization
type MessageSyncer struct {
	cfg            *core.Config
	repo           *Repository
	client         *client.Client
	msgRepo        MessageRepository
	contactsGetter ContactsGetter
	mediaGetter    MediaGetter
	zpPool         *pgxpool.Pool
	sessionID      string
}

// NewMessageSyncer creates a new message syncer
func NewMessageSyncer(
	cfg *core.Config,
	repo *Repository,
	cli *client.Client,
	msgRepo MessageRepository,
	contactsGetter ContactsGetter,
	mediaGetter MediaGetter,
	zpPool *pgxpool.Pool,
	sessionID string,
) *MessageSyncer {
	return &MessageSyncer{
		cfg:            cfg,
		repo:           repo,
		client:         cli,
		msgRepo:        msgRepo,
		contactsGetter: contactsGetter,
		mediaGetter:    mediaGetter,
		zpPool:         zpPool,
		sessionID:      sessionID,
	}
}

// Sync synchronizes messages to Chatwoot
func (s *MessageSyncer) Sync(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	stats := &core.SyncStats{}

	logger.Debug().Str("sessionId", s.sessionID).Int("daysLimit", daysLimit).Msg("Chatwoot sync: starting messages")

	userID, userType, err := s.repo.GetChatwootUser(ctx, s.cfg.Token)
	if err != nil {
		return stats, err
	}

	messages, err := s.msgRepo.GetBySession(ctx, s.sessionID, core.MaxMessagesPerSync, 0)
	if err != nil {
		return stats, wrapErr("get messages", err)
	}

	filteredMessages, existingSourceIDs := s.filterMessages(ctx, messages, daysLimit, stats)
	if len(filteredMessages) == 0 {
		logger.Debug().Msg("Chatwoot sync: no valid messages to sync")
		return stats, nil
	}

	logger.Debug().Int("messages", len(filteredMessages)).Msg("Chatwoot sync: messages filtered")

	// Sort by timestamp ascending
	sort.Slice(filteredMessages, func(i, j int) bool {
		return filteredMessages[i].Timestamp.Before(filteredMessages[j].Timestamp)
	})

	messagesByChat := s.groupMessagesByChat(filteredMessages)
	waContactsCache := s.loadContactsCache(ctx)

	chatCache, err := s.createContactsAndConversations(ctx, messagesByChat, waContactsCache, stats)
	if err != nil {
		return stats, err
	}

	s.updateContactAvatars(ctx, chatCache)

	if err := s.insertMessagesInBatches(ctx, filteredMessages, existingSourceIDs, chatCache, userID, userType, stats); err != nil {
		return stats, err
	}

	logger.Info().Int("imported", stats.MessagesImported).Msg("Chatwoot sync: messages completed")
	return stats, nil
}

// filterMessages filters messages based on criteria
func (s *MessageSyncer) filterMessages(ctx context.Context, messages []model.Message, daysLimit int, stats *core.SyncStats) ([]model.Message, map[string]bool) {
	var cutoffTime time.Time
	if daysLimit > 0 {
		cutoffTime = time.Now().AddDate(0, 0, -daysLimit)
	}

	messageIDs := make([]string, len(messages))
	for i, msg := range messages {
		messageIDs[i] = msg.MsgId
	}
	existingSourceIDs, _ := s.repo.GetExistingSourceIDs(ctx, messageIDs)

	filtered := make([]model.Message, 0, len(messages)/2)

	for _, msg := range messages {
		if s.shouldSkipMessage(&msg, daysLimit, cutoffTime, existingSourceIDs, stats) {
			continue
		}

		// Handle LID JIDs
		if util.IsLIDJID(msg.ChatJID) {
			phone := util.ResolveLIDToPhone(ctx, s.zpPool, msg.ChatJID)
			if phone == "" {
				stats.MessagesSkipped++
				continue
			}
			msg.ChatJID = phone + "@s.whatsapp.net"
		}

		filtered = append(filtered, msg)
	}

	return filtered, existingSourceIDs
}

// shouldSkipMessage checks if a message should be skipped
func (s *MessageSyncer) shouldSkipMessage(msg *model.Message, daysLimit int, cutoffTime time.Time, existingSourceIDs map[string]bool, stats *core.SyncStats) bool {
	sourceID := "WAID:" + msg.MsgId

	if existingSourceIDs[sourceID] {
		stats.MessagesSkipped++
		return true
	}

	if msg.CwMsgId != nil && *msg.CwMsgId > 0 {
		stats.MessagesSkipped++
		return true
	}

	if daysLimit > 0 && msg.Timestamp.Before(cutoffTime) {
		stats.MessagesSkipped++
		return true
	}

	if util.IsStatusBroadcast(msg.ChatJID) || util.IsNewsletter(msg.ChatJID) {
		stats.MessagesSkipped++
		return true
	}

	phone := util.ExtractPhoneFromJID(msg.ChatJID)
	if phone == "" || phone == "0" {
		stats.MessagesSkipped++
		return true
	}

	if msg.Type == "protocol" || msg.Type == "reaction" || msg.Type == "system" {
		stats.MessagesSkipped++
		return true
	}

	return false
}

// groupMessagesByChat groups messages by chat JID
func (s *MessageSyncer) groupMessagesByChat(messages []model.Message) map[string][]model.Message {
	result := make(map[string][]model.Message)
	for _, msg := range messages {
		result[msg.ChatJID] = append(result[msg.ChatJID], msg)
	}
	return result
}

// loadContactsCache loads WhatsApp contacts cache
func (s *MessageSyncer) loadContactsCache(ctx context.Context) map[string]*core.ContactNameInfo {
	cache := make(map[string]*core.ContactNameInfo)
	if s.contactsGetter == nil {
		return cache
	}

	contacts, err := s.contactsGetter.GetAllContacts(ctx)
	if err != nil {
		return cache
	}

	for _, c := range contacts {
		cache[c.JID] = &core.ContactNameInfo{
			FullName:     c.FullName,
			FirstName:    c.FirstName,
			PushName:     c.PushName,
			BusinessName: c.BusinessName,
		}
	}
	return cache
}

// createContactsAndConversations creates contacts and conversations in batch
func (s *MessageSyncer) createContactsAndConversations(
	ctx context.Context,
	messagesByChat map[string][]model.Message,
	waContactsCache map[string]*core.ContactNameInfo,
	stats *core.SyncStats,
) (map[string]*core.ChatFKs, error) {
	phoneDataList := s.buildPhoneDataList(ctx, messagesByChat, waContactsCache)

	logger.Debug().Int("chats", len(phoneDataList)).Msg("Chatwoot sync: creating contacts/conversations")

	chatCacheByPhone := make(map[string]*core.ChatFKs)

	for i := 0; i < len(phoneDataList); i += core.ConversationBatchSize {
		end := min(i+core.ConversationBatchSize, len(phoneDataList))
		batch := phoneDataList[i:end]

		result, err := s.repo.CreateContactsAndConversations(ctx, batch)
		if err != nil {
			return nil, err
		}
		for k, v := range result {
			chatCacheByPhone[k] = v
		}
	}

	chatCache := make(map[string]*core.ChatFKs)
	for _, pd := range phoneDataList {
		if fks, ok := chatCacheByPhone[pd.Phone]; ok {
			chatCache[pd.Identifier] = fks
			stats.ConversationsUsed++
		}
	}

	return chatCache, nil
}

// buildPhoneDataList builds the phone data list for batch creation
func (s *MessageSyncer) buildPhoneDataList(
	ctx context.Context,
	messagesByChat map[string][]model.Message,
	waContactsCache map[string]*core.ContactNameInfo,
) []core.PhoneTimestamp {
	var phoneDataList []core.PhoneTimestamp

	for chatJID, chatMessages := range messagesByChat {
		isGroup := util.IsGroupJID(chatJID)
		phone := util.ExtractPhoneFromJID(chatJID)
		if phone == "" {
			continue
		}

		contactName := s.getContactName(ctx, chatJID, phone, isGroup, chatMessages, waContactsCache)

		var firstTS, lastTS int64
		if len(chatMessages) > 0 {
			firstTS = chatMessages[0].Timestamp.Unix()
			lastTS = chatMessages[len(chatMessages)-1].Timestamp.Unix()
		} else {
			firstTS = time.Now().Unix()
			lastTS = firstTS
		}

		phoneValue := "+" + phone
		if isGroup {
			phoneValue = phone
		}

		phoneDataList = append(phoneDataList, core.PhoneTimestamp{
			Phone:      phoneValue,
			FirstTS:    firstTS,
			LastTS:     lastTS,
			Name:       contactName,
			Identifier: chatJID,
			IsGroup:    isGroup,
		})
	}

	return phoneDataList
}

// getContactName gets the best contact name for a chat
func (s *MessageSyncer) getContactName(
	ctx context.Context,
	chatJID, phone string,
	isGroup bool,
	chatMessages []model.Message,
	waContactsCache map[string]*core.ContactNameInfo,
) string {
	if isGroup {
		contactName := phone + " (GROUP)"
		if s.contactsGetter != nil {
			if groupName, err := s.contactsGetter.GetGroupName(ctx, chatJID); err == nil && groupName != "" {
				contactName = groupName
			}
		}
		return contactName
	}

	nameInfo := waContactsCache[chatJID]
	if nameInfo == nil || (nameInfo.FullName == "" && nameInfo.FirstName == "" && nameInfo.PushName == "" && nameInfo.BusinessName == "") {
		for i := len(chatMessages) - 1; i >= 0; i-- {
			if chatMessages[i].PushName != "" && !chatMessages[i].FromMe {
				if nameInfo == nil {
					nameInfo = &core.ContactNameInfo{}
				}
				nameInfo.PushName = chatMessages[i].PushName
				break
			}
		}
	}
	return util.GetBestContactName(nameInfo, phone)
}

// updateContactAvatars updates avatars for contacts
func (s *MessageSyncer) updateContactAvatars(ctx context.Context, chatCache map[string]*core.ChatFKs) {
	if s.contactsGetter == nil || len(chatCache) == 0 {
		return
	}

	for jid, fks := range chatCache {
		if fks == nil {
			continue
		}

		avatarURL, err := s.contactsGetter.GetProfilePictureURL(ctx, jid)
		if err != nil || avatarURL == "" {
			continue
		}

		_, _ = s.client.UpdateContactSilent404(ctx, fks.ContactID, map[string]interface{}{
			"avatar_url": avatarURL,
		})
	}
}

// insertMessagesInBatches inserts messages in batches
func (s *MessageSyncer) insertMessagesInBatches(
	ctx context.Context,
	messages []model.Message,
	existingSourceIDs map[string]bool,
	chatCache map[string]*core.ChatFKs,
	userID int,
	userType string,
	stats *core.SyncStats,
) error {
	var batch []model.Message

	for _, msg := range messages {
		if chatCache[msg.ChatJID] == nil {
			continue
		}
		if existingSourceIDs["WAID:"+msg.MsgId] {
			continue
		}

		batch = append(batch, msg)
		if len(batch) >= core.MessageBatchSize {
			imported, err := s.insertMessageBatch(ctx, batch, chatCache, userID, userType)
			if err != nil {
				logger.Warn().Err(err).Msg("Chatwoot sync: message batch insert failed")
				stats.Errors += len(batch)
			} else {
				stats.MessagesImported += imported
			}
			batch = nil
			UpdateSyncStats(s.sessionID, stats)
		}
	}

	// Process remaining batch
	if len(batch) > 0 {
		imported, err := s.insertMessageBatch(ctx, batch, chatCache, userID, userType)
		if err != nil {
			stats.Errors += len(batch)
		} else {
			stats.MessagesImported += imported
		}
	}

	return nil
}

// insertMessageBatch inserts a batch of messages
func (s *MessageSyncer) insertMessageBatch(
	ctx context.Context,
	messages []model.Message,
	chatCache map[string]*core.ChatFKs,
	userID int,
	userType string,
) (int, error) {
	if len(messages) == 0 {
		return 0, nil
	}

	totalImported := 0
	uploader := client.NewMediaUploader(s.client)

	for _, msg := range messages {
		fks := chatCache[msg.ChatJID]
		if fks == nil {
			continue
		}

		msgType := 0
		senderType := "Contact"
		senderID := fks.ContactID
		if msg.FromMe {
			msgType = 1
			senderType = userType
			senderID = userID
		}

		senderPrefix := s.buildSenderPrefix(ctx, &msg)

		if s.insertMediaMessage(ctx, &msg, fks, senderPrefix, uploader) {
			totalImported++
			continue
		}

		if s.insertTextMessage(ctx, &msg, fks, senderPrefix, msgType, senderType, senderID) {
			totalImported++
		}
	}

	if totalImported > 0 {
		s.updateConversationTimestamps(ctx, messages, chatCache)
	}

	return totalImported, nil
}

// buildSenderPrefix builds the sender prefix for group messages
func (s *MessageSyncer) buildSenderPrefix(ctx context.Context, msg *model.Message) string {
	if !msg.IsGroup || msg.FromMe || msg.SenderJID == "" {
		return ""
	}

	senderPhone := s.resolveSenderPhone(ctx, msg)
	senderName := msg.PushName

	if senderPhone != "" {
		formattedPhone := util.FormatPhoneDisplay(senderPhone)
		if senderName != "" && senderName != senderPhone {
			return fmt.Sprintf("**%s - %s:**\n\n", formattedPhone, senderName)
		}
		return fmt.Sprintf("**%s:**\n\n", formattedPhone)
	}

	if senderName != "" {
		return fmt.Sprintf("**%s:**\n\n", senderName)
	}

	if !util.IsGroupJID(msg.SenderJID) {
		lidNum := util.ExtractPhoneFromJID(msg.SenderJID)
		if lidNum != "" {
			return fmt.Sprintf("**[%s]:**\n\n", lidNum)
		}
	}

	return ""
}

// resolveSenderPhone resolves the sender phone number
func (s *MessageSyncer) resolveSenderPhone(ctx context.Context, msg *model.Message) string {
	// First try SenderAlt field
	if msg.SenderAlt != "" && !util.IsLIDJID(msg.SenderAlt) {
		if phone := util.ExtractPhoneFromJID(msg.SenderAlt); phone != "" {
			return phone
		}
	}

	// If SenderJID is a LID, try to resolve
	if util.IsLIDJID(msg.SenderJID) {
		if s.zpPool != nil {
			if phone := util.ResolveLIDToPhone(ctx, s.zpPool, msg.SenderJID); phone != "" {
				return phone
			}
		}

		// Fallback to SenderAlt from rawEvent
		if len(msg.RawEvent) > 0 {
			var rawData struct {
				Info struct {
					SenderAlt string `json:"SenderAlt"`
				} `json:"Info"`
			}
			if err := json.Unmarshal(msg.RawEvent, &rawData); err == nil && rawData.Info.SenderAlt != "" {
				return util.ExtractPhoneFromJID(rawData.Info.SenderAlt)
			}
		}
		return ""
	}

	// Regular phone JID
	if !util.IsGroupJID(msg.SenderJID) {
		return util.ExtractPhoneFromJID(msg.SenderJID)
	}

	return ""
}

// insertMediaMessage inserts a media message
func (s *MessageSyncer) insertMediaMessage(
	ctx context.Context,
	msg *model.Message,
	fks *core.ChatFKs,
	senderPrefix string,
	uploader *client.MediaUploader,
) bool {
	if !msg.IsMedia() || s.mediaGetter == nil {
		return false
	}

	media, err := s.mediaGetter.GetByMsgID(ctx, s.sessionID, msg.MsgId)
	if err != nil || media == nil || media.StorageURL == "" {
		return false
	}

	messageType := core.MessageTypeIncoming
	if msg.FromMe {
		messageType = core.MessageTypeOutgoing
	}

	caption := msg.Content
	if senderPrefix != "" {
		caption = senderPrefix + caption
	}

	cwMsg, err := uploader.UploadFromURL(ctx, client.MediaUploadRequest{
		ConversationID: fks.ConversationID,
		MediaURL:       media.StorageURL,
		MediaType:      media.MediaType,
		Filename:       media.FileName,
		MimeType:       media.MimeType,
		Caption:        caption,
		MessageType:    messageType,
		SourceID:       "WAID:" + msg.MsgId,
	})
	if err != nil {
		return false
	}

	if cwMsg != nil && cwMsg.ID > 0 {
		_ = s.repo.UpdateMessageTimestamp(ctx, cwMsg.ID, msg.Timestamp)
	}

	return true
}

// insertTextMessage inserts a text message
func (s *MessageSyncer) insertTextMessage(
	ctx context.Context,
	msg *model.Message,
	fks *core.ChatFKs,
	senderPrefix string,
	msgType int,
	senderType string,
	senderID int,
) bool {
	content := GetMessageContent(msg)
	if content == "" {
		return false
	}

	if senderPrefix != "" {
		content = senderPrefix + content
	}

	err := s.repo.InsertMessage(ctx, MessageInsertData{
		Content:        content,
		ConversationID: fks.ConversationID,
		MessageType:    msgType,
		SenderType:     senderType,
		SenderID:       senderID,
		SourceID:       "WAID:" + msg.MsgId,
		Timestamp:      msg.Timestamp,
	})

	return err == nil
}

// updateConversationTimestamps updates last_activity_at for conversations
func (s *MessageSyncer) updateConversationTimestamps(ctx context.Context, messages []model.Message, chatCache map[string]*core.ChatFKs) {
	convTimestamps := make(map[int]time.Time)

	for _, msg := range messages {
		if fks := chatCache[msg.ChatJID]; fks != nil {
			if existing, ok := convTimestamps[fks.ConversationID]; !ok || msg.Timestamp.After(existing) {
				convTimestamps[fks.ConversationID] = msg.Timestamp
			}
		}
	}

	s.repo.UpdateConversationTimestamps(ctx, convTimestamps)
}
