package service

import (
	"context"
	"fmt"
	"time"

	"go.mau.fi/whatsmeow"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

type MediaService struct {
	database *db.Database
	storage  *StorageService
}

func NewMediaService(database *db.Database, storage *StorageService) *MediaService {
	return &MediaService{
		database: database,
		storage:  storage,
	}
}

// DownloadAndStore downloads media from WhatsApp and stores it in MinIO
func (s *MediaService) DownloadAndStore(ctx context.Context, client *whatsmeow.Client, media *model.Media, sessionID string) error {
	if client == nil {
		return fmt.Errorf("whatsapp client is nil")
	}

	if !media.CanDownload() {
		return fmt.Errorf("media cannot be downloaded: missing directPath or mediaKey")
	}

	// Get fromMe from associated message (denormalized field not stored in zpMedia)
	fromMe := false
	msg, err := s.database.Messages.GetByMsgId(ctx, sessionID, media.MsgID)
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
		// Update download error
		_ = s.database.Media.IncrementDownloadAttempts(ctx, media.ID, err.Error())
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

	logger.Info().
		Str("mediaId", media.ID).
		Str("msgId", media.MsgID).
		Str("storageKey", result.Key).
		Int64("size", result.Size).
		Msg("Media downloaded and stored")

	return nil
}

// ProcessPendingDownloads processes pending media downloads for a session
func (s *MediaService) ProcessPendingDownloads(ctx context.Context, client *whatsmeow.Client, sessionID string, batchSize int) (int, int) {
	if s.storage == nil {
		logger.Warn().Msg("Storage service not configured, skipping media downloads")
		return 0, 0
	}

	medias, err := s.database.Media.GetPendingDownloads(ctx, sessionID, batchSize)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to get pending media downloads")
		return 0, 0
	}

	if len(medias) == 0 {
		return 0, 0
	}

	logger.Info().
		Str("sessionId", sessionID).
		Int("count", len(medias)).
		Msg("Processing pending media downloads")

	success := 0
	failed := 0

	for _, media := range medias {
		err := s.DownloadAndStore(ctx, client, media, sessionID)
		if err != nil {
			logger.Warn().
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

	return success, failed
}

func getWhatsmeowMediaType(mediaType string) whatsmeow.MediaType {
	switch mediaType {
	case "image":
		return whatsmeow.MediaImage
	case "video":
		return whatsmeow.MediaVideo
	case "audio":
		return whatsmeow.MediaAudio
	case "document":
		return whatsmeow.MediaDocument
	case "sticker":
		return whatsmeow.MediaImage
	default:
		return whatsmeow.MediaDocument
	}
}

func getDefaultContentType(mediaType string) string {
	switch mediaType {
	case "image":
		return "image/jpeg"
	case "video":
		return "video/mp4"
	case "audio":
		return "audio/ogg"
	case "document":
		return "application/octet-stream"
	case "sticker":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}

// SentMediaInfo holds information about sent media for storage
type SentMediaInfo struct {
	SessionID string
	MsgID     string
	ChatJID   string
	MediaType string
	MimeType  string
	FileName  string
	Caption   string
	FileSize  int64
	Data      []byte
}

// SaveSentMedia saves media that was sent via API directly to storage
func (s *MediaService) SaveSentMedia(ctx context.Context, info *SentMediaInfo) error {
	if s.storage == nil {
		logger.Debug().Msg("Storage service not configured, skipping sent media save")
		return nil
	}

	if len(info.Data) == 0 {
		return nil
	}

	// Upload to MinIO
	contentType := info.MimeType
	if contentType == "" {
		contentType = getDefaultContentType(info.MediaType)
	}

	result, err := s.storage.Upload(ctx, info.SessionID, info.MsgID, info.MediaType, true, info.Data, contentType)
	if err != nil {
		logger.Warn().Err(err).Str("msgId", info.MsgID).Msg("Failed to upload sent media to storage")
		return err
	}

	// Save to database (chatJid, fromMe, caption are in zpMessages, not zpMedia)
	now := time.Now()
	media := &model.Media{
		SessionID:  info.SessionID,
		MsgID:      info.MsgID,
		MediaType:  info.MediaType,
		MimeType:   info.MimeType,
		FileSize:   info.FileSize,
		FileName:   info.FileName,
		StorageKey: result.Key,
		StorageURL: result.URL,
		StoredAt:   &now,
		Downloaded: true,
	}

	if _, err := s.database.Media.Save(ctx, media); err != nil {
		logger.Warn().Err(err).Str("msgId", info.MsgID).Msg("Failed to save sent media info to database")
		return err
	}

	logger.Info().
		Str("msgId", info.MsgID).
		Str("mediaType", info.MediaType).
		Str("storageKey", result.Key).
		Int64("size", result.Size).
		Msg("Sent media saved to storage")

	return nil
}
