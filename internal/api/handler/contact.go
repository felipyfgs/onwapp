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
// @Success      200    {array}   dto.CheckPhoneResult
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contacts/check [post]
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

	c.JSON(http.StatusOK, checkResults)
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
// @Router       /sessions/{name}/contacts/{phone} [get]
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

		Users: users,
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
// @Router       /sessions/{name}/contacts/{phone}/avatar [get]
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

			URL: "",
		})
		return
	}

	c.JSON(http.StatusOK, dto.AvatarResponse{

		URL: pic.URL,
		ID:  pic.ID,
	})
}

// GetContacts godoc
// @Summary      Get all contacts
// @Description  Get all contacts from WhatsApp
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {array}   object
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contacts [get]
func (h *ContactHandler) GetContacts(c *gin.Context) {
	name := c.Param("name")

	contacts, err := h.whatsappService.GetContacts(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, contacts)
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
// @Router       /sessions/{name}/presence [put]
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

		Status: status,
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
// @Router       /sessions/{name}/chats/{chatId}/typing [post]
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

		State: req.State,
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
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/chats/{chatId}/read [post]
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

	c.JSON(http.StatusOK, gin.H{})
}

// GetBlocklist godoc
// @Summary      Get blocked contacts
// @Description  Get list of blocked contacts
// @Tags         contact
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  dto.BlocklistResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contacts/blocklist [get]
func (h *ContactHandler) GetBlocklist(c *gin.Context) {
	name := c.Param("name")

	blocklist, err := h.whatsappService.GetBlocklist(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	jids := make([]string, len(blocklist.JIDs))
	for i, jid := range blocklist.JIDs {
		jids[i] = jid.String()
	}

	c.JSON(http.StatusOK, dto.BlocklistResponse{

		JIDs: jids,
	})
}

// UpdateBlocklist godoc
// @Summary      Block or unblock contact
// @Description  Block or unblock a contact
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string              true  "Session name"
// @Param        body   body      dto.BlocklistRequest true  "Block action"
// @Success      200    {object}  dto.BlocklistActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contacts/blocklist [put]
func (h *ContactHandler) UpdateBlocklist(c *gin.Context) {
	name := c.Param("name")

	var req dto.BlocklistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	block := req.Action == "block"
	_, err := h.whatsappService.UpdateBlocklist(c.Request.Context(), name, req.Phone, block)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.BlocklistActionResponse{

		Action: req.Action,
		Phone:  req.Phone,
	})
}

// SubscribePresence godoc
// @Summary      Subscribe to presence updates
// @Description  Subscribe to receive presence updates from a contact
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string                      true  "Session name"
// @Param        body   body      dto.SubscribePresenceRequest true  "Subscribe data"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contacts/{phone}/presence/subscribe [post]
func (h *ContactHandler) SubscribePresence(c *gin.Context) {
	name := c.Param("name")

	var req dto.SubscribePresenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.SubscribePresence(c.Request.Context(), name, req.Phone); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// GetContactQRLink godoc
// @Summary      Get contact QR link
// @Description  Get QR link for adding contact
// @Tags         contact
// @Produce      json
// @Param        name   path      string  true   "Session name"
// @Param        revoke query     bool    false  "Revoke existing link"
// @Success      200    {object}  dto.QRLinkResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/qrlink [get]
func (h *ContactHandler) GetContactQRLink(c *gin.Context) {
	name := c.Param("name")
	revoke := c.Query("revoke") == "true"

	link, err := h.whatsappService.GetContactQRLink(c.Request.Context(), name, revoke)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.QRLinkResponse{

		Link: link,
	})
}

// GetBusinessProfile godoc
// @Summary      Get business profile
// @Description  Get business profile of a contact
// @Tags         contact
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Param        phone  path      string  true  "Phone number"
// @Success      200    {object}  dto.BusinessProfileResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contacts/{phone}/business [get]
func (h *ContactHandler) GetBusinessProfile(c *gin.Context) {
	name := c.Param("name")
	phone := c.Param("phone")

	profile, err := h.whatsappService.GetBusinessProfile(c.Request.Context(), name, phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.BusinessProfileResponse{

		Profile: profile,
	})
}

// GetContactLID godoc
// @Summary      Get contact LID
// @Description  Get the Linked ID (LID) for a contact
// @Tags         contact
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Param        phone  path      string  true  "Phone number or JID"
// @Success      200    {object}  dto.LIDResponse
// @Failure      404    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contacts/{phone}/lid [get]
func (h *ContactHandler) GetContactLID(c *gin.Context) {
	name := c.Param("name")
	phone := c.Param("phone")

	lid, err := h.whatsappService.GetContactLID(c.Request.Context(), name, phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if lid == "" {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "LID not found for this contact"})
		return
	}

	c.JSON(http.StatusOK, dto.LIDResponse{
		Phone: phone,
		LID:   lid,
	})
}
