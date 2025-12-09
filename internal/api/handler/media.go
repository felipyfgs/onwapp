package handler

import (
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"onwapp/internal/api/dto"
	"onwapp/internal/db"
	"onwapp/internal/service"
)

type MediaHandler struct {
	database     *db.Database
	mediaService *service.MediaService
	sessionSvc   *service.SessionService
}

func NewMediaHandler(database *db.Database, mediaService *service.MediaService, sessionSvc *service.SessionService) *MediaHandler {
	return &MediaHandler{
		database:     database,
		mediaService: mediaService,
		sessionSvc:   sessionSvc,
	}
}

// GetMedia godoc
// @Summary      Get media by message ID
// @Description  Get media information for a specific message
// @Tags         media
// @Produce      json
// @Param        session   path     string  true  "Session ID"
// @Param        messageId  query     string  true  "Message ID"
// @Success      200  {object}  dto.MediaResponse
// @Failure      404  {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/media/download [get]
func (h *MediaHandler) GetMedia(c *gin.Context) {
	sessionId := c.Param("session")
	messageID := c.Query("messageId")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "messageId query parameter is required"})
		return
	}

	session, err := h.sessionSvc.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	media, err := h.database.Media.GetByMsgID(c.Request.Context(), session.ID, messageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if media == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "media not found"})
		return
	}

	c.JSON(http.StatusOK, media)
}

// StreamMedia godoc
// @Summary      Stream media file
// @Description  Stream media file directly (redirects to storage URL or proxies the file)
// @Tags         media
// @Produce      application/octet-stream
// @Param        session   path     string  true  "Session ID"
// @Param        messageId  query     string  true  "Message ID"
// @Success      200  {file}    binary
// @Failure      404  {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/media/stream [get]
func (h *MediaHandler) StreamMedia(c *gin.Context) {
	sessionId := c.Param("session")
	messageID := c.Query("messageId")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "messageId query parameter is required"})
		return
	}

	session, err := h.sessionSvc.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	media, err := h.database.Media.GetByMsgID(c.Request.Context(), session.ID, messageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if media == nil || media.StorageURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "media not found or not yet downloaded"})
		return
	}

	// If storage URL is external (S3, etc), redirect to it
	if strings.HasPrefix(media.StorageURL, "http://") || strings.HasPrefix(media.StorageURL, "https://") {
		c.Redirect(http.StatusFound, media.StorageURL)
		return
	}

	// If it's a local file, proxy it
	req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, media.StorageURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch media"})
		return
	}
	defer resp.Body.Close()

	// Set content type
	contentType := media.MimeType
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	c.Header("Content-Type", contentType)

	// Copy the response body to the client
	_, _ = io.Copy(c.Writer, resp.Body)
}

// StreamMediaPublic godoc
// @Summary      Stream media file (public)
// @Description  Stream media file directly without authentication (for browser audio/video playback)
// @Tags         media
// @Produce      application/octet-stream
// @Param        session   path     string  true  "Session ID"
// @Param        messageId  query     string  true  "Message ID"
// @Success      200  {file}    binary
// @Failure      404  {object}  dto.ErrorResponse
// @Router       /public/{session}/media/stream [get]
func (h *MediaHandler) StreamMediaPublic(c *gin.Context) {
	sessionId := c.Param("session")
	messageID := c.Query("messageId")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "messageId query parameter is required"})
		return
	}

	session, err := h.sessionSvc.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	media, err := h.database.Media.GetByMsgID(c.Request.Context(), session.ID, messageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if media == nil || media.StorageURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "media not found or not yet downloaded"})
		return
	}

	// If storage URL is external (S3, etc), redirect to it
	if strings.HasPrefix(media.StorageURL, "http://") || strings.HasPrefix(media.StorageURL, "https://") {
		c.Redirect(http.StatusFound, media.StorageURL)
		return
	}

	// If it's a local file path, serve it
	c.File(media.StorageURL)
}

