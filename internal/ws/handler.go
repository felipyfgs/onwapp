package ws

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"onwapp/internal/logger"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins
	},
}

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

	logger.Session().Debug().
		Str("sessionId", sessionID).
		Msg("WebSocket upgrade request received")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Session().Error().
			Err(err).
			Str("sessionId", sessionID).
			Msg("Failed to upgrade WebSocket connection")
		return
	}

	client := newClient(h.hub, conn, sessionID)
	h.hub.register <- client

	logger.Session().Info().
		Str("sessionId", sessionID).
		Msg("WebSocket client connected")

	go client.writePump()
	go client.readPump()
}

// Hub returns the hub instance
func (h *Handler) Hub() *Hub {
	return h.hub
}
