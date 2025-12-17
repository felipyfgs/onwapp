package sync

import (
	"context"
	"database/sql"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/lib/pq"

	"onwapp/internal/integrations/chatwoot/client"
	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/integrations/chatwoot/util"
	"onwapp/internal/logger"
	"onwapp/internal/model"
)

type MessageRepository interface {
	GetBySession(ctx context.Context, sessionID string, limit, offset int) ([]model.Message, error)
	UpdateCwFields(ctx context.Context, sessionID, msgId string, cwMsgId, cwConvId int, cwSourceId string) error
}

type ContactsGetter interface {
	GetAllContacts(ctx context.Context) ([]core.WhatsAppContact, error)
	GetProfilePictureURL(ctx context.Context, jid string) (string, error)
	GetGroupName(ctx context.Context, groupJID string) (string, error)
	GetAllGroupNames(ctx context.Context) (map[string]string, error)
}

type MediaGetter interface {
	GetByMsgID(ctx context.Context, sessionID, msgID string) (*model.Media, error)
}

type ChatwootDBSync struct {
	cfg            *core.Config
	client         *client.Client
	repo           *Repository
	msgRepo        MessageRepository
	contactsGetter ContactsGetter
	mediaGetter    MediaGetter
	sessionID      string
	cwDB           *sql.DB
	lidResolver    util.LIDResolver
}

func NewChatwootDBSync(
	cfg *core.Config,
	msgRepo MessageRepository,
	contactsGetter ContactsGetter,
	mediaGetter MediaGetter,
	sessionID string,
	lidResolver util.LIDResolver,
) (*ChatwootDBSync, error) {
	if cfg.ChatwootDBHost == "" {
		return nil, core.ErrDBNotConfigured
	}

	db, err := openChatwootDB(cfg)
	if err != nil {
		return nil, err
	}

	logger.Chatwoot().Debug().
		Str("host", cfg.ChatwootDBHost).
		Str("database", cfg.ChatwootDBName).
		Msg("Chatwoot: connected to database for sync")

	cli := client.NewClient(cfg.URL, cfg.Token, cfg.Account)
	repo := NewRepository(db, cfg.Account, cfg.InboxID)
	repo.SetImportAsResolved(cfg.ImportAsResolved)

	return &ChatwootDBSync{
		cfg:            cfg,
		client:         cli,
		repo:           repo,
		msgRepo:        msgRepo,
		contactsGetter: contactsGetter,
		mediaGetter:    mediaGetter,
		sessionID:      sessionID,
		cwDB:           db,
		lidResolver:    lidResolver,
	}, nil
}

func (s *ChatwootDBSync) Close() error {
	if s.cwDB != nil {
		return s.cwDB.Close()
	}
	return nil
}

func (s *ChatwootDBSync) SyncAll(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	totalStats := &core.SyncStats{}

	if err := s.repo.ValidateInbox(ctx); err != nil {
		logger.Chatwoot().Error().Err(err).Int("inboxId", s.cfg.InboxID).Msg("Chatwoot sync: inbox validation failed")
		return nil, err
	}

	contactStats, err := s.SyncContacts(ctx, daysLimit)
	if err != nil {
		logger.Chatwoot().Warn().Err(err).Msg("Chatwoot DB: contacts sync failed")
	}
	if contactStats != nil {
		totalStats.ContactsImported = contactStats.ContactsImported
		totalStats.ContactsSkipped = contactStats.ContactsSkipped
		totalStats.ContactsErrors = contactStats.ContactsErrors
	}

	msgStats, err := s.SyncMessages(ctx, daysLimit)
	if err != nil {
		logger.Chatwoot().Warn().Err(err).Msg("Chatwoot DB: messages sync failed")
	}
	if msgStats != nil {
		totalStats.MessagesImported = msgStats.MessagesImported
		totalStats.MessagesSkipped = msgStats.MessagesSkipped
		totalStats.MessagesErrors = msgStats.MessagesErrors
		totalStats.ConversationsUsed = msgStats.ConversationsUsed
		totalStats.Errors = msgStats.Errors
	}

	return totalStats, nil
}

