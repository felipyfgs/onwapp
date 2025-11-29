package handler

import (
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
)

// DecodeBase64 decodes a base64 string and returns the data.
// Returns nil and false if decoding fails, also sends error response.
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

// ParseDisappearingTimer parses a timer string (24h, 7d, 90d, off, or Go duration)
// Returns 0 and false if parsing fails, also sends error response.
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

// GetMimeTypeOrDefault returns the provided mimeType or a default value
func GetMimeTypeOrDefault(mimeType, defaultType string) string {
	if mimeType == "" {
		return defaultType
	}
	return mimeType
}
