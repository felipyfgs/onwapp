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

func validateSessionID(c *gin.Context) (string, error) {
	sessionID := c.Param("session")
	if sessionID == "" {
		return "", errors.New(errSessionIDRequired)
	}
	return sessionID, nil
}

func (h *StatusHandler) parseJSONStatus(c *gin.Context) (text, image string, err error) {
	var req dto.SendStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		return "", "", fmt.Errorf("invalid JSON: %w", err)
	}
	return req.Text, req.Image, nil
}

func (h *StatusHandler) parseMultipartStatus(c *gin.Context) (text, image string, err error) {
	text = c.PostForm("text")

	if _, _, err := c.Request.FormFile("file"); err == nil {
		return "", "", errors.New(errImageStatusNotSupported)
	}

	return text, "", nil
}

func (h *StatusHandler) parseStatusInput(c *gin.Context) (text, image string, err error) {
	if IsMultipartRequest(c) {
		return h.parseMultipartStatus(c)
	}
	return h.parseJSONStatus(c)
}

func (h *StatusHandler) buildStatusMessage(text, image string) (*waE2E.Message, error) {
	if text == "" && image == "" {
		return nil, errors.New(errTextOrImageRequired)
	}

	if text != "" {
		return &waE2E.Message{
			Conversation: proto.String(text),
		}, nil
	}

	return nil, errors.New(errImageStatusNotSupported)
}

// @Summary      Post a story
// @Description  Post a text status update (visible to contacts). Supports JSON with text field or multipart/form-data. Note: Image status currently not supported.
// @Tags         status
// @Accept       json,mpfd
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendStatusRequest false  "Story data (JSON: text field)"
// @Param        text  formData  string  false  "Text content (multipart form-data)"
// @Success      200    {object}  dto.SendResponse  "Status posted successfully"
// @Failure      400    {object}  dto.ErrorResponse  "Invalid input or missing text"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to send status"
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

// @Summary      Get status privacy settings
// @Description  Get who can see your status updates (contacts, groups, everyone)
// @Tags         status
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.StatusPrivacyResponse  "Privacy settings"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to get privacy settings"
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

	respondSuccess(c, gin.H{
		"privacy": privacySettings,
	})
}
