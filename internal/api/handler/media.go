package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"onwapp/internal/api/dto"
	"onwapp/internal/db"
	"onwapp/internal/service"
)

type MediaHandler struct {
	database       *db.Database
	mediaService   *service.MediaService
	sessionSvc     *service.SessionService
	storageService *service.StorageService
}

func NewMediaHandler(database *db.Database, mediaService *service.MediaService, sessionSvc *service.SessionService, storageService *service.StorageService) *MediaHandler {
	return &MediaHandler{
		database:       database,
		mediaService:   mediaService,
		sessionSvc:     sessionSvc,
		storageService: storageService,
	}
}

func (h *MediaHandler) shouldProxyMedia(storageURL string) bool {
	if storageURL == "" {
		return false
	}

	lower := strings.ToLower(storageURL)

	isLocal := strings.Contains(lower, "localhost") ||
		strings.Contains(lower, "127.0.0.1") ||
		strings.Contains(lower, "::1") ||
		strings.Contains(lower, "192.168.") ||
		strings.Contains(lower, "10.0.") ||
		strings.Contains(lower, "172.16.")

	return isLocal
}

// @Summary      Get media by message ID
// @Description  Get media information for a specific message including storage URL, download status and metadata (type, mime, size, dimensions)
// @Tags         media
// @Produce      json
// @Param        session   path     string  true  "Session ID"
// @Param        messageId  query     string  true  "Message ID"
// @Success      200  {object}  dto.MediaResponse
// @Failure      400  {object}  dto.ErrorResponse  "Missing messageId parameter"
// @Failure      404  {object}  dto.ErrorResponse  "Session or media not found"
// @Failure      500  {object}  dto.ErrorResponse  "Internal server error"
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

// @Summary      Stream media file
// @Description  Stream media file directly. Automatically proxies local files or redirects to external storage URLs. Supports video streaming and audio playback in browsers.
// @Tags         media
// @Produce      application/octet-stream
// @Param        session   path     string  true  "Session ID"
// @Param        messageId  query     string  true  "Message ID"
// @Success      200  {file}    binary "Media file (image, video, audio, document)"
// @Failure      400  {object}  dto.ErrorResponse  "Missing messageId parameter"
// @Failure      404  {object}  dto.ErrorResponse  "Session or media not found/not downloaded"
// @Failure      500  {object}  dto.ErrorResponse  "Storage service not configured or streaming failed"
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

	if h.shouldProxyMedia(media.StorageURL) {
		if h.storageService == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "storage service not configured"})
			return
		}

		err := h.storageService.StreamObject(c.Request.Context(), c.Writer, media.StorageURL, media.MimeType, func(contentType string, size int64) {
			c.Header("Content-Type", contentType)
			c.Header("Content-Length", strconv.FormatInt(size, 10))
			c.Header("Cache-Control", "public, max-age=31536000")
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to stream media"})
			return
		}
	} else {
		c.Redirect(http.StatusFound, media.StorageURL)
	}
}

// @Summary      Stream media file (public)
// @Description  Stream media file directly without authentication. Useful for embedding media in browsers and external applications. Uses same authorization as internal endpoint.
// @Tags         media
// @Produce      application/octet-stream
// @Param        session   path     string  true  "Session ID"
// @Param        messageId  query     string  true  "Message ID"
// @Success      200  {file}    binary "Media file (for browser playback)"
// @Failure      400  {object}  dto.ErrorResponse  "Missing messageId parameter"
// @Failure      404  {object}  dto.ErrorResponse  "Session or media not found/not downloaded"
// @Failure      500  {object}  dto.ErrorResponse  "Storage service not configured"
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

	if h.shouldProxyMedia(media.StorageURL) {
		if h.storageService == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "storage service not configured"})
			return
		}

		err := h.storageService.StreamObject(c.Request.Context(), c.Writer, media.StorageURL, media.MimeType, func(contentType string, size int64) {
			c.Header("Content-Type", contentType)
			c.Header("Content-Length", strconv.FormatInt(size, 10))
			c.Header("Cache-Control", "public, max-age=31536000")
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to stream media"})
			return
		}
	} else {
		c.Redirect(http.StatusFound, media.StorageURL)
	}
}

// @Summary      List pending media downloads
// @Description  Get list of media files that have not been downloaded yet. Useful for monitoring and batch processing.
// @Tags         media
// @Produce      json
// @Param        session   path     string  true   "Session ID"
// @Param        limit     query    int     false  "Limit (default: 100, max: 500)"
// @Success      200  {object}  map[string]interface{}  "Media list with count"
// @Failure      404  {object}  dto.ErrorResponse  "Session not found"
// @Failure      500  {object}  dto.ErrorResponse  "Database error"
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

// @Summary      Process pending media downloads
// @Description  Download pending media from WhatsApp and upload to storage. Runs asynchronously in batches. Returns success/failed counts immediately.
// @Tags         media
// @Produce      json
// @Param        session    path     string  true   "Session ID"
// @Param        batchSize  query    int     false  "Batch size (default: 10, max: 50)"
// @Success      200  {object}  map[string]interface{}  "Processing results with success/failed counts"
// @Failure      400  {object}  dto.ErrorResponse  "Session not connected or service not configured"
// @Failure      404  {object}  dto.ErrorResponse  "Session not found"
// @Security     Authorization
// @Router       /sessions/{session}/media/process [post]
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

// @Summary      List all media for session
// @Description  Get list of all media files (downloaded and pending) for a session with pagination support
// @Tags         media
// @Produce      json
// @Param        session   path     string  true   "Session ID"
// @Param        limit     query    int     false  "Limit (default: 100, max: 500)"
// @Param        offset    query    int     false  "Offset (default: 0)"
// @Success      200  {object}  map[string]interface{}  "Media list with pagination info"
// @Failure      404  {object}  dto.ErrorResponse  "Session not found"
// @Failure      500  {object}  dto.ErrorResponse  "Database error"
// @Security     Authorization
// @Router       /sessions/{session}/media [get]
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

// @Summary      Retry downloading a specific media
// @Description  Force retry downloading media from WhatsApp. Useful when media download failed initially or expired. Runs asynchronously and returns immediately.
// @Tags         media
// @Produce      json
// @Param        session    path     string  true  "Session ID"
// @Param        messageId  query    string  true  "Message ID"
// @Success      200  {object}  map[string]interface{}  "Retry initiated successfully"
// @Failure      400  {object}  dto.ErrorResponse  "Missing messageId or session not connected"
// @Failure      404  {object}  dto.ErrorResponse  "Session or media not found"
// @Failure      500  {object}  dto.ErrorResponse  "Media service not configured"
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

	media, err := h.database.Media.GetByMsgID(c.Request.Context(), session.ID, messageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if media == nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "media not found"})
		return
	}

	go func() {
		ctx := c.Request.Context()

		err := h.mediaService.DownloadAndStore(ctx, session.Client, media, sessionId)

		if err != nil && service.IsMediaExpiredError(err) {
			_ = h.mediaService.SendMediaRetryRequest(ctx, session.Client, media, sessionId)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Media download retry initiated",
		"msgId":   messageID,
	})
}
