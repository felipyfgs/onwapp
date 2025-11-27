package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type ContactHandler struct {
	whatsappService *service.WhatsAppService
}

func NewContactHandler(whatsappService *service.WhatsAppService) *ContactHandler {
	return &ContactHandler{whatsappService: whatsappService}
}

// CheckPhone godoc
// @Summary      Check if phones are registered on WhatsApp
// @Description  Check if phone numbers are registered on WhatsApp
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string                true  "Session name"
// @Param        body   body      dto.CheckPhoneRequest true  "Phone numbers"
// @Success      200    {object}  dto.CheckPhoneResultsResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/check [post]
func (h *ContactHandler) CheckPhone(c *gin.Context) {
	name := c.Param("name")

	var req dto.CheckPhoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	results, err := h.whatsappService.CheckPhoneRegistered(c.Request.Context(), name, req.Phones)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	checkResults := make([]dto.CheckPhoneResult, len(results))
	for i, r := range results {
		checkResults[i] = dto.CheckPhoneResult{
			Phone:        req.Phones[i],
			IsRegistered: r.IsIn,
			JID:          r.JID.String(),
		}
	}

	c.JSON(http.StatusOK, dto.CheckPhoneResultsResponse{
		Success: true,
		Results: checkResults,
	})
}

// GetContactInfo godoc
// @Summary      Get contact information
// @Description  Get information about WhatsApp contacts
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string                  true  "Session name"
// @Param        body   body      dto.ContactInfoRequest  true  "Phone numbers"
// @Success      200    {object}  dto.ContactInfoResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/info [post]
func (h *ContactHandler) GetContactInfo(c *gin.Context) {
	name := c.Param("name")

	var req dto.ContactInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	info, err := h.whatsappService.GetUserInfo(c.Request.Context(), name, req.Phones)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	users := make(map[string]interface{})
	for jid, userInfo := range info {
		users[jid.String()] = map[string]interface{}{
			"status":    userInfo.Status,
			"pictureId": userInfo.PictureID,
			"devices":   userInfo.Devices,
		}
	}

	c.JSON(http.StatusOK, dto.ContactInfoResponse{
		Success: true,
		Users:   users,
	})
}

// GetAvatar godoc
// @Summary      Get contact avatar
// @Description  Get profile picture URL for a contact
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Param        phone  path      string  true  "Phone number"
// @Success      200    {object}  dto.AvatarResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/{phone}/avatar [get]
func (h *ContactHandler) GetAvatar(c *gin.Context) {
	name := c.Param("name")
	phone := c.Param("phone")

	pic, err := h.whatsappService.GetProfilePicture(c.Request.Context(), name, phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if pic == nil {
		c.JSON(http.StatusOK, dto.AvatarResponse{
			Success: true,
			URL:     "",
		})
		return
	}

	c.JSON(http.StatusOK, dto.AvatarResponse{
		Success: true,
		URL:     pic.URL,
		ID:      pic.ID,
	})
}

// GetContacts godoc
// @Summary      Get all contacts
// @Description  Get all contacts from WhatsApp
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  dto.ContactsListResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/list [get]
func (h *ContactHandler) GetContacts(c *gin.Context) {
	name := c.Param("name")

	contacts, err := h.whatsappService.GetContacts(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ContactsListResponse{
		Success:  true,
		Contacts: contacts,
	})
}

// SetPresence godoc
// @Summary      Set online presence
// @Description  Set online/offline presence status
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string                  true  "Session name"
// @Param        body   body      dto.SetPresenceRequest  true  "Presence data"
// @Success      200    {object}  dto.PresenceResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/presence [post]
func (h *ContactHandler) SetPresence(c *gin.Context) {
	name := c.Param("name")

	var req dto.SetPresenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.SendPresence(c.Request.Context(), name, req.Available); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	status := "unavailable"
	if req.Available {
		status = "available"
	}

	c.JSON(http.StatusOK, dto.PresenceResponse{
		Success: true,
		Status:  status,
	})
}

// SetChatPresence godoc
// @Summary      Set chat presence (typing/recording)
// @Description  Set typing or recording presence in a chat
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string                   true  "Session name"
// @Param        body   body      dto.ChatPresenceRequest  true  "Chat presence data"
// @Success      200    {object}  dto.ChatPresenceResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/typing [post]
func (h *ContactHandler) SetChatPresence(c *gin.Context) {
	name := c.Param("name")

	var req dto.ChatPresenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.SendChatPresenceRaw(c.Request.Context(), name, req.Phone, req.State, req.Media); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ChatPresenceResponse{
		Success: true,
		State:   req.State,
	})
}

// MarkRead godoc
// @Summary      Mark messages as read
// @Description  Mark messages as read in a chat
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string              true  "Session name"
// @Param        body   body      dto.MarkReadRequest true  "Messages to mark"
// @Success      200    {object}  dto.SuccessResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/markread [post]
func (h *ContactHandler) MarkRead(c *gin.Context) {
	name := c.Param("name")

	var req dto.MarkReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.MarkRead(c.Request.Context(), name, req.Phone, req.MessageIDs); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
	})
}
