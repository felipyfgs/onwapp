package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"google.golang.org/protobuf/proto"

	"onwapp/internal/api/dto"
	"onwapp/internal/service/wpp"
)

type StatusHandler struct {
	wpp *wpp.Service
}

func NewStatusHandler(wpp *wpp.Service) *StatusHandler {
	return &StatusHandler{wpp: wpp}
}

// SendStory godoc
// @Summary      Post a story
// @Description  Post a text or media story (status update visible to contacts). Supports JSON with base64/URL or multipart/form-data.
// @Tags         status
// @Accept       json,mpfd
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendStatusRequest false  "Story data (JSON)"
// @Param        text  formData  string  false  "Text content (form-data)"
// @Param        file  formData  file  false  "Image file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/status/send [post]
func (h *StatusHandler) SendStory(c *gin.Context) {
	sessionId := c.Param("session")

	var text, image string
	var imageData []byte

	if IsMultipartRequest(c) {
		text = c.PostForm("text")
		if file, _, err := c.Request.FormFile("file"); err == nil {
			defer file.Close()
			// Image from form-data - not yet fully supported
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "image status requires upload - use text status for now"})
			return
		}
	} else {
		var req dto.SendStatusRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
			return
		}
		text = req.Text
		image = req.Image
	}

	var msg *waE2E.Message

	if text != "" {
		msg = &waE2E.Message{
			Conversation: proto.String(text),
		}
	} else if image != "" {
		imageData, _, _ = GetMediaData(image, "image")
		_ = imageData
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "image status requires upload - use text status for now"})
		return
	} else {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "text or image required"})
		return
	}

	resp, err := h.wpp.SendStatus(c.Request.Context(), sessionId, msg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// GetStatusPrivacy godoc
// @Summary      Get status privacy settings
// @Description  Get who can see your status updates
// @Tags         status
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.StatusPrivacyResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/status/privacy [get]
func (h *StatusHandler) GetStatusPrivacy(c *gin.Context) {
	sessionId := c.Param("session")

	privacy, err := h.wpp.GetStatusPrivacy(c.Request.Context(), sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.StatusPrivacyResponse{

		Privacy: privacy,
	})
}
