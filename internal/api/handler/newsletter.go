package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/types"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service/wpp"
)

type NewsletterHandler struct {
	wpp *wpp.Service
}

func NewNewsletterHandler(wpp *wpp.Service) *NewsletterHandler {
	return &NewsletterHandler{wpp: wpp}
}

// CreateNewsletter godoc
// @Summary      Create a newsletter/channel
// @Description  Create a new WhatsApp newsletter/channel
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.CreateNewsletterRequest true  "Newsletter data"
// @Success      200    {object}  dto.NewsletterResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters [post]
func (h *NewsletterHandler) CreateNewsletter(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

	c.JSON(http.StatusOK, dto.NewsletterResponse{

		Data: newsletter,
	})
}

// FollowNewsletter godoc
// @Summary      Follow a newsletter
// @Description  Follow/subscribe to a WhatsApp newsletter
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterActionRequest true  "Newsletter JID"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters/{newsletterId}/follow [post]
func (h *NewsletterHandler) FollowNewsletter(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

// UnfollowNewsletter godoc
// @Summary      Unfollow a newsletter
// @Description  Unfollow/unsubscribe from a WhatsApp newsletter
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterActionRequest true  "Newsletter JID"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters/{newsletterId}/follow [delete]
func (h *NewsletterHandler) UnfollowNewsletter(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

// GetNewsletterInfo godoc
// @Summary      Get newsletter info
// @Description  Get information about a WhatsApp newsletter
// @Tags         newsletter
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        newsletterId  path      string  true  "Newsletter JID"
// @Success      200           {object}  dto.NewsletterResponse
// @Failure      500           {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters/{newsletterId} [get]
func (h *NewsletterHandler) GetNewsletterInfo(c *gin.Context) {
	sessionId := c.Param("sessionId")
	newsletterID := c.Param("newsletterId")

	info, err := h.wpp.GetNewsletterInfo(c.Request.Context(), sessionId, newsletterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.NewsletterResponse{

		Data: info,
	})
}

// GetSubscribedNewsletters godoc
// @Summary      List subscribed newsletters
// @Description  Get list of newsletters the session is subscribed to
// @Tags         newsletter
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Success      200    {array}   object
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters [get]
func (h *NewsletterHandler) GetSubscribedNewsletters(c *gin.Context) {
	sessionId := c.Param("sessionId")

	newsletters, err := h.wpp.GetSubscribedNewsletters(c.Request.Context(), sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, newsletters)
}

// GetNewsletterMessages godoc
// @Summary      Get newsletter messages
// @Description  Get messages from a WhatsApp newsletter
// @Tags         newsletter
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        newsletterId  path      string  true   "Newsletter JID"
// @Param        count         query     int     false  "Number of messages" default(50)
// @Param        before        query     int     false  "Before server ID"
// @Success      200           {object}  dto.NewsletterResponse
// @Failure      500           {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters/{newsletterId}/messages [get]
func (h *NewsletterHandler) GetNewsletterMessages(c *gin.Context) {
	sessionId := c.Param("sessionId")
	newsletterID := c.Param("newsletterId")

	count := 50
	if c.Query("count") != "" {
		if _, err := c.GetQuery("count"); err {
			count = 50
		}
	}

	var before types.MessageServerID
	// TODO: Parse before parameter if provided for pagination

	messages, err := h.wpp.GetNewsletterMessages(c.Request.Context(), sessionId, newsletterID, count, before)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.NewsletterResponse{

		Data: messages,
	})
}

// NewsletterSendReaction godoc
// @Summary      React to newsletter message
// @Description  Send a reaction to a newsletter message
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterReactionRequest true  "Reaction data"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters/{newsletterId}/reactions [post]
func (h *NewsletterHandler) NewsletterSendReaction(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.NewsletterReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	serverID := types.MessageServerID(req.ServerID)
	messageID := types.MessageID(req.MessageID)

	if err := h.wpp.NewsletterSendReaction(c.Request.Context(), sessionId, req.NewsletterJID, serverID, req.Reaction, messageID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// NewsletterToggleMute godoc
// @Summary      Mute/unmute newsletter
// @Description  Toggle mute status of a newsletter
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.NewsletterMuteRequest true  "Mute data"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters/{newsletterId}/mute [patch]
func (h *NewsletterHandler) NewsletterToggleMute(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

// NewsletterMarkViewed godoc
// @Summary      Mark newsletter messages as viewed
// @Description  Mark newsletter messages as viewed
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        newsletterId path string true "Newsletter JID"
// @Param        body body dto.NewsletterMarkViewedRequest true "Server IDs to mark"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters/{newsletterId}/viewed [post]
func (h *NewsletterHandler) NewsletterMarkViewed(c *gin.Context) {
	sessionId := c.Param("sessionId")
	newsletterID := c.Param("newsletterId")

	var req dto.NewsletterMarkViewedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	serverIDs := make([]types.MessageServerID, len(req.ServerIDs))
	for i, id := range req.ServerIDs {
		serverIDs[i] = types.MessageServerID(id)
	}

	if err := h.wpp.NewsletterMarkViewed(c.Request.Context(), sessionId, newsletterID, serverIDs); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "messages marked as viewed"})
}

// NewsletterSubscribeLiveUpdates godoc
// @Summary      Subscribe to live updates
// @Description  Subscribe to receive live updates from a newsletter
// @Tags         newsletter
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        newsletterId path string true "Newsletter JID"
// @Success      200 {object} dto.NewsletterLiveResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/newsletters/{newsletterId}/subscribe-live [post]
func (h *NewsletterHandler) NewsletterSubscribeLiveUpdates(c *gin.Context) {
	sessionId := c.Param("sessionId")
	newsletterID := c.Param("newsletterId")

	duration, err := h.wpp.NewsletterSubscribeLiveUpdates(c.Request.Context(), sessionId, newsletterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.NewsletterLiveResponse{
		Duration: duration.String(),
	})
}
