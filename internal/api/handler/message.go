package handler

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"google.golang.org/protobuf/proto"

	"onwapp/internal/api/dto"
	"onwapp/internal/service/wpp"
	"onwapp/internal/util/media"
)

// Default MIME types for media
const (
	mimeJPEG = "image/jpeg"
	mimeMP4  = "video/mp4"
)

type MessageHandler struct {
	wpp *wpp.Service
}

func NewMessageHandler(wpp *wpp.Service) *MessageHandler {
	return &MessageHandler{wpp: wpp}
}

// mediaConfig configures how to handle a specific media type
type mediaConfig struct {
	mediaType   string
	defaultMime string
	formField   string
}

// mediaRequest holds parsed media request data
type mediaRequest struct {
	Phone        string
	Data         []byte
	Caption      string
	MimeType     string
	DetectedMime string
	PTT          bool
}

// parseMediaRequest extracts media data from JSON or multipart form
func (h *MessageHandler) parseMediaRequest(c *gin.Context, config mediaConfig) (*mediaRequest, error) {
	var req mediaRequest

	if IsMultipartRequest(c) {
		req.Phone = c.PostForm("phone")
		req.Caption = c.PostForm("caption")
		req.MimeType = c.PostForm("mimeType")
		req.PTT = c.PostForm("ptt") == "true"

		data, detectedMime, err := GetMediaFromForm(c.Request, config.formField)
		if err != nil {
			return nil, err
		}
		req.Data = data
		req.DetectedMime = detectedMime
	} else {
		// Parse JSON based on media type
		var jsonErr error
		switch config.mediaType {
		case "image":
			var imageReq dto.SendImageRequest
			jsonErr = c.ShouldBindJSON(&imageReq)
			if jsonErr == nil {
				req.Phone = imageReq.Phone
				req.Caption = imageReq.Caption
				req.MimeType = imageReq.MimeType
				data, detectedMime, err := GetMediaData(imageReq.Image, "image")
				if err != nil {
					return nil, err
				}
				req.Data = data
				req.DetectedMime = detectedMime
			}
		case "audio":
			var audioReq dto.SendAudioRequest
			jsonErr = c.ShouldBindJSON(&audioReq)
			if jsonErr == nil {
				req.Phone = audioReq.Phone
				req.PTT = audioReq.PTT
				data, detectedMime, err := GetMediaData(audioReq.Audio, "audio")
				if err != nil {
					return nil, err
				}
				req.Data = data
				req.DetectedMime = detectedMime
			}
		case "video":
			var videoReq dto.SendVideoRequest
			jsonErr = c.ShouldBindJSON(&videoReq)
			if jsonErr == nil {
				req.Phone = videoReq.Phone
				req.Caption = videoReq.Caption
				req.MimeType = videoReq.MimeType
				data, detectedMime, err := GetMediaData(videoReq.Video, "video")
				if err != nil {
					return nil, err
				}
				req.Data = data
				req.DetectedMime = detectedMime
			}
		case "document":
			var docReq dto.SendDocumentRequest
			jsonErr = c.ShouldBindJSON(&docReq)
			if jsonErr == nil {
				req.Phone = docReq.Phone
				req.MimeType = docReq.MimeType
				data, detectedMime, err := GetMediaData(docReq.Document, "document")
				if err != nil {
					return nil, err
				}
				req.Data = data
				req.DetectedMime = detectedMime
			}
		case "sticker":
			var stickerReq dto.SendStickerRequest
			jsonErr = c.ShouldBindJSON(&stickerReq)
			if jsonErr == nil {
				req.Phone = stickerReq.Phone
				req.MimeType = stickerReq.MimeType
				data, detectedMime, err := GetMediaData(stickerReq.Sticker, "sticker")
				if err != nil {
					return nil, err
				}
				req.Data = data
				req.DetectedMime = detectedMime
			}
		}

		if jsonErr != nil {
			return nil, jsonErr
		}
	}

	return &req, nil
}

// resolveMimeType resolves MIME type with fallbacks
func resolveMimeType(requested, detected, defaultMime string) string {
	if requested != "" {
		return requested
	}
	if detected != "" {
		return detected
	}
	return defaultMime
}

