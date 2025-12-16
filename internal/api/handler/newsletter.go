package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/types"

	"onwapp/internal/api/dto"
	"onwapp/internal/service/wpp"
)

type NewsletterHandler struct {
	wpp *wpp.Service
}

func NewNewsletterHandler(wpp *wpp.Service) *NewsletterHandler {
	return &NewsletterHandler{wpp: wpp}
}

// @Summary      Create a newsletter/channel
// @Description  Create a new WhatsApp newsletter/channel. Returns newsletter JID and basic info.
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.CreateNewsletterRequest true  "Newsletter data (name, description, optional picture)"
// @Success      200    {object}  dto.NewsletterResponse
// @Failure      400    {object}  dto.ErrorResponse  "Invalid request data"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to create newsletter"
// @Security     Authorization
// @Router       /{session}/newsletter/create [post]
func (h *NewsletterHandler) CreateNewsletter(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.CreateNewsletterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	newsletter, err := h.wpp.CreateNewsletter(c.Request.Context(), sessionId, req.Name, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": newsletter,
	})
}

// @Summary      Follow a newsletter
// @Description  Follow/subscribe to a WhatsApp newsletter
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterActionRequest true  "Newsletter JID"
// @Success      200    {object}  dto.NewsletterActionResponse
// @Failure      400    {object}  dto.ErrorResponse  "Invalid request"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to follow newsletter"
// @Security     Authorization
// @Router       /{session}/newsletter/follow [post]
func (h *NewsletterHandler) FollowNewsletter(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.NewsletterActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.FollowNewsletter(c.Request.Context(), sessionId, req.NewsletterJID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// @Summary      Unfollow a newsletter
// @Description  Unfollow/unsubscribe from a WhatsApp newsletter
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterActionRequest true  "Newsletter JID"
// @Success      200    {object}  dto.NewsletterActionResponse
// @Failure      400    {object}  dto.ErrorResponse  "Invalid request"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to unfollow newsletter"
// @Security     Authorization
// @Router       /{session}/newsletter/unfollow [post]
func (h *NewsletterHandler) UnfollowNewsletter(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.NewsletterActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.UnfollowNewsletter(c.Request.Context(), sessionId, req.NewsletterJID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// @Summary      Get newsletter info
// @Description  Get detailed information about a WhatsApp newsletter (name, description, subscribers, privacy, picture)
// @Tags         newsletter
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        newsletterJid  query      string  true  "Newsletter JID (e.g., 123456789@newsletter)"
// @Success      200           {object}  dto.NewsletterResponse
// @Failure      400           {object}  dto.ErrorResponse  "Missing newsletterJid parameter"
// @Failure      404           {object}  dto.ErrorResponse  "Session not found"
// @Failure      500           {object}  dto.ErrorResponse  "Failed to get newsletter info"
// @Security     Authorization
// @Router       /{session}/newsletter/info [get]
func (h *NewsletterHandler) GetNewsletterInfo(c *gin.Context) {
	sessionId := c.Param("session")
	newsletterJID := c.Query("newsletterJid")
	if newsletterJID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "newsletterJid query parameter is required"})
		return
	}

	info, err := h.wpp.GetNewsletterInfo(c.Request.Context(), sessionId, newsletterJID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": info,
	})
}

// @Summary      List subscribed newsletters
// @Description  Get list of newsletters the session is subscribed to
// @Tags         newsletter
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.NewsletterListResponse
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to get newsletters"
// @Security     Authorization
// @Router       /{session}/newsletter/list [get]
func (h *NewsletterHandler) GetSubscribedNewsletters(c *gin.Context) {
	sessionId := c.Param("session")

	newsletters, err := h.wpp.GetSubscribedNewsletters(c.Request.Context(), sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, newsletters)
}

