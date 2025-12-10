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
// @Summary      WebSocket connection
// @Description  Establish WebSocket connection for real-time events
// @Tags         websocket
// @Param        session   path      string  true  "Session ID"
// @Success      101       "Switching Protocols"
// @Failure      400       {object}  object{error=string}
// @Failure      401       {object}  object{error=string}
// @Security     Authorization
// @Router       /{session}/ws [get]
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

// GetHub returns the hub instance
func (h *Handler) GetHub() *Hub {
	return h.hub
}
