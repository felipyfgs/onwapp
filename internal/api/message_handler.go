package api

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/service"
)

type MessageHandler struct {
	whatsappService *service.WhatsAppService
}

func NewMessageHandler(whatsappService *service.WhatsAppService) *MessageHandler {
	return &MessageHandler{whatsappService: whatsappService}
}

// Request/Response types

type SendTextRequest struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
	Text  string `json:"text" binding:"required" example:"Hello World"`
}

type SendImageRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Image    string `json:"image" binding:"required" example:"base64_encoded_image"`
	Caption  string `json:"caption" example:"Image caption"`
	MimeType string `json:"mimetype" example:"image/jpeg"`
}

type SendAudioRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Audio    string `json:"audio" binding:"required" example:"base64_encoded_audio"`
	PTT      bool   `json:"ptt" example:"true"`
	MimeType string `json:"mimetype" example:"audio/ogg; codecs=opus"`
}

type SendVideoRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Video    string `json:"video" binding:"required" example:"base64_encoded_video"`
	Caption  string `json:"caption" example:"Video caption"`
	MimeType string `json:"mimetype" example:"video/mp4"`
}

type SendDocumentRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Document string `json:"document" binding:"required" example:"base64_encoded_document"`
	Filename string `json:"filename" binding:"required" example:"document.pdf"`
	MimeType string `json:"mimetype" example:"application/pdf"`
}

type SendStickerRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Sticker  string `json:"sticker" binding:"required" example:"base64_encoded_sticker"`
	MimeType string `json:"mimetype" example:"image/webp"`
}

type SendLocationRequest struct {
	Phone     string  `json:"phone" binding:"required" example:"5511999999999"`
	Latitude  float64 `json:"latitude" binding:"required" example:"-23.5505"`
	Longitude float64 `json:"longitude" binding:"required" example:"-46.6333"`
	Name      string  `json:"name" example:"Location Name"`
	Address   string  `json:"address" example:"Street Address"`
}

type SendContactRequest struct {
	Phone        string `json:"phone" binding:"required" example:"5511999999999"`
	ContactName  string `json:"contactName" binding:"required" example:"John Doe"`
	ContactPhone string `json:"contactPhone" binding:"required" example:"5511888888888"`
}

type SendReactionRequest struct {
	Phone     string `json:"phone" binding:"required" example:"5511999999999"`
	MessageID string `json:"messageId" binding:"required" example:"ABCD1234"`
	Emoji     string `json:"emoji" binding:"required" example:"👍"`
}

type SendResponse struct {
	Success   bool   `json:"success" example:"true"`
	MessageID string `json:"messageId,omitempty" example:"ABCD1234"`
	Timestamp int64  `json:"timestamp,omitempty" example:"1699999999"`
}

// Handlers

// SendText godoc
// @Summary      Send text message
// @Description  Send a text message to a phone number
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string          true  "Session name"
// @Param        body   body      SendTextRequest true  "Message data"
// @Success      200    {object}  SendResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/text [post]
func (h *MessageHandler) SendText(c *gin.Context) {
	name := c.Param("name")

	var req SendTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.whatsappService.SendText(c.Request.Context(), name, req.Phone, req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendResponse{
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
// @Param        body   body      SendImageRequest true  "Image data"
// @Success      200    {object}  SendResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/image [post]
func (h *MessageHandler) SendImage(c *gin.Context) {
	name := c.Param("name")

	var req SendImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imageData, err := base64.StdEncoding.DecodeString(req.Image)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base64 image"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	resp, err := h.whatsappService.SendImage(c.Request.Context(), name, req.Phone, imageData, req.Caption, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendResponse{
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
// @Param        body   body      SendAudioRequest true  "Audio data"
// @Success      200    {object}  SendResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/audio [post]
func (h *MessageHandler) SendAudio(c *gin.Context) {
	name := c.Param("name")

	var req SendAudioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	audioData, err := base64.StdEncoding.DecodeString(req.Audio)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base64 audio"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "audio/ogg; codecs=opus"
	}

	resp, err := h.whatsappService.SendAudio(c.Request.Context(), name, req.Phone, audioData, mimeType, req.PTT)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendResponse{
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
// @Param        body   body      SendVideoRequest true  "Video data"
// @Success      200    {object}  SendResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/video [post]
func (h *MessageHandler) SendVideo(c *gin.Context) {
	name := c.Param("name")

	var req SendVideoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	videoData, err := base64.StdEncoding.DecodeString(req.Video)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base64 video"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "video/mp4"
	}

	resp, err := h.whatsappService.SendVideo(c.Request.Context(), name, req.Phone, videoData, req.Caption, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendResponse{
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
// @Param        body   body      SendDocumentRequest true  "Document data"
// @Success      200    {object}  SendResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/document [post]
func (h *MessageHandler) SendDocument(c *gin.Context) {
	name := c.Param("name")

	var req SendDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	docData, err := base64.StdEncoding.DecodeString(req.Document)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base64 document"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	resp, err := h.whatsappService.SendDocument(c.Request.Context(), name, req.Phone, docData, req.Filename, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendResponse{
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
// @Param        body   body      SendStickerRequest true  "Sticker data"
// @Success      200    {object}  SendResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/sticker [post]
func (h *MessageHandler) SendSticker(c *gin.Context) {
	name := c.Param("name")

	var req SendStickerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	stickerData, err := base64.StdEncoding.DecodeString(req.Sticker)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base64 sticker"})
		return
	}

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "image/webp"
	}

	resp, err := h.whatsappService.SendSticker(c.Request.Context(), name, req.Phone, stickerData, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendResponse{
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
// @Param        body   body      SendLocationRequest true  "Location data"
// @Success      200    {object}  SendResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/location [post]
func (h *MessageHandler) SendLocation(c *gin.Context) {
	name := c.Param("name")

	var req SendLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.whatsappService.SendLocation(c.Request.Context(), name, req.Phone, req.Latitude, req.Longitude, req.Name, req.Address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendResponse{
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
// @Param        body   body      SendContactRequest true  "Contact data"
// @Success      200    {object}  SendResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/contact [post]
func (h *MessageHandler) SendContact(c *gin.Context) {
	name := c.Param("name")

	var req SendContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.whatsappService.SendContact(c.Request.Context(), name, req.Phone, req.ContactName, req.ContactPhone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendResponse{
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
// @Param        body   body      SendReactionRequest true  "Reaction data"
// @Success      200    {object}  SendResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/reaction [post]
func (h *MessageHandler) SendReaction(c *gin.Context) {
	name := c.Param("name")

	var req SendReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.whatsappService.SendReaction(c.Request.Context(), name, req.Phone, req.MessageID, req.Emoji)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SendResponse{
		Success:   true,
		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}
