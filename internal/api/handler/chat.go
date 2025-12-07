package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/types"

	"onwapp/internal/api/dto"
	"onwapp/internal/db"
	"onwapp/internal/model"
	"onwapp/internal/service"
	"onwapp/internal/service/wpp"
)

type ChatHandler struct {
	wpp                *wpp.Service
	database           *db.Database
	sessionService     *service.SessionService
	historySyncService *service.HistorySyncService
}

func NewChatHandler(wpp *wpp.Service, database *db.Database) *ChatHandler {
	return &ChatHandler{wpp: wpp, database: database}
}

func (h *ChatHandler) SetSessionService(s *service.SessionService) {
	h.sessionService = s
}

func (h *ChatHandler) SetHistorySyncService(s *service.HistorySyncService) {
	h.historySyncService = s
}

// saveDeleteUpdate saves a delete event to the database
func (h *ChatHandler) saveDeleteUpdate(ctx context.Context, sessionId, phone, messageID string) {
	if h.database == nil {
		return
	}

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		return
	}

	data, _ := json.Marshal(map[string]interface{}{
		"deletedBy": "user",
		"phone":     phone,
	})

	update := &model.MessageUpdate{
		SessionID: session.ID,
		MsgID:     messageID,
		Type:      model.UpdateTypeDelete,
		Actor:     phone,
		Data:      data,
		EventAt:   time.Now(),
	}

	h.database.MessageUpdates.Save(ctx, update)
}

// =============================================================================
// PRESENCE
// =============================================================================

// SetPresence godoc
// @Summary      Set online presence
// @Description  Set online/offline presence status
// @Tags         presence
// @Accept       json
// @Produce      json
// @Param        session   path      string                true  "Session ID"
// @Param        body      body      dto.SetPresenceRequest true  "Presence data"
// @Success      200       {object}  dto.PresenceResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/presence [post]
func (h *ChatHandler) SetPresence(c *gin.Context) {
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

	c.JSON(http.StatusOK, dto.PresenceResponse{Status: status})
}

// SubscribePresence godoc
// @Summary      Subscribe to contact presence
// @Description  Subscribe to receive presence updates from a contact
// @Tags         presence
// @Accept       json
// @Produce      json
// @Param        session   path      string                       true  "Session ID"
// @Param        body      body      dto.SubscribePresenceRequest true  "Subscribe data"
// @Success      200       {object}  object
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/presence/subscribe [post]
func (h *ChatHandler) SubscribePresence(c *gin.Context) {
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

// SetChatPresence godoc
// @Summary      Set chat presence (typing/recording)
// @Description  Set typing or recording presence in a chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        session   path      string                   true  "Session ID"
// @Param        body      body      dto.ChatPresenceRequest  true  "Chat presence data"
// @Success      200       {object}  dto.ChatPresenceResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/presence [post]
func (h *ChatHandler) SetChatPresence(c *gin.Context) {
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

	c.JSON(http.StatusOK, dto.ChatPresenceResponse{State: req.State})
}

// MarkRead godoc
// @Summary      Mark messages as read
// @Description  Mark messages as read in a chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        session   path      string              true  "Session ID"
// @Param        body      body      dto.MarkReadRequest true  "Messages to mark"
// @Success      200       {object}  object
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/markread [post]
func (h *ChatHandler) MarkRead(c *gin.Context) {
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

	// Mark chat as read in database (zero unread count)
	if h.database != nil && h.sessionService != nil {
		session, err := h.sessionService.Get(sessionId)
		if err == nil {
			chatJID := req.Phone
			if !strings.Contains(chatJID, "@") {
				// Check if it's a group (contains hyphen) or individual chat
				if strings.Contains(req.Phone, "-") {
					chatJID = req.Phone + "@g.us"
				} else {
					chatJID = req.Phone + "@s.whatsapp.net"
				}
			}
			_ = h.database.Chats.MarkAsRead(c.Request.Context(), session.ID, chatJID)
		}
	}

	c.JSON(http.StatusOK, gin.H{})
}

// =============================================================================
// CHAT ACTIONS
// =============================================================================

// MarkChatUnread godoc
// @Summary      Mark chat as unread
// @Description  Mark a WhatsApp chat as unread
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        session   path      string                    true  "Session ID"
// @Param        body      body      dto.MarkChatUnreadRequest true  "Chat data"
// @Success      200       {object}  dto.ChatActionResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
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
// @Param        session   path      string                 true  "Session ID"
// @Param        body      body      dto.ArchiveChatRequest true  "Archive data"
// @Success      200       {object}  dto.ChatActionResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
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

	c.JSON(http.StatusOK, dto.ChatActionResponse{Status: status})
}

