package service

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"zpwoot/internal/model"
)

type EventType string

const (
	EventMessage         EventType = "message"
	EventMessageRevoked  EventType = "message.revoked"
	EventReceipt         EventType = "receipt"
	EventPresence        EventType = "presence"
	EventChatPresence    EventType = "chat.presence"
	EventGroupJoin       EventType = "group.join"
	EventGroupLeave      EventType = "group.leave"
	EventConnected       EventType = "connected"
	EventDisconnected    EventType = "disconnected"
	EventLoggedOut       EventType = "logged_out"
	EventQR              EventType = "qr"
	EventPairSuccess     EventType = "pair.success"
	EventCall            EventType = "call"
	EventHistorySync     EventType = "history.sync"
)

type WebhookPayload struct {
	Event     EventType   `json:"event"`
	Session   string      `json:"session"`
	Timestamp int64       `json:"timestamp"`
	Data      interface{} `json:"data"`
}

type MessageData struct {
	ID            string         `json:"id"`
	From          string         `json:"from"`
	To            string         `json:"to"`
	IsGroup       bool           `json:"is_group"`
	IsFromMe      bool           `json:"is_from_me"`
	Timestamp     int64          `json:"timestamp"`
	PushName      string         `json:"push_name"`
	Type          string         `json:"type"`
	Text          string         `json:"text,omitempty"`
	Caption       string         `json:"caption,omitempty"`
	MediaURL      string         `json:"media_url,omitempty"`
	MimeType      string         `json:"mime_type,omitempty"`
	QuotedMessage *MessageData   `json:"quoted_message,omitempty"`
	Mentions      []string       `json:"mentions,omitempty"`
}

type ReceiptData struct {
	MessageIDs []string `json:"message_ids"`
	From       string   `json:"from"`
	Timestamp  int64    `json:"timestamp"`
	Type       string   `json:"type"`
}

type PresenceData struct {
	JID         string `json:"jid"`
	Unavailable bool   `json:"unavailable"`
	LastSeen    int64  `json:"last_seen,omitempty"`
}

type ChatPresenceData struct {
	JID   string `json:"jid"`
	State string `json:"state"`
	Media string `json:"media,omitempty"`
}

type GroupParticipantData struct {
	GroupJID     string   `json:"group_jid"`
	Participants []string `json:"participants"`
	Action       string   `json:"action"`
}

type CallData struct {
	From      string `json:"from"`
	Timestamp int64  `json:"timestamp"`
	CallID    string `json:"call_id"`
	IsVideo   bool   `json:"is_video"`
}

type EventCallback func(payload *WebhookPayload)

type EventService struct {
	sessionService *SessionService
	webhookURL     string
	callbacks      map[string][]EventCallback
	httpClient     *http.Client
	mu             sync.RWMutex
}

