package ws

import (
	"go.mau.fi/whatsmeow/types/events"

	"onwapp/internal/model"
)

// EventHandler handles WhatsApp events and broadcasts them via WebSocket
type EventHandler struct {
	hub *Hub
}

// NewEventHandler creates a new WebSocket event handler
func NewEventHandler(hub *Hub) *EventHandler {
	return &EventHandler{hub: hub}
}

// HandleEvent processes WhatsApp events and broadcasts relevant ones via WebSocket
func (h *EventHandler) HandleEvent(session *model.Session, evt interface{}) {
	if !h.hub.HasClients(session.Session) {
		return
	}

	eventName := ""
	var data interface{}

	switch e := evt.(type) {
	case *events.Message:
		if e.Info.IsFromMe {
			eventName = EventMessageSent
		} else {
			eventName = EventMessageReceived
		}
		data = map[string]interface{}{
			"chatId":    e.Info.Chat.String(),
			"messageId": e.Info.ID,
			"fromMe":    e.Info.IsFromMe,
			"sender":    e.Info.Sender.String(),
			"pushName":  e.Info.PushName,
			"timestamp": e.Info.Timestamp.Unix(),
			"type":      e.Info.Type,
		}

	case *events.Receipt:
		eventName = EventMessageStatus
		data = map[string]interface{}{
			"chatId":     e.Chat.String(),
			"messageIds": e.MessageIDs,
			"type":       string(e.Type),
			"timestamp":  e.Timestamp.Unix(),
		}

	case *events.Presence:
		eventName = EventPresenceUpdated
		data = map[string]interface{}{
			"chatId":    e.From.String(),
			"available": !e.Unavailable,
			"lastSeen":  e.LastSeen.Unix(),
		}

	case *events.ChatPresence:
		eventName = EventPresenceUpdated
		data = map[string]interface{}{
			"chatId": e.Chat.String(),
			"sender": e.Sender.String(),
			"state":  string(e.State),
			"media":  string(e.Media),
		}

	case *events.Connected:
		eventName = EventSessionConnected
		data = map[string]interface{}{}

	case *events.Disconnected:
		eventName = EventSessionDisconnected
		data = map[string]interface{}{}
	}

	if eventName != "" {
		h.hub.Broadcast(session.Session, eventName, data)
	}
}
