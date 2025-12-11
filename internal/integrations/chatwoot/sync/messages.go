package sync

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"onwapp/internal/integrations/chatwoot/client"
	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/integrations/chatwoot/util"
	"onwapp/internal/logger"
	"onwapp/internal/model"
)

type MessageSyncer struct {
	cfg            *core.Config
	repo           *Repository
	client         *client.Client
	msgRepo        MessageRepository
	contactsGetter ContactsGetter
	mediaGetter    MediaGetter
	lidResolver    util.LIDResolver
	sessionID      string
}

func NewMessageSyncer(
	cfg *core.Config,
	repo *Repository,
	cli *client.Client,
	msgRepo MessageRepository,
	contactsGetter ContactsGetter,
	mediaGetter MediaGetter,
	lidResolver util.LIDResolver,
	sessionID string,
) *MessageSyncer {
	return &MessageSyncer{
		cfg:            cfg,
		repo:           repo,
		client:         cli,
		msgRepo:        msgRepo,
		contactsGetter: contactsGetter,
		mediaGetter:    mediaGetter,
		lidResolver:    lidResolver,
		sessionID:      sessionID,
	}
}

func (s *MessageSyncer) Sync(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	stats := &core.SyncStats{
		MessageDetails: &core.MessageSyncDetails{},
	}

	logger.Chatwoot().Debug().Str("sessionId", s.sessionID).Int("daysLimit", daysLimit).Msg("Chatwoot sync: starting messages")

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
		logger.Chatwoot().Debug().Msg("Chatwoot sync: no valid messages to sync")
		return stats, nil
	}

	logger.Chatwoot().Debug().Int("messages", len(filteredMessages)).Msg("Chatwoot sync: messages filtered")

	sort.Slice(filteredMessages, func(i, j int) bool {
		return filteredMessages[i].Timestamp.Before(filteredMessages[j].Timestamp)
	})

	messagesByChat := s.groupMessagesByChat(filteredMessages)
	waContactsCache := s.loadContactsCache(ctx)
	groupNamesCache := s.loadGroupNamesCache(ctx)

	chatCache, err := s.createContactsAndConversations(ctx, messagesByChat, waContactsCache, groupNamesCache, stats)
	if err != nil {
		return stats, err
	}

	if err := s.insertMessagesInBatches(ctx, filteredMessages, existingSourceIDs, chatCache, userID, userType, stats); err != nil {
		return stats, err
	}

	if fixed, err := s.repo.FixConversationCreatedAt(ctx); err == nil && fixed > 0 {
		logger.Chatwoot().Debug().Int("fixed", fixed).Msg("Chatwoot sync: fixed conversation created_at timestamps")
	}

	if err := s.repo.TouchInboxConversations(ctx); err != nil {
		logger.Chatwoot().Warn().Err(err).Msg("Chatwoot sync: failed to touch inbox conversations")
	}

	logger.Chatwoot().Info().Int("imported", stats.MessagesImported).Msg("Chatwoot sync: messages completed")
	return stats, nil
}

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

	details := stats.MessageDetails

	for _, msg := range messages {
		if s.shouldSkipMessage(&msg, daysLimit, cutoffTime, existingSourceIDs, stats) {
			continue
		}

		if util.IsLIDJID(msg.ChatJID) {
			phone := util.ResolveLIDToPhone(ctx, s.lidResolver, msg.ChatJID)
			if phone == "" {
				details.LidChats++
				stats.MessagesSkipped++
				continue
			}
			msg.ChatJID = phone + "@s.whatsapp.net"
		}

		filtered = append(filtered, msg)
	}

	return filtered, existingSourceIDs
}

func (s *MessageSyncer) shouldSkipMessage(msg *model.Message, daysLimit int, cutoffTime time.Time, existingSourceIDs map[string]bool, stats *core.SyncStats) bool {
	sourceID := "WAID:" + msg.MsgId
	details := stats.MessageDetails

	if existingSourceIDs[sourceID] {
		details.AlreadySynced++
		stats.MessagesSkipped++
		return true
	}

	if daysLimit > 0 && msg.Timestamp.Before(cutoffTime) {
		details.OldMessages++
		stats.MessagesSkipped++
		return true
	}

	if util.IsStatusBroadcast(msg.ChatJID) {
		details.StatusBroadcast++
		stats.MessagesSkipped++
		return true
	}

	if util.IsNewsletter(msg.ChatJID) {
		details.Newsletters++
		stats.MessagesSkipped++
		return true
	}

	phone := util.ExtractPhoneFromJID(msg.ChatJID)
	if phone == "" || phone == "0" {
		stats.MessagesSkipped++
		return true
	}

	if msg.Type == "protocol" {
		details.Protocol++
		stats.MessagesSkipped++
		return true
	}
	if msg.Type == "reaction" {
		details.Reactions++
		stats.MessagesSkipped++
		return true
	}
	if msg.Type == "system" {
		details.System++
		stats.MessagesSkipped++
		return true
	}

	return false
}

