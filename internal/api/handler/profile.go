package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/types"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service/wpp"
)

type ProfileHandler struct {
	wpp *wpp.Service
}

func NewProfileHandler(wpp *wpp.Service) *ProfileHandler {
	return &ProfileHandler{wpp: wpp}
}

// GetProfile godoc
// @Summary      Get own profile info
// @Description  Get own WhatsApp profile information
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Success      200    {object}  dto.ProfileInfoResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/profile [get]
func (h *ProfileHandler) GetProfile(c *gin.Context) {
	sessionId := c.Param("sessionId")

	profile, err := h.wpp.GetOwnProfile(c.Request.Context(), sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ProfileInfoResponse{

		Profile: profile,
	})
}

// SetStatus godoc
// @Summary      Set status message
// @Description  Set WhatsApp status/about message
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SetStatusRequest   true  "Status data"
// @Success      200    {object}  dto.SetStatusResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/profile/status [patch]
func (h *ProfileHandler) SetStatus(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SetStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.SetStatusMessage(c.Request.Context(), sessionId, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SetStatusResponse(req))
}

// SetPushName godoc
// @Summary      Set display name
// @Description  Set WhatsApp display name (push name)
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SetPushNameRequest   true  "Name data"
// @Success      200    {object}  dto.SetNameResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/profile/name [patch]
func (h *ProfileHandler) SetPushName(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SetPushNameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.SetPushName(c.Request.Context(), sessionId, req.Name); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SetNameResponse(req))
}

// SetProfilePicture godoc
// @Summary      Set profile picture
// @Description  Set WhatsApp profile picture (supports JSON with base64/URL or multipart/form-data)
// @Tags         profile
// @Accept       json,mpfd
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SetProfilePictureRequest  false  "Image data (JSON)"
// @Param        file  formData  file  false  "Image file (form-data)"
// @Success      200    {object}  dto.SetPictureResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/profile/picture [put]
func (h *ProfileHandler) SetProfilePicture(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var imageData []byte
	var ok bool

	if IsMultipartRequest(c) {
		imageData, _, ok = GetMediaFromForm(c, "file")
		if !ok {
			return
		}
	} else {
		var req dto.SetProfilePictureRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
			return
		}
		imageData, _, ok = GetMediaData(c, req.Image, "image")
		if !ok {
			return
		}
	}

	pictureID, err := h.wpp.SetProfilePicture(c.Request.Context(), sessionId, imageData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SetPictureResponse{PictureID: pictureID})
}

// DeleteProfilePicture godoc
// @Summary      Delete profile picture
// @Description  Remove WhatsApp profile picture
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Success      200    {object}  object
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/profile/picture [delete]
func (h *ProfileHandler) DeleteProfilePicture(c *gin.Context) {
	sessionId := c.Param("sessionId")

	if err := h.wpp.DeleteProfilePicture(c.Request.Context(), sessionId); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// GetPrivacySettings godoc
// @Summary      Get privacy settings
// @Description  Get WhatsApp privacy settings
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Success      200    {object}  dto.PrivacySettingsResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/profile/privacy [get]
func (h *ProfileHandler) GetPrivacySettings(c *gin.Context) {
	sessionId := c.Param("sessionId")

	settings, err := h.wpp.GetPrivacySettings(c.Request.Context(), sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PrivacySettingsResponse{

		Settings: settings,
	})
}

// SetPrivacySettings godoc
// @Summary      Set privacy settings
// @Description  Set WhatsApp privacy settings
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SetPrivacyRequest   true  "Privacy settings"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/profile/privacy [put]
func (h *ProfileHandler) SetPrivacySettings(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SetPrivacyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	settingType := types.PrivacySettingType(req.Setting)
	value := types.PrivacySetting(req.Value)

	settings, err := h.wpp.SetPrivacySettings(c.Request.Context(), sessionId, settingType, value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PrivacySettingsResponse{

		Settings: settings,
	})
}

// SetDefaultDisappearingTimer godoc
// @Summary      Set default disappearing timer
// @Description  Set the default disappearing messages timer for new chats
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.DefaultDisappearingRequest true  "Timer data"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/profile/disappearing [patch]
func (h *ProfileHandler) SetDefaultDisappearingTimer(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.DefaultDisappearingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	timer, ok := ParseDisappearingTimer(c, req.Timer)
	if !ok {
		return
	}

	if err := h.wpp.SetDefaultDisappearingTimer(c.Request.Context(), sessionId, timer); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageOnlyResponse{Message: "default timer set to " + req.Timer})
}
