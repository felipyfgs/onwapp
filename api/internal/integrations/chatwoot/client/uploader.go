package client

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"
	"time"

	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/logger"
)

type MediaUploader struct {
	client *Client
}

func NewMediaUploader(c *Client) *MediaUploader {
	return &MediaUploader{
		client: c,
	}
}

type MediaUploadRequest struct {
	ConversationID int
	MediaURL       string
	MediaType      string
	Filename       string
	MimeType       string
	Caption        string
	MessageType    string
	ContentAttrs   map[string]interface{}
	Timestamp      *time.Time
	SourceID       string
}

func (m *MediaUploader) UploadFromURL(ctx context.Context, req MediaUploadRequest) (*core.Message, error) {
	data, contentType, err := DownloadMedia(ctx, req.MediaURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download media: %w", err)
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = contentType
	}

	filename := req.Filename
	if filename == "" {
		filename = ExtractFilename(req.MediaURL, mimeType)
	}

	messageType := req.MessageType
	if messageType == "" {
		messageType = "incoming"
	}

	logger.Chatwoot().Debug().
		Int("conversationId", req.ConversationID).
		Str("mediaType", req.MediaType).
		Str("filename", filename).
		Str("mimeType", mimeType).
		Int("size", len(data)).
		Msg("Chatwoot: uploading media via API")

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

	logger.Chatwoot().Debug().
		Int("conversationId", req.ConversationID).
		Int("messageId", msg.ID).
		Str("filename", filename).
		Msg("Chatwoot: media uploaded successfully")

	return msg, nil
}

func DownloadMedia(ctx context.Context, url string) ([]byte, string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, "", err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	mimeType := resp.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	return data, mimeType, nil
}

func ExtractFilename(url, mimeType string) string {
	urlPath := strings.Split(url, "?")[0]
	filename := path.Base(urlPath)

	if filename != "" && filename != "." && filename != "/" {
		return filename
	}

	ext := GetExtensionFromMime(mimeType)
	return fmt.Sprintf("file%s", ext)
}

func GetExtensionFromMime(mimeType string) string {
	mimeToExt := map[string]string{
		"image/jpeg":         ".jpg",
		"image/png":          ".png",
		"image/gif":          ".gif",
		"image/webp":         ".webp",
		"video/mp4":          ".mp4",
		"video/3gpp":         ".3gp",
		"audio/ogg":          ".ogg",
		"audio/mpeg":         ".mp3",
		"audio/mp4":          ".m4a",
		"audio/aac":          ".aac",
		"application/pdf":    ".pdf",
		"application/msword": ".doc",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
	}

	if ext, ok := mimeToExt[mimeType]; ok {
		return ext
	}

	parts := strings.Split(mimeType, "/")
	if len(parts) == 2 {
		return "." + parts[1]
	}

	return ".bin"
}
