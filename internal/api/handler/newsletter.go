package handler

import (
	"net/http"
	"strconv"

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
// @Summary      Create newsletter
// @Description  Create a new channel/newsletter
// @Tags         Newsletter
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        request body dto.CreateNewsletterRequest true "Newsletter data"
// @Success      200 {object} dto.NewsletterResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/newsletter/create [post]
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
// @Summary      Follow newsletter
// @Description  Follow a channel/newsletter
// @Tags         Newsletter
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        request body dto.NewsletterActionRequest true "Newsletter JID"
// @Success      200 {object} dto.SuccessResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/newsletter/follow [post]
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

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Message: "followed"})
}

// UnfollowNewsletter godoc
// @Summary      Unfollow newsletter
// @Description  Unfollow a channel/newsletter
// @Tags         Newsletter
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        request body dto.NewsletterActionRequest true "Newsletter JID"
// @Success      200 {object} dto.SuccessResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/newsletter/unfollow [post]
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

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Message: "unfollowed"})
}

// GetNewsletterInfo godoc
// @Summary      Get newsletter info
// @Description  Get information about a channel/newsletter
// @Tags         Newsletter
// @Produce      json
// @Param        name path string true "Session name"
// @Param        newsletterId path string true "Newsletter JID"
// @Success      200 {object} dto.NewsletterResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/newsletter/{newsletterId}/info [get]
func (h *NewsletterHandler) GetNewsletterInfo(c *gin.Context) {
	name := c.Param("name")
	newsletterID := c.Param("newsletterId")

	newsletter, err := h.whatsappService.GetNewsletterInfo(c.Request.Context(), name, newsletterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.NewsletterResponse{
		Success: true,
		Data:    newsletter,
	})
}

// GetSubscribedNewsletters godoc
// @Summary      List subscribed newsletters
// @Description  List all followed channels/newsletters
// @Tags         Newsletter
// @Produce      json
// @Param        name path string true "Session name"
// @Success      200 {object} dto.NewsletterListResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/newsletter/list [get]
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
// @Description  Get messages from a channel/newsletter
// @Tags         Newsletter
// @Produce      json
// @Param        name path string true "Session name"
// @Param        newsletterId path string true "Newsletter JID"
// @Param        count query int false "Number of messages" default(50)
// @Success      200 {object} dto.NewsletterResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/newsletter/{newsletterId}/messages [get]
func (h *NewsletterHandler) GetNewsletterMessages(c *gin.Context) {
	name := c.Param("name")
	newsletterID := c.Param("newsletterId")

	count := 50
	if countStr := c.Query("count"); countStr != "" {
		if parsed, err := strconv.Atoi(countStr); err == nil {
			count = parsed
		}
	}

	messages, err := h.whatsappService.GetNewsletterMessages(c.Request.Context(), name, newsletterID, count, 0)
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
// @Summary      Send reaction to newsletter message
// @Description  Send a reaction to a message in a channel/newsletter
// @Tags         Newsletter
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        request body dto.NewsletterReactionRequest true "Reaction data"
// @Success      200 {object} dto.SuccessResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/newsletter/reaction [post]
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
// @Description  Mute or unmute notifications from a channel/newsletter
// @Tags         Newsletter
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        request body dto.NewsletterMuteRequest true "Mute setting"
// @Success      200 {object} dto.SuccessResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/newsletter/mute [post]
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

	status := "unmuted"
	if req.Mute {
		status = "muted"
	}
	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Message: status})
}
