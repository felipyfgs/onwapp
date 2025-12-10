package ws

import (
	"net/http"

	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"

	"onwapp/internal/logger"
)

// Handler handles WebSocket HTTP requests
type Handler struct {
	hub *Hub
}

// NewHandler creates a new WebSocket handler with the given hub
func NewHandler(hub *Hub) *Handler {
	return &Handler{hub: hub}
}

// Handle handles WebSocket upgrade requests
func (h *Handler) Handle(c *gin.Context) {
	sessionID := c.Param("session")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session ID required"})
		return
	}

	conn, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		logger.Session().Error().
			Err(err).
			Str("sessionId", sessionID).
			Msg("Failed to accept WebSocket connection")
		return
	}

	client := newClient(h.hub, conn, sessionID)
	h.hub.register <- client

	go client.writePump()
	go client.readPump()
}

// Hub returns the hub instance
func (h *Handler) Hub() *Hub {
	return h.hub
}
