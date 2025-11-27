package api

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"

	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

type Handler struct {
	sessionService *service.SessionService
}

func NewHandler(sessionService *service.SessionService) *Handler {
	return &Handler{sessionService: sessionService}
}

// SessionResponse represents session info response
type SessionResponse struct {
	Name   string `json:"name" example:"my-session"`
	Status string `json:"status" example:"connected"`
	JID    string `json:"jid,omitempty" example:"5511999999999@s.whatsapp.net"`
}

// ErrorResponse represents error response
type ErrorResponse struct {
	Error string `json:"error" example:"session not found"`
}

// MessageResponse represents message response
type MessageResponse struct {
	Message string `json:"message" example:"session deleted"`
}

// QRResponse represents QR code response
type QRResponse struct {
	QR       string `json:"qr" example:"2@ABC123..."`
	QRBase64 string `json:"qr_base64" example:"data:image/png;base64,..."`
	Status   string `json:"status" example:"qr"`
}

// Create godoc
// @Summary      Create a new session
// @Description  Create a new WhatsApp session with the given name
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      201    {object}  SessionResponse
// @Failure      409    {object}  ErrorResponse
// @Router       /sessions/{name}/create [post]
func (h *Handler) Create(c *gin.Context) {
	name := c.Param("name")

	session, err := h.sessionService.Create(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, SessionResponse{
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
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  MessageResponse
// @Failure      404    {object}  ErrorResponse
// @Router       /sessions/{name}/delete [delete]
func (h *Handler) Delete(c *gin.Context) {
	name := c.Param("name")

	if err := h.sessionService.Delete(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "session deleted"})
}

// Info godoc
// @Summary      Get session info
// @Description  Get information about a WhatsApp session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  SessionResponse
// @Failure      404    {object}  ErrorResponse
// @Router       /sessions/{name}/info [get]
func (h *Handler) Info(c *gin.Context) {
	name := c.Param("name")

	session, err := h.sessionService.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	resp := SessionResponse{
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
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  MessageResponse
// @Failure      500    {object}  ErrorResponse
// @Router       /sessions/{name}/connect [post]
func (h *Handler) Connect(c *gin.Context) {
	name := c.Param("name")

	session, qrChan, err := h.sessionService.Connect(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if qrChan != nil {
		go h.sessionService.HandleQRChannel(session, qrChan)
		c.JSON(http.StatusOK, gin.H{
			"message": "connecting, use /sessions/" + name + "/qr to get QR code",
			"status":  string(model.StatusConnecting),
		})
		return
	}

	if session.Client.IsConnected() {
		c.JSON(http.StatusOK, gin.H{
			"message": "already connected",
			"status":  string(session.GetStatus()),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "connected",
		"status":  string(model.StatusConnected),
	})
}

// Logout godoc
// @Summary      Logout session
// @Description  Logout from WhatsApp and clear session credentials
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  MessageResponse
// @Failure      500    {object}  ErrorResponse
// @Router       /sessions/{name}/logout [post]
func (h *Handler) Logout(c *gin.Context) {
	name := c.Param("name")

	if err := h.sessionService.Logout(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// Restart godoc
// @Summary      Restart session
// @Description  Disconnect and reconnect a WhatsApp session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  MessageResponse
// @Failure      500    {object}  ErrorResponse
// @Router       /sessions/{name}/restart [post]
func (h *Handler) Restart(c *gin.Context) {
	name := c.Param("name")

	session, err := h.sessionService.Restart(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "restarted",
		"status":  string(session.GetStatus()),
	})
}

// QR godoc
// @Summary      Get QR code
// @Description  Get QR code for WhatsApp authentication
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        name    path      string  true   "Session name"
// @Param        format  query     string  false  "Response format (json or image)"  default(json)
// @Success      200     {object}  QRResponse
// @Failure      404     {object}  ErrorResponse
// @Router       /sessions/{name}/qr [get]
func (h *Handler) QR(c *gin.Context) {
	name := c.Param("name")

	session, err := h.sessionService.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	qrCode := session.GetQR()
	if qrCode == "" {
		c.JSON(http.StatusNotFound, gin.H{
			"error":  "no QR code available",
			"status": string(session.GetStatus()),
		})
		return
	}

	format := c.DefaultQuery("format", "json")

	if format == "image" {
		png, err := qrcode.Encode(qrCode, qrcode.Medium, 256)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR image"})
			return
		}
		c.Data(http.StatusOK, "image/png", png)
		return
	}

	png, _ := qrcode.Encode(qrCode, qrcode.Medium, 256)
	base64Img := base64.StdEncoding.EncodeToString(png)

	c.JSON(http.StatusOK, gin.H{
		"qr":        qrCode,
		"qr_base64": "data:image/png;base64," + base64Img,
		"status":    string(session.GetStatus()),
	})
}
