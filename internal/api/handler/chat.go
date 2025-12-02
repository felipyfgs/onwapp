package handler

import (
	"net/http"

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
// @Router       /sessions/{name}/chats/{chatId}/archive [patch]
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

		Status: status,
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
// @Router       /sessions/{name}/chats/{chatId}/messages/{messageId} [delete]
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
// @Router       /sessions/{name}/chats/{chatId}/messages/{messageId} [patch]
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
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/chats/{chatId}/settings/disappearing [patch]
func (h *ChatHandler) SetDisappearingTimer(c *gin.Context) {
	name := c.Param("name")

	var req dto.DisappearingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	timer, ok := ParseDisappearingTimer(c, req.Timer)
	if !ok {
		return
	}

	if err := h.whatsappService.SetDisappearingTimer(c.Request.Context(), name, req.Phone, timer); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageOnlyResponse{Message: "timer set to " + req.Timer})
}

// RequestUnavailableMessage godoc
// @Summary      Request unavailable message
// @Description  Request WhatsApp to resend an unavailable message from phone storage
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        chatId path string true "Chat JID"
// @Param        messageId path string true "Message ID"
// @Param        body body dto.RequestUnavailableMessageRequest false "Optional sender JID for group messages"
// @Success      200 {object} dto.MessageResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/chats/{chatId}/messages/{messageId}/request [post]
func (h *ChatHandler) RequestUnavailableMessage(c *gin.Context) {
	name := c.Param("name")
	chatID := c.Param("chatId")
	messageID := c.Param("messageId")

	var req dto.RequestUnavailableMessageRequest
	_ = c.ShouldBindJSON(&req)

	resp, err := h.whatsappService.RequestUnavailableMessage(c.Request.Context(), name, chatID, req.SenderJID, messageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	id := resp.ID
	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "unavailable message request sent",
		ID:      &id,
	})
}
