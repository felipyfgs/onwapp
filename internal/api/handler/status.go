package handler

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"google.golang.org/protobuf/proto"

	"onwapp/internal/api/dto"
	"onwapp/internal/service/wpp"
)

const (
	errImageStatusNotSupported = "image status not yet supported - use text status"
	errTextOrImageRequired     = "text or image required"
	errSessionIDRequired       = "session ID is required"
	errStatusSendFailed        = "failed to send status"
	errStatusPrivacyFailed     = "failed to get status privacy"
	statusContextTimeout       = 30 * time.Second
)

type StatusHandler struct {
	wpp *wpp.Service
}

func NewStatusHandler(wpp *wpp.Service) *StatusHandler {
	return &StatusHandler{wpp: wpp}
}

// validateSessionID validates and returns the session ID from URL params
func validateSessionID(c *gin.Context) (string, error) {
	sessionID := c.Param("session")
	if sessionID == "" {
		return "", errors.New(errSessionIDRequired)
	}
	return sessionID, nil
}

// parseJSONStatus parses status data from JSON request
func (h *StatusHandler) parseJSONStatus(c *gin.Context) (text, image string, err error) {
	var req dto.SendStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		return "", "", fmt.Errorf("invalid JSON: %w", err)
	}
	return req.Text, req.Image, nil
}

// parseMultipartStatus parses status data from multipart form request
func (h *StatusHandler) parseMultipartStatus(c *gin.Context) (text, image string, err error) {
	text = c.PostForm("text")

	// Check if file was provided
	if _, _, err := c.Request.FormFile("file"); err == nil {
		return "", "", errors.New(errImageStatusNotSupported)
	}

	return text, "", nil
}

// parseStatusInput routes to the appropriate parser based on content type
func (h *StatusHandler) parseStatusInput(c *gin.Context) (text, image string, err error) {
	if IsMultipartRequest(c) {
		return h.parseMultipartStatus(c)
	}
	return h.parseJSONStatus(c)
}

// buildStatusMessage constructs a WhatsApp status message from input
func (h *StatusHandler) buildStatusMessage(text, image string) (*waE2E.Message, error) {
	if text == "" && image == "" {
		return nil, errors.New(errTextOrImageRequired)
	}

	if text != "" {
		return &waE2E.Message{
			Conversation: proto.String(text),
		}, nil
	}

	// Image status not yet supported
	return nil, errors.New(errImageStatusNotSupported)
}

// SendStory godoc
// @Summary      Post a story
// @Description  Post a text or media story (status update visible to contacts). Supports JSON with base64/URL or multipart/form-data.
// @Tags         status
// @Accept       json,mpfd
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendStatusRequest false  "Story data (JSON)"
// @Param        text  formData  string  false  "Text content (form-data)"
// @Param        file  formData  file  false  "Image file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/status/send [post]
func (h *StatusHandler) SendStory(c *gin.Context) {
	sessionID, err := validateSessionID(c)
	if err != nil {
		respondBadRequest(c, errSessionIDRequired, err)
		return
	}

	text, image, err := h.parseStatusInput(c)
	if err != nil {
		respondBadRequest(c, "invalid input", err)
		return
	}

	statusMessage, err := h.buildStatusMessage(text, image)
	if err != nil {
		respondBadRequest(c, "invalid status message", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), statusContextTimeout)
	defer cancel()

	sendResult, err := h.wpp.SendStatus(ctx, sessionID, statusMessage)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			respondGatewayTimeout(c, "status send timeout", err)
			return
		}
		respondInternalError(c, errStatusSendFailed, err)
		return
	}

	respondSuccess(c, dto.SendResponse{
		MessageID: sendResult.ID,
		Timestamp: sendResult.Timestamp.Unix(),
	})
}

// GetStatusPrivacy godoc
// @Summary      Get status privacy settings
// @Description  Get who can see your status updates
// @Tags         status
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.StatusPrivacyResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/status/privacy [get]
func (h *StatusHandler) GetStatusPrivacy(c *gin.Context) {
	sessionID, err := validateSessionID(c)
	if err != nil {
		respondBadRequest(c, errSessionIDRequired, err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), statusContextTimeout)
	defer cancel()

	privacySettings, err := h.wpp.GetStatusPrivacy(ctx, sessionID)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			respondGatewayTimeout(c, "status privacy fetch timeout", err)
			return
		}
		respondInternalError(c, errStatusPrivacyFailed, err)
		return
	}

	respondSuccess(c, dto.StatusPrivacyResponse{
		Privacy: privacySettings,
	})
}
