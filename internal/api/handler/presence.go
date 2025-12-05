package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"onwapp/internal/api/dto"
	"onwapp/internal/service/wpp"
)

type PresenceHandler struct {
	wpp *wpp.Service
}

func NewPresenceHandler(wpp *wpp.Service) *PresenceHandler {
	return &PresenceHandler{wpp: wpp}
}

// SetPresence godoc
// @Summary      Set online presence
// @Description  Set online/offline presence status
// @Tags         presence
// @Accept       json
// @Produce      json
// @Param        session   path      string                true  "Session ID"
// @Param        body        body      dto.SetPresenceRequest true  "Presence data"
// @Success      200         {object}  dto.PresenceResponse
// @Failure      400         {object}  dto.ErrorResponse
// @Failure      401         {object}  dto.ErrorResponse
// @Failure      500         {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/presence [post]
func (h *PresenceHandler) SetPresence(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.SetPresenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.SendPresence(c.Request.Context(), sessionId, req.Available); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	status := "unavailable"
	if req.Available {
		status = "available"
	}

	c.JSON(http.StatusOK, dto.PresenceResponse{
		Status: status,
	})
}

// SetChatPresence godoc
// @Summary      Set chat presence (typing/recording)
// @Description  Set typing or recording presence in a chat
// @Tags         presence
// @Accept       json
// @Produce      json
// @Param        session   path      string                   true  "Session ID"
// @Param        chatId      path      string                   true  "Chat JID"
// @Param        body        body      dto.ChatPresenceRequest  true  "Chat presence data"
// @Success      200         {object}  dto.ChatPresenceResponse
// @Failure      400         {object}  dto.ErrorResponse
// @Failure      401         {object}  dto.ErrorResponse
// @Failure      500         {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/presence [post]
func (h *PresenceHandler) SetChatPresence(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.ChatPresenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.SendChatPresenceRaw(c.Request.Context(), sessionId, req.Phone, req.State, req.Media); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ChatPresenceResponse{
		State: req.State,
	})
}

// MarkRead godoc
// @Summary      Mark messages as read
// @Description  Mark messages as read in a chat
// @Tags         presence
// @Accept       json
// @Produce      json
// @Param        session   path      string              true  "Session ID"
// @Param        chatId      path      string              true  "Chat JID"
// @Param        body        body      dto.MarkReadRequest true  "Messages to mark"
// @Success      200         {object}  object
// @Failure      400         {object}  dto.ErrorResponse
// @Failure      401         {object}  dto.ErrorResponse
// @Failure      500         {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/markread [post]
func (h *PresenceHandler) MarkRead(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.MarkReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.MarkRead(c.Request.Context(), sessionId, req.Phone, req.MessageIDs); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// SubscribePresence godoc
// @Summary      Subscribe to contact presence
// @Description  Subscribe to receive presence updates from a contact
// @Tags         presence
// @Accept       json
// @Produce      json
// @Param        session   path      string                       true  "Session ID"
// @Param        phone       path      string                       true  "Phone number"
// @Param        body        body      dto.SubscribePresenceRequest true  "Subscribe data"
// @Success      200         {object}  object
// @Failure      400         {object}  dto.ErrorResponse
// @Failure      500         {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/presence/subscribe [post]
func (h *PresenceHandler) SubscribePresence(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.SubscribePresenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.SubscribePresence(c.Request.Context(), sessionId, req.Phone); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}
