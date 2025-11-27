package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type PollHandler struct {
	whatsappService *service.WhatsAppService
}

func NewPollHandler(whatsappService *service.WhatsAppService) *PollHandler {
	return &PollHandler{whatsappService: whatsappService}
}

// SendPoll godoc
// @Summary      Send poll
// @Description  Send a poll to a phone number
// @Tags         Message
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        request body dto.SendPollRequest true "Poll data"
// @Success      200 {object} dto.SendResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/poll [post]
func (h *PollHandler) SendPoll(c *gin.Context) {
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
		Success:   true,
		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SendPollVote godoc
// @Summary      Vote in poll
// @Description  Vote in an existing poll
// @Tags         Message
// @Accept       json
// @Produce      json
// @Param        name path string true "Session name"
// @Param        request body dto.SendPollVoteRequest true "Vote data"
// @Success      200 {object} dto.SendResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/send/poll/vote [post]
func (h *PollHandler) SendPollVote(c *gin.Context) {
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
		Success:   true,
		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}
