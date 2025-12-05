package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"onwapp/internal/api/dto"
	"onwapp/internal/service/wpp"
)

type ChatHandler struct {
	wpp *wpp.Service
}

func NewChatHandler(wpp *wpp.Service) *ChatHandler {
	return &ChatHandler{wpp: wpp}
}

// MarkChatUnread godoc
// @Summary      Mark chat as unread
// @Description  Mark a WhatsApp chat as unread
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.MarkChatUnreadRequest true  "Chat data"
// @Success      200    {object}  dto.ChatActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/unread [post]
func (h *ChatHandler) MarkChatUnread(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.MarkChatUnreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.MarkChatUnread(c.Request.Context(), sessionId, req.Phone); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ChatActionResponse{Status: "marked_unread"})
}

// ArchiveChat godoc
// @Summary      Archive or unarchive a chat
// @Description  Archive or unarchive a WhatsApp chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.ArchiveChatRequest true  "Archive data"
// @Success      200    {object}  dto.ChatActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/archive [patch]
func (h *ChatHandler) ArchiveChat(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.ArchiveChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.ArchiveChat(c.Request.Context(), sessionId, req.Phone, req.Archive); err != nil {
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
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.DeleteMessageRequest true  "Delete data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/delete [post]
func (h *ChatHandler) DeleteMessage(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.DeleteMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.DeleteMessage(c.Request.Context(), sessionId, req.Phone, req.MessageID, req.ForMe)
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
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.EditMessageRequest true  "Edit data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/edit [post]
func (h *ChatHandler) EditMessage(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.EditMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.EditMessage(c.Request.Context(), sessionId, req.Phone, req.MessageID, req.NewText)
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
// @Param        session   path      string  true  "Session ID"
// @Param        body body dto.DisappearingRequest true "Timer data"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/disappearing [patch]
func (h *ChatHandler) SetDisappearingTimer(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.DisappearingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	timer, ok := ParseDisappearingTimer(c, req.Timer)
	if !ok {
		return
	}

	if err := h.wpp.SetDisappearingTimer(c.Request.Context(), sessionId, req.Phone, timer); err != nil {
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
// @Param        session   path      string  true  "Session ID"
// @Param        chatId path string true "Chat JID"
// @Param        messageId path string true "Message ID"
// @Param        body body dto.RequestUnavailableMessageRequest false "Optional sender JID for group messages"
// @Success      200 {object} dto.MessageResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/request-unavailable [post]
func (h *ChatHandler) RequestUnavailableMessage(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.RequestUnavailableMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.RequestUnavailableMessage(c.Request.Context(), sessionId, req.ChatID, req.SenderJID, req.MessageID)
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