func NewEventService(sessionService *SessionService, webhookURL string) *EventService {
	return &EventService{
		sessionService: sessionService,
		webhookURL:     webhookURL,
		callbacks:      make(map[string][]EventCallback),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (e *EventService) SetWebhookURL(url string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.webhookURL = url
}

func (e *EventService) RegisterCallback(sessionName string, callback EventCallback) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.callbacks[sessionName] = append(e.callbacks[sessionName], callback)
}

func (e *EventService) SetupEventHandlers(session *model.Session) {
	session.Client.AddEventHandler(func(evt interface{}) {
		e.handleEvent(session.Name, evt)
	})
}

func (e *EventService) handleEvent(sessionName string, evt interface{}) {
	var payload *WebhookPayload

	switch v := evt.(type) {
	case *events.Message:
		payload = e.handleMessage(sessionName, v)
	case *events.Receipt:
		payload = e.handleReceipt(sessionName, v)
	case *events.Presence:
		payload = e.handlePresence(sessionName, v)
	case *events.ChatPresence:
		payload = e.handleChatPresence(sessionName, v)
	case *events.GroupInfo:
		payload = e.handleGroupInfo(sessionName, v)
	case *events.JoinedGroup:
		payload = e.handleJoinedGroup(sessionName, v)
	case *events.Connected:
		payload = &WebhookPayload{
			Event:     EventConnected,
			Session:   sessionName,
			Timestamp: time.Now().Unix(),
			Data:      map[string]interface{}{},
		}
	case *events.Disconnected:
		payload = &WebhookPayload{
			Event:     EventDisconnected,
			Session:   sessionName,
			Timestamp: time.Now().Unix(),
			Data:      map[string]interface{}{},
		}
	case *events.LoggedOut:
		payload = &WebhookPayload{
			Event:     EventLoggedOut,
			Session:   sessionName,
			Timestamp: time.Now().Unix(),
			Data: map[string]interface{}{
				"reason": v.Reason.String(),
			},
		}
	case *events.CallOffer:
		payload = &WebhookPayload{
			Event:     EventCall,
			Session:   sessionName,
			Timestamp: time.Now().Unix(),
			Data: CallData{
				From:      v.CallCreator.String(),
				Timestamp: v.Timestamp.Unix(),
				CallID:    v.CallID,
				IsVideo:   false,
			},
		}
	case *events.HistorySync:
		payload = &WebhookPayload{
			Event:     EventHistorySync,
			Session:   sessionName,
			Timestamp: time.Now().Unix(),
			Data: map[string]interface{}{
				"type":  v.Data.GetSyncType().String(),
				"count": len(v.Data.GetConversations()),
			},
		}
	case *events.PairSuccess:
		payload = &WebhookPayload{
			Event:     EventPairSuccess,
			Session:   sessionName,
			Timestamp: time.Now().Unix(),
			Data: map[string]interface{}{
				"jid":      v.ID.String(),
				"platform": v.Platform,
			},
		}
	}

	if payload != nil {
		e.dispatch(sessionName, payload)
	}
}

func (e *EventService) handleMessage(sessionName string, evt *events.Message) *WebhookPayload {
	msg := evt.Message

	data := MessageData{
		ID:        evt.Info.ID,
		From:      evt.Info.Sender.String(),
		To:        evt.Info.Chat.String(),
		IsGroup:   evt.Info.IsGroup,
		IsFromMe:  evt.Info.IsFromMe,
		Timestamp: evt.Info.Timestamp.Unix(),
		PushName:  evt.Info.PushName,
	}

	switch {
	case msg.Conversation != nil && *msg.Conversation != "":
		data.Type = "text"
		data.Text = *msg.Conversation
	case msg.ExtendedTextMessage != nil:
		data.Type = "text"
		data.Text = msg.ExtendedTextMessage.GetText()
	case msg.ImageMessage != nil:
		data.Type = "image"
		data.Caption = msg.ImageMessage.GetCaption()
		data.MimeType = msg.ImageMessage.GetMimetype()
		data.MediaURL = msg.ImageMessage.GetURL()
	case msg.VideoMessage != nil:
		data.Type = "video"
		data.Caption = msg.VideoMessage.GetCaption()
		data.MimeType = msg.VideoMessage.GetMimetype()
		data.MediaURL = msg.VideoMessage.GetURL()
	case msg.AudioMessage != nil:
		data.Type = "audio"
		data.MimeType = msg.AudioMessage.GetMimetype()
		data.MediaURL = msg.AudioMessage.GetURL()
	case msg.DocumentMessage != nil:
		data.Type = "document"
		data.Caption = msg.DocumentMessage.GetCaption()
		data.MimeType = msg.DocumentMessage.GetMimetype()
		data.MediaURL = msg.DocumentMessage.GetURL()
	case msg.StickerMessage != nil:
		data.Type = "sticker"
		data.MimeType = msg.StickerMessage.GetMimetype()
		data.MediaURL = msg.StickerMessage.GetURL()
	case msg.LocationMessage != nil:
		data.Type = "location"
	case msg.ContactMessage != nil:
		data.Type = "contact"
	case msg.ReactionMessage != nil:
		data.Type = "reaction"
		data.Text = msg.ReactionMessage.GetText()
	default:
		data.Type = "unknown"
	}

	return &WebhookPayload{
		Event:     EventMessage,
		Session:   sessionName,
		Timestamp: time.Now().Unix(),
		Data:      data,
	}
}

func (e *EventService) handleReceipt(sessionName string, evt *events.Receipt) *WebhookPayload {
	receiptType := "delivery"
	switch evt.Type {
	case types.ReceiptTypeRead:
		receiptType = "read"
	case types.ReceiptTypeReadSelf:
		receiptType = "read_self"
	case types.ReceiptTypePlayed:
		receiptType = "played"
	}

	return &WebhookPayload{
		Event:     EventReceipt,
		Session:   sessionName,
		Timestamp: time.Now().Unix(),
		Data: ReceiptData{
			MessageIDs: evt.MessageIDs,
			From:       evt.MessageSource.Sender.String(),
			Timestamp:  evt.Timestamp.Unix(),
			Type:       receiptType,
		},
	}
}

func (e *EventService) handlePresence(sessionName string, evt *events.Presence) *WebhookPayload {
	data := PresenceData{
		JID:         evt.From.String(),
		Unavailable: evt.Unavailable,
	}
	if !evt.LastSeen.IsZero() {
		data.LastSeen = evt.LastSeen.Unix()
	}

	return &WebhookPayload{
		Event:     EventPresence,
		Session:   sessionName,
		Timestamp: time.Now().Unix(),
		Data:      data,
	}
}

func (e *EventService) handleChatPresence(sessionName string, evt *events.ChatPresence) *WebhookPayload {
	return &WebhookPayload{
		Event:     EventChatPresence,
		Session:   sessionName,
		Timestamp: time.Now().Unix(),
		Data: ChatPresenceData{
			JID:   evt.MessageSource.Sender.String(),
			State: string(evt.State),
			Media: string(evt.Media),
		},
	}
}

func (e *EventService) handleGroupInfo(sessionName string, evt *events.GroupInfo) *WebhookPayload {
	eventType := EventGroupJoin
	action := "unknown"

	if evt.Join != nil {
		action = "join"
		participants := make([]string, len(evt.Join))
		for i, p := range evt.Join {
			participants[i] = p.String()
		}
		return &WebhookPayload{
			Event:     eventType,
			Session:   sessionName,
			Timestamp: time.Now().Unix(),
			Data: GroupParticipantData{
				GroupJID:     evt.JID.String(),
				Participants: participants,
				Action:       action,
			},
		}
	}

	if evt.Leave != nil {
		eventType = EventGroupLeave
		action = "leave"
		participants := make([]string, len(evt.Leave))
		for i, p := range evt.Leave {
			participants[i] = p.String()
		}
		return &WebhookPayload{
			Event:     eventType,
			Session:   sessionName,
			Timestamp: time.Now().Unix(),
			Data: GroupParticipantData{
				GroupJID:     evt.JID.String(),
				Participants: participants,
				Action:       action,
			},
		}
	}

	return nil
}

func (e *EventService) handleJoinedGroup(sessionName string, evt *events.JoinedGroup) *WebhookPayload {
	return &WebhookPayload{
		Event:     EventGroupJoin,
		Session:   sessionName,
		Timestamp: time.Now().Unix(),
		Data: map[string]interface{}{
			"group_jid":  evt.JID.String(),
			"group_name": evt.GroupInfo.Name,
		},
	}
}

func (e *EventService) dispatch(sessionName string, payload *WebhookPayload) {
	e.mu.RLock()
	webhookURL := e.webhookURL
	callbacks := e.callbacks[sessionName]
	e.mu.RUnlock()

	for _, cb := range callbacks {
		go cb(payload)
	}

	if webhookURL != "" {
		go e.sendWebhook(webhookURL, payload)
	}
}

func (e *EventService) sendWebhook(url string, payload *WebhookPayload) {
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := e.httpClient.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()
}
