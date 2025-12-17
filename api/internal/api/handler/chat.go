package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mau.fi/whatsmeow"
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

func (h *ChatHandler) saveDeleteUpdate(ctx context.Context, sessionId, phone, messageID string) error {
	if h.database == nil {
		return fmt.Errorf("database not initialized")
	}

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	data, err := json.Marshal(map[string]interface{}{
		"deletedBy": "user",
		"phone":     phone,
	})
	if err != nil {
		return fmt.Errorf("failed to marshal delete data: %w", err)
	}

	update := &model.MessageUpdate{
		SessionID: session.ID,
		MsgID:     messageID,
		Type:      model.UpdateTypeDelete,
		Actor:     phone,
		Data:      data,
		EventAt:   time.Now(),
	}

	_, err = h.database.MessageUpdates.Save(ctx, update)
	if err != nil {
		return fmt.Errorf("failed to save message update: %w", err)
	}

	return nil
}

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

	chatJID := req.Phone
	if !strings.Contains(chatJID, "@") {
		if strings.Contains(req.Phone, "-") {
			chatJID = req.Phone + "@g.us"
		} else {
			chatJID = req.Phone + "@s.whatsapp.net"
		}
	}

	if len(req.MessageIDs) > 0 {
		if err := h.wpp.MarkRead(c.Request.Context(), sessionId, req.Phone, req.MessageIDs); err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
			return
		}
	}

	if h.database != nil && h.sessionService != nil {
		session, err := h.sessionService.Get(sessionId)
		if err != nil {
			log.Error().Err(err).Str("sessionId", sessionId).Msg("failed to get session for markRead")
		} else {
			log.Debug().Str("sessionID", session.ID).Str("chatJID", chatJID).Msg("marking chat as read in database")
			if err := h.database.Chats.MarkAsRead(c.Request.Context(), session.ID, chatJID); err != nil {
				log.Warn().Err(err).Str("chatJID", chatJID).Msg("failed to mark chat as read in database")
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{})
}

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

	timer, err := ParseDisappearingTimer(c, req.Timer)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.SetDisappearingTimer(c.Request.Context(), sessionId, req.Phone, timer); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageOnlyResponse{Message: "timer set to " + req.Timer})
}

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

	if h.database != nil && !req.ForMe {
		if saveErr := h.saveDeleteUpdate(c.Request.Context(), sessionId, req.Phone, req.MessageID); saveErr != nil {
			log.Warn().Err(saveErr).Str("messageID", req.MessageID).Msg("failed to save delete update to database")
		}
	}

	if err != nil {
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

func isGroupJID(jid string) bool {
	return len(jid) > 5 && jid[len(jid)-5:] == "@g.us"
}

func (h *ChatHandler) batchFetchContactNames(ctx context.Context, client *whatsmeow.Client, jids []string) map[string]string {
	names := make(map[string]string, len(jids))

	if client == nil || client.Store == nil || client.Store.Contacts == nil || len(jids) == 0 {
		return names
	}

	for _, jid := range jids {
		parsedJID, err := types.ParseJID(jid)
		if err != nil {
			continue
		}

		contact, err := client.Store.Contacts.GetContact(ctx, parsedJID)
		if err != nil || !contact.Found {
			continue
		}

		if contact.FullName != "" {
			names[jid] = contact.FullName
		} else if contact.FirstName != "" {
			names[jid] = contact.FirstName
		} else if contact.PushName != "" {
			names[jid] = contact.PushName
		} else if contact.BusinessName != "" {
			names[jid] = contact.BusinessName
		}
	}

	return names
}

func (h *ChatHandler) batchFetchGroupNames(ctx context.Context, client *whatsmeow.Client, jids []string) map[string]string {
	names := make(map[string]string, len(jids))

	if client == nil || len(jids) == 0 {
		return names
	}

	for _, jid := range jids {
		parsedJID, err := types.ParseJID(jid)
		if err != nil {
			continue
		}

		groupInfo, err := client.GetGroupInfo(ctx, parsedJID)
		if err == nil && groupInfo != nil && groupInfo.Name != "" {
			names[jid] = groupInfo.Name
		}
	}

	return names
}

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

	pagination, err := ParseChatsPagination(c)
	if err != nil {
		respondBadRequest(c, "invalid pagination", err)
		return
	}

	unreadOnly := c.Query("unread") == "true"

	session, sessionErr := h.sessionService.Get(sessionId)
	if sessionErr != nil {
		respondNotFound(c, "session not found")
		return
	}

	chats, err := h.historySyncService.GetAllChatsWithLastMessage(c.Request.Context(), session.ID, pagination.Limit, pagination.Offset, unreadOnly)
	if err != nil {
		respondInternalError(c, "failed to fetch chats", err)
		return
	}

	contactJIDs := make([]string, 0, len(chats))
	groupJIDs := make([]string, 0, len(chats))

	for _, chatData := range chats {
		if isGroupJID(chatData.Chat.ChatJID) {
			groupJIDs = append(groupJIDs, chatData.Chat.ChatJID)
		} else {
			contactJIDs = append(contactJIDs, chatData.Chat.ChatJID)
		}
	}

	contactNames := h.batchFetchContactNames(c.Request.Context(), session.Client, contactJIDs)
	groupNames := h.batchFetchGroupNames(c.Request.Context(), session.Client, groupJIDs)

	response := make([]dto.ChatResponse, 0, len(chats))
	for _, chatData := range chats {
		chat := chatData.Chat
		isGroup := isGroupJID(chat.ChatJID)

		var contactName string
		if isGroup {
			contactName = groupNames[chat.ChatJID]
		} else {
			contactName = contactNames[chat.ChatJID]
		}

		resp := dto.ChatResponse{
			ID:                  chat.ID,
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

	respondSuccess(c, response)
}

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
		respondBadRequest(c, "chatId query parameter is required", nil)
		return
	}

	pagination, err := ParseMessagesPagination(c)
	if err != nil {
		respondBadRequest(c, "invalid pagination", err)
		return
	}

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		respondNotFound(c, "session not found")
		return
	}

	messages, err := h.historySyncService.GetMessagesByChat(c.Request.Context(), session.ID, chatID, pagination.Limit, pagination.Offset)
	if err != nil {
		respondInternalError(c, "failed to fetch messages", err)
		return
	}

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
		if isDeleted {
			resp.Content = ""
			resp.MediaType = ""
		}
		response = append(response, resp)
	}

	respondSuccess(c, response)
}

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
		ID:                  chat.ID,
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