// sendMediaMessage handles sending any media type
func (h *MessageHandler) sendMediaMessage(c *gin.Context, config mediaConfig) {
	sessionID := c.Param("session")

	// Parse media request
	mediaReq, err := h.parseMediaRequest(c, config)
	if err != nil {
		respondBadRequest(c, "invalid media request", err)
		return
	}

	// Validate phone
	if mediaReq.Phone == "" {
		respondBadRequest(c, "phone is required", nil)
		return
	}

	// Resolve MIME type
	mimeType := resolveMimeType(mediaReq.MimeType, mediaReq.DetectedMime, config.defaultMime)

	// Send based on media type
	var resp whatsmeow.SendResponse
	switch config.mediaType {
	case "image":
		resp, err = h.wpp.SendImage(c.Request.Context(), sessionID, mediaReq.Phone, mediaReq.Data, mediaReq.Caption, mimeType, nil)
	case "audio":
		// Convert WebM to OGG for WhatsApp compatibility
		audioData := mediaReq.Data
		if media.IsWebMFormat(audioData, mimeType) {
			convertedData, convErr := media.ConvertWebMToOgg(audioData)
			if convErr != nil {
				respondInternalError(c, "failed to convert audio", convErr)
				return
			}
			audioData = convertedData
			mimeType = "audio/ogg; codecs=opus"
		}
		resp, err = h.wpp.SendAudio(c.Request.Context(), sessionID, mediaReq.Phone, audioData, mimeType, mediaReq.PTT, nil)
	case "video":
		resp, err = h.wpp.SendVideo(c.Request.Context(), sessionID, mediaReq.Phone, mediaReq.Data, mediaReq.Caption, mimeType, nil)
	case "document":
		resp, err = h.wpp.SendDocument(c.Request.Context(), sessionID, mediaReq.Phone, mediaReq.Data, "", mimeType, nil)
	case "sticker":
		resp, err = h.wpp.SendSticker(c.Request.Context(), sessionID, mediaReq.Phone, mediaReq.Data, mimeType)
	}

	if err != nil {
		respondInternalError(c, "failed to send "+config.mediaType, err)
		return
	}

	respondSuccess(c, dto.SendResponse{
		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SendText godoc
// @Summary      Send text message
// @Description  Send a text message to a phone number
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendTextRequest true  "Message data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/text [post]
func (h *MessageHandler) SendText(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.SendTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var quoted *wpp.QuotedMessage
	if req.Quoted != nil {
		quoted = &wpp.QuotedMessage{
			MessageID: req.Quoted.MessageID,
			ChatJID:   req.Quoted.ChatJID,
			SenderJID: req.Quoted.SenderJID,
		}
	}

	resp, err := h.wpp.SendTextQuoted(c.Request.Context(), sessionId, req.Phone, req.Text, quoted)
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
// @Tags         message
// @Accept       json,mpfd
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendImageRequest false  "Image data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        caption  formData  string  false  "Caption (form-data)"
// @Param        file  formData  file  false  "Image file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/image [post]
func (h *MessageHandler) SendImage(c *gin.Context) {
	h.sendMediaMessage(c, mediaConfig{
		mediaType:   "image",
		defaultMime: mimeJPEG,
		formField:   "file",
	})
}

// SendAudio godoc
// @Summary      Send audio message
// @Description  Send an audio to a phone number (supports JSON with base64/URL or multipart/form-data)
// @Tags         message
// @Accept       json,mpfd
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendAudioRequest false  "Audio data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        ptt  formData  bool  false  "Push to talk (form-data)"
// @Param        file  formData  file  false  "Audio file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/audio [post]
func (h *MessageHandler) SendAudio(c *gin.Context) {
	h.sendMediaMessage(c, mediaConfig{
		mediaType:   "audio",
		defaultMime: "audio/ogg; codecs=opus",
		formField:   "file",
	})
}

// SendVideo godoc
// @Summary      Send video message
// @Description  Send a video to a phone number (supports JSON with base64/URL or multipart/form-data)
// @Tags         message
// @Accept       json,mpfd
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendVideoRequest false  "Video data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        caption  formData  string  false  "Caption (form-data)"
// @Param        file  formData  file  false  "Video file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/video [post]
func (h *MessageHandler) SendVideo(c *gin.Context) {
	h.sendMediaMessage(c, mediaConfig{
		mediaType:   "video",
		defaultMime: mimeMP4,
		formField:   "file",
	})
}

// SendDocument godoc
// @Summary      Send document message
// @Description  Send a document to a phone number (supports JSON with base64/URL or multipart/form-data)
// @Tags         message
// @Accept       json,mpfd
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendDocumentRequest false  "Document data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        filename  formData  string  false  "Filename (form-data)"
// @Param        file  formData  file  false  "Document file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/document [post]
func (h *MessageHandler) SendDocument(c *gin.Context) {
	h.sendMediaMessage(c, mediaConfig{
		mediaType:   "document",
		defaultMime: "application/octet-stream",
		formField:   "file",
	})
}

// SendSticker godoc
// @Summary      Send sticker message
// @Description  Send a sticker to a phone number (supports JSON with base64/URL or multipart/form-data)
// @Tags         message
// @Accept       json,mpfd
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendStickerRequest false  "Sticker data (JSON)"
// @Param        phone  formData  string  false  "Phone number (form-data)"
// @Param        file  formData  file  false  "Sticker file (form-data)"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/sticker [post]
func (h *MessageHandler) SendSticker(c *gin.Context) {
	h.sendMediaMessage(c, mediaConfig{
		mediaType:   "sticker",
		defaultMime: "image/webp",
		formField:   "file",
	})
}

// SendLocation godoc
// @Summary      Send location message
// @Description  Send a location to a phone number
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendLocationRequest true  "Location data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/location [post]
func (h *MessageHandler) SendLocation(c *gin.Context) {
	sessionId := c.Param("session")

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
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendContactRequest true  "Contact data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/contact [post]
func (h *MessageHandler) SendContact(c *gin.Context) {
	sessionId := c.Param("session")

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
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendReactionRequest true  "Reaction data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/react [post]
func (h *MessageHandler) SendReaction(c *gin.Context) {
	sessionId := c.Param("session")

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
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendPollRequest true  "Poll data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/poll [post]
func (h *MessageHandler) SendPoll(c *gin.Context) {
	sessionId := c.Param("session")

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
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendPollVoteRequest true  "Vote data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/poll/vote [post]
func (h *MessageHandler) SendPollVote(c *gin.Context) {
	sessionId := c.Param("session")

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
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendButtonsRequest true  "Buttons data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/buttons [post]
func (h *MessageHandler) SendButtons(c *gin.Context) {
	sessionId := c.Param("session")

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
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendListRequest true  "List data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/list [post]
func (h *MessageHandler) SendList(c *gin.Context) {
	sessionId := c.Param("session")

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
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendInteractiveRequest true  "Interactive data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/interactive [post]
func (h *MessageHandler) SendInteractive(c *gin.Context) {
	sessionId := c.Param("session")

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
		imageData, detectedMime, err := GetMediaData(req.Image, "image")
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
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
			mimeType = mimeJPEG
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
		videoData, detectedMime, err := GetMediaData(req.Video, "video")
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
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
			mimeType = mimeMP4
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
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendTemplateRequest  true  "Template data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/template [post]
func (h *MessageHandler) SendTemplate(c *gin.Context) {
	sessionId := c.Param("session")

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
		imageData, detectedMime, err := GetMediaData(req.Image, "image")
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
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
			mimeType = mimeJPEG
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
		videoData, detectedMime, err := GetMediaData(req.Video, "video")
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
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
			mimeType = mimeMP4
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
		docData, detectedMime, err := GetMediaData(req.Document, "document")
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
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
// @Tags         message
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendCarouselRequest  true  "Carousel data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/message/send/carousel [post]
func (h *MessageHandler) SendCarousel(c *gin.Context) {
	sessionId := c.Param("session")

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
				mimeType = mimeJPEG
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
				mimeType = mimeMP4
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
