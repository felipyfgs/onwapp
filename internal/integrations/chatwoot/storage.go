package chatwoot

import (
	"bytes"
	"context"
	"fmt"
	"path"
	"strings"
	"time"

	"zpwoot/internal/logger"
)

// MediaUploader handles uploading media to Chatwoot via API
type MediaUploader struct {
	client *Client
}

// NewMediaUploader creates a new media uploader
func NewMediaUploader(client *Client) *MediaUploader {
	return &MediaUploader{
		client: client,
	}
}

// MediaUploadRequest represents a request to upload media to Chatwoot
type MediaUploadRequest struct {
	ConversationID int
	MediaURL       string
	MediaType      string // image, video, audio, document
	Filename       string
	MimeType       string
	Caption        string
	MessageType    string // incoming or outgoing
	ContentAttrs   map[string]interface{}
	Timestamp      *time.Time // Optional: original message timestamp for correct ordering
	SourceID       string     // Optional: source_id to prevent webhook loops (e.g., "WAID:msgid")
}

// UploadFromURL downloads media from URL and uploads to Chatwoot
func (m *MediaUploader) UploadFromURL(ctx context.Context, req MediaUploadRequest) (*Message, error) {
	// Download file from URL
	data, contentType, err := downloadMedia(req.MediaURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download media: %w", err)
	}

	// Use provided mime type if available, otherwise use detected
	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = contentType
	}

	// Determine filename
	filename := req.Filename
	if filename == "" {
		filename = extractFilename(req.MediaURL, mimeType)
	}

	// Set default message type
	messageType := req.MessageType
	if messageType == "" {
		messageType = "incoming"
	}

	logger.Debug().
		Int("conversationId", req.ConversationID).
		Str("mediaType", req.MediaType).
		Str("filename", filename).
		Str("mimeType", mimeType).
		Int("size", len(data)).
		Msg("Chatwoot: uploading media via API")

	// Upload to Chatwoot using full method with timestamp support
	msg, err := m.client.CreateMessageWithAttachmentFull(ctx, AttachmentUploadRequest{
		ConversationID:    req.ConversationID,
		Content:           req.Caption,
		MessageType:       messageType,
		Attachment:        bytes.NewReader(data),
		Filename:          filename,
		MimeType:          mimeType,
		ContentAttributes: req.ContentAttrs,
		Timestamp:         req.Timestamp,
		SourceID:          req.SourceID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload to Chatwoot: %w", err)
	}

	logger.Debug().
		Int("conversationId", req.ConversationID).
		Int("messageId", msg.ID).
		Str("filename", filename).
		Msg("Chatwoot: media uploaded successfully")

	return msg, nil
}

// UploadFromData uploads raw media data to Chatwoot
func (m *MediaUploader) UploadFromData(ctx context.Context, conversationID int, data []byte, filename, mimeType, caption, messageType string, contentAttrs map[string]interface{}, timestamp *time.Time) (*Message, error) {
	if messageType == "" {
		messageType = "incoming"
	}

	logger.Debug().
		Int("conversationId", conversationID).
		Str("filename", filename).
		Str("mimeType", mimeType).
		Int("size", len(data)).
		Msg("Chatwoot: uploading media from data via API")

	msg, err := m.client.CreateMessageWithAttachmentFull(ctx, AttachmentUploadRequest{
		ConversationID:    conversationID,
		Content:           caption,
		MessageType:       messageType,
		Attachment:        bytes.NewReader(data),
		Filename:          filename,
		MimeType:          mimeType,
		ContentAttributes: contentAttrs,
		Timestamp:         timestamp,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload to Chatwoot: %w", err)
	}

	logger.Debug().
		Int("conversationId", conversationID).
		Int("messageId", msg.ID).
		Str("filename", filename).
		Msg("Chatwoot: media uploaded successfully from data")

	return msg, nil
}

// Note: downloadMedia is defined in handler.go and reused here

// extractFilename extracts or generates a filename from URL or mime type
func extractFilename(url, mimeType string) string {
	// Try to get from URL path
	urlPath := strings.Split(url, "?")[0]
	filename := path.Base(urlPath)
	
	if filename != "" && filename != "." && filename != "/" {
		return filename
	}

	// Generate from mime type
	ext := getExtensionFromMime(mimeType)
	return fmt.Sprintf("file%s", ext)
}

// getExtensionFromMime returns file extension for common mime types
func getExtensionFromMime(mimeType string) string {
	mimeToExt := map[string]string{
		"image/jpeg":      ".jpg",
		"image/png":       ".png",
		"image/gif":       ".gif",
		"image/webp":      ".webp",
		"video/mp4":       ".mp4",
		"video/3gpp":      ".3gp",
		"audio/ogg":       ".ogg",
		"audio/mpeg":      ".mp3",
		"audio/mp4":       ".m4a",
		"audio/aac":       ".aac",
		"application/pdf": ".pdf",
		"application/msword": ".doc",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
	}

	if ext, ok := mimeToExt[mimeType]; ok {
		return ext
	}

	// Try to extract from mime type
	parts := strings.Split(mimeType, "/")
	if len(parts) == 2 {
		return "." + parts[1]
	}

	return ".bin"
}

// FileTypeMap maps media types to Chatwoot file_type strings
var FileTypeMap = map[string]string{
	"image":    "image",
	"video":    "video",
	"audio":    "audio",
	"document": "file",
	"file":     "file",
	"sticker":  "image",
}