func (s *MessageSyncer) groupMessagesByChat(messages []model.Message) map[string][]model.Message {
	result := make(map[string][]model.Message)
	for _, msg := range messages {
		result[msg.ChatJID] = append(result[msg.ChatJID], msg)
	}
	return result
}

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

func (s *MessageSyncer) loadGroupNamesCache(ctx context.Context) map[string]string {
	cache := make(map[string]string)
	if s.contactsGetter == nil {
		return cache
	}

	groups, err := s.contactsGetter.GetAllGroupNames(ctx)
	if err != nil {
		logger.Chatwoot().Debug().Err(err).Msg("Chatwoot sync: failed to load group names cache")
		return cache
	}

	return groups
}

func (s *MessageSyncer) createContactsAndConversations(
	ctx context.Context,
	messagesByChat map[string][]model.Message,
	waContactsCache map[string]*core.ContactNameInfo,
	groupNamesCache map[string]string,
	stats *core.SyncStats,
) (map[string]*core.ChatFKs, error) {
	phoneDataList := s.buildPhoneDataList(messagesByChat, waContactsCache, groupNamesCache)

	logger.Chatwoot().Debug().Int("chats", len(phoneDataList)).Msg("Chatwoot sync: creating contacts/conversations")

	chatCacheByPhone := make(map[string]*core.ChatFKs)

	for i := 0; i < len(phoneDataList); i += core.ConversationBatchSize {
		end := min(i+core.ConversationBatchSize, len(phoneDataList))
		batch := phoneDataList[i:end]

		result, err := s.repo.CreateContactsAndConversationsOptimized(ctx, batch)
		if err != nil {
			logger.Chatwoot().Warn().Err(err).Msg("Chatwoot sync: optimized creation failed, using fallback")
			result, err = s.repo.CreateContactsAndConversations(ctx, batch)
			if err != nil {
				return nil, err
			}
		}
		for k, v := range result {
			chatCacheByPhone[k] = v
		}
	}

	chatCache := make(map[string]*core.ChatFKs)
	details := stats.MessageDetails
	for _, pd := range phoneDataList {
		if fks, ok := chatCacheByPhone[pd.Phone]; ok {
			chatCache[pd.Identifier] = fks
			stats.ConversationsUsed++
			if pd.IsGroup {
				details.GroupChats++
			} else {
				details.PrivateChats++
			}
		}
	}

	return chatCache, nil
}

