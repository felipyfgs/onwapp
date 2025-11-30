package service

import (
	"context"
	"encoding/base64"
	"time"

	"go.mau.fi/whatsmeow/proto/waHistorySync"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/db/repository"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

type HistorySyncService struct {
	chatRepo        *repository.ChatRepository
	stickerRepo     *repository.StickerRepository
	historySyncRepo *repository.HistorySyncRepository
}

func NewHistorySyncService(
	chatRepo *repository.ChatRepository,
	stickerRepo *repository.StickerRepository,
	historySyncRepo *repository.HistorySyncRepository,
) *HistorySyncService {
	return &HistorySyncService{
		chatRepo:        chatRepo,
		stickerRepo:     stickerRepo,
		historySyncRepo: historySyncRepo,
	}
}

// ProcessHistorySync processes a history sync event and saves relevant data
func (s *HistorySyncService) ProcessHistorySync(ctx context.Context, sessionID string, e *events.HistorySync) error {
	syncType := mapSyncType(e.Data.GetSyncType())
	chunkOrder := int(e.Data.GetChunkOrder())
	progress := int(e.Data.GetProgress())

	now := time.Now()

	// Create/update sync progress tracking
	syncProgress := &model.HistorySyncProgress{
		SessionID:      sessionID,
		SyncType:       syncType,
		LastChunkIndex: chunkOrder,
		Status:         model.SyncStatusInProgress,
		Progress:       progress,
		StartedAt:      &now,
	}

	if _, err := s.historySyncRepo.SaveSyncProgress(ctx, syncProgress); err != nil {
		logger.Warn().Err(err).Str("syncType", string(syncType)).Msg("Failed to save sync progress")
	}

	// Process conversations (chat metadata)
	processedChats, err := s.processConversations(ctx, sessionID, e.Data.GetConversations())
	if err != nil {
		logger.Warn().Err(err).Msg("Failed to process conversations")
	}

	// Process recent stickers
	processedStickers, err := s.processRecentStickers(ctx, sessionID, e.Data.GetRecentStickers())
	if err != nil {
		logger.Warn().Err(err).Msg("Failed to process recent stickers")
	}

	// Process past participants from history sync
	processedParticipants, err := s.processPastParticipants(ctx, sessionID, e.Data.GetPastParticipants())
	if err != nil {
		logger.Warn().Err(err).Msg("Failed to process past participants")
	}

	// Update progress with processed counts
	if err := s.historySyncRepo.UpdateSyncProgress(ctx, sessionID, syncType, 0, processedChats, 0); err != nil {
		logger.Warn().Err(err).Msg("Failed to update sync progress")
	}

	// Mark complete if progress is 100
	if progress >= 100 {
		if err := s.historySyncRepo.MarkSyncComplete(ctx, sessionID, syncType); err != nil {
			logger.Warn().Err(err).Msg("Failed to mark sync complete")
		}
	}

	logger.Info().
		Str("sessionId", sessionID).
		Str("syncType", string(syncType)).
		Int("chats", processedChats).
		Int("stickers", processedStickers).
		Int("pastParticipants", processedParticipants).
		Msg("History sync processed")

	return nil
}

// processConversations extracts and saves chat metadata from conversations
func (s *HistorySyncService) processConversations(ctx context.Context, sessionID string, conversations []*waHistorySync.Conversation) (int, error) {
	if len(conversations) == 0 {
		return 0, nil
	}

	var chats []*model.Chat
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

// processRecentStickers extracts and saves recent stickers
func (s *HistorySyncService) processRecentStickers(ctx context.Context, sessionID string, recentStickers []*waHistorySync.StickerMetadata) (int, error) {
	if len(recentStickers) == 0 {
		return 0, nil
	}

	var stickers []*model.Sticker
	for _, rs := range recentStickers {
		fileSHA256 := rs.GetFileSHA256()
		if len(fileSHA256) == 0 {
			continue
		}

		var lastUsed *time.Time
		if ts := rs.GetLastStickerSentTS(); ts > 0 {
			t := time.UnixMilli(ts)
			lastUsed = &t
		}

		// Decode base64 fields if they come as strings
		var fileEncSHA256, mediaKey []byte
		if enc := rs.GetFileEncSHA256(); len(enc) > 0 {
			fileEncSHA256 = enc
		}
		if mk := rs.GetMediaKey(); len(mk) > 0 {
			mediaKey = mk
		}

		sticker := &model.Sticker{
			SessionID:       sessionID,
			WAFileSHA256:    fileSHA256,
			WAFileEncSHA256: fileEncSHA256,
			WAMediaKey:      mediaKey,
			WADirectPath:    rs.GetDirectPath(),
			MimeType:        rs.GetMimetype(),
			FileSize:        int(rs.GetFileLength()),
			Width:           int(rs.GetWidth()),
			Height:          int(rs.GetHeight()),
			IsLottie:        rs.GetIsLottie(),
			IsAvatar:        rs.GetIsAvatarSticker(),
			Weight:          rs.GetWeight(),
			LastUsedAt:      lastUsed,
		}

		stickers = append(stickers, sticker)
	}

	if len(stickers) == 0 {
		return 0, nil
	}

	saved, err := s.stickerRepo.SaveBatch(ctx, stickers)
	if err != nil {
		logger.Error().Err(err).Int("total", len(stickers)).Msg("Failed to save stickers batch")
		return 0, err
	}

	logger.Debug().
		Str("sessionId", sessionID).
		Int("total", len(stickers)).
		Int("saved", saved).
		Msg("Stickers saved from history sync")

	return saved, nil
}

// processPastParticipants extracts and saves past participants from history sync
func (s *HistorySyncService) processPastParticipants(ctx context.Context, sessionID string, pastParticipantsGroups []*waHistorySync.PastParticipants) (int, error) {
	if len(pastParticipantsGroups) == 0 {
		return 0, nil
	}

	var participants []*model.GroupPastParticipant
	for _, ppGroup := range pastParticipantsGroups {
		groupJID := ppGroup.GetGroupJID()
		if groupJID == "" {
			continue
		}

		for _, pp := range ppGroup.GetPastParticipants() {
			userJID := pp.GetUserJID()
			if userJID == "" {
				continue
			}

			leaveTs := time.Unix(int64(pp.GetLeaveTS()), 0)

			participant := &model.GroupPastParticipant{
				SessionID:      sessionID,
				GroupJID:       groupJID,
				UserJID:        userJID,
				LeaveReason:    model.LeaveReason(pp.GetLeaveReason()),
				LeaveTimestamp: leaveTs,
			}

			participants = append(participants, participant)
		}
	}

	if len(participants) == 0 {
		return 0, nil
	}

	saved, err := s.historySyncRepo.SavePastParticipantsBatch(ctx, participants)
	if err != nil {
		logger.Error().Err(err).Int("total", len(participants)).Msg("Failed to save past participants batch")
		return 0, err
	}

	logger.Debug().
		Str("sessionId", sessionID).
		Int("total", len(participants)).
		Int("saved", saved).
		Msg("Past participants saved from history sync")

	return saved, nil
}

// GetSyncProgress returns the sync progress for a session
func (s *HistorySyncService) GetSyncProgress(ctx context.Context, sessionID string) ([]*model.HistorySyncProgress, error) {
	return s.historySyncRepo.GetAllSyncProgress(ctx, sessionID)
}

// GetGroupPastParticipants returns past participants for a group with resolved names
func (s *HistorySyncService) GetGroupPastParticipants(ctx context.Context, sessionID, groupJID string) ([]*model.GroupPastParticipant, error) {
	return s.historySyncRepo.GetGroupHistoryWithNames(ctx, sessionID, groupJID)
}

// GetUnreadChats returns chats with unread messages
func (s *HistorySyncService) GetUnreadChats(ctx context.Context, sessionID string) ([]*model.Chat, error) {
	return s.chatRepo.GetUnreadChats(ctx, sessionID)
}

// GetChatByJID returns a chat by its JID with additional context
func (s *HistorySyncService) GetChatByJID(ctx context.Context, sessionID, chatJID string) (*model.Chat, error) {
	return s.chatRepo.GetWithContext(ctx, sessionID, chatJID)
}

// GetTopStickers returns the most used stickers
func (s *HistorySyncService) GetTopStickers(ctx context.Context, sessionID string, limit int) ([]*model.Sticker, error) {
	return s.stickerRepo.GetTopStickers(ctx, sessionID, limit)
}

// CleanupOldProgress removes sync progress older than the specified time
func (s *HistorySyncService) CleanupOldProgress(ctx context.Context, sessionID string, olderThan time.Duration) error {
	cutoff := time.Now().Add(-olderThan)
	return s.historySyncRepo.DeleteOldProgress(ctx, sessionID, cutoff)
}

// mapSyncType converts whatsmeow sync type to our model type
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

// Helper to decode base64 strings to bytes (for JSON deserialization)
func decodeBase64(s string) []byte {
	if s == "" {
		return nil
	}
	data, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		return nil
	}
	return data
}
