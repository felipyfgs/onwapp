package handler

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type MessageHandler struct {
	whatsappService *service.WhatsAppService
}

func NewMessageHandler(whatsappService *service.WhatsAppService) *MessageHandler {
	return &MessageHandler{whatsappService: whatsappService}
}

// SendText godoc
// @Summary      Send text message
// @Description  Send a text message to a phone number
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string          true  "Session name"
// @Param        body   body      dto.SendTextRequest true  "Message data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/text [post]
func (h *MessageHandler) SendText(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.SendText(c.Request.Context(), name, req.Phone, req.Text)
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

// SendImage godoc
// @Summary      Send image message
// @Description  Send an image to a phone number (base64 encoded)
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string           true  "Session name"
// @Param        body   body      dto.SendImageRequest true  "Image data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/image [post]
func (h *MessageHandler) SendImage(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	imageData, err := base64.StdEncoding.DecodeString(req.Image)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 image"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	resp, err := h.whatsappService.SendImage(c.Request.Context(), name, req.Phone, imageData, req.Caption, mimeType)
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

// SendAudio godoc
// @Summary      Send audio message
// @Description  Send an audio to a phone number (base64 encoded)
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string           true  "Session name"
// @Param        body   body      dto.SendAudioRequest true  "Audio data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/audio [post]
func (h *MessageHandler) SendAudio(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendAudioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	audioData, err := base64.StdEncoding.DecodeString(req.Audio)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 audio"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "audio/ogg; codecs=opus"
	}

	resp, err := h.whatsappService.SendAudio(c.Request.Context(), name, req.Phone, audioData, mimeType, req.PTT)
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

// SendVideo godoc
// @Summary      Send video message
// @Description  Send a video to a phone number (base64 encoded)
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string           true  "Session name"
// @Param        body   body      dto.SendVideoRequest true  "Video data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/video [post]
func (h *MessageHandler) SendVideo(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendVideoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	videoData, err := base64.StdEncoding.DecodeString(req.Video)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 video"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "video/mp4"
	}

	resp, err := h.whatsappService.SendVideo(c.Request.Context(), name, req.Phone, videoData, req.Caption, mimeType)
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

// SendDocument godoc
// @Summary      Send document message
// @Description  Send a document to a phone number (base64 encoded)
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string              true  "Session name"
// @Param        body   body      dto.SendDocumentRequest true  "Document data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/document [post]
func (h *MessageHandler) SendDocument(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	docData, err := base64.StdEncoding.DecodeString(req.Document)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 document"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	resp, err := h.whatsappService.SendDocument(c.Request.Context(), name, req.Phone, docData, req.Filename, mimeType)
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

// SendSticker godoc
// @Summary      Send sticker message
// @Description  Send a sticker to a phone number (base64 encoded webp)
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string             true  "Session name"
// @Param        body   body      dto.SendStickerRequest true  "Sticker data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/sticker [post]
func (h *MessageHandler) SendSticker(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendStickerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	stickerData, err := base64.StdEncoding.DecodeString(req.Sticker)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 sticker"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "image/webp"
	}

	resp, err := h.whatsappService.SendSticker(c.Request.Context(), name, req.Phone, stickerData, mimeType)
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

// SendLocation godoc
// @Summary      Send location message
// @Description  Send a location to a phone number
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string              true  "Session name"
// @Param        body   body      dto.SendLocationRequest true  "Location data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/location [post]
func (h *MessageHandler) SendLocation(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.SendLocation(c.Request.Context(), name, req.Phone, req.Latitude, req.Longitude, req.Name, req.Address)
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

// SendContact godoc
// @Summary      Send contact message
// @Description  Send a contact card to a phone number
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string             true  "Session name"
// @Param        body   body      dto.SendContactRequest true  "Contact data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/contact [post]
func (h *MessageHandler) SendContact(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.SendContact(c.Request.Context(), name, req.Phone, req.ContactName, req.ContactPhone)
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

// SendReaction godoc
// @Summary      Send reaction to message
// @Description  Send a reaction emoji to a message
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string              true  "Session name"
// @Param        body   body      dto.SendReactionRequest true  "Reaction data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/reaction [post]
func (h *MessageHandler) SendReaction(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.SendReaction(c.Request.Context(), name, req.Phone, req.MessageID, req.Emoji)
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
