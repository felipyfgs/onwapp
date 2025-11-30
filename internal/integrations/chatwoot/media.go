package chatwoot

import (
	"path"
	"strings"

	"go.mau.fi/whatsmeow/proto/waE2E"
)

// IsMediaMessage checks if the message contains downloadable media
func IsMediaMessage(msg *waE2E.Message) bool {
	if msg == nil {
		return false
	}
	return msg.ImageMessage != nil ||
		msg.VideoMessage != nil ||
		msg.AudioMessage != nil ||
		msg.DocumentMessage != nil ||
		msg.StickerMessage != nil
}

// GetMediaInfo extracts media information from a message
func GetMediaInfo(msg *waE2E.Message) *MediaInfo {
	if msg == nil {
		return nil
	}

	if img := msg.GetImageMessage(); img != nil {
		return &MediaInfo{
			IsMedia:  true,
			MimeType: img.GetMimetype(),
			Filename: "image.jpg",
			Caption:  img.GetCaption(),
		}
	}

	if vid := msg.GetVideoMessage(); vid != nil {
		return &MediaInfo{
			IsMedia:  true,
			MimeType: vid.GetMimetype(),
			Filename: "video.mp4",
			Caption:  vid.GetCaption(),
		}
	}

	if aud := msg.GetAudioMessage(); aud != nil {
		ext := "ogg"
		if strings.Contains(aud.GetMimetype(), "mpeg") {
			ext = "mp3"
		}
		return &MediaInfo{
			IsMedia:  true,
			MimeType: aud.GetMimetype(),
			Filename: "audio." + ext,
			Caption:  "",
		}
	}

	if doc := msg.GetDocumentMessage(); doc != nil {
		filename := doc.GetFileName()
		if filename == "" {
			filename = "document"
		}
		return &MediaInfo{
			IsMedia:  true,
			MimeType: doc.GetMimetype(),
			Filename: filename,
			Caption:  doc.GetCaption(),
		}
	}

	if stk := msg.GetStickerMessage(); stk != nil {
		return &MediaInfo{
			IsMedia:  true,
			MimeType: stk.GetMimetype(),
			Filename: "sticker.webp",
			Caption:  "",
		}
	}

	return nil
}

// GetMediaTypeFromFilename returns the media type based on file extension
func GetMediaTypeFromFilename(filename string) string {
	ext := strings.ToLower(path.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp":
		return "image"
	case ".mp4", ".mov", ".avi", ".mkv", ".webm":
		return "video"
	case ".mp3", ".wav", ".ogg", ".aac", ".m4a":
		return "audio"
	default:
		return "file"
	}
}

// GetMediaTypeFromURL returns the media type based on URL path
func GetMediaTypeFromURL(url string) string {
	return GetMediaTypeFromFilename(url)
}
