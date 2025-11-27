package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type BlocklistHandler struct {
	whatsappService *service.WhatsAppService
}

func NewBlocklistHandler(whatsappService *service.WhatsAppService) *BlocklistHandler {
	return &BlocklistHandler{whatsappService: whatsappService}
}

// GetBlocklist godoc
// @Summary      Get blocklist
// @Description  Get list of blocked contacts
// @Tags         Blocklist
// @Produce      json
// @Param        name path string true "Session name"
// @Success      200 {object} dto.BlocklistResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/blocklist [get]
func (h *BlocklistHandler) GetBlocklist(c *gin.Context) {
	name := c.Param("name")

	blocklist, err := h.whatsappService.GetBlocklist(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	jids := make([]string, len(blocklist.JIDs))
	for i, jid := range blocklist.JIDs {
		jids[i] = jid.String()
	}

	c.JSON(http.StatusOK, dto.BlocklistResponse{
		Success: true,
		JIDs:    jids,
	})
}

// UpdateBlocklist godoc
// @Summary      Block or unblock contact
// @Description  Block or unblock a contact
// @Tags         Blocklist
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        request body dto.BlocklistRequest true "Block action"
// @Success      200 {object} dto.BlocklistActionResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/blocklist [post]
func (h *BlocklistHandler) UpdateBlocklist(c *gin.Context) {
	name := c.Param("name")

	var req dto.BlocklistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	block := req.Action == "block"
	_, err := h.whatsappService.UpdateBlocklist(c.Request.Context(), name, req.Phone, block)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.BlocklistActionResponse{
		Success: true,
		Action:  req.Action,
		Phone:   req.Phone,
	})
}
