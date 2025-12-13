package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waMmsRetry"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"onwapp/internal/db"
	"onwapp/internal/logger"
	"onwapp/internal/model"
	"onwapp/internal/util"
)

var downloadSemaphore = util.NewSemaphore(100)

const (
	mediaDownloadTimeout   = 60 * time.Second
	downloadBatchDelay     = 100 * time.Millisecond
	historySyncSettleDelay = 2 * time.Second
	historySyncTimeout     = 10 * time.Minute
	batchProcessDelay      = 3 * time.Second
	pendingRetryMaxAge     = 5 * time.Minute
)

type MediaRetryInfo struct {
	SessionID string
	MsgID     string
	ChatJID   string
	SenderJID string
	MediaKey  []byte
	IsFromMe  bool
	IsGroup   bool
	CreatedAt time.Time
}

type MediaService struct {
	database *db.Database
	storage  *StorageService

	pendingRetries   map[string]*MediaRetryInfo
	pendingRetriesMu sync.RWMutex

	downloading   map[string]bool
	downloadingMu sync.Mutex

	historySyncRunning bool
	historySyncMu      sync.Mutex
}

func NewMediaService(database *db.Database, storage *StorageService) *MediaService {
	return &MediaService{
		database:       database,
		storage:        storage,
		pendingRetries: make(map[string]*MediaRetryInfo),
		downloading:    make(map[string]bool),
	}
}

func (s *MediaService) tryStartDownload(mediaID string) bool {
	s.downloadingMu.Lock()
	defer s.downloadingMu.Unlock()

	if s.downloading[mediaID] {
		return false
	}
	s.downloading[mediaID] = true
	return true
}

func (s *MediaService) finishDownload(mediaID string) {
	s.downloadingMu.Lock()
	defer s.downloadingMu.Unlock()
	delete(s.downloading, mediaID)
}

var ErrMediaExpired = errors.New("media expired on WhatsApp servers")

func IsMediaExpiredError(err error) bool {
	if err == nil {
		return false
	}
	errStr := strings.ToLower(err.Error())
	return errors.Is(err, whatsmeow.ErrMediaDownloadFailedWith403) ||
		errors.Is(err, whatsmeow.ErrMediaDownloadFailedWith404) ||
		errors.Is(err, whatsmeow.ErrMediaDownloadFailedWith410) ||
		strings.Contains(errStr, "403") ||
		strings.Contains(errStr, "404") ||
		strings.Contains(errStr, "410") ||
		strings.Contains(errStr, "not found") ||
		strings.Contains(errStr, "forbidden")
}

func (s *MediaService) DownloadAndStore(ctx context.Context, client *whatsmeow.Client, media *model.Media, sessionID string) error {
	if client == nil {
		return fmt.Errorf("whatsapp client is nil")
	}

	if !media.CanDownload() {
		return fmt.Errorf("media cannot be downloaded: missing directPath or mediaKey")
	}

	// Check connection before attempting download
	if !client.IsConnected() {
		return fmt.Errorf("websocket not connected")
	}

	fromMe := false
	msg, err := s.database.Messages.GetByMsgId(ctx, media.SessionID, media.MsgID)
	if err == nil && msg != nil {
		fromMe = msg.FromMe
	}

	waMediaType := getWhatsmeowMediaType(media.MediaType)

	data, err := client.DownloadMediaWithPath(
		ctx,
		media.WADirectPath,
		media.WAFileEncSHA256,
		media.WAFileSHA256,
		media.WAMediaKey,
		int(media.FileSize),
		waMediaType,
		"",
	)
	if err != nil {
		errMsg := err.Error()
		_ = s.database.Media.IncrementDownloadAttempts(ctx, media.ID, errMsg)

		if IsMediaExpiredError(err) {
			logger.Storage().Warn().
				Str("mediaId", media.ID).
				Str("msgId", media.MsgID).
				Str("error", errMsg).
				Msg("Media expired on WhatsApp servers, needs retry request")
			return fmt.Errorf("%w: %s", ErrMediaExpired, errMsg)
		}

		return fmt.Errorf("failed to download from whatsapp: %w", err)
	}

	contentType := media.MimeType
	if contentType == "" {
		contentType = getDefaultContentType(media.MediaType)
	}

	result, err := s.storage.Upload(ctx, sessionID, media.MsgID, media.MediaType, fromMe, data, contentType)
	if err != nil {
		_ = s.database.Media.IncrementDownloadAttempts(ctx, media.ID, err.Error())
		return fmt.Errorf("failed to upload to storage: %w", err)
	}

	err = s.database.Media.UpdateDownloadStatus(ctx, media.ID, true, result.Key, result.URL, "")
	if err != nil {
		return fmt.Errorf("failed to update media status: %w", err)
	}

	logger.Storage().Info().
		Str("mediaId", media.ID).
		Str("msgId", media.MsgID).
		Str("storageKey", result.Key).
		Int64("size", result.Size).
		Msg("Media downloaded and stored")

	return nil
}

