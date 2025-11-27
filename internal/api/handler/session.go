package handler

import (
	"encoding/base64"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"

	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

type SessionHandler struct {
	sessionService *service.SessionService
}

func NewSessionHandler(sessionService *service.SessionService) *SessionHandler {
	return &SessionHandler{sessionService: sessionService}
}

// Fetch godoc
// @Summary      Fetch all sessions
// @Description  Get a list of all WhatsApp sessions
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Success      200    {array}   SessionResponse
// @Failure      401    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/fetch [get]
func (h *SessionHandler) Fetch(c *gin.Context) {
	sessions := h.sessionService.List()

	response := make([]SessionResponse, 0, len(sessions))
	for _, name := range sessions {
		sess, err := h.sessionService.Get(name)
		if err != nil {
			continue
		}
		resp := SessionResponse{
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
// @Param        name   path      string  true  "Session name"
// @Success      201    {object}  SessionResponse
// @Failure      409    {object}  ErrorResponse
// @Failure      401    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/create [post]
func (h *SessionHandler) Create(c *gin.Context) {
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
// @Failure      401    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/delete [delete]
func (h *SessionHandler) Delete(c *gin.Context) {
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
// @Failure      401    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/info [get]
func (h *SessionHandler) Info(c *gin.Context) {
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
// @Failure      401    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/connect [post]
func (h *SessionHandler) Connect(c *gin.Context) {
	name := c.Param("name")

	session, err := h.sessionService.Connect(c.Request.Context(), name)
	if err != nil {
		if err.Error() == fmt.Sprintf("session %s not found", name) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if session.Client.Store.ID == nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "connecting, check terminal for QR code or use /sessions/" + name + "/qr",
			"status":  string(model.StatusConnecting),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "connected",
		"status":  string(session.GetStatus()),
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
// @Failure      401    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/logout [post]
func (h *SessionHandler) Logout(c *gin.Context) {
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
// @Failure      401    {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/restart [post]
func (h *SessionHandler) Restart(c *gin.Context) {
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
// @Failure      401     {object}  ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/qr [get]
func (h *SessionHandler) QR(c *gin.Context) {
	name := c.Param("name")
	format := c.DefaultQuery("format", "json")

	session, err := h.sessionService.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	qr := session.GetQR()
	if qr == "" {
		c.JSON(http.StatusOK, QRResponse{
			Status: string(session.GetStatus()),
		})
		return
	}

	if format == "image" {
		png, err := qrcode.Encode(qr, qrcode.Medium, 256)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR image"})
			return
		}
		c.Data(http.StatusOK, "image/png", png)
		return
	}

	image, _ := qrcode.Encode(qr, qrcode.Medium, 256)
	base64QR := "data:image/png;base64," + base64.StdEncoding.EncodeToString(image)

	c.JSON(http.StatusOK, QRResponse{
		QR:     base64QR,
		Status: string(session.GetStatus()),
	})
}
