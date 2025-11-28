package handler

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"google.golang.org/protobuf/proto"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type StatusHandler struct {
	whatsappService *service.WhatsAppService
}

func NewStatusHandler(whatsappService *service.WhatsAppService) *StatusHandler {
	return &StatusHandler{whatsappService: whatsappService}
}

// SendStory godoc
// @Summary      Post a story
// @Description  Post a text or media story (status update visible to contacts)
// @Tags         status
// @Accept       json
// @Produce      json
// @Param        name   path      string               true  "Session name"
// @Param        body   body      dto.SendStatusRequest true  "Story data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/story [post]
func (h *StatusHandler) SendStory(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var msg *waE2E.Message

	if req.Text != "" {
		msg = &waE2E.Message{
			Conversation: proto.String(req.Text),
		}
	} else if req.Image != "" {
		imageData, err := base64.StdEncoding.DecodeString(req.Image)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 image"})
			return
		}
		_ = imageData
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "image status requires upload - use text status for now"})
		return
	} else {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "text or image required"})
		return
	}

	resp, err := h.whatsappService.SendStatus(c.Request.Context(), name, msg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{
		Success:   true,
		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// GetStatusPrivacy godoc
// @Summary      Get status privacy settings
// @Description  Get who can see your status updates
// @Tags         status
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  dto.StatusPrivacyResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/status/privacy [get]
func (h *StatusHandler) GetStatusPrivacy(c *gin.Context) {
	name := c.Param("name")

	privacy, err := h.whatsappService.GetStatusPrivacy(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.StatusPrivacyResponse{
		Success: true,
		Privacy: privacy,
	})
}
