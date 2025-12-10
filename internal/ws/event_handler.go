package ws

import (
	"fmt"

	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
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
		return // No WebSocket clients connected, skip broadcast
	}

	eventName := ""
	var data interface{}

	switch e := evt.(type) {
	case *events.Message:
		// Skip protocol messages and reactions for now
		if e.Message.GetSenderKeyDistributionMessage() != nil {
			return
		}
		if e.Message.GetReactionMessage() != nil {
			eventName = EventMessageReaction
			data = h.buildReactionData(e)
		} else if e.Message.GetProtocolMessage() != nil {
			proto := e.Message.GetProtocolMessage()
			if proto.GetType() == waE2E.ProtocolMessage_REVOKE {
				eventName = EventMessageDeleted
				data = map[string]interface{}{
					"chatId":    e.Info.Chat.String(),
					"messageId": proto.GetKey().GetID(),
					"deletedBy": e.Info.Sender.String(),
					"fromMe":    e.Info.IsFromMe,
					"timestamp": e.Info.Timestamp.Unix(),
				}
			}
		} else {
			if e.Info.IsFromMe {
				eventName = EventMessageSent
			} else {
				eventName = EventMessageReceived
			}
			data = h.buildMessageData(e)
		}

	case *events.Receipt:
		eventName = EventMessageStatus
		status := "unknown"
		switch e.Type {
		case types.ReceiptTypeDelivered:
			status = "delivered"
		case types.ReceiptTypeRead:
			status = "read"
		case types.ReceiptTypePlayed:
			status = "played"
		}
		data = map[string]interface{}{
			"chatId":     e.Chat.String(),
			"messageIds": e.MessageIDs,
			"status":     status,
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
		eventName = EventChatPresence
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

// buildMessageData builds complete message data for WebSocket broadcast
func (h *EventHandler) buildMessageData(e *events.Message) map[string]interface{} {
	msgType, content := extractMessageTypeAndContent(e.Message)

	status := "sent"
	if !e.Info.IsFromMe {
		status = "delivered"
	}

	data := map[string]interface{}{
		"msgId":     e.Info.ID,
		"chatJid":   e.Info.Chat.String(),
		"senderJid": e.Info.Sender.String(),
		"pushName":  e.Info.PushName,
		"timestamp": e.Info.Timestamp.Unix(),
		"type":      msgType,
		"content":   content,
		"fromMe":    e.Info.IsFromMe,
		"isGroup":   e.Info.IsGroup,
		"status":    status,
	}

	if e.Info.MediaType != "" {
		data["mediaType"] = e.Info.MediaType
	}

	if quotedID := extractQuotedID(e.Message); quotedID != "" {
		data["quotedId"] = quotedID
	}

	if quotedSender := extractQuotedSender(e.Message); quotedSender != "" {
		data["quotedSender"] = quotedSender
	}

	return data
}

// buildReactionData builds reaction data for WebSocket broadcast
func (h *EventHandler) buildReactionData(e *events.Message) map[string]interface{} {
	reaction := e.Message.GetReactionMessage()
	action := "add"
	if reaction.GetText() == "" {
		action = "remove"
	}

	return map[string]interface{}{
		"chatId":    e.Info.Chat.String(),
		"messageId": reaction.GetKey().GetID(),
		"emoji":     reaction.GetText(),
		"action":    action,
		"senderJid": e.Info.Sender.String(),
		"timestamp": e.Info.Timestamp.Unix(),
	}
}

// extractMessageTypeAndContent extracts message type and content
func extractMessageTypeAndContent(msg *waE2E.Message) (string, string) {
	if msg == nil {
		return "unknown", ""
	}

	if msg.GetConversation() != "" {
		return "text", msg.GetConversation()
	}

	if ext := msg.GetExtendedTextMessage(); ext != nil {
		return "text", ext.GetText()
	}

	if img := msg.GetImageMessage(); img != nil {
		return "image", img.GetCaption()
	}

	if vid := msg.GetVideoMessage(); vid != nil {
		return "video", vid.GetCaption()
	}

	if msg.GetAudioMessage() != nil {
		return "audio", ""
	}

	if doc := msg.GetDocumentMessage(); doc != nil {
		return "document", doc.GetFileName()
	}

	if msg.GetStickerMessage() != nil {
		return "sticker", ""
	}

	if loc := msg.GetLocationMessage(); loc != nil {
		return "location", fmt.Sprintf("%.6f,%.6f", loc.GetDegreesLatitude(), loc.GetDegreesLongitude())
	}

	if contact := msg.GetContactMessage(); contact != nil {
		return "contact", contact.GetDisplayName()
	}

	if poll := msg.GetPollCreationMessage(); poll != nil {
		return "poll", poll.GetName()
	}

	if interactive := msg.GetInteractiveMessage(); interactive != nil {
		if body := interactive.GetBody(); body != nil {
			return "interactive", body.GetText()
		}
		return "interactive", ""
	}

	if viewOnce := msg.GetViewOnceMessage(); viewOnce != nil {
		return extractMessageTypeAndContent(viewOnce.GetMessage())
	}

	if viewOnceV2 := msg.GetViewOnceMessageV2(); viewOnceV2 != nil {
		return extractMessageTypeAndContent(viewOnceV2.GetMessage())
	}

	return "unknown", ""
}

// extractQuotedID extracts the quoted message ID
func extractQuotedID(msg *waE2E.Message) string {
	if msg == nil {
		return ""
	}

	var ctxInfo *waE2E.ContextInfo

	if ext := msg.GetExtendedTextMessage(); ext != nil {
		ctxInfo = ext.GetContextInfo()
	} else if img := msg.GetImageMessage(); img != nil {
		ctxInfo = img.GetContextInfo()
	} else if vid := msg.GetVideoMessage(); vid != nil {
		ctxInfo = vid.GetContextInfo()
	} else if aud := msg.GetAudioMessage(); aud != nil {
		ctxInfo = aud.GetContextInfo()
	} else if doc := msg.GetDocumentMessage(); doc != nil {
		ctxInfo = doc.GetContextInfo()
	}

	if ctxInfo != nil {
		return ctxInfo.GetStanzaID()
	}
	return ""
}

// extractQuotedSender extracts the quoted message sender
func extractQuotedSender(msg *waE2E.Message) string {
	if msg == nil {
		return ""
	}

	var ctxInfo *waE2E.ContextInfo

	if ext := msg.GetExtendedTextMessage(); ext != nil {
		ctxInfo = ext.GetContextInfo()
	} else if img := msg.GetImageMessage(); img != nil {
		ctxInfo = img.GetContextInfo()
	} else if vid := msg.GetVideoMessage(); vid != nil {
		ctxInfo = vid.GetContextInfo()
	} else if aud := msg.GetAudioMessage(); aud != nil {
		ctxInfo = aud.GetContextInfo()
	} else if doc := msg.GetDocumentMessage(); doc != nil {
		ctxInfo = doc.GetContextInfo()
	}

	if ctxInfo != nil {
		return ctxInfo.GetParticipant()
	}
	return ""
}
