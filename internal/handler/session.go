package handler

import (
	"context"
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/session"
)

type SessionHandler struct {
	manager *session.Manager
}

func NewSessionHandler(manager *session.Manager) *SessionHandler {
	return &SessionHandler{manager: manager}
}

type SessionResponse struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	JID    string `json:"jid,omitempty"`
}

func (h *SessionHandler) Create(c *gin.Context) {
	name := c.Param("name")

	sess, err := h.manager.Create(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, SessionResponse{
		Name:   sess.Name,
		Status: string(sess.GetStatus()),
	})
}

func (h *SessionHandler) Delete(c *gin.Context) {
	name := c.Param("name")

	if err := h.manager.Delete(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "session deleted"})
}

func (h *SessionHandler) Info(c *gin.Context) {
	name := c.Param("name")

	sess, err := h.manager.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	resp := SessionResponse{
		Name:   sess.Name,
		Status: string(sess.GetStatus()),
	}

	if sess.Client.Store.ID != nil {
		resp.JID = sess.Client.Store.ID.String()
	}

	c.JSON(http.StatusOK, resp)
}

func (h *SessionHandler) Connect(c *gin.Context) {
	name := c.Param("name")

	sess, err := h.manager.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if sess.Client.IsConnected() {
		c.JSON(http.StatusOK, gin.H{"message": "already connected"})
		return
	}

	sess.SetStatus(session.StatusConnecting)

	if sess.Client.Store.ID == nil {
		qrChan, _ := sess.Client.GetQRChannel(context.Background())
		err = sess.Client.Connect()
		if err != nil {
			sess.SetStatus(session.StatusDisconnected)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		go h.handleQREvents(sess, qrChan)

		c.JSON(http.StatusOK, gin.H{
			"message": "connecting, use /sessions/" + name + "/qr to get QR code",
			"status":  string(session.StatusConnecting),
		})
		return
	}

	err = sess.Client.Connect()
	if err != nil {
		sess.SetStatus(session.StatusDisconnected)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sess.Client.AddEventHandler(func(evt interface{}) {
		switch evt.(type) {
		case *events.Connected:
			sess.SetStatus(session.StatusConnected)
		case *events.Disconnected:
			sess.SetStatus(session.StatusDisconnected)
		}
	})

	sess.SetStatus(session.StatusConnected)
	c.JSON(http.StatusOK, gin.H{
		"message": "connected",
		"status":  string(session.StatusConnected),
	})
}

func (h *SessionHandler) handleQREvents(sess *session.Session, qrChan <-chan whatsmeow.QRChannelItem) {
	sess.Client.AddEventHandler(func(evt interface{}) {
		switch evt.(type) {
		case *events.Connected:
			sess.SetStatus(session.StatusConnected)
			sess.SetQR("")
		case *events.Disconnected:
			sess.SetStatus(session.StatusDisconnected)
		}
	})

	for evt := range qrChan {
		if evt.Event == "code" {
			sess.SetQR(evt.Code)
			sess.SetStatus(session.StatusQR)
		} else if evt.Event == "success" {
			sess.SetStatus(session.StatusConnected)
			sess.SetQR("")
		} else if evt.Event == "timeout" {
			sess.SetStatus(session.StatusDisconnected)
			sess.SetQR("")
		}
	}
}

func (h *SessionHandler) Logout(c *gin.Context) {
	name := c.Param("name")

	sess, err := h.manager.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if err := sess.Client.Logout(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sess.SetStatus(session.StatusDisconnected)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func (h *SessionHandler) Restart(c *gin.Context) {
	name := c.Param("name")

	sess, err := h.manager.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if sess.Client.IsConnected() {
		sess.Client.Disconnect()
	}

	sess.SetStatus(session.StatusDisconnected)

	err = sess.Client.Connect()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sess.SetStatus(session.StatusConnected)
	c.JSON(http.StatusOK, gin.H{"message": "restarted", "status": string(sess.GetStatus())})
}

func (h *SessionHandler) QR(c *gin.Context) {
	name := c.Param("name")

	sess, err := h.manager.Get(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	qrCode := sess.GetQR()
	if qrCode == "" {
		c.JSON(http.StatusNotFound, gin.H{
			"error":  "no QR code available",
			"status": string(sess.GetStatus()),
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
		"qr":         qrCode,
		"qr_base64":  "data:image/png;base64," + base64Img,
		"status":     string(sess.GetStatus()),
	})
}
