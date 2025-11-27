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

type SessionResponse struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	JID    string `json:"jid,omitempty"`
}

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

func (h *Handler) Delete(c *gin.Context) {
	name := c.Param("name")

	if err := h.sessionService.Delete(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "session deleted"})
}

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

func (h *Handler) Logout(c *gin.Context) {
	name := c.Param("name")

	if err := h.sessionService.Logout(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

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
