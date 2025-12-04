package event

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// WebhookSender defines the interface for sending webhooks
type WebhookSender interface {
	Send(ctx context.Context, sessionID, sessionName, event string, rawEvent interface{})
}

// WebhookSkipChecker checks if webhook should be skipped for a session/event
type WebhookSkipChecker func(sessionID string, eventName string) bool

// MediaService defines the interface for media operations
type MediaService interface {
	DownloadAndStore(ctx context.Context, client *whatsmeow.Client, media *model.Media, sessionName string) error
	ProcessHistorySyncMedia(ctx context.Context, client *whatsmeow.Client, sessionID string, count int)
	HandleMediaRetryResponse(ctx context.Context, client *whatsmeow.Client, e *events.MediaRetry, sessionID string) error
}

// HistorySyncService defines the interface for history sync operations
type HistorySyncService interface {
	ProcessHistorySync(ctx context.Context, sessionID string, e *events.HistorySync) error
}

// Service handles WhatsApp events
type Service struct {
	database           *db.Database
	webhookService     WebhookSender
	mediaService       MediaService
	historySyncService HistorySyncService
	webhookSkipChecker WebhookSkipChecker
}

// New creates a new event service
func New(database *db.Database, webhookService WebhookSender) *Service {
	return &Service{
		database:       database,
		webhookService: webhookService,
	}
}

// SetMediaService sets the media service for downloading media to storage
func (s *Service) SetMediaService(mediaService MediaService) {
	s.mediaService = mediaService
}

// SetHistorySyncService sets the history sync service for processing sync data
func (s *Service) SetHistorySyncService(historySyncService HistorySyncService) {
	s.historySyncService = historySyncService
}

// SetWebhookSkipChecker sets the function that determines if webhook should be skipped
func (s *Service) SetWebhookSkipChecker(checker WebhookSkipChecker) {
	s.webhookSkipChecker = checker
}

// HandleEvent routes events to appropriate handlers
func (s *Service) HandleEvent(session *model.Session, evt interface{}) {
	ctx := context.Background()

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

	// Chat management events
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
			Str("session", session.Session).
			Str("event_type", fmt.Sprintf("%T", evt)).
			Msg("Unhandled event type")
	}
}

// sendWebhook sends webhook if configured and not skipped
func (s *Service) sendWebhook(ctx context.Context, session *model.Session, event string, rawEvent interface{}) {
	if s.webhookService == nil {
		return
	}

	if s.webhookSkipChecker != nil && s.webhookSkipChecker(session.ID, event) {
		return
	}

	s.webhookService.Send(ctx, session.ID, session.Session, event, rawEvent)
}

// saveHistorySyncToJSON saves history sync to JSON for debugging
func (s *Service) saveHistorySyncToJSON(sessionId string, e *events.HistorySync, syncType string, chunkOrder uint32) {
	if os.Getenv("DEBUG_HISTORY_SYNC") != "true" {
		return
	}

	dir := "history_sync_dumps"
	if err := os.MkdirAll(dir, 0755); err != nil {
		logger.Error().Err(err).Msg("Failed to create history sync dump directory")
		return
	}

	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("%s_%s_%s_chunk%d.json", sessionId, timestamp, syncType, chunkOrder)
	filePath := filepath.Join(dir, filename)

	data, err := json.MarshalIndent(e.Data, "", "  ")
	if err != nil {
		logger.Error().Err(err).Msg("Failed to marshal history sync data")
		return
	}

	if err := os.WriteFile(filePath, data, 0600); err != nil {
		logger.Error().Err(err).Str("file", filePath).Msg("Failed to write history sync JSON")
		return
	}

	logger.Info().
		Str("session", sessionId).
		Str("file", filePath).
		Int("size", len(data)).
		Msg("History sync saved to JSON")
}
