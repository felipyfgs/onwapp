package sse

import (
	"encoding/json"
	"sync"
)

// EventType represents the type of SSE event
type EventType string

const (
	EventMessageNew    EventType = "message.new"
	EventMessageStatus EventType = "message.status"
	EventChatUpdate    EventType = "chat.update"
	EventTyping        EventType = "typing"
	EventPresence      EventType = "presence"
)

// Event represents an SSE event to be sent to clients
type Event struct {
	Type      EventType   `json:"type"`
	SessionID string      `json:"sessionId"`
	ChatJID   string      `json:"chatJid,omitempty"`
	Data      interface{} `json:"data"`
}

// Client represents a connected SSE client
type Client struct {
	SessionID string
	Channel   chan []byte
}

// Hub manages SSE connections and event broadcasting
type Hub struct {
	clients    map[string]map[*Client]bool // sessionID -> clients
	register   chan *Client
	unregister chan *Client
	broadcast  chan *Event
	mu         sync.RWMutex
}

var (
	instance *Hub
	once     sync.Once
)

// GetHub returns the singleton Hub instance
func GetHub() *Hub {
	once.Do(func() {
		instance = &Hub{
			clients:    make(map[string]map[*Client]bool),
			register:   make(chan *Client),
			unregister: make(chan *Client),
			broadcast:  make(chan *Event, 256),
		}
		go instance.run()
	})
	return instance
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.clients[client.SessionID] == nil {
				h.clients[client.SessionID] = make(map[*Client]bool)
			}
			h.clients[client.SessionID][client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.SessionID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Channel)
					if len(clients) == 0 {
						delete(h.clients, client.SessionID)
					}
				}
			}
			h.mu.Unlock()

		case event := <-h.broadcast:
			h.mu.RLock()
			clients := h.clients[event.SessionID]
			h.mu.RUnlock()

			if clients == nil {
				continue
			}

			data, err := json.Marshal(event)
			if err != nil {
				continue
			}

			h.mu.RLock()
			for client := range clients {
				select {
				case client.Channel <- data:
				default:
					// Client buffer full, skip
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Register adds a new client to the hub
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister removes a client from the hub
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// Broadcast sends an event to all clients of a session
func (h *Hub) Broadcast(event *Event) {
	select {
	case h.broadcast <- event:
	default:
		// Buffer full, drop event
	}
}

// ClientCount returns the number of connected clients for a session
func (h *Hub) ClientCount(sessionID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients[sessionID])
}

// TotalClients returns total connected clients across all sessions
func (h *Hub) TotalClients() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	total := 0
	for _, clients := range h.clients {
		total += len(clients)
	}
	return total
}
