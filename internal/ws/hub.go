package ws

import (
	"encoding/json"
	"sync"

	"onwapp/internal/logger"
)

const broadcastBuffer = 256

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients by session ID
	clients map[string]map[*Client]bool

	// Inbound messages from clients to broadcast
	broadcast chan Message

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe access to clients map
	mu sync.RWMutex
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		broadcast:  make(chan Message, broadcastBuffer),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub's event loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastMessage(message)
		}
	}
}

func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[client.sessionID] == nil {
		h.clients[client.sessionID] = make(map[*Client]bool)
	}
	h.clients[client.sessionID][client] = true

	logger.Session().Debug().
		Str("sessionId", client.sessionID).
		Int("totalClients", len(h.clients[client.sessionID])).
		Msg("WebSocket client connected")
}

func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.clients[client.sessionID]; ok {
		if _, ok := clients[client]; ok {
			delete(clients, client)
			close(client.send)
			if len(clients) == 0 {
				delete(h.clients, client.sessionID)
			}
		}
	}

	logger.Session().Debug().
		Str("sessionId", client.sessionID).
		Msg("WebSocket client disconnected")
}

func (h *Hub) broadcastMessage(message Message) {
	h.mu.RLock()
	clients := h.clients[message.SessionID]
	clientCount := len(clients)
	h.mu.RUnlock()

	logger.Session().Debug().
		Str("sessionId", message.SessionID).
		Str("event", message.Event).
		Int("clientCount", clientCount).
		Msg("WebSocket sending to clients")

	sentCount := 0
	for client := range clients {
		select {
		case client.send <- message:
			sentCount++
		default:
			h.mu.Lock()
			close(client.send)
			delete(h.clients[message.SessionID], client)
			h.mu.Unlock()
		}
	}

	logger.Session().Debug().
		Str("sessionId", message.SessionID).
		Str("event", message.Event).
		Int("sentCount", sentCount).
		Msg("WebSocket message sent")
}

// Broadcast sends a message to all clients subscribed to a session
func (h *Hub) Broadcast(sessionID, event string, data interface{}) {
	msg := NewMessage(sessionID, event, data)

	logger.Session().Debug().
		Str("sessionId", sessionID).
		Str("event", event).
		Int("clientCount", h.GetClientCount(sessionID)).
		Msg("WebSocket broadcasting message")

	select {
	case h.broadcast <- msg:
	default:
		logger.Session().Warn().
			Str("sessionId", sessionID).
			Str("event", event).
			Msg("WebSocket broadcast channel full, dropping message")
	}
}

// BroadcastJSON sends a pre-serialized JSON message
func (h *Hub) BroadcastJSON(sessionID, event string, jsonData []byte) {
	var data interface{}
	if err := json.Unmarshal(jsonData, &data); err != nil {
		data = string(jsonData)
	}
	h.Broadcast(sessionID, event, data)
}

// BroadcastToAll sends a message to all connected clients across all sessions
func (h *Hub) BroadcastToAll(event string, data interface{}) {
	h.mu.RLock()
	sessionIDs := make([]string, 0, len(h.clients))
	for sessionID := range h.clients {
		sessionIDs = append(sessionIDs, sessionID)
	}
	h.mu.RUnlock()

	for _, sessionID := range sessionIDs {
		h.Broadcast(sessionID, event, data)
	}
}

// GetConnectedSessions returns a list of session IDs with active WebSocket connections
func (h *Hub) GetConnectedSessions() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	sessions := make([]string, 0, len(h.clients))
	for sessionID := range h.clients {
		sessions = append(sessions, sessionID)
	}
	return sessions
}

// GetClientCount returns the number of connected clients for a session
func (h *Hub) GetClientCount(sessionID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	return len(h.clients[sessionID])
}

// GetTotalClientCount returns the total number of connected clients
func (h *Hub) GetTotalClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	total := 0
	for _, clients := range h.clients {
		total += len(clients)
	}
	return total
}

// HasClients returns true if there are any clients connected for the session
func (h *Hub) HasClients(sessionID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	return len(h.clients[sessionID]) > 0
}
