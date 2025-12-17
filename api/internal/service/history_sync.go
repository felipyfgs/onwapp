package service

import (
	"context"

	"go.mau.fi/whatsmeow/proto/waHistorySync"
	"go.mau.fi/whatsmeow/types/events"

	"onwapp/internal/db/repository"
	"onwapp/internal/logger"
	"onwapp/internal/model"
)

type ChatWithLastMessage = repository.ChatWithLastMessage
type LastMessageData = repository.LastMessageData

type HistorySyncService struct {
	chatRepo    *repository.ChatRepository
	messageRepo *repository.MessageRepository
}

func NewHistorySyncService(chatRepo *repository.ChatRepository) *HistorySyncService {
	return &HistorySyncService{
		chatRepo: chatRepo,
	}
}

func (s *HistorySyncService) SetMessageRepository(repo *repository.MessageRepository) {
	s.messageRepo = repo
}

func (s *HistorySyncService) ProcessHistorySync(ctx context.Context, sessionID string, e *events.HistorySync) error {
	syncType := mapSyncType(e.Data.GetSyncType())
	progress := int(e.Data.GetProgress())

	processedChats, err := s.processConversations(ctx, sessionID, e.Data.GetConversations())
	if err != nil {
		logger.Session().Warn().Err(err).Msg("Failed to process conversations")
	}

	logger.Session().Info().
		Str("sessionId", sessionID).
		Str("syncType", string(syncType)).
		Int("progress", progress).
		Int("chats", processedChats).
		Msg("History sync processed")

	return nil
}

func (s *HistorySyncService) processConversations(ctx context.Context, sessionID string, conversations []*waHistorySync.Conversation) (int, error) {
	if len(conversations) == 0 {
		return 0, nil
	}

	chats := make([]*model.Chat, 0, len(conversations))
	for _, conv := range conversations {
		chatJID := conv.GetID()
		if chatJID == "" {
			continue
		}

		chat := &model.Chat{
			SessionID:                 sessionID,
			ChatJID:                   chatJID,
			Name:                      conv.GetName(),
			UnreadCount:               int(conv.GetUnreadCount()),
			MarkedAsUnread:            conv.GetMarkedAsUnread(),
			EphemeralExpiration:       int(conv.GetEphemeralExpiration()),
			EphemeralSettingTimestamp: conv.GetEphemeralSettingTimestamp(),
			DisappearingModeInitiator: int16(conv.GetDisappearingMode().GetInitiator()),
			ReadOnly:                  conv.GetReadOnly(),
			Suspended:                 conv.GetSuspended(),
			Locked:                    conv.GetLocked(),
			LimitSharing:              conv.GetLimitSharing(),
			LimitSharingTimestamp:     conv.GetLimitSharingSettingTimestamp(),
			LimitSharingTrigger:       int16(conv.GetLimitSharingTrigger()),
			LimitSharingInitiatedByMe: conv.GetLimitSharingInitiatedByMe(),
			IsDefaultSubgroup:         conv.GetIsDefaultSubgroup(),
			CommentsCount:             int(conv.GetCommentsCount()),
			ConversationTimestamp:     int64(conv.GetConversationTimestamp()),
			PHash:                     conv.GetPHash(),
			NotSpam:                   boolPtr(conv.GetNotSpam()),
		}

		chats = append(chats, chat)
	}

	if len(chats) == 0 {
		return 0, nil
	}

	saved, err := s.chatRepo.SaveBatch(ctx, chats)
	if err != nil {
		return 0, err
	}

	return saved, nil
}

func (s *HistorySyncService) GetAllChats(ctx context.Context, sessionID string, limit, offset int, unreadOnly bool) ([]*model.Chat, error) {
	if limit <= 0 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}
	return s.chatRepo.GetBySession(ctx, sessionID, limit, offset, unreadOnly)
}

func (s *HistorySyncService) GetAllChatsWithLastMessage(ctx context.Context, sessionID string, limit, offset int, unreadOnly bool) ([]*repository.ChatWithLastMessage, error) {
	if limit <= 0 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}
	return s.chatRepo.GetBySessionWithLastMessage(ctx, sessionID, limit, offset, unreadOnly)
}

func (s *HistorySyncService) GetChatByJID(ctx context.Context, sessionID, chatJID string) (*model.Chat, error) {
	return s.chatRepo.GetWithContext(ctx, sessionID, chatJID)
}

func (s *HistorySyncService) GetMessagesByChat(ctx context.Context, sessionID, chatJID string, limit, offset int) ([]model.Message, error) {
	if s.messageRepo == nil {
		return nil, nil
	}
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	return s.messageRepo.GetByChat(ctx, sessionID, chatJID, limit, offset)
}

func mapSyncType(t waHistorySync.HistorySync_HistorySyncType) model.SyncType {
	switch t {
	case waHistorySync.HistorySync_INITIAL_BOOTSTRAP:
		return model.SyncTypeInitialBootstrap
	case waHistorySync.HistorySync_INITIAL_STATUS_V3:
		return model.SyncTypeInitialStatus
	case waHistorySync.HistorySync_PUSH_NAME:
		return model.SyncTypePushName
	case waHistorySync.HistorySync_RECENT:
		return model.SyncTypeRecent
	case waHistorySync.HistorySync_FULL:
		return model.SyncTypeFull
	case waHistorySync.HistorySync_NON_BLOCKING_DATA:
		return model.SyncTypeNonBlockingData
	case waHistorySync.HistorySync_ON_DEMAND:
		return model.SyncTypeOnDemand
	default:
		return model.SyncType(t.String())
	}
}

func boolPtr(b bool) *bool {
	return &b
}
