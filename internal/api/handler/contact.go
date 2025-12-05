package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"onwapp/internal/api/dto"
	"onwapp/internal/service/wpp"
)

type ContactHandler struct {
	wpp *wpp.Service
}

func NewContactHandler(wpp *wpp.Service) *ContactHandler {
	return &ContactHandler{wpp: wpp}
}

// CheckPhone godoc
// @Summary      Check if phones are registered on WhatsApp
// @Description  Check if phone numbers are registered on WhatsApp
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.CheckPhoneRequest true  "Phone numbers"
// @Success      200    {array}   dto.CheckPhoneResult
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/contact/check [post]
func (h *ContactHandler) CheckPhone(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.CheckPhoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	results, err := h.wpp.CheckPhoneRegistered(c.Request.Context(), sessionId, req.Phones)
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
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.ContactInfoRequest  true  "Phone numbers"
// @Success      200    {object}  dto.ContactInfoResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/contact/info [post]
func (h *ContactHandler) GetContactInfo(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.ContactInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	info, err := h.wpp.GetUserInfo(c.Request.Context(), sessionId, req.Phones)
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
// @Param        session   path      string  true  "Session ID"
// @Param        phone  query      string  true  "Phone number"
// @Success      200    {object}  dto.AvatarResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/contact/avatar [get]
func (h *ContactHandler) GetAvatar(c *gin.Context) {
	sessionId := c.Param("session")
	phone := c.Query("phone")
	if phone == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "phone query parameter is required"})
		return
	}

	pic, err := h.wpp.GetProfilePicture(c.Request.Context(), sessionId, phone)
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
// @Param        session   path      string  true  "Session ID"
// @Success      200    {array}   object
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/contact/list [get]
func (h *ContactHandler) GetContacts(c *gin.Context) {
	sessionId := c.Param("session")

	contacts, err := h.wpp.GetContacts(c.Request.Context(), sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, contacts)
}

// GetBlocklist godoc
// @Summary      Get blocked contacts
// @Description  Get list of blocked contacts
// @Tags         contact
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.BlocklistResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/contact/blocklist [get]
func (h *ContactHandler) GetBlocklist(c *gin.Context) {
	sessionId := c.Param("session")

	blocklist, err := h.wpp.GetBlocklist(c.Request.Context(), sessionId)
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
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.BlocklistRequest true  "Block action"
// @Success      200    {object}  dto.BlocklistActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/contact/blocklist [post]
func (h *ContactHandler) UpdateBlocklist(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.BlocklistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	block := req.Action == "block"
	_, err := h.wpp.UpdateBlocklist(c.Request.Context(), sessionId, req.Phone, block)
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
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SubscribePresenceRequest true  "Subscribe data"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/presence/subscribe [post]
func (h *ContactHandler) SubscribePresence(c *gin.Context) {
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

// GetContactQRLink godoc
// @Summary      Get contact QR link
// @Description  Get QR link for adding contact
// @Tags         contact
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        revoke query     bool    false  "Revoke existing link"
// @Success      200    {object}  dto.QRLinkResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/contact/qrlink [get]
func (h *ContactHandler) GetContactQRLink(c *gin.Context) {
	sessionId := c.Param("session")
	revoke := c.Query("revoke") == "true"

	link, err := h.wpp.GetContactQRLink(c.Request.Context(), sessionId, revoke)
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
// @Param        session   path      string  true  "Session ID"
// @Param        phone  query      string  true  "Phone number"
// @Success      200    {object}  dto.BusinessProfileResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/contact/business [get]
func (h *ContactHandler) GetBusinessProfile(c *gin.Context) {
	sessionId := c.Param("session")
	phone := c.Query("phone")
	if phone == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "phone query parameter is required"})
		return
	}

	profile, err := h.wpp.GetBusinessProfile(c.Request.Context(), sessionId, phone)
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
// @Param        session   path      string  true  "Session ID"
// @Param        phone  query      string  true  "Phone number or JID"
// @Success      200    {object}  dto.LIDResponse
// @Failure      404    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/contact/lid [get]
func (h *ContactHandler) GetContactLID(c *gin.Context) {
	sessionId := c.Param("session")
	phone := c.Query("phone")
	if phone == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "phone query parameter is required"})
		return
	}

	lid, err := h.wpp.GetContactLID(c.Request.Context(), sessionId, phone)
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
