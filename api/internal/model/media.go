package model

import "time"

type MediaType string

const (
	MediaTypeImage    MediaType = "image"
	MediaTypeVideo    MediaType = "video"
	MediaTypeAudio    MediaType = "audio"
	MediaTypeDocument MediaType = "document"
	MediaTypeSticker  MediaType = "sticker"
)

type Media struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`
	MsgID     string `json:"msgId"`

	MediaType string `json:"mediaType"`
	MimeType  string `json:"mimeType,omitempty"`
	FileSize  int64  `json:"fileSize,omitempty"`
	FileName  string `json:"fileName,omitempty"`

	WADirectPath        string `json:"waDirectPath,omitempty"`
	WAMediaKey          []byte `json:"waMediaKey,omitempty"`
	WAFileSHA256        []byte `json:"waFileSha256,omitempty"`
	WAFileEncSHA256     []byte `json:"waFileEncSha256,omitempty"`
	WAMediaKeyTimestamp int64  `json:"waMediaKeyTimestamp,omitempty"`

	Width    int `json:"width,omitempty"`
	Height   int `json:"height,omitempty"`
	Duration int `json:"duration,omitempty"`

	StorageKey string     `json:"storageKey,omitempty"`
	StorageURL string     `json:"storageUrl,omitempty"`
	StoredAt   *time.Time `json:"storedAt,omitempty"`

	ThumbnailKey string `json:"thumbnailKey,omitempty"`
	ThumbnailURL string `json:"thumbnailUrl,omitempty"`

	Downloaded       bool   `json:"downloaded"`
	DownloadError    string `json:"downloadError,omitempty"`
	DownloadAttempts int    `json:"downloadAttempts"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	ChatJID  string `json:"chatJid,omitempty"`
	FromMe   bool   `json:"fromMe,omitempty"`
	Caption  string `json:"caption,omitempty"`
	PushName string `json:"pushName,omitempty"`
}

func (m *Media) CanDownload() bool {
	return m.WADirectPath != "" && len(m.WAMediaKey) > 0
}

func (m *Media) NeedsDownload() bool {
	return !m.Downloaded && m.CanDownload() && m.DownloadAttempts < 3
}
