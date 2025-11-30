package handler

import (
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
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
