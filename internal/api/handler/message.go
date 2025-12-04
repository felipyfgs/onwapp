package handler

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"google.golang.org/protobuf/proto"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service/wpp"
)

type MessageHandler struct {
	wpp *wpp.Service
}

func NewMessageHandler(wpp *wpp.Service) *MessageHandler {
	return &MessageHandler{wpp: wpp}
}

// SendText godoc
// @Summary      Send text message
// @Description  Send a text message to a phone number
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendTextRequest true  "Message data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/text [post]
func (h *MessageHandler) SendText(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SendTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.SendText(c.Request.Context(), sessionId, req.Phone, req.Text)
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
// @Description  Send an image to a phone number (supports JSON with base64/URL or multipart/form-data)
// @Tags         messages
// @Accept       json,mpfd
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendImageRequest false  "Image data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        caption  formData  string  false  "Caption (form-data)"
// @Param        file  formData  file  false  "Image file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/image [post]
func (h *MessageHandler) SendImage(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var phone, caption, mimeType string
	var imageData []byte
	var detectedMime string
	var ok bool

	if IsMultipartRequest(c) {
		phone = c.PostForm("phone")
		caption = c.PostForm("caption")
		mimeType = c.PostForm("mimeType")
		imageData, detectedMime, ok = GetMediaFromForm(c, "file")
		if !ok {
			return
		}
	} else {
		var req dto.SendImageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
			return
		}
		phone = req.Phone
		caption = req.Caption
		mimeType = req.MimeType
		imageData, detectedMime, ok = GetMediaData(c, req.Image, "image")
		if !ok {
			return
		}
	}

	if phone == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "phone is required"})
		return
	}

	if mimeType == "" {
		mimeType = detectedMime
	}
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	resp, err := h.wpp.SendImage(c.Request.Context(), sessionId, phone, imageData, caption, mimeType, nil)
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
// @Description  Send an audio to a phone number (supports JSON with base64/URL or multipart/form-data)
// @Tags         messages
// @Accept       json,mpfd
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendAudioRequest false  "Audio data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        ptt  formData  bool  false  "Push to talk (form-data)"
// @Param        file  formData  file  false  "Audio file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/audio [post]
func (h *MessageHandler) SendAudio(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var phone, mimeType string
	var ptt bool
	var audioData []byte
	var detectedMime string
	var ok bool

	if IsMultipartRequest(c) {
		phone = c.PostForm("phone")
		mimeType = c.PostForm("mimeType")
		ptt = c.PostForm("ptt") == "true"
		audioData, detectedMime, ok = GetMediaFromForm(c, "file")
		if !ok {
			return
		}
	} else {
		var req dto.SendAudioRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
			return
		}
		phone = req.Phone
		mimeType = req.MimeType
		ptt = req.PTT
		audioData, detectedMime, ok = GetMediaData(c, req.Audio, "audio")
		if !ok {
			return
		}
	}

	if phone == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "phone is required"})
		return
	}

	if mimeType == "" {
		mimeType = detectedMime
	}
	if mimeType == "" {
		mimeType = "audio/ogg; codecs=opus"
	}

	resp, err := h.wpp.SendAudio(c.Request.Context(), sessionId, phone, audioData, mimeType, ptt, nil)
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
// @Description  Send a video to a phone number (supports JSON with base64/URL or multipart/form-data)
// @Tags         messages
// @Accept       json,mpfd
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendVideoRequest false  "Video data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        caption  formData  string  false  "Caption (form-data)"
// @Param        file  formData  file  false  "Video file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/video [post]
func (h *MessageHandler) SendVideo(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var phone, caption, mimeType string
	var videoData []byte
	var detectedMime string
	var ok bool

	if IsMultipartRequest(c) {
		phone = c.PostForm("phone")
		caption = c.PostForm("caption")
		mimeType = c.PostForm("mimeType")
		videoData, detectedMime, ok = GetMediaFromForm(c, "file")
		if !ok {
			return
		}
	} else {
		var req dto.SendVideoRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
			return
		}
		phone = req.Phone
		caption = req.Caption
		mimeType = req.MimeType
		videoData, detectedMime, ok = GetMediaData(c, req.Video, "video")
		if !ok {
			return
		}
	}

	if phone == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "phone is required"})
		return
	}

	if mimeType == "" {
		mimeType = detectedMime
	}
	if mimeType == "" {
		mimeType = "video/mp4"
	}

	resp, err := h.wpp.SendVideo(c.Request.Context(), sessionId, phone, videoData, caption, mimeType, nil)
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
// @Description  Send a document to a phone number (supports JSON with base64/URL or multipart/form-data)
// @Tags         messages
// @Accept       json,mpfd
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendDocumentRequest false  "Document data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        filename  formData  string  false  "Filename (form-data)"
// @Param        file  formData  file  false  "Document file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/document [post]
func (h *MessageHandler) SendDocument(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var phone, filename, mimeType string
	var docData []byte
	var detectedMime string
	var ok bool

	if IsMultipartRequest(c) {
		phone = c.PostForm("phone")
		filename = c.PostForm("filename")
		mimeType = c.PostForm("mimeType")
		docData, detectedMime, ok = GetMediaFromForm(c, "file")
		if !ok {
			return
		}
	} else {
		var req dto.SendDocumentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
			return
		}
		phone = req.Phone
		filename = req.Filename
		mimeType = req.MimeType
		docData, detectedMime, ok = GetMediaData(c, req.Document, "document")
		if !ok {
			return
		}
	}

	if phone == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "phone is required"})
		return
	}

	if mimeType == "" {
		mimeType = detectedMime
	}
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	resp, err := h.wpp.SendDocument(c.Request.Context(), sessionId, phone, docData, filename, mimeType, nil)
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
// @Description  Send a sticker to a phone number (supports JSON with base64/URL or multipart/form-data)
// @Tags         messages
// @Accept       json,mpfd
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendStickerRequest false  "Sticker data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        file  formData  file  false  "Sticker file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/sticker [post]
func (h *MessageHandler) SendSticker(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var phone, mimeType string
	var stickerData []byte
	var detectedMime string
	var ok bool

	if IsMultipartRequest(c) {
		phone = c.PostForm("phone")
		mimeType = c.PostForm("mimeType")
		stickerData, detectedMime, ok = GetMediaFromForm(c, "file")
		if !ok {
			return
		}
	} else {
		var req dto.SendStickerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
			return
		}
		phone = req.Phone
		mimeType = req.MimeType
		stickerData, detectedMime, ok = GetMediaData(c, req.Sticker, "sticker")
		if !ok {
			return
		}
	}

	if phone == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "phone is required"})
		return
	}

	if mimeType == "" {
		mimeType = detectedMime
	}
	if mimeType == "" {
		mimeType = "image/webp"
	}

	resp, err := h.wpp.SendSticker(c.Request.Context(), sessionId, phone, stickerData, mimeType)
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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendLocationRequest true  "Location data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/location [post]
func (h *MessageHandler) SendLocation(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SendLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.SendLocation(c.Request.Context(), sessionId, req.Phone, req.Latitude, req.Longitude, req.Name, req.Address)
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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendContactRequest true  "Contact data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/contact [post]
func (h *MessageHandler) SendContact(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SendContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.SendContact(c.Request.Context(), sessionId, req.Phone, req.ContactName, req.ContactPhone)
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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendReactionRequest true  "Reaction data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/reaction [post]
func (h *MessageHandler) SendReaction(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SendReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.SendReaction(c.Request.Context(), sessionId, req.Phone, req.MessageID, req.Emoji)
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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendPollRequest true  "Poll data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/poll [post]
func (h *MessageHandler) SendPoll(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SendPollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.SendPoll(c.Request.Context(), sessionId, req.Phone, req.Name, req.Options, req.SelectableCount)
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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendPollVoteRequest true  "Vote data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/poll/vote [post]
func (h *MessageHandler) SendPollVote(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SendPollVoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.SendPollVote(c.Request.Context(), sessionId, req.Phone, req.PollMessageID, req.SelectedOptions)
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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendButtonsRequest true  "Buttons data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/buttons [post]
func (h *MessageHandler) SendButtons(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

	resp, err := h.wpp.SendButtons(c.Request.Context(), sessionId, req.Phone, params)
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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendListRequest true  "List data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/list [post]
func (h *MessageHandler) SendList(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

	resp, err := h.wpp.SendList(c.Request.Context(), sessionId, req.Phone, params)
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
// @Description  Send an interactive message with buttons (quick_reply, cta_url, cta_call, cta_copy). Supports optional image/video header.
// @Tags         messages
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendInteractiveRequest true  "Interactive data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/interactive [post]
func (h *MessageHandler) SendInteractive(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

	// Handle optional image (supports URL or base64)
	if req.Image != "" {
		imageData, detectedMime, ok := GetMediaData(c, req.Image, "image")
		if !ok {
			return
		}
		uploaded, err := h.wpp.UploadMedia(c.Request.Context(), sessionId, imageData, whatsmeow.MediaImage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload image: " + err.Error()})
			return
		}
		mimeType := req.MimeType
		if mimeType == "" {
			mimeType = detectedMime
		}
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

	// Handle optional video (supports URL or base64)
	if req.Video != "" {
		videoData, detectedMime, ok := GetMediaData(c, req.Video, "video")
		if !ok {
			return
		}
		uploaded, err := h.wpp.UploadMedia(c.Request.Context(), sessionId, videoData, whatsmeow.MediaVideo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload video: " + err.Error()})
			return
		}
		mimeType := req.MimeType
		if mimeType == "" {
			mimeType = detectedMime
		}
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

	resp, err := h.wpp.SendNativeFlow(c.Request.Context(), sessionId, req.Phone, params)
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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendTemplateRequest  true  "Template data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/template [post]
func (h *MessageHandler) SendTemplate(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

	// Handle optional image (supports URL or base64)
	if req.Image != "" {
		imageData, detectedMime, ok := GetMediaData(c, req.Image, "image")
		if !ok {
			return
		}
		uploaded, err := h.wpp.UploadMedia(c.Request.Context(), sessionId, imageData, whatsmeow.MediaImage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload image: " + err.Error()})
			return
		}
		mimeType := req.MimeType
		if mimeType == "" {
			mimeType = detectedMime
		}
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

	// Handle optional video (supports URL or base64)
	if req.Video != "" {
		videoData, detectedMime, ok := GetMediaData(c, req.Video, "video")
		if !ok {
			return
		}
		uploaded, err := h.wpp.UploadMedia(c.Request.Context(), sessionId, videoData, whatsmeow.MediaVideo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload video: " + err.Error()})
			return
		}
		mimeType := req.MimeType
		if mimeType == "" {
			mimeType = detectedMime
		}
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

	// Handle optional document (supports URL or base64)
	if req.Document != "" {
		docData, detectedMime, ok := GetMediaData(c, req.Document, "document")
		if !ok {
			return
		}
		uploaded, err := h.wpp.UploadMedia(c.Request.Context(), sessionId, docData, whatsmeow.MediaDocument)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload document: " + err.Error()})
			return
		}
		mimeType := req.MimeType
		if mimeType == "" {
			mimeType = detectedMime
		}
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

	resp, err := h.wpp.SendTemplate(c.Request.Context(), sessionId, req.Phone, params)
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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendCarouselRequest  true  "Carousel data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/messages/carousel [post]
func (h *MessageHandler) SendCarousel(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

		// Handle card image (supports URL or base64)
		if card.Header.Image != "" {
			var imageData []byte
			var downloadErr error
			mimeType := card.Header.MimeType

			if IsURL(card.Header.Image) {
				// Download from URL
				var detectedMime string
				imageData, detectedMime, downloadErr = DownloadFromURL(card.Header.Image)
				if downloadErr != nil {
					c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "failed to download image from URL: " + downloadErr.Error()})
					return
				}
				if mimeType == "" {
					mimeType = detectedMime
				}
			} else {
				// Decode base64
				imageData, downloadErr = base64.StdEncoding.DecodeString(card.Header.Image)
				if downloadErr != nil {
					c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 image in card"})
					return
				}
			}

			uploaded, err := h.wpp.UploadMedia(c.Request.Context(), sessionId, imageData, whatsmeow.MediaImage)
			if err != nil {
				c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload card image: " + err.Error()})
				return
			}
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

		// Handle card video (supports URL or base64)
		if card.Header.Video != "" {
			var videoData []byte
			var downloadErr error
			mimeType := card.Header.MimeType

			if IsURL(card.Header.Video) {
				// Download from URL
				var detectedMime string
				videoData, detectedMime, downloadErr = DownloadFromURL(card.Header.Video)
				if downloadErr != nil {
					c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "failed to download video from URL: " + downloadErr.Error()})
					return
				}
				if mimeType == "" {
					mimeType = detectedMime
				}
			} else {
				// Decode base64
				videoData, downloadErr = base64.StdEncoding.DecodeString(card.Header.Video)
				if downloadErr != nil {
					c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid base64 video in card"})
					return
				}
			}

			uploaded, err := h.wpp.UploadMedia(c.Request.Context(), sessionId, videoData, whatsmeow.MediaVideo)
			if err != nil {
				c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to upload card video: " + err.Error()})
				return
			}
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

	resp, err := h.wpp.SendCarousel(c.Request.Context(), sessionId, req.Phone, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}
