package ws

import (
	"context"
	"time"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"

	"onwapp/internal/logger"
)

const (
	writeTimeout = 10 * time.Second
	pingInterval = 30 * time.Second
	sendBuffer   = 64
)

// Client represents a connected WebSocket client
type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	sessionID string
	send      chan Message
	done      chan struct{}
}

// newClient creates a new WebSocket client
func newClient(hub *Hub, conn *websocket.Conn, sessionID string) *Client {
	return &Client{
		hub:       hub,
		conn:      conn,
		sessionID: sessionID,
		send:      make(chan Message, sendBuffer),
		done:      make(chan struct{}),
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(pingInterval)
	defer func() {
		ticker.Stop()
		c.conn.Close(websocket.StatusNormalClosure, "")
		c.hub.unregister <- c
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				return
			}
			ctx, cancel := context.WithTimeout(context.Background(), writeTimeout)
			err := wsjson.Write(ctx, c.conn, message)
			cancel()
			if err != nil {
				logger.Session().Debug().
					Err(err).
					Str("sessionId", c.sessionID).
					Msg("Failed to write WebSocket message")
				return
			}

		case <-ticker.C:
			ctx, cancel := context.WithTimeout(context.Background(), writeTimeout)
			err := c.conn.Ping(ctx)
			cancel()
			if err != nil {
				return
			}

		case <-c.done:
			return
		}
	}
}

// readPump pumps messages from the WebSocket connection
func (c *Client) readPump() {
	defer close(c.done)

	for {
		_, _, err := c.conn.Read(context.Background())
		if err != nil {
			if websocket.CloseStatus(err) != websocket.StatusNormalClosure {
				logger.Session().Debug().
					Err(err).
					Str("sessionId", c.sessionID).
					Msg("WebSocket read error")
			}
			return
		}
	}
}

// Close closes the client connection
func (c *Client) Close() {
	select {
	case <-c.done:
	default:
		close(c.done)
	}
}