// SetDisappearingTimer godoc
// @Summary      Set disappearing messages timer
// @Description  Set the disappearing messages timer for a chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        session   path      string                  true  "Session ID"
// @Param        body      body      dto.DisappearingRequest true  "Timer data"
// @Success      200       {object}  dto.MessageOnlyResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
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

// =============================================================================
// MESSAGE ACTIONS
// =============================================================================

// DeleteMessage godoc
// @Summary      Delete a message
// @Description  Delete a message from a chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        session   path      string                   true  "Session ID"
// @Param        body      body      dto.DeleteMessageRequest true  "Delete data"
// @Success      200       {object}  dto.SendResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
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
	
	// Save delete to database (even if WhatsApp returns error like 479 = already deleted)
	if h.database != nil && !req.ForMe {
		h.saveDeleteUpdate(c.Request.Context(), sessionId, req.Phone, req.MessageID)
	}

	if err != nil {
		// Error 479 means message was already deleted - treat as success
		if strings.Contains(err.Error(), "479") {
			c.JSON(http.StatusOK, dto.SendResponse{
				MessageID: req.MessageID,
				Timestamp: time.Now().Unix(),
			})
			return
		}
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
// @Param        session   path      string                 true  "Session ID"
// @Param        body      body      dto.EditMessageRequest true  "Edit data"
// @Success      200       {object}  dto.SendResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
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

// RequestUnavailableMessage godoc
// @Summary      Request unavailable message
// @Description  Request WhatsApp to resend an unavailable message from phone storage
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        session   path      string                              true  "Session ID"
// @Param        body      body      dto.RequestUnavailableMessageRequest true "Request data"
// @Success      200       {object}  dto.MessageResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
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

// =============================================================================
// CALL
// =============================================================================

// RejectCall godoc
// @Summary      Reject incoming call
// @Description  Reject an incoming WhatsApp call
// @Tags         call
// @Accept       json
// @Produce      json
// @Param        session   path      string                 true  "Session ID"
// @Param        body      body      dto.RejectCallRequest  true  "Call data"
// @Success      200       {object}  object
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/call/reject [post]
func (h *ChatHandler) RejectCall(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.RejectCallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.RejectCall(c.Request.Context(), sessionId, req.CallFrom, req.CallID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// =============================================================================
// CHAT HISTORY (synced data)
// =============================================================================

// GetAllChats godoc
// @Summary      Get all chats
// @Description  Get list of chats from synced data with pagination and optional filters
// @Tags         chat
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        limit     query     int     false "Max results (default: 100, max: 500)"
// @Param        offset    query     int     false "Offset for pagination (default: 0)"
// @Param        unread    query     bool    false "Filter only unread chats (default: false)"
// @Success      200       {array}   dto.ChatResponse
// @Failure      404       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/list [get]
func (h *ChatHandler) GetAllChats(c *gin.Context) {
	sessionId := c.Param("session")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	unreadOnly := c.Query("unread") == "true"

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	chats, err := h.historySyncService.GetAllChatsWithLastMessage(c.Request.Context(), session.ID, limit, offset, unreadOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Helper to get contact name from WhatsApp ContactStore
	// Priority: FullName > FirstName > PushName > BusinessName (same as Chatwoot)
	getContactName := func(jid string) string {
		if session.Client == nil || session.Client.Store == nil || session.Client.Store.Contacts == nil {
			return ""
		}
		parsedJID, parseErr := types.ParseJID(jid)
		if parseErr != nil {
			return ""
		}
		contact, contactErr := session.Client.Store.Contacts.GetContact(c.Request.Context(), parsedJID)
		if contactErr != nil || !contact.Found {
			return ""
		}
		if contact.FullName != "" {
			return contact.FullName
		}
		if contact.FirstName != "" {
			return contact.FirstName
		}
		if contact.PushName != "" {
			return contact.PushName
		}
		return contact.BusinessName
	}

	// Helper to get group name from WhatsApp
	// Note: Avatar is fetched separately via /group/avatar endpoint to avoid slow list loading
	getGroupName := func(groupJID string) string {
		if session.Client == nil {
			return ""
		}
		parsedJID, parseErr := types.ParseJID(groupJID)
		if parseErr != nil {
			return ""
		}
		groupInfo, err := session.Client.GetGroupInfo(c.Request.Context(), parsedJID)
		if err == nil && groupInfo != nil {
			return groupInfo.Name
		}
		return ""
	}

	response := make([]dto.ChatResponse, 0, len(chats))
	for _, chatData := range chats {
		chat := chatData.Chat
		isGroup := len(chat.ChatJID) > 12 && chat.ChatJID[len(chat.ChatJID)-5:] == "@g.us"

		var contactName string

		if isGroup {
			// Get group name from WhatsApp (avatar is fetched separately via /group/avatar)
			contactName = getGroupName(chat.ChatJID)
		} else {
			// Get contact name from WhatsApp contacts
			contactName = getContactName(chat.ChatJID)
		}

		resp := dto.ChatResponse{
			JID:                 chat.ChatJID,
			Name:                chat.Name,
			ContactName:         contactName,
			UnreadCount:         chat.UnreadCount,
			MarkedAsUnread:      chat.MarkedAsUnread,
			EphemeralExpiration: chat.EphemeralExpiration,
			ConversationTS:      chat.ConversationTimestamp,
			ReadOnly:            chat.ReadOnly,
			Suspended:           chat.Suspended,
			Locked:              chat.Locked,
			IsGroup:             isGroup,
			Archived:            chatData.Archived,
			Pinned:              chatData.Pinned,
			Muted:               chatData.Muted,
		}

		// Add last message if available
		if chatData.LastMessage != nil {
			resp.LastMessage = &dto.LastMessageInfo{
				Content:   chatData.LastMessage.Content,
				Timestamp: chatData.LastMessage.Timestamp,
				FromMe:    chatData.LastMessage.FromMe,
				Type:      chatData.LastMessage.Type,
				MediaType: chatData.LastMessage.MediaType,
				Status:    chatData.LastMessage.Status,
				SenderJID: chatData.LastMessage.SenderJID,
				PushName:  chatData.LastMessage.PushName,
			}
		}

		response = append(response, resp)
	}

	c.JSON(http.StatusOK, response)
}

// GetChatMessages godoc
// @Summary      Get chat messages
// @Description  Get messages from a specific chat with pagination
// @Tags         chat
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        chatId    query     string  true  "Chat JID"
// @Param        limit     query     int     false "Max results (default: 50, max: 200)"
// @Param        offset    query     int     false "Offset for pagination (default: 0)"
// @Success      200       {array}   dto.ChatMessageResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      404       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/messages [get]
func (h *ChatHandler) GetChatMessages(c *gin.Context) {
	sessionId := c.Param("session")
	chatID := c.Query("chatId")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "chatId query parameter is required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	messages, err := h.historySyncService.GetMessagesByChat(c.Request.Context(), session.ID, chatID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Get deleted message IDs
	msgIDs := make([]string, len(messages))
	for i, msg := range messages {
		msgIDs[i] = msg.MsgId
	}
	deletedMsgs := make(map[string]bool)
	if h.database != nil && len(msgIDs) > 0 {
		deletedMsgs, _ = h.database.MessageUpdates.GetDeletedMsgIDs(c.Request.Context(), session.ID, msgIDs)
	}

	response := make([]dto.ChatMessageResponse, 0, len(messages))
	for _, msg := range messages {
		isDeleted := deletedMsgs[msg.MsgId]
		resp := dto.ChatMessageResponse{
			MsgId:        msg.MsgId,
			ChatJID:      msg.ChatJID,
			SenderJID:    msg.SenderJID,
			PushName:     msg.PushName,
			Timestamp:    msg.Timestamp.Unix(),
			Type:         msg.Type,
			MediaType:    msg.MediaType,
			Content:      msg.Content,
			FromMe:       msg.FromMe,
			IsGroup:      msg.IsGroup,
			QuotedID:     msg.QuotedID,
			QuotedSender: msg.QuotedSender,
			Status:       string(msg.Status),
			Deleted:      isDeleted,
		}
		// Clear content for deleted messages
		if isDeleted {
			resp.Content = ""
			resp.MediaType = ""
		}
		response = append(response, resp)
	}

	c.JSON(http.StatusOK, response)
}

// GetChatInfo godoc
// @Summary      Get chat info
// @Description  Get detailed chat information from synced data
// @Tags         chat
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        chatId    query     string  true  "Chat JID"
// @Success      200       {object}  dto.ChatResponse
// @Failure      400       {object}  dto.ErrorResponse
// @Failure      404       {object}  dto.ErrorResponse
// @Failure      500       {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/chat/info [get]
func (h *ChatHandler) GetChatInfo(c *gin.Context) {
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
