package ws

import "time"

// Event types
const (
	EventMessageReceived     = "message.received"
	EventMessageSent         = "message.sent"
	EventMessageStatus       = "message.status"
	EventMessageDeleted      = "message.deleted"
	EventMessageReaction     = "message.reaction"
	EventSessionConnected    = "session.connected"
	EventSessionDisconnected = "session.disconnected"
	EventSessionQR           = "session.qr"
	EventChatUpdated         = "chat.updated"
	EventChatArchived        = "chat.archived"
	EventPresenceUpdated     = "presence.updated"
	EventChatPresence        = "chat.presence"
	EventGroupUpdated        = "group.updated"
	EventCallReceived        = "call.received"
)

// Message represents a WebSocket message
type Message struct {
	Event     string      `json:"event"`
	SessionID string      `json:"sessionId"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

// NewMessage creates a new WebSocket message
func NewMessage(sessionID, event string, data interface{}) Message {
	return Message{
		Event:     event,
		SessionID: sessionID,
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	}
}
