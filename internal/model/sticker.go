package model

import "time"

// Sticker represents a frequently used sticker from History Sync
type Sticker struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`

	// WhatsApp Download Info (same pattern as Media)
	WAFileSHA256    []byte `json:"waFileSha256"`
	WAFileEncSHA256 []byte `json:"waFileEncSha256,omitempty"`
	WAMediaKey      []byte `json:"waMediaKey"`
	WADirectPath    string `json:"waDirectPath,omitempty"`

	// Sticker metadata
	MimeType string `json:"mimeType,omitempty"`
	FileSize int    `json:"fileSize,omitempty"`
	Width    int    `json:"width,omitempty"`
	Height   int    `json:"height,omitempty"`
	IsLottie bool   `json:"isLottie"`
	IsAvatar bool   `json:"isAvatar"`

	// Usage statistics (weight is float32 to match DB REAL type)
	Weight     float32    `json:"weight"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`

	// Storage Info (MinIO/S3)
	StorageKey string `json:"storageKey,omitempty"`
	StorageURL string `json:"storageUrl,omitempty"`

	// Download Status
	Downloaded       bool   `json:"downloaded"`
	DownloadError    string `json:"downloadError,omitempty"`
	DownloadAttempts int    `json:"downloadAttempts"`

	// Timestamps
	SyncedAt  time.Time `json:"syncedAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CanDownload returns true if we have enough info to download from WhatsApp
func (s *Sticker) CanDownload() bool {
	return s.WADirectPath != "" && len(s.WAMediaKey) > 0
}

// NeedsDownload returns true if sticker should be downloaded
func (s *Sticker) NeedsDownload() bool {
	return !s.Downloaded && s.CanDownload() && s.DownloadAttempts < 3
}

// IsAnimated returns true if this is an animated sticker (Lottie)
func (s *Sticker) IsAnimated() bool {
	return s.IsLottie
}
