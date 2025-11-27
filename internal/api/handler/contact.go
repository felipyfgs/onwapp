package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/service"
)

type ContactHandler struct {
	whatsappService *service.WhatsAppService
}

func NewContactHandler(whatsappService *service.WhatsAppService) *ContactHandler {
	return &ContactHandler{whatsappService: whatsappService}
}

// Request types

type CheckPhoneRequest struct {
	Phones []string `json:"phones" binding:"required" example:"5511999999999,5511888888888"`
}

type GetContactInfoRequest struct {
	Phones []string `json:"phones" binding:"required" example:"5511999999999"`
}

type PresenceRequest struct {
	Available bool `json:"available" example:"true"`
}

type ChatPresenceRequest struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
	State string `json:"state" binding:"required" example:"composing"`
	Media string `json:"media" example:""`
}

type MarkReadRequest struct {
	Phone      string   `json:"phone" binding:"required" example:"5511999999999"`
	MessageIDs []string `json:"messageIds" binding:"required" example:"ABCD1234"`
}

// Response types

type CheckPhoneResult struct {
	Phone        string `json:"phone"`
	IsRegistered bool   `json:"isRegistered"`
	JID          string `json:"jid,omitempty"`
}

// Handlers

// CheckPhone godoc
// @Summary      Check if phones are registered on WhatsApp
// @Description  Check if phone numbers are registered on WhatsApp
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string            true  "Session name"
// @Param        body   body      CheckPhoneRequest true  "Phone numbers"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/check [post]
func (h *ContactHandler) CheckPhone(c *gin.Context) {
	name := c.Param("name")

	var req CheckPhoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	results, err := h.whatsappService.CheckPhoneRegistered(c.Request.Context(), name, req.Phones)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	checkResults := make([]CheckPhoneResult, len(results))
	for i, r := range results {
		checkResults[i] = CheckPhoneResult{
			Phone:        req.Phones[i],
			IsRegistered: r.IsIn,
			JID:          r.JID.String(),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"results": checkResults,
	})
}

// GetContactInfo godoc
// @Summary      Get contact information
// @Description  Get information about WhatsApp contacts
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string                true  "Session name"
// @Param        body   body      GetContactInfoRequest true  "Phone numbers"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/info [post]
func (h *ContactHandler) GetContactInfo(c *gin.Context) {
	name := c.Param("name")

	var req GetContactInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	info, err := h.whatsappService.GetUserInfo(c.Request.Context(), name, req.Phones)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"users":   users,
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
// @Success      200    {object}  GroupResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/{phone}/avatar [get]
func (h *ContactHandler) GetAvatar(c *gin.Context) {
	name := c.Param("name")
	phone := c.Param("phone")

	pic, err := h.whatsappService.GetProfilePicture(c.Request.Context(), name, phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if pic == nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"url":     "",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"url":     pic.URL,
		"id":      pic.ID,
	})
}

// GetContacts godoc
// @Summary      Get all contacts
// @Description  Get all contacts from WhatsApp
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  GroupResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/list [get]
func (h *ContactHandler) GetContacts(c *gin.Context) {
	name := c.Param("name")

	contacts, err := h.whatsappService.GetContacts(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"contacts": contacts,
	})
}

// SetPresence godoc
// @Summary      Set online presence
// @Description  Set online/offline presence status
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string          true  "Session name"
// @Param        body   body      PresenceRequest true  "Presence data"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/presence [post]
func (h *ContactHandler) SetPresence(c *gin.Context) {
	name := c.Param("name")

	var req PresenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.whatsappService.SendPresence(c.Request.Context(), name, req.Available); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	status := "unavailable"
	if req.Available {
		status = "available"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"status":  status,
	})
}

// SetChatPresence godoc
// @Summary      Set chat presence (typing/recording)
// @Description  Set typing or recording presence in a chat
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string              true  "Session name"
// @Param        body   body      ChatPresenceRequest true  "Chat presence data"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/typing [post]
func (h *ContactHandler) SetChatPresence(c *gin.Context) {
	name := c.Param("name")

	var req ChatPresenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.whatsappService.SendChatPresenceRaw(c.Request.Context(), name, req.Phone, req.State, req.Media); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"state":   req.State,
	})
}

// MarkRead godoc
// @Summary      Mark messages as read
// @Description  Mark messages as read in a chat
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        name   path      string          true  "Session name"
// @Param        body   body      MarkReadRequest true  "Messages to mark"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/contact/markread [post]
func (h *ContactHandler) MarkRead(c *gin.Context) {
	name := c.Param("name")

	var req MarkReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.whatsappService.MarkRead(c.Request.Context(), name, req.Phone, req.MessageIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}
