package handler

import (
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/types"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type ProfileHandler struct {
	whatsappService *service.WhatsAppService
}

func NewProfileHandler(whatsappService *service.WhatsAppService) *ProfileHandler {
	return &ProfileHandler{whatsappService: whatsappService}
}

// GetProfile godoc
// @Summary      Get own profile info
// @Description  Get own WhatsApp profile information
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  dto.ProfileInfoResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile [get]
func (h *ProfileHandler) GetProfile(c *gin.Context) {
	name := c.Param("name")

	profile, err := h.whatsappService.GetOwnProfile(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ProfileInfoResponse{
		Success: true,
		Profile: profile,
	})
}

// SetStatus godoc
// @Summary      Set status message
// @Description  Set WhatsApp status/about message
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string                 true  "Session name"
// @Param        body   body      dto.SetStatusRequest   true  "Status data"
// @Success      200    {object}  dto.SetStatusResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/status [patch]
func (h *ProfileHandler) SetStatus(c *gin.Context) {
	name := c.Param("name")

	var req dto.SetStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.SetStatusMessage(c.Request.Context(), name, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SetStatusResponse{
		Success: true,
		Status:  req.Status,
	})
}

// SetPushName godoc
// @Summary      Set display name
// @Description  Set WhatsApp display name (push name)
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string                   true  "Session name"
// @Param        body   body      dto.SetPushNameRequest   true  "Name data"
// @Success      200    {object}  dto.SetNameResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/name [patch]
func (h *ProfileHandler) SetPushName(c *gin.Context) {
	name := c.Param("name")

	var req dto.SetPushNameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.SetPushName(c.Request.Context(), name, req.Name); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SetNameResponse{
		Success: true,
		Name:    req.Name,
	})
}

// SetProfilePicture godoc
// @Summary      Set profile picture
// @Description  Set WhatsApp profile picture
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string                        true  "Session name"
// @Param        body   body      dto.SetProfilePictureRequest  true  "Image data"
// @Success      200    {object}  dto.SetPictureResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/picture [put]
func (h *ProfileHandler) SetProfilePicture(c *gin.Context) {
	name := c.Param("name")

	var req dto.SetProfilePictureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	imageData, err := base64.StdEncoding.DecodeString(req.Image)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 image"})
		return
	}

	pictureID, err := h.whatsappService.SetProfilePicture(c.Request.Context(), name, imageData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SetPictureResponse{
		Success:   true,
		PictureID: pictureID,
	})
}

// DeleteProfilePicture godoc
// @Summary      Delete profile picture
// @Description  Remove WhatsApp profile picture
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  dto.SuccessResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/picture [delete]
func (h *ProfileHandler) DeleteProfilePicture(c *gin.Context) {
	name := c.Param("name")

	if err := h.whatsappService.DeleteProfilePicture(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
	})
}

// GetPrivacySettings godoc
// @Summary      Get privacy settings
// @Description  Get WhatsApp privacy settings
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  dto.PrivacySettingsResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/privacy [get]
func (h *ProfileHandler) GetPrivacySettings(c *gin.Context) {
	name := c.Param("name")

	settings, err := h.whatsappService.GetPrivacySettings(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PrivacySettingsResponse{
		Success:  true,
		Settings: settings,
	})
}

// SetPrivacySettings godoc
// @Summary      Set privacy settings
// @Description  Set WhatsApp privacy settings
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string                  true  "Session name"
// @Param        body   body      dto.SetPrivacyRequest   true  "Privacy settings"
// @Success      200    {object}  dto.SuccessResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/privacy [put]
func (h *ProfileHandler) SetPrivacySettings(c *gin.Context) {
	name := c.Param("name")

	var req dto.SetPrivacyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	settingType := types.PrivacySettingType(req.Setting)
	value := types.PrivacySetting(req.Value)

	settings, err := h.whatsappService.SetPrivacySettings(c.Request.Context(), name, settingType, value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PrivacySettingsResponse{
		Success:  true,
		Settings: settings,
	})
}

// SetDefaultDisappearingTimer godoc
// @Summary      Set default disappearing timer
// @Description  Set the default disappearing messages timer for new chats
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        name   path      string                        true  "Session name"
// @Param        body   body      dto.DefaultDisappearingRequest true  "Timer data"
// @Success      200    {object}  dto.SuccessResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/profile/disappearing [patch]
func (h *ProfileHandler) SetDefaultDisappearingTimer(c *gin.Context) {
	name := c.Param("name")

	var req dto.DefaultDisappearingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var timer time.Duration
	switch req.Timer {
	case "24h":
		timer = 24 * time.Hour
	case "7d":
		timer = 7 * 24 * time.Hour
	case "90d":
		timer = 90 * 24 * time.Hour
	case "off", "0":
		timer = 0
	default:
		parsed, err := time.ParseDuration(req.Timer)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid timer format. Use: 24h, 7d, 90d, off, or Go duration"})
			return
		}
		timer = parsed
	}

	if err := h.whatsappService.SetDefaultDisappearingTimer(c.Request.Context(), name, timer); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Message: "default timer set to " + req.Timer})
}
