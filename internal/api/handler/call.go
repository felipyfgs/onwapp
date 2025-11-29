package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type CallHandler struct {
	whatsappService *service.WhatsAppService
}

func NewCallHandler(whatsappService *service.WhatsAppService) *CallHandler {
	return &CallHandler{whatsappService: whatsappService}
}

// RejectCall godoc
// @Summary      Reject incoming call
// @Description  Reject an incoming WhatsApp call
// @Tags         call
// @Accept       json
// @Produce      json
// @Param        id     path      string               true  "Session name"
// @Param        body   body      dto.RejectCallRequest true  "Call data"
// @Success      200    {object}  dto.SuccessResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/calls/reject [post]
func (h *CallHandler) RejectCall(c *gin.Context) {
	name := c.Param("id")

	var req dto.RejectCallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.RejectCall(c.Request.Context(), name, req.CallFrom, req.CallID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true})
}
