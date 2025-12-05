package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"onwapp/internal/api/dto"
	"onwapp/internal/db/repository"
	"onwapp/internal/service/wpp"
)

type SettingsHandler struct {
	settingsRepo *repository.SettingsRepository
	wpp          *wpp.Service
}

func NewSettingsHandler(settingsRepo *repository.SettingsRepository, wpp *wpp.Service) *SettingsHandler {
	return &SettingsHandler{
		settingsRepo: settingsRepo,
		wpp:          wpp,
	}
}

// GetSettings godoc
// @Summary      Get session settings
// @Description  Get all settings for a session (local + privacy synced from WhatsApp)
// @Tags         settings
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.SettingsResponse
// @Failure      404    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/settings [get]
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	sessionName := c.Param("session")

	settings, err := h.settingsRepo.GetBySessionName(c.Request.Context(), sessionName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "settings not found"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateSettings godoc
// @Summary      Update session settings
// @Description  Update settings for a session. Local settings are saved to DB. Privacy settings are applied to WhatsApp AND saved to DB.
// @Tags         settings
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SessionSettingsRequest  true  "Settings to update"
// @Success      200    {object}  dto.SettingsResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/settings [post]
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	sessionName := c.Param("session")

	var req dto.SessionSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	ctx := c.Request.Context()

	// Get current settings
	currentSettings, err := h.settingsRepo.GetBySessionName(ctx, sessionName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "settings not found"})
		return
	}

	// Build updates map
	updates := make(map[string]interface{})

	// Local settings (just save to DB)
	if req.AlwaysOnline != nil {
		updates["alwaysOnline"] = *req.AlwaysOnline
	}
	if req.AutoRejectCalls != nil {
		updates["autoRejectCalls"] = *req.AutoRejectCalls
	}
	if req.SyncHistory != nil {
		updates["syncHistory"] = *req.SyncHistory
	}

	// Privacy settings (apply to WhatsApp first, then save to DB)
	privacyUpdates := make(map[string]string)

	if req.LastSeen != nil {
		privacyUpdates["last_seen"] = *req.LastSeen
		updates["lastSeen"] = *req.LastSeen
	}
	if req.Online != nil {
		privacyUpdates["online"] = *req.Online
		updates["online"] = *req.Online
	}
	if req.ProfilePhoto != nil {
		privacyUpdates["profile"] = *req.ProfilePhoto
		updates["profilePhoto"] = *req.ProfilePhoto
	}
	if req.Status != nil {
		privacyUpdates["status"] = *req.Status
		updates["status"] = *req.Status
	}
	if req.ReadReceipts != nil {
		privacyUpdates["read_receipts"] = *req.ReadReceipts
		updates["readReceipts"] = *req.ReadReceipts
	}
	if req.GroupAdd != nil {
		privacyUpdates["group_add"] = *req.GroupAdd
		updates["groupAdd"] = *req.GroupAdd
	}
	if req.CallAdd != nil {
		privacyUpdates["call_add"] = *req.CallAdd
		updates["callAdd"] = *req.CallAdd
	}

	// Apply privacy settings to WhatsApp
	if len(privacyUpdates) > 0 {
		for setting, value := range privacyUpdates {
			if err := h.wpp.SetPrivacySettingByName(ctx, sessionName, setting, value); err != nil {
				c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to apply privacy setting " + setting + ": " + err.Error()})
				return
			}
		}
	}

	// Apply default disappearing timer to WhatsApp
	if req.DefaultDisappearingTimer != nil {
		if err := h.wpp.SetDefaultDisappearingTimerByName(ctx, sessionName, *req.DefaultDisappearingTimer); err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to set disappearing timer: " + err.Error()})
			return
		}
		updates["defaultDisappearingTimer"] = *req.DefaultDisappearingTimer
	}

	// Save to database
	updatedSettings, err := h.settingsRepo.Update(ctx, currentSettings.SessionID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedSettings)
}
