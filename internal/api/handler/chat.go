package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type ChatHandler struct {
	whatsappService *service.WhatsAppService
}

func NewChatHandler(whatsappService *service.WhatsAppService) *ChatHandler {
	return &ChatHandler{whatsappService: whatsappService}
}

// ArchiveChat godoc
// @Summary      Archive or unarchive a chat
// @Description  Archive or unarchive a WhatsApp chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        name   path      string                 true  "Session name"
// @Param        body   body      dto.ArchiveChatRequest true  "Archive data"
// @Success      200    {object}  dto.ChatActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/chats/{chatId}/archive [patch]
func (h *ChatHandler) ArchiveChat(c *gin.Context) {
	name := c.Param("name")

	var req dto.ArchiveChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.ArchiveChat(c.Request.Context(), name, req.Phone, req.Archive); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	status := "unarchived"
	if req.Archive {
		status = "archived"
	}

	c.JSON(http.StatusOK, dto.ChatActionResponse{
		Success: true,
		Status:  status,
	})
}

// DeleteMessage godoc
// @Summary      Delete a message
// @Description  Delete a message from a chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        name   path      string                   true  "Session name"
// @Param        body   body      dto.DeleteMessageRequest true  "Delete data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/chats/{chatId}/messages/{messageId} [delete]
func (h *ChatHandler) DeleteMessage(c *gin.Context) {
	name := c.Param("name")

	var req dto.DeleteMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.DeleteMessage(c.Request.Context(), name, req.Phone, req.MessageID, req.ForMe)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{
		Success:   true,
		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// EditMessage godoc
// @Summary      Edit a message
// @Description  Edit a previously sent message
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        name   path      string                 true  "Session name"
// @Param        body   body      dto.EditMessageRequest true  "Edit data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/chats/{chatId}/messages/{messageId} [patch]
func (h *ChatHandler) EditMessage(c *gin.Context) {
	name := c.Param("name")

	var req dto.EditMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.EditMessage(c.Request.Context(), name, req.Phone, req.MessageID, req.NewText)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{
		Success:   true,
		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SetDisappearingTimer godoc
// @Summary      Set disappearing messages timer
// @Description  Set the disappearing messages timer for a chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        body body dto.DisappearingRequest true "Timer data"
// @Success      200 {object} dto.SuccessResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/chats/{chatId}/settings/disappearing [patch]
func (h *ChatHandler) SetDisappearingTimer(c *gin.Context) {
	name := c.Param("name")

	var req dto.DisappearingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var timer time.Duration
	switch req.Timer {
	case "24h":
		timer = 24 * time.Hour
	case "7d":
		timer = 7 * 24 * time.Hour
	case "90d":
		timer = 90 * 24 * time.Hour
	case "off", "0":
		timer = 0
	default:
		parsed, err := time.ParseDuration(req.Timer)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid timer format. Use: 24h, 7d, 90d, off, or Go duration"})
			return
		}
		timer = parsed
	}

	if err := h.whatsappService.SetDisappearingTimer(c.Request.Context(), name, req.Phone, timer); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Message: "timer set to " + req.Timer})
}