func (s *ChatwootDBSync) SyncContacts(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	syncer := NewContactSyncer(s.repo, s.contactsGetter, s.lidResolver, s.sessionID)
	return syncer.Sync(ctx, daysLimit)
}

func (s *ChatwootDBSync) SyncMessages(ctx context.Context, daysLimit int) (*core.SyncStats, error) {
	syncer := NewMessageSyncer(
		s.cfg,
		s.repo,
		s.client,
		s.msgRepo,
		s.contactsGetter,
		s.mediaGetter,
		s.lidResolver,
		s.sessionID,
	)

	stats, err := syncer.Sync(ctx, daysLimit)
	if err != nil {
		return stats, err
	}

	avatarUpdater := NewAvatarUpdater(s.cfg, s.client, s.contactsGetter)
	avatarUpdater.UpdateAllAvatarsAsync(s.cfg)

	return stats, nil
}

func (s *ChatwootDBSync) StartSyncAsync(syncType string, daysLimit int) (*core.SyncStatus, error) {
	if IsSyncRunning(s.sessionID) {
		return GetSyncStatus(s.sessionID), core.ErrSyncInProgress
	}

	startTime := time.Now()
	status := &core.SyncStatus{
		SessionID: s.sessionID,
		Status:    core.SyncStatusRunning,
		Type:      syncType,
		StartedAt: &startTime,
	}
	SetSyncStatus(s.sessionID, status)

	go s.runAsyncSync(syncType, daysLimit, startTime)

	return status, nil
}

func (s *ChatwootDBSync) runAsyncSync(syncType string, daysLimit int, startTime time.Time) {
	ctx := context.Background()
	var stats *core.SyncStats
	var err error

	switch syncType {
	case core.SyncTypeContacts:
		stats, err = s.SyncContacts(ctx, daysLimit)
	case core.SyncTypeMessages:
		stats, err = s.SyncMessages(ctx, daysLimit)
	default:
		stats, err = s.SyncAll(ctx, daysLimit)
	}

	endTime := time.Now()
	finalStatus := &core.SyncStatus{
		SessionID: s.sessionID,
		Type:      syncType,
		StartedAt: &startTime,
		EndedAt:   &endTime,
		Status:    core.SyncStatusCompleted,
	}

	if err != nil {
		finalStatus.Status = core.SyncStatusFailed
		finalStatus.Error = err.Error()
	}
	if stats != nil {
		finalStatus.Stats = *stats
	}

	SetSyncStatus(s.sessionID, finalStatus)
	s.Close()

	logger.Chatwoot().Debug().
		Str("sessionId", s.sessionID).
		Str("status", finalStatus.Status).
		Dur("duration", endTime.Sub(startTime)).
		Msg("Chatwoot sync: async completed")
}

func (s *ChatwootDBSync) ResetData(ctx context.Context) (*core.ResetStats, error) {
	resetter := NewDataResetter(s.repo)
	return resetter.Reset(ctx)
}

func (s *ChatwootDBSync) ResolveAllConversations(ctx context.Context) (int, error) {
	return s.repo.ResolveAllConversations(ctx)
}

func (s *ChatwootDBSync) GetOpenConversationsCount(ctx context.Context) (int, error) {
	return s.repo.GetOpenConversationsCount(ctx)
}

func (s *ChatwootDBSync) GetSyncOverview(ctx context.Context) (*SyncOverview, error) {
	return s.repo.GetSyncOverview(ctx)
}

func (s *ChatwootDBSync) GetOrphanStats(ctx context.Context) (*OrphanStats, error) {
	return s.repo.GetOrphanStats(ctx)
}

func (s *ChatwootDBSync) CleanOurOrphanRecords(ctx context.Context) (*OrphanCleanupResult, error) {
	return s.repo.CleanOurOrphanRecords(ctx)
}
