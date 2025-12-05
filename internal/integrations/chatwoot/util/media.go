package util

import (
	"net/url"
	"path"
	"strings"

	"go.mau.fi/whatsmeow/proto/waE2E"

	"onwapp/internal/integrations/chatwoot/core"
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
func GetMediaInfo(msg *waE2E.Message) *core.MediaInfo {
	if msg == nil {
		return nil
	}

	if img := msg.GetImageMessage(); img != nil {
		return &core.MediaInfo{
			IsMedia:  true,
			MimeType: img.GetMimetype(),
			Filename: "image.jpg",
			Caption:  img.GetCaption(),
		}
	}

	if vid := msg.GetVideoMessage(); vid != nil {
		return &core.MediaInfo{
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
		return &core.MediaInfo{
			IsMedia:  true,
			MimeType: aud.GetMimetype(),
			Filename: "audio." + ext,
			Caption:  "",
		}
	}

	if doc := msg.GetDocumentMessage(); doc != nil {
		filename := doc.GetFileName()
		if filename == "" {
			filename = doc.GetTitle()
		}
		if filename == "" {
			// Generate filename from mimetype
			ext := ".bin"
			switch doc.GetMimetype() {
			case "application/pdf":
				ext = ".pdf"
			case "application/msword":
				ext = ".doc"
			case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				ext = ".docx"
			case "application/vnd.ms-excel":
				ext = ".xls"
			case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
				ext = ".xlsx"
			case "text/plain":
				ext = ".txt"
			}
			filename = "document" + ext
		}
		return &core.MediaInfo{
			IsMedia:  true,
			MimeType: doc.GetMimetype(),
			Filename: filename,
			Caption:  doc.GetCaption(),
		}
	}

	if stk := msg.GetStickerMessage(); stk != nil {
		return &core.MediaInfo{
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

// ExtractFilenameFromURL extracts the filename from a URL
func ExtractFilenameFromURL(urlStr string) string {
	if urlStr == "" {
		return ""
	}

	// Remove query string
	urlPath := strings.Split(urlStr, "?")[0]

	// Get the base name
	filename := path.Base(urlPath)

	// Validate it's a reasonable filename
	if filename == "" || filename == "." || filename == "/" {
		return ""
	}

	// Check if it has an extension
	if !strings.Contains(filename, ".") {
		return ""
	}

	// Decode URL-encoded characters (e.g., %20 -> space)
	decoded, err := url.PathUnescape(filename)
	if err != nil {
		return filename
	}

	return decoded
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
