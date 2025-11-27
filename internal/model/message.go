package model

import "time"

type MessageDirection string

const (
	MessageDirectionIncoming MessageDirection = "incoming"
	MessageDirectionOutgoing MessageDirection = "outgoing"
)

type MessageStatus string

const (
	MessageStatusSent      MessageStatus = "sent"
	MessageStatusDelivered MessageStatus = "delivered"
	MessageStatusRead      MessageStatus = "read"
	MessageStatusFailed    MessageStatus = "failed"
	MessageStatusReceived  MessageStatus = "received"
)

type MessageType string

const (
	MessageTypeText     MessageType = "text"
	MessageTypeImage    MessageType = "image"
	MessageTypeVideo    MessageType = "video"
	MessageTypeAudio    MessageType = "audio"
	MessageTypeDocument MessageType = "document"
	MessageTypeSticker  MessageType = "sticker"
	MessageTypeLocation MessageType = "location"
	MessageTypeContact  MessageType = "contact"
	MessageTypeReaction MessageType = "reaction"
)

type Message struct {
	ID            int
	SessionID     int
	MessageID     string
	ChatJID       string
	SenderJID     string
	Type          MessageType
	Content       string
	MediaURL      string
	MediaMimetype string
	MediaSize     int
	Timestamp     *time.Time
	Direction     MessageDirection
	Status        MessageStatus
	CreatedAt     *time.Time
}