// ListPendingMedia godoc
// @Summary      List pending media downloads
// @Description  Get list of media files pending download
// @Tags         media
// @Produce      json
// @Param        session   path     string  true   "Session ID"
// @Param        limit  query    int     false  "Limit (default: 100)"
// @Success      200  {array}   dto.MediaResponse
// @Security     Authorization
// @Router       /sessions/{id}/media/pending [get]
func (h *MediaHandler) ListPendingMedia(c *gin.Context) {
	sessionId := c.Param("session")

	session, err := h.sessionSvc.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, parseErr := strconv.Atoi(l); parseErr == nil && parsed > 0 {
			limit = parsed
		}
	}

	medias, err := h.database.Media.GetPendingDownloads(c.Request.Context(), session.ID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"count": len(medias),
		"media": medias,
	})
}

// ProcessPendingMedia godoc
// @Summary      Process pending media downloads
// @Description  Download pending media from WhatsApp and upload to storage
// @Tags         media
// @Produce      json
// @Param        id         path     string  true   "Session ID"
// @Param        batchSize  query    int     false  "Batch size (default: 10)"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{id}/media/process [post]
func (h *MediaHandler) ProcessPendingMedia(c *gin.Context) {
	sessionId := c.Param("session")

	if h.mediaService == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "media service not configured"})
		return
	}

	session, err := h.sessionSvc.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	if session.Client == nil || !session.Client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session not connected"})
		return
	}

	batchSize := 10
	if bs := c.Query("batchSize"); bs != "" {
		if parsed, err := strconv.Atoi(bs); err == nil && parsed > 0 {
			batchSize = parsed
		}
	}

	success, failed := h.mediaService.ProcessPendingDownloads(c.Request.Context(), session.Client, session.ID, batchSize)

	c.JSON(http.StatusOK, gin.H{
		"success": success,
		"failed":  failed,
		"message": "Media processing completed",
	})
}

// ListMedia godoc
// @Summary      List all media for session
// @Description  Get list of all media files for a session
// @Tags         media
// @Produce      json
// @Param        id      path     string  true   "Session ID"
// @Param        limit   query    int     false  "Limit (default: 100)"
// @Param        offset  query    int     false  "Offset (default: 0)"
// @Success      200  {array}   dto.MediaResponse
// @Security     Authorization
// @Router       /sessions/{id}/media [get]
func (h *MediaHandler) ListMedia(c *gin.Context) {
	sessionId := c.Param("session")

	session, err := h.sessionSvc.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	limit := 100
	offset := 0

	if l := c.Query("limit"); l != "" {
		if parsed, parseErr := strconv.Atoi(l); parseErr == nil && parsed > 0 {
			limit = parsed
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsed, parseErr := strconv.Atoi(o); parseErr == nil && parsed >= 0 {
			offset = parsed
		}
	}

	medias, err := h.database.Media.GetBySessionID(c.Request.Context(), session.ID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"count":  len(medias),
		"limit":  limit,
		"offset": offset,
		"media":  medias,
	})
}

// RetryMediaDownload godoc
// @Summary      Retry downloading a specific media
// @Description  Force retry downloading media from WhatsApp (sends retry request if needed)
// @Tags         media
// @Produce      json
// @Param        session    path     string  true  "Session ID"
// @Param        messageId  query    string  true  "Message ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  dto.ErrorResponse
// @Failure      404  {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/media/retry [post]
func (h *MediaHandler) RetryMediaDownload(c *gin.Context) {
	sessionId := c.Param("session")
	messageID := c.Query("messageId")
	
	if messageID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "messageId query parameter is required"})
		return
	}

	if h.mediaService == nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "media service not configured"})
		return
	}

	session, err := h.sessionSvc.Get(sessionId)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "session not found"})
		return
	}

	if session.Client == nil || !session.Client.IsConnected() {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "session not connected"})
		return
	}

	// Get media from database
	media, err := h.database.Media.GetByMsgID(c.Request.Context(), session.ID, messageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if media == nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "media not found"})
		return
	}

	// Try to download
	go func() {
		ctx := c.Request.Context()
		
		// Attempt download
		err := h.mediaService.DownloadAndStore(ctx, session.Client, media, sessionId)
		
		// If media expired, send retry request automatically
		if err != nil && service.IsMediaExpiredError(err) {
			_ = h.mediaService.SendMediaRetryRequest(ctx, session.Client, media, sessionId)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Media download retry initiated",
		"msgId":   messageID,
	})
}
