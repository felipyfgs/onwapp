package ws

import (
	"encoding/json"
	"time"

	"github.com/gorilla/websocket"

	"onwapp/internal/logger"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024
	sendBuffer     = 64
)

// Client represents a connected WebSocket client
type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	sessionID string
	send      chan Message
}

// newClient creates a new WebSocket client
func newClient(hub *Hub, conn *websocket.Conn, sessionID string) *Client {
	return &Client{
		hub:       hub,
		conn:      conn,
		sessionID: sessionID,
		send:      make(chan Message, sendBuffer),
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
		c.hub.unregister <- c
	}()

	for {
		select {
		case message, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			data, err := json.Marshal(message)
			if err != nil {
				logger.Session().Debug().
					Err(err).
					Str("sessionId", c.sessionID).
					Msg("Failed to marshal WebSocket message")
				continue
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				logger.Session().Debug().
					Err(err).
					Str("sessionId", c.sessionID).
					Msg("Failed to write WebSocket message")
				return
			}

		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// readPump pumps messages from the WebSocket connection
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logger.Session().Debug().
					Err(err).
					Str("sessionId", c.sessionID).
					Msg("WebSocket read error")
			}
			break
		}
	}
}
