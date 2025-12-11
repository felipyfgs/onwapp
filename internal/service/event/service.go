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

	"onwapp/internal/db"
	"onwapp/internal/logger"
	"onwapp/internal/model"
)

type WebhookSender interface {
	Send(ctx context.Context, sessionID, sessionName, event string, rawEvent interface{})
}

type WebhookSkipChecker func(sessionID string, eventName string) bool

type MediaService interface {
	DownloadAndStore(ctx context.Context, client *whatsmeow.Client, media *model.Media, sessionName string) error
	ProcessHistorySyncMedia(ctx context.Context, client *whatsmeow.Client, sessionID string, count int)
	HandleMediaRetryResponse(ctx context.Context, client *whatsmeow.Client, e *events.MediaRetry, sessionID string) error
}

type HistorySyncService interface {
	ProcessHistorySync(ctx context.Context, sessionID string, e *events.HistorySync) error
}

type SettingsProvider interface {
	GetBySessionID(ctx context.Context, sessionID string) (alwaysOnline, autoRejectCalls bool, err error)
	EnsureExists(ctx context.Context, sessionID string) error
	SyncPrivacyFromWhatsApp(ctx context.Context, sessionID string, privacy map[string]string) error
}

type CallRejecter interface {
	RejectCall(ctx context.Context, sessionId, callFrom, callID string) error
}

type PrivacyGetter interface {
	GetPrivacySettingsAsStrings(ctx context.Context, sessionId string) (map[string]string, error)
}

type PresenceSender interface {
	SendPresence(ctx context.Context, sessionId string, available bool) error
}

type Service struct {
	database           *db.Database
	webhookService     WebhookSender
	mediaService       MediaService
	historySyncService HistorySyncService
	webhookSkipChecker WebhookSkipChecker
	settingsProvider   SettingsProvider
	callRejecter       CallRejecter
	privacyGetter      PrivacyGetter
	presenceSender     PresenceSender
}

func New(database *db.Database, webhookService WebhookSender) *Service {
	return &Service{
		database:       database,
		webhookService: webhookService,
	}
}

func (s *Service) SetMediaService(mediaService MediaService) {
	s.mediaService = mediaService
}

func (s *Service) SetHistorySyncService(historySyncService HistorySyncService) {
	s.historySyncService = historySyncService
}

func (s *Service) SetWebhookSkipChecker(checker WebhookSkipChecker) {
	s.webhookSkipChecker = checker
}

func (s *Service) SetSettingsProvider(provider SettingsProvider) {
	s.settingsProvider = provider
}

func (s *Service) SetCallRejecter(rejecter CallRejecter) {
	s.callRejecter = rejecter
}

func (s *Service) SetPrivacyGetter(getter PrivacyGetter) {
	s.privacyGetter = getter
}

func (s *Service) SetPresenceSender(sender PresenceSender) {
	s.presenceSender = sender
}

func (s *Service) HandleEvent(session *model.Session, evt interface{}) {
	ctx := context.Background()

	switch e := evt.(type) {
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

	case *events.Message:
		s.handleMessage(ctx, session, e)
	case *events.Receipt:
		s.handleReceipt(ctx, session, e)
	case *events.UndecryptableMessage:
		s.handleUndecryptableMessage(ctx, session, e)
	case *events.MediaRetry:
		s.handleMediaRetry(ctx, session, e)

	case *events.Presence:
		s.handlePresence(ctx, session, e)
	case *events.ChatPresence:
		s.handleChatPresence(ctx, session, e)

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

	case *events.PushName:
		s.handlePushName(ctx, session, e)
	case *events.Picture:
		s.handlePicture(ctx, session, e)
	case *events.Contact:
		s.handleContact(ctx, session, e)
	case *events.BusinessName:
		s.handleBusinessName(ctx, session, e)

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

	case *events.GroupInfo:
		s.handleGroupInfo(ctx, session, e)
	case *events.JoinedGroup:
		s.handleJoinedGroup(ctx, session, e)

	case *events.IdentityChange:
		s.handleIdentityChange(ctx, session, e)
	case *events.PrivacySettings:
		s.handlePrivacySettings(ctx, session, e)
	case *events.Blocklist:
		s.handleBlocklist(ctx, session, e)

	case *events.NewsletterJoin:
		s.handleNewsletterJoin(ctx, session, e)
	case *events.NewsletterLeave:
		s.handleNewsletterLeave(ctx, session, e)
	case *events.NewsletterMuteChange:
		s.handleNewsletterMuteChange(ctx, session, e)
	case *events.NewsletterLiveUpdate:
		s.handleNewsletterLiveUpdate(ctx, session, e)

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
		logger.WPP().Debug().
			Str("session", session.Session).
			Str("event_type", fmt.Sprintf("%T", evt)).
			Msg("Unhandled event type")
	}
}

func (s *Service) sendWebhook(ctx context.Context, session *model.Session, event string, rawEvent interface{}) {
	if s.webhookService == nil {
		return
	}

	if s.webhookSkipChecker != nil && s.webhookSkipChecker(session.ID, event) {
		return
	}

	s.webhookService.Send(ctx, session.ID, session.Session, event, rawEvent)
}

func (s *Service) saveHistorySyncToJSON(sessionId string, e *events.HistorySync, syncType string, chunkOrder uint32) {
	if os.Getenv("DEBUG_HISTORY_SYNC") != "true" {
		return
	}

	dir := "history_sync_dumps"
	if err := os.MkdirAll(dir, 0755); err != nil {
		logger.WPP().Error().Err(err).Msg("Failed to create history sync dump directory")
		return
	}

	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("%s_%s_%s_chunk%d.json", sessionId, timestamp, syncType, chunkOrder)
	filePath := filepath.Join(dir, filename)

	data, err := json.MarshalIndent(e.Data, "", "  ")
	if err != nil {
		logger.WPP().Error().Err(err).Msg("Failed to marshal history sync data")
		return
	}

	if err := os.WriteFile(filePath, data, 0600); err != nil {
		logger.WPP().Error().Err(err).Str("file", filePath).Msg("Failed to write history sync JSON")
		return
	}

	logger.WPP().Info().
		Str("session", sessionId).
		Str("file", filePath).
		Int("size", len(data)).
		Msg("History sync saved to JSON")
}