// @Summary      Get newsletter messages
// @Description  Get messages from a WhatsApp newsletter with pagination
// @Tags         newsletter
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        newsletterJid  query      string  true   "Newsletter JID"
// @Param        count         query     int     false  "Number of messages (default: 50)"
// @Param        before        query     int     false  "Before server ID (for pagination)"
// @Success      200           {object}  dto.NewsletterMessagesResponse
// @Failure      400           {object}  dto.ErrorResponse  "Missing newsletterJid parameter"
// @Failure      404           {object}  dto.ErrorResponse  "Session not found"
// @Failure      500           {object}  dto.ErrorResponse  "Failed to get messages"
// @Security     Authorization
// @Router       /{session}/newsletter/messages [get]
func (h *NewsletterHandler) GetNewsletterMessages(c *gin.Context) {
	sessionId := c.Param("session")
	newsletterJID := c.Query("newsletterJid")
	if newsletterJID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "newsletterJid query parameter is required"})
		return
	}

	count := 50
	var before types.MessageServerID

	messages, err := h.wpp.GetNewsletterMessages(c.Request.Context(), sessionId, newsletterJID, count, before)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": messages,
	})
}

// @Summary      React to newsletter message
// @Description  Send a reaction (emoji) to a newsletter message
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterReactionRequest true  "Reaction data (emoji, server ID, newsletter JID)"
// @Success      200    {object}  object  "Reaction sent successfully"
// @Failure      400    {object}  dto.ErrorResponse  "Invalid request data"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to send reaction"
// @Security     Authorization
// @Router       /{session}/newsletter/react [post]
func (h *NewsletterHandler) NewsletterSendReaction(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.NewsletterReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	serverID := req.ServerID
	messageID := req.MessageID

	if err := h.wpp.NewsletterSendReaction(c.Request.Context(), sessionId, req.NewsletterJID, serverID, req.Reaction, messageID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// @Summary      Mute/unmute newsletter
// @Description  Toggle mute status of a newsletter (notifications on/off)
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterMuteRequest true  "Mute/unmute data"
// @Success      200    {object}  object  "Mute status updated"
// @Failure      400    {object}  dto.ErrorResponse  "Invalid request"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to update mute status"
// @Security     Authorization
// @Router       /{session}/newsletter/mute [patch]
func (h *NewsletterHandler) NewsletterToggleMute(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.NewsletterMuteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.NewsletterToggleMute(c.Request.Context(), sessionId, req.NewsletterJID, req.Mute); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// @Summary      Mark newsletter messages as viewed
// @Description  Mark newsletter messages as viewed by their server IDs
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterMarkViewedRequest true  "Server IDs to mark as viewed"
// @Success      200    {object}  object  "Messages marked as viewed"
// @Failure      400    {object}  dto.ErrorResponse  "Invalid request data"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to mark as viewed"
// @Security     Authorization
// @Router       /{session}/newsletter/viewed [post]
func (h *NewsletterHandler) NewsletterMarkViewed(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.NewsletterMarkViewedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	serverIDs := make([]types.MessageServerID, len(req.ServerIDs))
	copy(serverIDs, req.ServerIDs)

	if err := h.wpp.NewsletterMarkViewed(c.Request.Context(), sessionId, req.NewsletterJID, serverIDs); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "messages marked as viewed"})
}

// @Summary      Subscribe to live updates
// @Description  Subscribe to receive live updates from a newsletter (real-time notifications)
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterIDRequest true  "Newsletter JID to subscribe"
// @Success      200    {object}  dto.NewsletterLiveResponse
// @Failure      400    {object}  dto.ErrorResponse  "Invalid request"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to subscribe"
// @Security     Authorization
// @Router       /{session}/newsletter/subscribe-live [post]
func (h *NewsletterHandler) NewsletterSubscribeLiveUpdates(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.NewsletterIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	duration, err := h.wpp.NewsletterSubscribeLiveUpdates(c.Request.Context(), sessionId, req.NewsletterJID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.NewsletterLiveResponse{
		Duration: duration.String(),
	})
}
