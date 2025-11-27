package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/service"
)

type ChatHandler struct {
	whatsappService *service.WhatsAppService
}

func NewChatHandler(whatsappService *service.WhatsAppService) *ChatHandler {
	return &ChatHandler{whatsappService: whatsappService}
}

// Request types

type ArchiveChatRequest struct {
	Phone   string `json:"phone" binding:"required" example:"5511999999999"`
	Archive bool   `json:"archive" example:"true"`
}

type DeleteMessageRequest struct {
	Phone     string `json:"phone" binding:"required" example:"5511999999999"`
	MessageID string `json:"messageId" binding:"required" example:"ABCD1234"`
	ForMe     bool   `json:"forMe" example:"false"`
}

type EditMessageRequest struct {
	Phone     string `json:"phone" binding:"required" example:"5511999999999"`
	MessageID string `json:"messageId" binding:"required" example:"ABCD1234"`
	NewText   string `json:"newText" binding:"required" example:"Edited message"`
}

// Handlers

// ArchiveChat godoc
// @Summary      Archive or unarchive a chat
// @Description  Archive or unarchive a WhatsApp chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        name   path      string             true  "Session name"
// @Param        body   body      ArchiveChatRequest true  "Archive data"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/chat/archive [post]
func (h *ChatHandler) ArchiveChat(c *gin.Context) {
	name := c.Param("name")

	var req ArchiveChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.whatsappService.ArchiveChat(c.Request.Context(), name, req.Phone, req.Archive); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	status := "unarchived"
	if req.Archive {
		status = "archived"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"status":  status,
	})
}

// DeleteMessage godoc
// @Summary      Delete a message
// @Description  Delete a message from a chat
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        name   path      string               true  "Session name"
// @Param        body   body      DeleteMessageRequest true  "Delete data"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/chat/delete [post]
func (h *ChatHandler) DeleteMessage(c *gin.Context) {
	name := c.Param("name")

	var req DeleteMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.whatsappService.DeleteMessage(c.Request.Context(), name, req.Phone, req.MessageID, req.ForMe)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"messageId": resp.ID,
		"timestamp": resp.Timestamp.Unix(),
	})
}

// EditMessage godoc
// @Summary      Edit a message
// @Description  Edit a previously sent message
// @Tags         chat
// @Accept       json
// @Produce      json
// @Param        name   path      string             true  "Session name"
// @Param        body   body      EditMessageRequest true  "Edit data"
// @Success      200    {object}  GroupResponse
// @Failure      400    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Failure      500    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/chat/edit [post]
func (h *ChatHandler) EditMessage(c *gin.Context) {
	name := c.Param("name")

	var req EditMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.whatsappService.EditMessage(c.Request.Context(), name, req.Phone, req.MessageID, req.NewText)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"messageId": resp.ID,
		"timestamp": resp.Timestamp.Unix(),
	})
}
