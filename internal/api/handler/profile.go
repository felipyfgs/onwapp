package handler

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/service"
)

type ProfileHandler struct {
	whatsappService *service.WhatsAppService
}

func NewProfileHandler(whatsappService *service.WhatsAppService) *ProfileHandler {
	return &ProfileHandler{whatsappService: whatsappService}
}

// Request types

type SetStatusRequest struct {
	Status string `json:"status" binding:"required" example:"Hello, I'm using WhatsApp"`
}

type SetPushNameRequest struct {
	Name string `json:"name" binding:"required" example:"John Doe"`
}

type SetProfilePictureRequest struct {
	Image string `json:"image" binding:"required" example:"base64_encoded_image"`
}

type PrivacySettingsRequest struct {
	LastSeen       string `json:"lastSeen" example:"all"`       // all, contacts, none
	ProfilePicture string `json:"profilePicture" example:"all"` // all, contacts, none
	Status         string `json:"status" example:"all"`         // all, contacts, none
	ReadReceipts   bool   `json:"readReceipts" example:"true"`
	GroupsAdd      string `json:"groupsAdd" example:"all"`      // all, contacts, none
}

// Handlers

// GetProfile godoc
// @Summary      Get own profile info
// @Description  Get own WhatsApp profile information
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  GroupResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile [get]
func (h *ProfileHandler) GetProfile(c *gin.Context) {
	name := c.Param("name")

	profile, err := h.whatsappService.GetOwnProfile(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"profile": profile,
	})
}

// SetStatus godoc
// @Summary      Set status message
// @Description  Set WhatsApp status/about message
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string           true  "Session name"
// @Param        body   body      SetStatusRequest true  "Status data"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/status [put]
func (h *ProfileHandler) SetStatus(c *gin.Context) {
	name := c.Param("name")

	var req SetStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.whatsappService.SetStatusMessage(c.Request.Context(), name, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"status":  req.Status,
	})
}

// SetPushName godoc
// @Summary      Set display name
// @Description  Set WhatsApp display name (push name)
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string             true  "Session name"
// @Param        body   body      SetPushNameRequest true  "Name data"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/name [put]
func (h *ProfileHandler) SetPushName(c *gin.Context) {
	name := c.Param("name")

	var req SetPushNameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.whatsappService.SetPushName(c.Request.Context(), name, req.Name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"name":    req.Name,
	})
}

// SetProfilePicture godoc
// @Summary      Set profile picture
// @Description  Set WhatsApp profile picture
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string                   true  "Session name"
// @Param        body   body      SetProfilePictureRequest true  "Image data"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/picture [put]
func (h *ProfileHandler) SetProfilePicture(c *gin.Context) {
	name := c.Param("name")

	var req SetProfilePictureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imageData, err := base64.StdEncoding.DecodeString(req.Image)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base64 image"})
		return
	}

	pictureID, err := h.whatsappService.SetProfilePicture(c.Request.Context(), name, imageData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"pictureId": pictureID,
	})
}

// DeleteProfilePicture godoc
// @Summary      Delete profile picture
// @Description  Remove WhatsApp profile picture
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  GroupResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/picture [delete]
func (h *ProfileHandler) DeleteProfilePicture(c *gin.Context) {
	name := c.Param("name")

	if err := h.whatsappService.DeleteProfilePicture(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// GetPrivacySettings godoc
// @Summary      Get privacy settings
// @Description  Get WhatsApp privacy settings
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  GroupResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/privacy [get]
func (h *ProfileHandler) GetPrivacySettings(c *gin.Context) {
	name := c.Param("name")

	settings, err := h.whatsappService.GetPrivacySettings(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"settings": settings,
	})
}

// SetPrivacySettings godoc
// @Summary      Set privacy settings
// @Description  Set WhatsApp privacy settings
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string                  true  "Session name"
// @Param        body   body      PrivacySettingsRequest  true  "Privacy settings"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/privacy [put]
func (h *ProfileHandler) SetPrivacySettings(c *gin.Context) {
	name := c.Param("name")

	var req PrivacySettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	settings := map[string]string{
		"lastSeen":       req.LastSeen,
		"profilePicture": req.ProfilePicture,
		"status":         req.Status,
		"groupsAdd":      req.GroupsAdd,
	}

	if err := h.whatsappService.SetPrivacySettings(c.Request.Context(), name, settings, req.ReadReceipts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}
