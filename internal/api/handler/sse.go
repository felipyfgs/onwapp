package handler

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"onwapp/internal/api/sse"
	"onwapp/internal/logger"
)

// SSEHandler handles Server-Sent Events connections
type SSEHandler struct{}

// NewSSEHandler creates a new SSE handler
func NewSSEHandler() *SSEHandler {
	return &SSEHandler{}
}

// Events handles SSE connections for real-time updates
// @Summary Stream real-time events
// @Description Opens an SSE connection to receive real-time events for a session
// @Tags SSE
// @Produce text/event-stream
// @Param session path string true "Session ID"
// @Success 200 {string} string "Event stream"
// @Router /{session}/sse/events [get]
func (h *SSEHandler) Events(c *gin.Context) {
	sessionID := c.Param("session")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session ID required"})
		return
	}

	// Set headers for SSE
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	c.Writer.Header().Set("X-Accel-Buffering", "no") // Disable nginx buffering

	// Create client
	client := &sse.Client{
		SessionID: sessionID,
		Channel:   make(chan []byte, 64),
	}

	hub := sse.GetHub()
	hub.Register(client)

	logger.API().Info().
		Str("session", sessionID).
		Int("clients", hub.ClientCount(sessionID)).
		Msg("SSE client connected")

	// Send initial connection event
	fmt.Fprintf(c.Writer, "event: connected\ndata: {\"sessionId\":\"%s\"}\n\n", sessionID)
	c.Writer.Flush()

	// Cleanup on disconnect
	defer func() {
		hub.Unregister(client)
		logger.API().Info().
			Str("session", sessionID).
			Int("clients", hub.ClientCount(sessionID)).
			Msg("SSE client disconnected")
	}()

	// Keep-alive ticker
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Stream events
	clientGone := c.Request.Context().Done()
	for {
		select {
		case <-clientGone:
			return
		case <-ticker.C:
			// Send keep-alive comment
			fmt.Fprintf(c.Writer, ": keepalive\n\n")
			c.Writer.Flush()
		case data, ok := <-client.Channel:
			if !ok {
				return
			}
			fmt.Fprintf(c.Writer, "event: message\ndata: %s\n\n", data)
			c.Writer.Flush()
		}
	}
}

// Status returns the status of SSE connections
// @Summary Get SSE status
// @Description Returns statistics about SSE connections
// @Tags SSE
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /sse/status [get]
func (h *SSEHandler) Status(c *gin.Context) {
	hub := sse.GetHub()
	c.JSON(http.StatusOK, gin.H{
		"totalClients": hub.TotalClients(),
	})
}

// TestEvent sends a test event to a session (for debugging)
func (h *SSEHandler) TestEvent(c *gin.Context) {
	sessionID := c.Param("session")

	hub := sse.GetHub()
	hub.Broadcast(&sse.Event{
		Type:      sse.EventMessageNew,
		SessionID: sessionID,
		ChatJID:   "test@s.whatsapp.net",
		Data: map[string]interface{}{
			"msgId":     "test-123",
			"content":   "Test message",
			"timestamp": time.Now().Unix(),
		},
	})

	c.JSON(http.StatusOK, gin.H{
		"sent":    true,
		"clients": hub.ClientCount(sessionID),
	})
}

// StreamEventsProxy is a helper for proxying SSE through Next.js API routes
func StreamEventsProxy(w http.ResponseWriter, r *http.Request, sessionID string) {
	// Set headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	client := &sse.Client{
		SessionID: sessionID,
		Channel:   make(chan []byte, 64),
	}

	hub := sse.GetHub()
	hub.Register(client)
	defer hub.Unregister(client)

	// Send connected event
	fmt.Fprintf(w, "event: connected\ndata: {\"sessionId\":\"%s\"}\n\n", sessionID)
	flusher.Flush()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			fmt.Fprintf(w, ": keepalive\n\n")
			flusher.Flush()
		case data, ok := <-client.Channel:
			if !ok {
				return
			}
			fmt.Fprintf(w, "event: message\ndata: %s\n\n", data)
			flusher.Flush()
		}
	}
}

// Ensure SSEHandler implements io.Closer if needed
var _ io.Closer = (*closeHelper)(nil)

type closeHelper struct{}

func (c *closeHelper) Close() error { return nil }
