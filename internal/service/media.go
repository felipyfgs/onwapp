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
)

// MediaRetryInfo stores info needed to process media retry responses
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

	// Track pending media retries
	pendingRetries   map[string]*MediaRetryInfo // key: msgID
	pendingRetriesMu sync.RWMutex

	// Track downloads in progress to prevent duplicates
	downloading   map[string]bool // key: mediaID or msgID
	downloadingMu sync.Mutex

	// Track if history sync processing is running
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

// tryStartDownload attempts to mark a media as being downloaded
// Returns true if this goroutine should proceed with the download
func (s *MediaService) tryStartDownload(mediaID string) bool {
	s.downloadingMu.Lock()
	defer s.downloadingMu.Unlock()

	if s.downloading[mediaID] {
		return false // Already being downloaded
	}
	s.downloading[mediaID] = true
	return true
}

// finishDownload marks a media download as complete
func (s *MediaService) finishDownload(mediaID string) {
	s.downloadingMu.Lock()
	defer s.downloadingMu.Unlock()
	delete(s.downloading, mediaID)
}

// ErrMediaExpired indicates the media is no longer available on WhatsApp servers (404/410)
var ErrMediaExpired = errors.New("media expired on WhatsApp servers")

// IsMediaExpiredError checks if the error indicates media is no longer available
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

// Deprecated: Use IsMediaExpiredError instead
func isMediaExpiredError(err error) bool {
	return IsMediaExpiredError(err)
}

// DownloadAndStore downloads media from WhatsApp and stores it in MinIO
// Returns ErrMediaExpired if media needs retry request
func (s *MediaService) DownloadAndStore(ctx context.Context, client *whatsmeow.Client, media *model.Media, sessionID string) error {
	if client == nil {
		return fmt.Errorf("whatsapp client is nil")
	}

	if !media.CanDownload() {
		return fmt.Errorf("media cannot be downloaded: missing directPath or mediaKey")
	}

	// Get fromMe from associated message (denormalized field not stored in zpMedia)
	// Use media.SessionID (UUID) instead of sessionID parameter (which is session name for storage path)
	fromMe := false
	msg, err := s.database.Messages.GetByMsgId(ctx, media.SessionID, media.MsgID)
	if err == nil && msg != nil {
		fromMe = msg.FromMe
	}

	// Get media type for whatsmeow
	waMediaType := getWhatsmeowMediaType(media.MediaType)

	// Download from WhatsApp
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

		// Check if media expired (404/410) - needs retry request
		if isMediaExpiredError(err) {
			logger.Storage().Warn().
				Str("mediaId", media.ID).
				Str("msgId", media.MsgID).
				Str("error", errMsg).
				Msg("Media expired on WhatsApp servers, needs retry request")
			return fmt.Errorf("%w: %s", ErrMediaExpired, errMsg)
		}

		return fmt.Errorf("failed to download from whatsapp: %w", err)
	}

	// Upload to MinIO
	contentType := media.MimeType
	if contentType == "" {
		contentType = getDefaultContentType(media.MediaType)
	}

	result, err := s.storage.Upload(ctx, sessionID, media.MsgID, media.MediaType, fromMe, data, contentType)
	if err != nil {
		_ = s.database.Media.IncrementDownloadAttempts(ctx, media.ID, err.Error())
		return fmt.Errorf("failed to upload to storage: %w", err)
	}

	// Update database
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

// SendMediaRetryRequest sends a media retry request to WhatsApp for expired media
func (s *MediaService) SendMediaRetryRequest(ctx context.Context, client *whatsmeow.Client, media *model.Media, sessionID string) error {
	if client == nil {
		return fmt.Errorf("whatsapp client is nil")
	}

	// Get message info for the retry request
	// Use media.SessionID (UUID) instead of sessionID parameter (which is session name)
	msg, err := s.database.Messages.GetByMsgId(ctx, media.SessionID, media.MsgID)
	if err != nil || msg == nil {
		return fmt.Errorf("failed to get message info: %w", err)
	}

	// Parse JIDs
	chatJID, err := types.ParseJID(msg.ChatJID)
	if err != nil {
		return fmt.Errorf("failed to parse chat JID: %w", err)
	}

	senderJID := chatJID
	if msg.SenderJID != "" && msg.SenderJID != msg.ChatJID {
		senderJID, _ = types.ParseJID(msg.SenderJID)
	}

	// Build message info for retry request
	msgInfo := &types.MessageInfo{
		ID: msg.MsgId,
		MessageSource: types.MessageSource{
			Chat:     chatJID,
			Sender:   senderJID,
			IsFromMe: msg.FromMe,
			IsGroup:  msg.IsGroup,
		},
	}

	// Store pending retry info
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

	// Send retry request
	err = client.SendMediaRetryReceipt(ctx, msgInfo, media.WAMediaKey)
	if err != nil {
		s.pendingRetriesMu.Lock()
		delete(s.pendingRetries, media.MsgID)
		s.pendingRetriesMu.Unlock()
		return fmt.Errorf("failed to send media retry request: %w", err)
	}

	// Mark as retry requested in database
	_ = s.database.Media.MarkAsRetryRequested(ctx, media.ID)

	logger.Storage().Info().
		Str("mediaId", media.ID).
		Str("msgId", media.MsgID).
		Str("chatJid", msg.ChatJID).
		Msg("Media retry request sent")

	return nil
}

