package handler

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"google.golang.org/protobuf/proto"

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
// @Router       /sessions/{name}/messages/text [post]
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
// @Router       /sessions/{name}/messages/image [post]
func (h *MessageHandler) SendImage(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	imageData, ok := DecodeBase64(c, req.Image, "image")
	if !ok {
		return
	}

	mimeType := GetMimeTypeOrDefault(req.MimeType, "image/jpeg")

	resp, err := h.whatsappService.SendImage(c.Request.Context(), name, req.Phone, imageData, req.Caption, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

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
// @Router       /sessions/{name}/messages/audio [post]
func (h *MessageHandler) SendAudio(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendAudioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	audioData, ok := DecodeBase64(c, req.Audio, "audio")
	if !ok {
		return
	}

	mimeType := GetMimeTypeOrDefault(req.MimeType, "audio/ogg; codecs=opus")

	resp, err := h.whatsappService.SendAudio(c.Request.Context(), name, req.Phone, audioData, mimeType, req.PTT)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

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
// @Router       /sessions/{name}/messages/video [post]
func (h *MessageHandler) SendVideo(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendVideoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	videoData, ok := DecodeBase64(c, req.Video, "video")
	if !ok {
		return
	}

	mimeType := GetMimeTypeOrDefault(req.MimeType, "video/mp4")

	resp, err := h.whatsappService.SendVideo(c.Request.Context(), name, req.Phone, videoData, req.Caption, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

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
// @Router       /sessions/{name}/messages/document [post]
func (h *MessageHandler) SendDocument(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	docData, ok := DecodeBase64(c, req.Document, "document")
	if !ok {
		return
	}

	mimeType := GetMimeTypeOrDefault(req.MimeType, "application/octet-stream")

	resp, err := h.whatsappService.SendDocument(c.Request.Context(), name, req.Phone, docData, req.Filename, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

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
// @Router       /sessions/{name}/messages/sticker [post]
func (h *MessageHandler) SendSticker(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendStickerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	stickerData, ok := DecodeBase64(c, req.Sticker, "sticker")
	if !ok {
		return
	}

	mimeType := GetMimeTypeOrDefault(req.MimeType, "image/webp")

	resp, err := h.whatsappService.SendSticker(c.Request.Context(), name, req.Phone, stickerData, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

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
// @Router       /sessions/{name}/messages/location [post]
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
// @Router       /sessions/{name}/messages/contact [post]
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
// @Router       /sessions/{name}/messages/reaction [post]
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

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SendPoll godoc
// @Summary      Send poll message
// @Description  Send a poll to a phone number
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string              true  "Session name"
// @Param        body   body      dto.SendPollRequest true  "Poll data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/messages/poll [post]
func (h *MessageHandler) SendPoll(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendPollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.SendPoll(c.Request.Context(), name, req.Phone, req.Name, req.Options, req.SelectableCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SendPollVote godoc
// @Summary      Vote in a poll
// @Description  Vote for options in an existing poll
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string                  true  "Session name"
// @Param        body   body      dto.SendPollVoteRequest true  "Vote data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/messages/poll/vote [post]
func (h *MessageHandler) SendPollVote(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendPollVoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.SendPollVote(c.Request.Context(), name, req.Phone, req.PollMessageID, req.SelectedOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SendButtons godoc
// @Summary      Send buttons message
// @Description  Send a message with buttons (max 3 buttons)
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string                 true  "Session name"
// @Param        body   body      dto.SendButtonsRequest true  "Buttons data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/messages/buttons [post]
func (h *MessageHandler) SendButtons(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendButtonsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	buttons := make([]whatsmeow.Button, len(req.Buttons))
	for i, btn := range req.Buttons {
		buttons[i] = whatsmeow.Button{
			ButtonID:    btn.ButtonID,
			DisplayText: btn.DisplayText,
		}
	}

	params := whatsmeow.ButtonsMessageParams{
		ContentText: req.ContentText,
		FooterText:  req.FooterText,
		HeaderText:  req.HeaderText,
		Buttons:     buttons,
	}

	resp, err := h.whatsappService.SendButtonsMessage(c.Request.Context(), name, req.Phone, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SendList godoc
// @Summary      Send list message
// @Description  Send a message with a selectable list
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string              true  "Session name"
// @Param        body   body      dto.SendListRequest true  "List data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/messages/list [post]
func (h *MessageHandler) SendList(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	sections := make([]whatsmeow.ListSection, len(req.Sections))
	for i, sec := range req.Sections {
		rows := make([]whatsmeow.ListRow, len(sec.Rows))
		for j, row := range sec.Rows {
			rows[j] = whatsmeow.ListRow{
				Title:       row.Title,
				Description: row.Description,
				RowID:       row.RowID,
			}
		}
		sections[i] = whatsmeow.ListSection{
			Title: sec.Title,
			Rows:  rows,
		}
	}

	params := whatsmeow.ListMessageParams{
		Title:       req.Title,
		Description: req.Description,
		ButtonText:  req.ButtonText,
		FooterText:  req.FooterText,
		Sections:    sections,
	}

	resp, err := h.whatsappService.SendListMessage(c.Request.Context(), name, req.Phone, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SendInteractive godoc
// @Summary      Send interactive message with native flow buttons
// @Description  Send an interactive message with buttons (quick_reply, cta_url, cta_call, cta_copy)
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string                     true  "Session name"
// @Param        body   body      dto.SendInteractiveRequest true  "Interactive data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/messages/interactive [post]
func (h *MessageHandler) SendInteractive(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendInteractiveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	buttons := make([]whatsmeow.NativeFlowButton, len(req.Buttons))
	for i, btn := range req.Buttons {
		buttons[i] = whatsmeow.NativeFlowButton{
			Name:   btn.Name,
			Params: btn.Params,
		}
	}

	params := whatsmeow.NativeFlowMessageParams{
		Title:   req.Title,
		Body:    req.Body,
		Footer:  req.Footer,
		Buttons: buttons,
	}

	resp, err := h.whatsappService.SendNativeFlowMessage(c.Request.Context(), name, req.Phone, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SendTemplate godoc
// @Summary      Send template message
// @Description  Send a message with template buttons (URL, Call, QuickReply). Works on Web and Mobile.
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string                   true  "Session name"
// @Param        body   body      dto.SendTemplateRequest  true  "Template data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/messages/template [post]
func (h *MessageHandler) SendTemplate(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	buttons := make([]whatsmeow.TemplateButton, len(req.Buttons))
	for i, btn := range req.Buttons {
		tb := whatsmeow.TemplateButton{Index: btn.Index}
		if btn.QuickReply != nil {
			tb.QuickReply = &whatsmeow.TemplateQuickReplyButton{
				DisplayText: btn.QuickReply.DisplayText,
				ID:          btn.QuickReply.ID,
			}
		}
		if btn.URLButton != nil {
			tb.URLButton = &whatsmeow.TemplateURLButton{
				DisplayText: btn.URLButton.DisplayText,
				URL:         btn.URLButton.URL,
			}
		}
		if btn.CallButton != nil {
			tb.CallButton = &whatsmeow.TemplateCallButton{
				DisplayText: btn.CallButton.DisplayText,
				PhoneNumber: btn.CallButton.PhoneNumber,
			}
		}
		buttons[i] = tb
	}

	params := whatsmeow.TemplateMessageParams{
		Title:   req.Title,
		Content: req.Content,
		Footer:  req.Footer,
		Buttons: buttons,
	}

	// Handle optional image
	if req.Image != "" {
		imageData, err := base64.StdEncoding.DecodeString(req.Image)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 image"})
			return
		}
		uploaded, err := h.whatsappService.UploadMedia(c.Request.Context(), name, imageData, whatsmeow.MediaImage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload image: " + err.Error()})
			return
		}
		mimeType := req.MimeType
		if mimeType == "" {
			mimeType = "image/jpeg"
		}
		params.ImageMessage = &waE2E.ImageMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(imageData))),
			Mimetype:      proto.String(mimeType),
		}
	}

	// Handle optional video
	if req.Video != "" {
		videoData, err := base64.StdEncoding.DecodeString(req.Video)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 video"})
			return
		}
		uploaded, err := h.whatsappService.UploadMedia(c.Request.Context(), name, videoData, whatsmeow.MediaVideo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload video: " + err.Error()})
			return
		}
		mimeType := req.MimeType
		if mimeType == "" {
			mimeType = "video/mp4"
		}
		params.VideoMessage = &waE2E.VideoMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(videoData))),
			Mimetype:      proto.String(mimeType),
		}
	}

	// Handle optional document
	if req.Document != "" {
		docData, err := base64.StdEncoding.DecodeString(req.Document)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 document"})
			return
		}
		uploaded, err := h.whatsappService.UploadMedia(c.Request.Context(), name, docData, whatsmeow.MediaDocument)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload document: " + err.Error()})
			return
		}
		mimeType := req.MimeType
		if mimeType == "" {
			mimeType = "application/pdf"
		}
		params.DocumentMessage = &waE2E.DocumentMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(docData))),
			Mimetype:      proto.String(mimeType),
			FileName:      proto.String(req.Filename),
		}
	}

	resp, err := h.whatsappService.SendTemplateMessage(c.Request.Context(), name, req.Phone, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SendCarousel godoc
// @Summary      Send carousel message
// @Description  Send an interactive carousel message with multiple cards, each with image/video and buttons
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        name   path      string                   true  "Session name"
// @Param        body   body      dto.SendCarouselRequest  true  "Carousel data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/messages/carousel [post]
func (h *MessageHandler) SendCarousel(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendCarouselRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	cards := make([]whatsmeow.CarouselCard, len(req.Cards))
	for i, card := range req.Cards {
		buttons := make([]whatsmeow.NativeFlowButton, len(card.Buttons))
		for j, btn := range card.Buttons {
			buttons[j] = whatsmeow.NativeFlowButton{
				Name:   btn.Name,
				Params: btn.Params,
			}
		}

		cardHeader := whatsmeow.CarouselCardHeader{
			Title: card.Header.Title,
		}

		// Handle card image
		if card.Header.Image != "" {
			imageData, err := base64.StdEncoding.DecodeString(card.Header.Image)
			if err != nil {
				c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 image in card"})
				return
			}
			uploaded, err := h.whatsappService.UploadMedia(c.Request.Context(), name, imageData, whatsmeow.MediaImage)
			if err != nil {
				c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload card image: " + err.Error()})
				return
			}
			mimeType := card.Header.MimeType
			if mimeType == "" {
				mimeType = "image/jpeg"
			}
			cardHeader.ImageMessage = &waE2E.ImageMessage{
				URL:           proto.String(uploaded.URL),
				DirectPath:    proto.String(uploaded.DirectPath),
				MediaKey:      uploaded.MediaKey,
				FileEncSHA256: uploaded.FileEncSHA256,
				FileSHA256:    uploaded.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(imageData))),
				Mimetype:      proto.String(mimeType),
			}
		}

		// Handle card video
		if card.Header.Video != "" {
			videoData, err := base64.StdEncoding.DecodeString(card.Header.Video)
			if err != nil {
				c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 video in card"})
				return
			}
			uploaded, err := h.whatsappService.UploadMedia(c.Request.Context(), name, videoData, whatsmeow.MediaVideo)
			if err != nil {
				c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload card video: " + err.Error()})
				return
			}
			mimeType := card.Header.MimeType
			if mimeType == "" {
				mimeType = "video/mp4"
			}
			cardHeader.VideoMessage = &waE2E.VideoMessage{
				URL:           proto.String(uploaded.URL),
				DirectPath:    proto.String(uploaded.DirectPath),
				MediaKey:      uploaded.MediaKey,
				FileEncSHA256: uploaded.FileEncSHA256,
				FileSHA256:    uploaded.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(videoData))),
				Mimetype:      proto.String(mimeType),
			}
		}

		cards[i] = whatsmeow.CarouselCard{
			Header:  cardHeader,
			Body:    card.Body,
			Footer:  card.Footer,
			Buttons: buttons,
		}
	}

	params := whatsmeow.CarouselMessageParams{
		Title:  req.Title,
		Body:   req.Body,
		Footer: req.Footer,
		Cards:  cards,
	}

	resp, err := h.whatsappService.SendCarouselMessage(c.Request.Context(), name, req.Phone, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}
