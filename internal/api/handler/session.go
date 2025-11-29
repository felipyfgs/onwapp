package handler

import (
	"encoding/base64"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

type SessionHandler struct {
	sessionService  *service.SessionService
	whatsappService *service.WhatsAppService
}

func NewSessionHandler(sessionService *service.SessionService, whatsappService *service.WhatsAppService) *SessionHandler {
	return &SessionHandler{sessionService: sessionService, whatsappService: whatsappService}
}

// Fetch godoc
// @Summary      Fetch all sessions
// @Description  Get a list of all WhatsApp sessions
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Success      200    {array}   dto.SessionResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions [get]
func (h *SessionHandler) Fetch(c *gin.Context) {
	sessions := h.sessionService.List()

	response := make([]dto.SessionResponse, 0, len(sessions))
	for _, name := range sessions {
		sess, err := h.sessionService.Get(name)
		if err != nil {
			continue
		}
		resp := dto.SessionResponse{
			Name:   sess.Name,
			Status: string(sess.GetStatus()),
		}
		if sess.Client.Store.ID != nil {
			resp.JID = sess.Client.Store.ID.String()
		}
		response = append(response, resp)
	}

	c.JSON(http.StatusOK, response)
}

// Create godoc
// @Summary      Create a new session
// @Description  Create a new WhatsApp session with the given name
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Session name"
// @Success      201    {object}  dto.SessionResponse
// @Failure      409    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions [post]
func (h *SessionHandler) Create(c *gin.Context) {
	name := c.Param("id")

	session, err := h.sessionService.Create(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusConflict, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.SessionResponse{
		Name:   session.Name,
		Status: string(session.GetStatus()),
	})
}

// Delete godoc
// @Summary      Delete a session
// @Description  Delete an existing WhatsApp session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Session name"
// @Success      200    {object}  dto.MessageResponse
// @Failure      404    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id} [delete]
func (h *SessionHandler) Delete(c *gin.Context) {
	name := c.Param("id")

	if err := h.sessionService.Delete(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "session deleted"})
}

// Info godoc
// @Summary      Get session info
// @Description  Get information about a WhatsApp session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Session name"
// @Success      200    {object}  dto.SessionResponse
// @Failure      404    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id} [get]
func (h *SessionHandler) Info(c *gin.Context) {
	name := c.Param("id")

	session, err := h.sessionService.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp := dto.SessionResponse{
		Name:   session.Name,
		Status: string(session.GetStatus()),
	}

	if session.Client.Store.ID != nil {
		resp.JID = session.Client.Store.ID.String()
	}

	c.JSON(http.StatusOK, resp)
}

// Connect godoc
// @Summary      Connect session
// @Description  Connect a WhatsApp session. If not authenticated, returns QR code endpoint
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Session name"
// @Success      200    {object}  dto.MessageResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/connect [post]
func (h *SessionHandler) Connect(c *gin.Context) {
	name := c.Param("id")

	session, err := h.sessionService.Connect(c.Request.Context(), name)
	if err != nil {
		if err.Error() == fmt.Sprintf("session %s not found", name) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if session.Client.Store.ID == nil {
		c.JSON(http.StatusOK, dto.MessageResponse{
			Message: "connecting, check terminal for QR code or use /sessions/" + name + "/qr",
			Status:  string(model.StatusConnecting),
		})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "connected",
		Status:  string(session.GetStatus()),
	})
}

// Logout godoc
// @Summary      Logout session
// @Description  Logout from WhatsApp and clear session credentials
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Session name"
// @Success      200    {object}  dto.MessageResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/logout [post]
func (h *SessionHandler) Logout(c *gin.Context) {
	name := c.Param("id")

	if err := h.sessionService.Logout(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "logged out"})
}

// Restart godoc
// @Summary      Restart session
// @Description  Disconnect and reconnect a WhatsApp session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Session name"
// @Success      200    {object}  dto.MessageResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/restart [post]
func (h *SessionHandler) Restart(c *gin.Context) {
	name := c.Param("id")

	session, err := h.sessionService.Restart(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "restarted",
		Status:  string(session.GetStatus()),
	})
}

// QR godoc
// @Summary      Get QR code
// @Description  Get QR code for WhatsApp authentication
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        id      path      string  true   "Session name"
// @Param        format  query     string  false  "Response format (json or image)"  default(json)
// @Success      200     {object}  dto.QRResponse
// @Failure      404     {object}  dto.ErrorResponse
// @Failure      401     {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/qr [get]
func (h *SessionHandler) QR(c *gin.Context) {
	name := c.Param("id")
	format := c.DefaultQuery("format", "json")

	session, err := h.sessionService.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
		return
	}

	qr := session.GetQR()
	if qr == "" {
		c.JSON(http.StatusOK, dto.QRResponse{
			Status: string(session.GetStatus()),
		})
		return
	}

	if format == "image" {
		png, err := qrcode.Encode(qr, qrcode.Medium, 256)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to generate QR image"})
			return
		}
		c.Data(http.StatusOK, "image/png", png)
		return
	}

	image, _ := qrcode.Encode(qr, qrcode.Medium, 256)
	base64QR := "data:image/png;base64," + base64.StdEncoding.EncodeToString(image)

	c.JSON(http.StatusOK, dto.QRResponse{
		QR:     base64QR,
		Status: string(session.GetStatus()),
	})
}

// PairPhone godoc
// @Summary      Pair using phone number
// @Description  Pair WhatsApp session using phone number instead of QR code
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        id     path      string               true  "Session name"
// @Param        body   body      dto.PairPhoneRequest true  "Phone data"
// @Success      200    {object}  dto.PairPhoneResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{id}/pair/phone [post]
func (h *SessionHandler) PairPhone(c *gin.Context) {
	name := c.Param("id")

	var req dto.PairPhoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	code, err := h.whatsappService.PairPhone(c.Request.Context(), name, req.Phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PairPhoneResponse{
		Success: true,
		Code:    code,
	})
}
