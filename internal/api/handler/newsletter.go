package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/types"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type NewsletterHandler struct {
	whatsappService *service.WhatsAppService
}

func NewNewsletterHandler(whatsappService *service.WhatsAppService) *NewsletterHandler {
	return &NewsletterHandler{whatsappService: whatsappService}
}

// CreateNewsletter godoc
// @Summary      Create a newsletter/channel
// @Description  Create a new WhatsApp newsletter/channel
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        name   path      string                     true  "Session name"
// @Param        body   body      dto.CreateNewsletterRequest true  "Newsletter data"
// @Success      200    {object}  dto.NewsletterResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/newsletters [post]
func (h *NewsletterHandler) CreateNewsletter(c *gin.Context) {
	name := c.Param("name")

	var req dto.CreateNewsletterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	newsletter, err := h.whatsappService.CreateNewsletter(c.Request.Context(), name, req.Name, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.NewsletterResponse{
		Success: true,
		Data:    newsletter,
	})
}

// FollowNewsletter godoc
// @Summary      Follow a newsletter
// @Description  Follow/subscribe to a WhatsApp newsletter
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        name   path      string                     true  "Session name"
// @Param        body   body      dto.NewsletterActionRequest true  "Newsletter JID"
// @Success      200    {object}  dto.SuccessResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/newsletters/{newsletterId}/follow [post]
func (h *NewsletterHandler) FollowNewsletter(c *gin.Context) {
	name := c.Param("name")

	var req dto.NewsletterActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.FollowNewsletter(c.Request.Context(), name, req.NewsletterJID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true})
}

// UnfollowNewsletter godoc
// @Summary      Unfollow a newsletter
// @Description  Unfollow/unsubscribe from a WhatsApp newsletter
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        name   path      string                     true  "Session name"
// @Param        body   body      dto.NewsletterActionRequest true  "Newsletter JID"
// @Success      200    {object}  dto.SuccessResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/newsletters/{newsletterId}/follow [delete]
func (h *NewsletterHandler) UnfollowNewsletter(c *gin.Context) {
	name := c.Param("name")

	var req dto.NewsletterActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.UnfollowNewsletter(c.Request.Context(), name, req.NewsletterJID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true})
}

// GetNewsletterInfo godoc
// @Summary      Get newsletter info
// @Description  Get information about a WhatsApp newsletter
// @Tags         newsletter
// @Produce      json
// @Param        name          path      string  true  "Session name"
// @Param        newsletterId  path      string  true  "Newsletter JID"
// @Success      200           {object}  dto.NewsletterResponse
// @Failure      500           {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/newsletters/{newsletterId} [get]
func (h *NewsletterHandler) GetNewsletterInfo(c *gin.Context) {
	name := c.Param("name")
	newsletterID := c.Param("newsletterId")

	info, err := h.whatsappService.GetNewsletterInfo(c.Request.Context(), name, newsletterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.NewsletterResponse{
		Success: true,
		Data:    info,
	})
}

// GetSubscribedNewsletters godoc
// @Summary      List subscribed newsletters
// @Description  Get list of newsletters the session is subscribed to
// @Tags         newsletter
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  dto.NewsletterListResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/newsletters [get]
func (h *NewsletterHandler) GetSubscribedNewsletters(c *gin.Context) {
	name := c.Param("name")

	newsletters, err := h.whatsappService.GetSubscribedNewsletters(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.NewsletterListResponse{
		Success:     true,
		Newsletters: newsletters,
	})
}

// GetNewsletterMessages godoc
// @Summary      Get newsletter messages
// @Description  Get messages from a WhatsApp newsletter
// @Tags         newsletter
// @Produce      json
// @Param        name          path      string  true   "Session name"
// @Param        newsletterId  path      string  true   "Newsletter JID"
// @Param        count         query     int     false  "Number of messages" default(50)
// @Param        before        query     int     false  "Before server ID"
// @Success      200           {object}  dto.NewsletterResponse
// @Failure      500           {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/newsletters/{newsletterId}/messages [get]
func (h *NewsletterHandler) GetNewsletterMessages(c *gin.Context) {
	name := c.Param("name")
	newsletterID := c.Param("newsletterId")

	count := 50
	if c.Query("count") != "" {
		if _, err := c.GetQuery("count"); err {
			count = 50
		}
	}

	var before types.MessageServerID
	// TODO: Parse before parameter if provided for pagination

	messages, err := h.whatsappService.GetNewsletterMessages(c.Request.Context(), name, newsletterID, count, before)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.NewsletterResponse{
		Success: true,
		Data:    messages,
	})
}

// NewsletterSendReaction godoc
// @Summary      React to newsletter message
// @Description  Send a reaction to a newsletter message
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        name   path      string                        true  "Session name"
// @Param        body   body      dto.NewsletterReactionRequest true  "Reaction data"
// @Success      200    {object}  dto.SuccessResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/newsletters/{newsletterId}/reactions [post]
func (h *NewsletterHandler) NewsletterSendReaction(c *gin.Context) {
	name := c.Param("name")

	var req dto.NewsletterReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	serverID := types.MessageServerID(req.ServerID)
	messageID := types.MessageID(req.MessageID)

	if err := h.whatsappService.NewsletterSendReaction(c.Request.Context(), name, req.NewsletterJID, serverID, req.Reaction, messageID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true})
}

// NewsletterToggleMute godoc
// @Summary      Mute/unmute newsletter
// @Description  Toggle mute status of a newsletter
// @Tags         newsletter
// @Accept       json
// @Produce      json
// @Param        name   path      string                   true  "Session name"
// @Param        body   body      dto.NewsletterMuteRequest true  "Mute data"
// @Success      200    {object}  dto.SuccessResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/newsletters/{newsletterId}/mute [patch]
func (h *NewsletterHandler) NewsletterToggleMute(c *gin.Context) {
	name := c.Param("name")

	var req dto.NewsletterMuteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.NewsletterToggleMute(c.Request.Context(), name, req.NewsletterJID, req.Mute); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true})
}