func (s *MessageSyncer) buildPhoneDataList(
	messagesByChat map[string][]model.Message,
	waContactsCache map[string]*core.ContactNameInfo,
	groupNamesCache map[string]string,
) []core.PhoneTimestamp {
	phoneDataList := make([]core.PhoneTimestamp, 0, len(messagesByChat))

	for chatJID, chatMessages := range messagesByChat {
		isGroup := util.IsGroupJID(chatJID)
		phone := util.ExtractPhoneFromJID(chatJID)
		if phone == "" {
			continue
		}

		contactName := s.getContactName(chatJID, phone, isGroup, chatMessages, waContactsCache, groupNamesCache)

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

func (s *MessageSyncer) getContactName(
	chatJID, phone string,
	isGroup bool,
	chatMessages []model.Message,
	waContactsCache map[string]*core.ContactNameInfo,
	groupNamesCache map[string]string,
) string {
	if isGroup {
		if groupName, ok := groupNamesCache[chatJID]; ok && groupName != "" {
			return groupName
		}
		return phone + " (GROUP)"
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

func (s *MessageSyncer) insertMessagesInBatches(
	ctx context.Context,
	messages []model.Message,
	existingSourceIDs map[string]bool,
	chatCache map[string]*core.ChatFKs,
	userID int,
	userType string,
	stats *core.SyncStats,
) error {
	var textMessages []model.Message
	var mediaMessages []model.Message

	for _, msg := range messages {
		if chatCache[msg.ChatJID] == nil {
			continue
		}
		if existingSourceIDs["WAID:"+msg.MsgId] {
			continue
		}

		if msg.IsMedia() && s.mediaGetter != nil {
			mediaMessages = append(mediaMessages, msg)
		} else {
			textMessages = append(textMessages, msg)
		}
	}

	if len(textMessages) > 0 {
		s.processTextMessages(ctx, textMessages, chatCache, userID, userType, stats)
	}

	if len(mediaMessages) > 0 {
		s.processMediaMessagesParallel(ctx, mediaMessages, chatCache, userID, userType, stats)
	}

	return nil
}

func (s *MessageSyncer) processTextMessages(
	ctx context.Context,
	messages []model.Message,
	chatCache map[string]*core.ChatFKs,
	userID int,
	userType string,
	stats *core.SyncStats,
) {
	details := stats.MessageDetails

	for i := 0; i < len(messages); i += core.MessageBatchSize {
		end := min(i+core.MessageBatchSize, len(messages))
		batch := messages[i:end]

		imported, err := s.insertTextMessageBatch(ctx, batch, chatCache, userID, userType)
		if err != nil {
			logger.Chatwoot().Warn().Err(err).Msg("Chatwoot sync: text message batch insert failed")
			stats.Errors += len(batch)
		} else {
			stats.MessagesImported += imported
			details.TextMessages += imported
			for _, msg := range batch {
				if msg.IsGroup {
					details.GroupMessages++
				}
			}
		}
		UpdateSyncStats(s.sessionID, stats)
	}
}

func (s *MessageSyncer) processMediaMessagesParallel(
	ctx context.Context,
	messages []model.Message,
	chatCache map[string]*core.ChatFKs,
	userID int,
	userType string,
	stats *core.SyncStats,
) {
	details := stats.MessageDetails

	mediaInfos := s.prefetchMediaInfo(ctx, messages)

	jobs := make([]MediaUploadJob, 0, len(messages))
	for i := range messages {
		msg := &messages[i]
		fks := chatCache[msg.ChatJID]
		if fks == nil {
			continue
		}

		media := mediaInfos[msg.MsgId]
		if media == nil || media.StorageURL == "" {
			details.NoMedia++
			stats.MessagesSkipped++
			continue
		}

		senderPrefix := s.buildSenderPrefix(ctx, msg)

		jobs = append(jobs, MediaUploadJob{
			Msg:            msg,
			Media:          media,
			ConversationID: fks.ConversationID,
			SenderPrefix:   senderPrefix,
			SourceID:       "WAID:" + msg.MsgId,
		})
	}

	if len(jobs) == 0 {
		return
	}

	logger.Chatwoot().Debug().Int("jobs", len(jobs)).Msg("Chatwoot sync: starting parallel media upload")

	pool := NewMediaWorkerPool(s.client, core.MediaWorkers, core.MediaRatePerSecond)
	results := pool.ProcessBatch(ctx, jobs)

	msgTimestamps := make(map[int]time.Time)
	convTimestamps := make(map[int]time.Time)

	for i, result := range results {
		if result.Success {
			stats.MessagesImported++
			details.MediaMessages++
			if i < len(jobs) && jobs[i].Msg != nil && jobs[i].Msg.IsGroup {
				details.GroupMessages++
			}
			if result.CwMsgID > 0 {
				msgTimestamps[result.CwMsgID] = result.Timestamp
			}
			if existing, ok := convTimestamps[result.ConvID]; !ok || result.Timestamp.After(existing) {
				convTimestamps[result.ConvID] = result.Timestamp
			}
		} else {
			stats.MessagesErrors++
			if result.Error != nil {
				logger.Chatwoot().Debug().Err(result.Error).Str("sourceId", result.SourceID).Msg("Chatwoot sync: media upload failed")
			}
		}
	}

	if len(msgTimestamps) > 0 {
		_ = s.repo.UpdateMessageTimestampsBatch(ctx, msgTimestamps)
	}
	if len(convTimestamps) > 0 {
		_ = s.repo.UpdateConversationTimestampsBatch(ctx, convTimestamps)
	}

	UpdateSyncStats(s.sessionID, stats)
	logger.Chatwoot().Debug().Int("success", stats.MessagesImported).Int("errors", stats.MessagesErrors).Msg("Chatwoot sync: parallel media upload completed")
}

func (s *MessageSyncer) prefetchMediaInfo(ctx context.Context, messages []model.Message) map[string]*model.Media {
	result := make(map[string]*model.Media, len(messages))

	if s.mediaGetter == nil {
		return result
	}

	for _, msg := range messages {
		media, err := s.mediaGetter.GetByMsgID(ctx, s.sessionID, msg.MsgId)
		if err == nil && media != nil {
			result[msg.MsgId] = media
		}
	}

	return result
}

func (s *MessageSyncer) insertTextMessageBatch(
	ctx context.Context,
	messages []model.Message,
	chatCache map[string]*core.ChatFKs,
	userID int,
	userType string,
) (int, error) {
	if len(messages) == 0 {
		return 0, nil
	}

	textMessages := make([]MessageInsertData, 0, len(messages))

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

		content := GetMessageContent(&msg)
		if content == "" {
			continue
		}
		if senderPrefix != "" {
			content = senderPrefix + content
		}

		var inReplyToExternalID string
		if quotedID := ExtractQuotedID(&msg); quotedID != "" {
			inReplyToExternalID = "WAID:" + quotedID
		}

		textMessages = append(textMessages, MessageInsertData{
			Content:             content,
			ConversationID:      fks.ConversationID,
			MessageType:         msgType,
			SenderType:          senderType,
			SenderID:            senderID,
			SourceID:            "WAID:" + msg.MsgId,
			Timestamp:           msg.Timestamp,
			InReplyToExternalID: inReplyToExternalID,
		})
	}

	if len(textMessages) == 0 {
		return 0, nil
	}

	inserted, err := s.repo.InsertMessagesBatch(ctx, textMessages)
	if err != nil {
		return 0, wrapErr("bulk insert text messages", err)
	}

	sourceIDs := make([]string, len(textMessages))
	for i, msg := range textMessages {
		sourceIDs[i] = msg.SourceID
	}
	cwMsgIDs, err := s.repo.GetInsertedMessageIDs(ctx, sourceIDs)
	if err != nil {
		logger.Chatwoot().Warn().Err(err).Msg("Chatwoot sync: failed to get inserted message IDs")
	}

	if len(cwMsgIDs) > 0 && s.msgRepo != nil {
		for _, msg := range textMessages {
			if cwID, ok := cwMsgIDs[msg.SourceID]; ok {
				msgId := msg.SourceID
				if len(msgId) > 5 && msgId[:5] == "WAID:" {
					msgId = msgId[5:]
				}
				_ = s.msgRepo.UpdateCwFields(ctx, s.sessionID, msgId, cwID, msg.ConversationID, msg.SourceID)
			}
		}
	}

	quotedRefs := make(map[string]string)
	for _, msg := range textMessages {
		if msg.InReplyToExternalID != "" {
			quotedRefs[msg.SourceID] = msg.InReplyToExternalID
		}
	}
	if len(quotedRefs) > 0 && len(cwMsgIDs) > 0 {
		resolved, err := s.repo.ResolveQuotedMessages(ctx, quotedRefs)
		if err != nil {
			logger.Chatwoot().Warn().Err(err).Msg("Chatwoot sync: failed to resolve quoted messages")
		} else if resolved > 0 {
			logger.Chatwoot().Debug().Int("resolved", resolved).Msg("Chatwoot sync: resolved quoted message references")
		}
	}

	if inserted > 0 {
		s.updateConversationTimestamps(ctx, messages, chatCache)
	}

	return inserted, nil
}

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

func (s *MessageSyncer) resolveSenderPhone(ctx context.Context, msg *model.Message) string {
	if msg.SenderAlt != "" && !util.IsLIDJID(msg.SenderAlt) {
		if phone := util.ExtractPhoneFromJID(msg.SenderAlt); phone != "" {
			return phone
		}
	}

	if util.IsLIDJID(msg.SenderJID) {
		if s.lidResolver != nil {
			if phone := util.ResolveLIDToPhone(ctx, s.lidResolver, msg.SenderJID); phone != "" {
				return phone
			}
		}

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

	if !util.IsGroupJID(msg.SenderJID) {
		return util.ExtractPhoneFromJID(msg.SenderJID)
	}

	return ""
}

func (s *MessageSyncer) updateConversationTimestamps(ctx context.Context, messages []model.Message, chatCache map[string]*core.ChatFKs) {
	convTimestamps := make(map[int]time.Time)

	for _, msg := range messages {
		if fks := chatCache[msg.ChatJID]; fks != nil {
			if existing, ok := convTimestamps[fks.ConversationID]; !ok || msg.Timestamp.After(existing) {
				convTimestamps[fks.ConversationID] = msg.Timestamp
			}
		}
	}

	_ = s.repo.UpdateConversationTimestampsBatch(ctx, convTimestamps)
}