func (s *MediaService) SendMediaRetryRequest(ctx context.Context, client *whatsmeow.Client, media *model.Media, sessionID string) error {
	if client == nil {
		return fmt.Errorf("whatsapp client is nil")
	}

	msg, err := s.database.Messages.GetByMsgId(ctx, media.SessionID, media.MsgID)
	if err != nil || msg == nil {
		return fmt.Errorf("failed to get message info: %w", err)
	}

	chatJID, err := types.ParseJID(msg.ChatJID)
	if err != nil {
		return fmt.Errorf("failed to parse chat JID: %w", err)
	}

	senderJID := chatJID
	if msg.SenderJID != "" && msg.SenderJID != msg.ChatJID {
		senderJID, _ = types.ParseJID(msg.SenderJID)
	}

	msgInfo := &types.MessageInfo{
		ID: msg.MsgId,
		MessageSource: types.MessageSource{
			Chat:     chatJID,
			Sender:   senderJID,
			IsFromMe: msg.FromMe,
			IsGroup:  msg.IsGroup,
		},
	}

	s.pendingRetriesMu.Lock()
	s.pendingRetries[media.MsgID] = &MediaRetryInfo{
		SessionID: sessionID,
		MsgID:     media.MsgID,
		ChatJID:   msg.ChatJID,
		SenderJID: msg.SenderJID,
		MediaKey:  media.WAMediaKey,
		IsFromMe:  msg.FromMe,
		IsGroup:   msg.IsGroup,
		CreatedAt: time.Now(),
	}
	s.pendingRetriesMu.Unlock()

	err = client.SendMediaRetryReceipt(ctx, msgInfo, media.WAMediaKey)
	if err != nil {
		s.pendingRetriesMu.Lock()
		delete(s.pendingRetries, media.MsgID)
		s.pendingRetriesMu.Unlock()
		return fmt.Errorf("failed to send media retry request: %w", err)
	}

	_ = s.database.Media.MarkAsRetryRequested(ctx, media.ID)

	logger.Storage().Info().
		Str("mediaId", media.ID).
		Str("msgId", media.MsgID).
		Str("chatJid", msg.ChatJID).
		Msg("Media retry request sent")

	return nil
}

func (s *MediaService) HandleMediaRetryResponse(ctx context.Context, client *whatsmeow.Client, evt *events.MediaRetry, sessionID string) error {
	msgID := evt.MessageID

	s.pendingRetriesMu.RLock()
	retryInfo, exists := s.pendingRetries[msgID]
	s.pendingRetriesMu.RUnlock()

	if !exists {
		logger.Storage().Debug().
			Str("msgId", msgID).
			Msg("No pending retry info for media retry response")
		return nil
	}

	retryData, err := whatsmeow.DecryptMediaRetryNotification(evt, retryInfo.MediaKey)
	if err != nil {
		logger.Storage().Warn().
			Err(err).
			Str("msgId", msgID).
			Msg("Failed to decrypt media retry notification")
		return err
	}

	if retryData.GetResult() != waMmsRetry.MediaRetryNotification_SUCCESS {
		logger.Storage().Warn().
			Str("msgId", msgID).
			Int32("result", int32(retryData.GetResult())).
			Msg("Media retry failed")

		s.pendingRetriesMu.Lock()
		delete(s.pendingRetries, msgID)
		s.pendingRetriesMu.Unlock()

		return fmt.Errorf("media retry failed with result: %v", retryData.GetResult())
	}

	newDirectPath := retryData.GetDirectPath()
	if newDirectPath == "" {
		return fmt.Errorf("media retry response has empty direct path")
	}

	err = s.database.Media.UpdateDirectPath(ctx, sessionID, msgID, newDirectPath)
	if err != nil {
		return fmt.Errorf("failed to update direct path: %w", err)
	}

	logger.Storage().Info().
		Str("msgId", msgID).
		Str("newDirectPath", newDirectPath).
		Msg("Media retry successful, direct path updated")

	s.pendingRetriesMu.Lock()
	delete(s.pendingRetries, msgID)
	s.pendingRetriesMu.Unlock()

	media, err := s.database.Media.GetByMsgID(ctx, sessionID, msgID)
	if err != nil || media == nil {
		return fmt.Errorf("failed to get updated media: %w", err)
	}

	go func() {
		downloadSemaphore.Acquire()
		defer downloadSemaphore.Release()

		downloadCtx, cancel := context.WithTimeout(context.Background(), mediaDownloadTimeout)
		defer cancel()

		if err := s.DownloadAndStore(downloadCtx, client, media, sessionID); err != nil {
			logger.Storage().Warn().
				Err(err).
				Str("msgId", msgID).
				Msg("Failed to download media after retry")
		}
	}()

	return nil
}

