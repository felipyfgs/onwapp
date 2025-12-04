package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service/wpp"
)

type CallHandler struct {
	wpp *wpp.Service
}

func NewCallHandler(wpp *wpp.Service) *CallHandler {
	return &CallHandler{wpp: wpp}
}

// RejectCall godoc
// @Summary      Reject incoming call
// @Description  Reject an incoming WhatsApp call
// @Tags         call
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.RejectCallRequest true  "Call data"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/calls/reject [post]
func (h *CallHandler) RejectCall(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.RejectCallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.RejectCall(c.Request.Context(), sessionId, req.CallFrom, req.CallID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}
