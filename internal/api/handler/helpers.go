package handler

import (
	"encoding/base64"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"onwapp/internal/api/dto"
)

func DecodeBase64(c *gin.Context, data, mediaType string) ([]byte, bool) {
	decoded, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "invalid base64 " + mediaType,
		})
		return nil, false
	}
	return decoded, true
}

// IsURL checks if a string is a URL
func IsURL(s string) bool {
	return strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://")
}

// DownloadFromURL downloads content from a URL and returns the data and detected mime type
func DownloadFromURL(url string) ([]byte, string, error) {
	resp, err := http.Get(url)
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
		mimeType = http.DetectContentType(data)
	}

	return data, mimeType, nil
}

// GetMediaData handles URL or base64 input and returns the raw bytes and detected mime type
func GetMediaData(c *gin.Context, media string, mediaType string) ([]byte, string, bool) {
	if media == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: mediaType + " is required"})
		return nil, "", false
	}

	if IsURL(media) {
		data, mimeType, err := DownloadFromURL(media)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "failed to download " + mediaType + " from URL: " + err.Error()})
			return nil, "", false
		}
		return data, mimeType, true
	}

	// Try base64 decode
	data, err := base64.StdEncoding.DecodeString(media)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 " + mediaType})
		return nil, "", false
	}

	// Detect mime type from content
	mimeType := http.DetectContentType(data)
	return data, mimeType, true
}

// IsMultipartRequest checks if the request is multipart/form-data
func IsMultipartRequest(c *gin.Context) bool {
	contentType := c.GetHeader("Content-Type")
	return strings.HasPrefix(contentType, "multipart/form-data")
}

// GetMediaFromForm extracts file from multipart form and returns bytes and mime type
func GetMediaFromForm(c *gin.Context, fieldName string) ([]byte, string, bool) {
	file, header, err := c.Request.FormFile(fieldName)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "failed to get file from form: " + err.Error()})
		return nil, "", false
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "failed to read file: " + err.Error()})
		return nil, "", false
	}

	// Get mime type from header or detect from content
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = http.DetectContentType(data)
	}

	return data, mimeType, true
}

func ParseDisappearingTimer(c *gin.Context, timer string) (time.Duration, bool) {
	switch timer {
	case "24h":
		return 24 * time.Hour, true
	case "7d":
		return 7 * 24 * time.Hour, true
	case "90d":
		return 90 * 24 * time.Hour, true
	case "off", "0":
		return 0, true
	default:
		parsed, err := time.ParseDuration(timer)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error: "invalid timer format. Use: 24h, 7d, 90d, off, or Go duration",
			})
			return 0, false
		}
		return parsed, true
	}
}

func GetMimeTypeOrDefault(mimeType, defaultType string) string {
	if mimeType == "" {
		return defaultType
	}
	return mimeType
}