func (s *MediaService) CleanupOldPendingRetries() {
	s.pendingRetriesMu.Lock()
	defer s.pendingRetriesMu.Unlock()

	threshold := time.Now().Add(-pendingRetryMaxAge)
	for msgID, info := range s.pendingRetries {
		if info.CreatedAt.Before(threshold) {
			delete(s.pendingRetries, msgID)
		}
	}
}

func (s *MediaService) ProcessPendingDownloads(ctx context.Context, client *whatsmeow.Client, sessionID string, batchSize int) (int, int) {
	if s.storage == nil {
		logger.Storage().Warn().Msg("Storage service not configured, skipping media downloads")
		return 0, 0
	}

	medias, err := s.database.Media.GetPendingDownloads(ctx, sessionID, batchSize)
	if err != nil {
		logger.Storage().Error().Err(err).Msg("Failed to get pending media downloads")
		return 0, 0
	}

	if len(medias) == 0 {
		return 0, 0
	}

	logger.Storage().Debug().
		Str("sessionId", sessionID).
		Int("count", len(medias)).
		Msg("Processing pending media downloads")

	success := 0
	failed := 0
	skipped := 0

	for _, media := range medias {
		if !s.tryStartDownload(media.ID) {
			skipped++
			continue
		}

		err := s.DownloadAndStore(ctx, client, media, sessionID)
		s.finishDownload(media.ID)

		if err != nil {
			if errors.Is(err, ErrMediaExpired) {
				if retryErr := s.SendMediaRetryRequest(ctx, client, media, sessionID); retryErr != nil {
					logger.Storage().Warn().
						Err(retryErr).
						Str("mediaId", media.ID).
						Str("msgId", media.MsgID).
						Msg("Failed to send media retry request")
				}
			}

			logger.Storage().Warn().
				Err(err).
				Str("mediaId", media.ID).
				Str("msgId", media.MsgID).
				Msg("Failed to download media")
			failed++
		} else {
			success++
		}

		time.Sleep(downloadBatchDelay)
	}

	if skipped > 0 {
		logger.Storage().Debug().Int("skipped", skipped).Msg("Skipped media already being downloaded")
	}

	return success, failed
}

func (s *MediaService) ProcessHistorySyncMedia(ctx context.Context, client *whatsmeow.Client, sessionID string, mediaCount int) {
	if s.storage == nil {
		return
	}

	s.historySyncMu.Lock()
	if s.historySyncRunning {
		s.historySyncMu.Unlock()
		logger.Storage().Debug().Msg("History sync media processing already running, skipping")
		return
	}
	s.historySyncRunning = true
	s.historySyncMu.Unlock()

	go func() {
		defer func() {
			s.historySyncMu.Lock()
			s.historySyncRunning = false
			s.historySyncMu.Unlock()
		}()

		time.Sleep(historySyncSettleDelay)

		processCtx, cancel := context.WithTimeout(context.Background(), historySyncTimeout)
		defer cancel()

		batchSize := 5
		totalSuccess := 0
		totalFailed := 0
		emptyBatches := 0

		for emptyBatches < 3 { // Exit after 3 consecutive empty batches
			select {
			case <-processCtx.Done():
				logger.Storage().Warn().Msg("History sync media processing timeout")
				return
			default:
			}

			// Check if client is still connected before processing
			if !client.IsConnected() {
				logger.Storage().Warn().
					Str("sessionId", sessionID).
					Msg("Client disconnected, stopping media processing")
				return
			}

			success, failed := s.ProcessPendingDownloads(processCtx, client, sessionID, batchSize)
			totalSuccess += success
			totalFailed += failed

			if success == 0 && failed == 0 {
				emptyBatches++
			} else {
				emptyBatches = 0
			}

			time.Sleep(batchProcessDelay)
		}

		if totalSuccess > 0 || totalFailed > 0 {
			logger.Storage().Info().
				Str("sessionId", sessionID).
				Int("success", totalSuccess).
				Int("failed", totalFailed).
				Msg("History sync media processing completed")
		}
	}()
}

var waMediaTypes = map[string]whatsmeow.MediaType{
	"image":    whatsmeow.MediaImage,
	"video":    whatsmeow.MediaVideo,
	"audio":    whatsmeow.MediaAudio,
	"document": whatsmeow.MediaDocument,
	"sticker":  whatsmeow.MediaImage,
}

var defaultContentTypes = map[string]string{
	"image":    "image/jpeg",
	"video":    "video/mp4",
	"audio":    "audio/ogg",
	"document": "application/octet-stream",
	"sticker":  "image/webp",
}

func getWhatsmeowMediaType(mediaType string) whatsmeow.MediaType {
	if mt, ok := waMediaTypes[mediaType]; ok {
		return mt
	}
	return whatsmeow.MediaDocument
}

func getDefaultContentType(mediaType string) string {
	if ct, ok := defaultContentTypes[mediaType]; ok {
		return ct
	}
	return "application/octet-stream"
}
