package errors

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

var (
	ErrSessionNotFound     = &AppError{Code: "SESSION_NOT_FOUND", Message: "session not found", Status: http.StatusNotFound}
	ErrSessionExists       = &AppError{Code: "SESSION_EXISTS", Message: "session already exists", Status: http.StatusConflict}
	ErrSessionNotConnected = &AppError{Code: "SESSION_NOT_CONNECTED", Message: "session is not connected", Status: http.StatusBadRequest}
	ErrInvalidRequest      = &AppError{Code: "INVALID_REQUEST", Message: "invalid request body", Status: http.StatusBadRequest}
	ErrInvalidWebhookURL   = &AppError{Code: "INVALID_WEBHOOK_URL", Message: "invalid webhook URL: must be a valid http or https URL", Status: http.StatusBadRequest}
	ErrInvalidWebhookID    = &AppError{Code: "INVALID_WEBHOOK_ID", Message: "invalid webhook id", Status: http.StatusBadRequest}
	ErrInvalidPhone        = &AppError{Code: "INVALID_PHONE", Message: "invalid phone number", Status: http.StatusBadRequest}
	ErrInvalidGroupID      = &AppError{Code: "INVALID_GROUP_ID", Message: "invalid group id", Status: http.StatusBadRequest}
	ErrInvalidBase64       = &AppError{Code: "INVALID_BASE64", Message: "invalid base64 encoding", Status: http.StatusBadRequest}
	ErrInvalidMessageID    = &AppError{Code: "INVALID_MESSAGE_ID", Message: "invalid message id", Status: http.StatusBadRequest}
	ErrUnauthorized        = &AppError{Code: "UNAUTHORIZED", Message: "invalid or missing apikey", Status: http.StatusUnauthorized}
	ErrRateLimitExceeded   = &AppError{Code: "RATE_LIMIT_EXCEEDED", Message: "rate limit exceeded, please try again later", Status: http.StatusTooManyRequests}
	ErrInternalServer      = &AppError{Code: "INTERNAL_ERROR", Message: "internal server error", Status: http.StatusInternalServerError}
)

func New(code, message string, status int) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Status:  status,
	}
}

func Respond(c *gin.Context, err *AppError) {
	c.JSON(err.Status, gin.H{
		"error": gin.H{
			"code":    err.Code,
			"message": err.Message,
		},
	})
}

func RespondWithMessage(c *gin.Context, err *AppError, message string) {
	c.JSON(err.Status, gin.H{
		"error": gin.H{
			"code":    err.Code,
			"message": message,
		},
	})
}

func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, gin.H{
		"error": gin.H{
			"code":    "BAD_REQUEST",
			"message": message,
		},
	})
}

func InternalError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, gin.H{
		"error": gin.H{
			"code":    "INTERNAL_ERROR",
			"message": message,
		},
	})
}
