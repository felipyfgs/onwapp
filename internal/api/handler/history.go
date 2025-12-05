package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
	"zpwoot/internal/service/wpp"
)

type HistoryHandler struct {
	sessionService     *service.SessionService
	wpp                *wpp.Service
	historySyncService *service.HistorySyncService
}

func NewHistoryHandler(
	sessionService *service.SessionService,
	wppSvc *wpp.Service,
	historySyncService *service.HistorySyncService,
) *HistoryHandler {
	return &HistoryHandler{
		sessionService:     sessionService,
		wpp:                wppSvc,
		historySyncService: historySyncService,
	}
}

// RequestHistorySync godoc
// @Summary Request history sync
// @Description Request WhatsApp to send history sync data from the phone
// @Tags         history
// @Accept json
// @Produce json
// @Param        session   path      string  true  "Session ID"
// @Param request body dto.HistorySyncRequest false "Sync options"
// @Success 200 {object} dto.MessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security Authorization
// @Router       /{session}/history/sync [post]
func (h *HistoryHandler) RequestHistorySync(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.HistorySyncRequest
	_ = c.ShouldBindJSON(&req)

	resp, err := h.wpp.RequestHistorySync(c.Request.Context(), sessionId, req.Count)
	if err != nil {
		if err.Error() == "session "+sessionId+" not found" || err.Error() == "session not found" {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "history sync request sent",
		ID:      &resp.ID,
	})
}

// GetUnreadChats godoc
// @Summary Get unread chats
// @Description Get list of chats with unread messages from history sync data
// @Tags         history
// @Produce json
// @Param        session   path      string  true  "Session ID"
// @Success 200 {array} dto.ChatResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security Authorization
// @Router       /{session}/history/chats/unread [get]
func (h *HistoryHandler) GetUnreadChats(c *gin.Context) {
	sessionId := c.Param("session")

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	chats, err := h.historySyncService.GetUnreadChats(c.Request.Context(), session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.ChatResponse, 0, len(chats))
	for _, chat := range chats {
		response = append(response, dto.ChatResponse{
			JID:                 chat.ChatJID,
			Name:                chat.Name,
			UnreadCount:         chat.UnreadCount,
			MarkedAsUnread:      chat.MarkedAsUnread,
			EphemeralExpiration: chat.EphemeralExpiration,
			ConversationTS:      chat.ConversationTimestamp,
		})
	}

	c.JSON(http.StatusOK, response)
}

// GetChatInfo godoc
// @Summary Get chat info
// @Description Get detailed chat information from history sync data
// @Tags         history
// @Produce json
// @Param        session   path      string  true  "Session ID"
// @Param        chatId  query string true "Chat JID"
// @Success 200 {object} dto.ChatResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security Authorization
// @Router       /{session}/history/chat [get]
func (h *HistoryHandler) GetChatInfo(c *gin.Context) {
	sessionId := c.Param("session")
	chatID := c.Query("chatId")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "chatId query parameter is required"})
		return
	}

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	chat, err := h.historySyncService.GetChatByJID(c.Request.Context(), session.ID, chatID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	if chat == nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "chat not found"})
		return
	}

	c.JSON(http.StatusOK, dto.ChatResponse{
		JID:                 chat.ChatJID,
		Name:                chat.Name,
		UnreadCount:         chat.UnreadCount,
		MarkedAsUnread:      chat.MarkedAsUnread,
		EphemeralExpiration: chat.EphemeralExpiration,
		ConversationTS:      chat.ConversationTimestamp,
		ReadOnly:            chat.ReadOnly,
		Suspended:           chat.Suspended,
		Locked:              chat.Locked,
	})
}