// HandleMediaRetryResponse processes a media retry response from WhatsApp
func (s *MediaService) HandleMediaRetryResponse(ctx context.Context, client *whatsmeow.Client, evt *events.MediaRetry, sessionID string) error {
	msgID := evt.MessageID

	// Get pending retry info
	s.pendingRetriesMu.RLock()
	retryInfo, exists := s.pendingRetries[msgID]
	s.pendingRetriesMu.RUnlock()

	if !exists {
		logger.Storage().Debug().
			Str("msgId", msgID).
			Msg("No pending retry info for media retry response")
		return nil
	}

	// Decrypt the retry notification
	retryData, err := whatsmeow.DecryptMediaRetryNotification(evt, retryInfo.MediaKey)
	if err != nil {
		logger.Storage().Warn().
			Err(err).
			Str("msgId", msgID).
			Msg("Failed to decrypt media retry notification")
		return err
	}

	// Check result
	if retryData.GetResult() != waMmsRetry.MediaRetryNotification_SUCCESS {
		logger.Storage().Warn().
			Str("msgId", msgID).
			Int32("result", int32(retryData.GetResult())).
			Msg("Media retry failed")

		// Clean up pending retry
		s.pendingRetriesMu.Lock()
		delete(s.pendingRetries, msgID)
		s.pendingRetriesMu.Unlock()

		return fmt.Errorf("media retry failed with result: %v", retryData.GetResult())
	}

	// Update direct path in database
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

	// Clean up pending retry
	s.pendingRetriesMu.Lock()
	delete(s.pendingRetries, msgID)
	s.pendingRetriesMu.Unlock()

	// Try to download with new path
	media, err := s.database.Media.GetByMsgID(ctx, sessionID, msgID)
	if err != nil || media == nil {
		return fmt.Errorf("failed to get updated media: %w", err)
	}

	// Download with new path
	go func() {
		downloadCtx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
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

// CleanupOldPendingRetries removes old pending retries (older than 5 minutes)
func (s *MediaService) CleanupOldPendingRetries() {
	s.pendingRetriesMu.Lock()
	defer s.pendingRetriesMu.Unlock()

	threshold := time.Now().Add(-5 * time.Minute)
	for msgID, info := range s.pendingRetries {
		if info.CreatedAt.Before(threshold) {
			delete(s.pendingRetries, msgID)
		}
	}
}

// ProcessPendingDownloads processes pending media downloads for a session
// Returns (success, failed, retryRequested)
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
		// Skip if already being downloaded by another goroutine
		if !s.tryStartDownload(media.ID) {
			skipped++
			continue
		}

		err := s.DownloadAndStore(ctx, client, media, sessionID)
		s.finishDownload(media.ID)

		if err != nil {
			// Check if media expired and needs retry
			if errors.Is(err, ErrMediaExpired) {
				// Send retry request
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

		// Small delay to avoid rate limiting
		time.Sleep(100 * time.Millisecond)
	}

	if skipped > 0 {
		logger.Storage().Debug().Int("skipped", skipped).Msg("Skipped media already being downloaded")
	}

	return success, failed
}

// ProcessHistorySyncMedia processes media from history sync in background
// Only one instance runs at a time per service to prevent duplicate downloads
func (s *MediaService) ProcessHistorySyncMedia(ctx context.Context, client *whatsmeow.Client, sessionID string, mediaCount int) {
	if s.storage == nil {
		return
	}

	// Check if already running - only one history sync processor at a time
	s.historySyncMu.Lock()
	if s.historySyncRunning {
		s.historySyncMu.Unlock()
		logger.Storage().Debug().Msg("History sync media processing already running, skipping")
		return
	}
	s.historySyncRunning = true
	s.historySyncMu.Unlock()

	// Process in background with delay to not overload
	go func() {
		defer func() {
			s.historySyncMu.Lock()
			s.historySyncRunning = false
			s.historySyncMu.Unlock()
		}()

		// Wait a bit for history sync to settle
		time.Sleep(2 * time.Second)

		processCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		// Process in batches
		batchSize := 10
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

			success, failed := s.ProcessPendingDownloads(processCtx, client, sessionID, batchSize)
			totalSuccess += success
			totalFailed += failed

			if success == 0 && failed == 0 {
				emptyBatches++
			} else {
				emptyBatches = 0
			}

			// Delay between batches
			time.Sleep(1 * time.Second)
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

// waMediaTypes maps media type strings to whatsmeow.MediaType - O(1) lookup
var waMediaTypes = map[string]whatsmeow.MediaType{
	"image":    whatsmeow.MediaImage,
	"video":    whatsmeow.MediaVideo,
	"audio":    whatsmeow.MediaAudio,
	"document": whatsmeow.MediaDocument,
	"sticker":  whatsmeow.MediaImage,
}

// defaultContentTypes maps media type strings to MIME types - O(1) lookup
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
