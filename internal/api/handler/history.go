package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type HistoryHandler struct {
	sessionService     *service.SessionService
	whatsappService    *service.WhatsAppService
	historySyncService *service.HistorySyncService
}

func NewHistoryHandler(
	sessionService *service.SessionService,
	whatsappService *service.WhatsAppService,
	historySyncService *service.HistorySyncService,
) *HistoryHandler {
	return &HistoryHandler{
		sessionService:     sessionService,
		whatsappService:    whatsappService,
		historySyncService: historySyncService,
	}
}

// RequestHistorySync godoc
// @Summary Request history sync
// @Description Request WhatsApp to send history sync data from the phone
// @Tags history
// @Accept json
// @Produce json
// @Param        sessionId   path      string  true  "Session ID"
// @Param request body dto.HistorySyncRequest false "Sync options"
// @Success 200 {object} dto.MessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router       /sessions/{sessionId}/history/sync [post]
func (h *HistoryHandler) RequestHistorySync(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.HistorySyncRequest
	_ = c.ShouldBindJSON(&req)

	resp, err := h.whatsappService.RequestHistorySync(c.Request.Context(), sessionId, req.Count)
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

// GetSyncProgress godoc
// @Summary Get history sync progress
// @Description Get the current progress of history sync operations
// @Tags history
// @Produce json
// @Param        sessionId   path      string  true  "Session ID"
// @Success 200 {array} dto.SyncProgressResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router       /sessions/{sessionId}/history/progress [get]
func (h *HistoryHandler) GetSyncProgress(c *gin.Context) {
	sessionId := c.Param("sessionId")

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	progress, err := h.historySyncService.GetSyncProgress(c.Request.Context(), session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.SyncProgressResponse, 0, len(progress))
	for _, p := range progress {
		resp := dto.SyncProgressResponse{
			SyncType:          string(p.SyncType),
			Status:            string(p.Status),
			Progress:          p.Progress,
			ProcessedChunks:   p.ProcessedChunks,
			TotalMessages:     p.TotalMessages,
			ProcessedMessages: p.ProcessedMessages,
			TotalChats:        p.TotalChats,
			ProcessedChats:    p.ProcessedChats,
			Errors:            p.Errors,
			StartedAt:         p.StartedAt,
			CompletedAt:       p.CompletedAt,
		}
		if p.TotalChunks != nil {
			resp.TotalChunks = *p.TotalChunks
		}
		response = append(response, resp)
	}

	c.JSON(http.StatusOK, response)
}

// GetUnreadChats godoc
// @Summary Get unread chats
// @Description Get list of chats with unread messages from history sync data
// @Tags history
// @Produce json
// @Param        sessionId   path      string  true  "Session ID"
// @Success 200 {array} dto.ChatResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router       /sessions/{sessionId}/history/chats/unread [get]
func (h *HistoryHandler) GetUnreadChats(c *gin.Context) {
	sessionId := c.Param("sessionId")

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
// @Tags history
// @Produce json
// @Param        sessionId   path      string  true  "Session ID"
// @Param chatId path string true "Chat JID"
// @Success 200 {object} dto.ChatResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router       /sessions/{sessionId}/history/chats/{chatId} [get]
func (h *HistoryHandler) GetChatInfo(c *gin.Context) {
	sessionId := c.Param("sessionId")
	chatID := c.Param("chatId")

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

// GetGroupPastParticipants godoc
// @Summary Get group past participants
// @Description Get past participants of a group from history sync data
// @Tags history
// @Produce json
// @Param        sessionId   path      string  true  "Session ID"
// @Param groupId path string true "Group JID"
// @Success 200 {array} dto.PastParticipantResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router       /sessions/{sessionId}/history/groups/{groupId}/participants/past [get]
func (h *HistoryHandler) GetGroupPastParticipants(c *gin.Context) {
	sessionId := c.Param("sessionId")
	groupID := c.Param("groupId")

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	participants, err := h.historySyncService.GetGroupPastParticipants(c.Request.Context(), session.ID, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.PastParticipantResponse, 0, len(participants))
	for _, p := range participants {
		reason := "LEFT"
		if p.LeaveReason == 1 {
			reason = "REMOVED"
		}
		response = append(response, dto.PastParticipantResponse{
			UserJID:        p.UserJID,
			LeaveReason:    reason,
			LeaveTimestamp: p.LeaveTimestamp,
		})
	}

	c.JSON(http.StatusOK, response)
}

// GetTopStickers godoc
// @Summary Get top stickers
// @Description Get most used stickers from history sync data
// @Tags history
// @Produce json
// @Param        sessionId   path      string  true  "Session ID"
// @Param limit query int false "Number of stickers to return" default(20)
// @Success 200 {array} dto.StickerResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security ApiKeyAuth
// @Router       /sessions/{sessionId}/history/stickers [get]
func (h *HistoryHandler) GetTopStickers(c *gin.Context) {
	sessionId := c.Param("sessionId")
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	stickers, err := h.historySyncService.GetTopStickers(c.Request.Context(), session.ID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.StickerResponse, 0, len(stickers))
	for _, s := range stickers {
		response = append(response, dto.StickerResponse{
			DirectPath: s.WADirectPath,
			MimeType:   s.MimeType,
			FileSize:   s.FileSize,
			Width:      s.Width,
			Height:     s.Height,
			IsLottie:   s.IsLottie,
			IsAvatar:   s.IsAvatar,
			Weight:     s.Weight,
			LastUsedAt: s.LastUsedAt,
		})
	}

	c.JSON(http.StatusOK, response)
}

func parseInt(s string) (int, error) {
	var i int
	_, err := fmt.Sscanf(s, "%d", &i)
	return i, err
}
