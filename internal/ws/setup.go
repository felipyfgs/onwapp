package ws

import "github.com/gin-gonic/gin"

// AuthFunc is a function that validates the request and returns true if authorized
type AuthFunc func(c *gin.Context) bool

// Config holds WebSocket server configuration
type Config struct {
	// Auth is an optional authentication function
	Auth AuthFunc
}

// Server encapsulates the WebSocket hub and handler
type Server struct {
	hub     *Hub
	handler *Handler
	config  Config
}

// NewServer creates a new WebSocket server
func NewServer(cfg ...Config) *Server {
	var config Config
	if len(cfg) > 0 {
		config = cfg[0]
	}

	hub := NewHub()
	handler := NewHandler(hub)

	return &Server{
		hub:     hub,
		handler: handler,
		config:  config,
	}
}

// Start starts the hub's event loop (call this in a goroutine)
func (s *Server) Start() {
	s.hub.Run()
}

// Hub returns the hub for broadcasting messages
func (s *Server) Hub() *Hub {
	return s.hub
}

// RegisterRoutes registers WebSocket routes on the given router group
// Route: GET /:session/ws
func (s *Server) RegisterRoutes(group *gin.RouterGroup) {
	if s.config.Auth != nil {
		group.GET("/:session/ws", s.authMiddleware(), s.handler.Handle)
	} else {
		group.GET("/:session/ws", s.handler.Handle)
	}
}

// RegisterRoute registers a single WebSocket route
// Route: GET /ws (session from query param or header)
func (s *Server) RegisterRoute(r *gin.Engine, path string) {
	if s.config.Auth != nil {
		r.GET(path, s.authMiddleware(), s.handler.Handle)
	} else {
		r.GET(path, s.handler.Handle)
	}
}

// authMiddleware returns middleware that uses the configured auth function
func (s *Server) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if s.config.Auth != nil && !s.config.Auth(c) {
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
			return
		}
		c.Next()
	}
}

// Broadcast sends a message to all clients subscribed to a session
func (s *Server) Broadcast(sessionID, event string, data interface{}) {
	s.hub.Broadcast(sessionID, event, data)
}

// BroadcastJSON sends a pre-serialized JSON message
func (s *Server) BroadcastJSON(sessionID, event string, jsonData []byte) {
	s.hub.BroadcastJSON(sessionID, event, jsonData)
}

// BroadcastToAll sends a message to all connected clients
func (s *Server) BroadcastToAll(event string, data interface{}) {
	s.hub.BroadcastToAll(event, data)
}

// HasClients returns true if there are any clients connected for the session
func (s *Server) HasClients(sessionID string) bool {
	return s.hub.HasClients(sessionID)
}

// GetClientCount returns the number of connected clients for a session
func (s *Server) GetClientCount(sessionID string) int {
	return s.hub.GetClientCount(sessionID)
}

// GetTotalClientCount returns the total number of connected clients
func (s *Server) GetTotalClientCount() int {
	return s.hub.GetTotalClientCount()
}
