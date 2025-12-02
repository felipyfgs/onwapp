package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	_ "zpwoot/internal/api/dto" // for swagger
	"zpwoot/internal/db"
	"zpwoot/internal/service"
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
// @Param        id     path     string  true  "Session ID"
// @Param        msgId  path     string  true  "Message ID"
// @Success      200  {object}  dto.MediaResponse
// @Failure      404  {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/media/{msgId} [get]
func (h *MediaHandler) GetMedia(c *gin.Context) {
	sessionName := c.Param("id")
	msgID := c.Param("msgId")

	session, err := h.sessionSvc.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	media, err := h.database.Media.GetByMsgID(c.Request.Context(), session.ID, msgID)
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

// ListPendingMedia godoc
// @Summary      List pending media downloads
// @Description  Get list of media files pending download
// @Tags         media
// @Produce      json
// @Param        id     path     string  true   "Session ID"
// @Param        limit  query    int     false  "Limit (default: 100)"
// @Success      200  {array}   dto.MediaResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/media/pending [get]
func (h *MediaHandler) ListPendingMedia(c *gin.Context) {
	sessionName := c.Param("id")

	session, err := h.sessionSvc.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
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
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/media/process [post]
func (h *MediaHandler) ProcessPendingMedia(c *gin.Context) {
	sessionName := c.Param("id")

	if h.mediaService == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "media service not configured"})
		return
	}

	session, err := h.sessionSvc.Get(sessionName)
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
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/media [get]
func (h *MediaHandler) ListMedia(c *gin.Context) {
	sessionName := c.Param("id")

	session, err := h.sessionSvc.Get(sessionName)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	limit := 100
	offset := 0

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
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
