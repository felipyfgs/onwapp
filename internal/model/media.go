package model

import "time"

// MediaType represents the type of media
type MediaType string

const (
	MediaTypeImage    MediaType = "image"
	MediaTypeVideo    MediaType = "video"
	MediaTypeAudio    MediaType = "audio"
	MediaTypeDocument MediaType = "document"
	MediaTypeSticker  MediaType = "sticker"
)

// Media represents a media file attached to a message
// Note: chatJid, fromMe, caption are obtained via JOIN with zpMessages (no redundancy)
type Media struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`
	MsgID     string `json:"msgId"`

	// Media Classification
	MediaType string `json:"mediaType"`
	MimeType  string `json:"mimeType,omitempty"`
	FileSize  int64  `json:"fileSize,omitempty"`
	FileName  string `json:"fileName,omitempty"`

	// WhatsApp Download Info (needed to download from WA servers)
	WADirectPath        string `json:"waDirectPath,omitempty"`
	WAMediaKey          []byte `json:"waMediaKey,omitempty"`
	WAFileSHA256        []byte `json:"waFileSha256,omitempty"`
	WAFileEncSHA256     []byte `json:"waFileEncSha256,omitempty"`
	WAMediaKeyTimestamp int64  `json:"waMediaKeyTimestamp,omitempty"`

	// Media Dimensions
	Width    int `json:"width,omitempty"`
	Height   int `json:"height,omitempty"`
	Duration int `json:"duration,omitempty"`

	// Storage Info (MinIO/S3)
	StorageKey string     `json:"storageKey,omitempty"`
	StorageURL string     `json:"storageUrl,omitempty"`
	StoredAt   *time.Time `json:"storedAt,omitempty"`

	// Thumbnail
	ThumbnailKey string `json:"thumbnailKey,omitempty"`
	ThumbnailURL string `json:"thumbnailUrl,omitempty"`

	// Download Status
	Downloaded       bool   `json:"downloaded"`
	DownloadError    string `json:"downloadError,omitempty"`
	DownloadAttempts int    `json:"downloadAttempts"`

	// Metadata
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Denormalized fields (populated via JOIN when needed)
	ChatJID  string `json:"chatJid,omitempty"`
	FromMe   bool   `json:"fromMe,omitempty"`
	Caption  string `json:"caption,omitempty"`
	PushName string `json:"pushName,omitempty"`
}

// CanDownload returns true if we have enough info to download from WhatsApp
func (m *Media) CanDownload() bool {
	return m.WADirectPath != "" && len(m.WAMediaKey) > 0
}

// NeedsDownload returns true if media should be downloaded
func (m *Media) NeedsDownload() bool {
	return !m.Downloaded && m.CanDownload() && m.DownloadAttempts < 3
}
