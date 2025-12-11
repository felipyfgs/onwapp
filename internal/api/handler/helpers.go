package handler

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"onwapp/internal/util/web"
)

func IsURL(s string) bool {
	return strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://")
}

func DownloadFromURL(url string) ([]byte, string, error) {
	return web.DownloadFromURL(url)
}

func GetMediaData(media string, mediaType string) ([]byte, string, error) {
	if media == "" {
		return nil, "", fmt.Errorf("%s is required", mediaType)
	}

	if IsURL(media) {
		data, mimeType, err := web.DownloadFromURL(media)
		if err != nil {
			return nil, "", fmt.Errorf("failed to download %s from URL: %w", mediaType, err)
		}
		return data, mimeType, nil
	}

	data, err := base64.StdEncoding.DecodeString(media)
	if err != nil {
		return nil, "", fmt.Errorf("invalid base64 %s", mediaType)
	}

	mimeType := http.DetectContentType(data)
	return data, mimeType, nil
}

func IsMultipartRequest(c *gin.Context) bool {
	contentType := c.GetHeader("Content-Type")
	return strings.HasPrefix(contentType, "multipart/form-data")
}

func GetMediaFromForm(r *http.Request, fieldName string) ([]byte, string, error) {
	file, header, err := r.FormFile(fieldName)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get file from form: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read file: %w", err)
	}

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = http.DetectContentType(data)
	}

	return data, mimeType, nil
}

func ParseDisappearingTimer(c *gin.Context, timer string) (time.Duration, error) {
	switch timer {
	case "24h":
		return 24 * time.Hour, nil
	case "7d":
		return 7 * 24 * time.Hour, nil
	case "90d":
		return 90 * 24 * time.Hour, nil
	case "off", "0":
		return 0, nil
	default:
		parsed, err := time.ParseDuration(timer)
		if err != nil {
			return 0, fmt.Errorf("invalid timer format. Use: 24h, 7d, 90d, off, or Go duration")
		}
		return parsed, nil
	}
}
