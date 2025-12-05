package queue

import (
	"encoding/json"
	"time"

	"onwapp/internal/integrations/chatwoot/core"
)

// MessageType identifica o tipo de mensagem na fila
type MessageType string

const (
	// WhatsApp -> Chatwoot
	MsgTypeIncoming     MessageType = "incoming"      // Mensagem recebida
	MsgTypeOutgoingSent MessageType = "outgoing_sent" // Mensagem enviada pelo WA
	MsgTypeReceipt      MessageType = "receipt"       // Read/Delivered
	MsgTypeReaction     MessageType = "reaction"      // Reação
	MsgTypeDelete       MessageType = "delete"        // Mensagem deletada

	// Chatwoot -> WhatsApp
	MsgTypeSendText  MessageType = "send_text"  // Enviar texto
	MsgTypeSendMedia MessageType = "send_media" // Enviar mídia
	MsgTypeDeleteWA  MessageType = "delete_wa"  // Deletar no WA
)

// QueueMessage é a estrutura base para todas as mensagens
type QueueMessage struct {
	ID        string          `json:"id"`
	Type      MessageType     `json:"type"`
	SessionID string          `json:"session_id"`
	Timestamp time.Time       `json:"timestamp"`
	Retries   int             `json:"retries"`
	Data      json.RawMessage `json:"data"`
}

// MediaInfo informações de mídia
type MediaInfo struct {
	IsMedia  bool   `json:"is_media"`
	MimeType string `json:"mime_type"`
	Filename string `json:"filename"`
	Caption  string `json:"caption,omitempty"`
}

// WAToCWMessage - dados específicos WhatsApp -> Chatwoot
type WAToCWMessage struct {
	MessageID     string          `json:"message_id"`
	SessionName   string          `json:"session_name"` // Session name (used for media download)
	ChatJID       string          `json:"chat_jid"`
	SenderJID     string          `json:"sender_jid"`
	PushName      string          `json:"push_name"`
	Content       string          `json:"content"`
	IsFromMe      bool            `json:"is_from_me"`
	IsGroup       bool            `json:"is_group"`
	ParticipantID string          `json:"participant_id,omitempty"`
	MediaInfo     *MediaInfo      `json:"media_info,omitempty"`
	RawEvent      []byte          `json:"raw_event"`       // Protobuf serialized message for Chatwoot processing
	FullEventJSON json.RawMessage `json:"full_event_json"` // Complete event JSON for webhook payload
}

// WAToCWReceiptMessage - dados de recibo (read/delivered)
type WAToCWReceiptMessage struct {
	MessageIDs  []string `json:"message_ids"`
	ChatJID     string   `json:"chat_jid"`
	ReceiptType string   `json:"receipt_type"` // "read", "delivered"
}

// WAToCWReactionMessage - dados de reação
type WAToCWReactionMessage struct {
	Emoji       string `json:"emoji"`
	TargetMsgID string `json:"target_msg_id"`
	ChatJID     string `json:"chat_jid"`
	SenderJID   string `json:"sender_jid"`
	IsFromMe    bool   `json:"is_from_me"`
}

// WAToCWDeleteMessage - dados de deleção
type WAToCWDeleteMessage struct {
	DeletedMsgID string `json:"deleted_msg_id"`
}

// QuotedInfo informações de mensagem citada
type QuotedInfo struct {
	MsgID     string `json:"msg_id"`
	ChatJID   string `json:"chat_jid"`
	SenderJID string `json:"sender_jid"`
	Content   string `json:"content"`
	FromMe    bool   `json:"from_me"`
}

// CWToWAMessage - dados específicos Chatwoot -> WhatsApp
type CWToWAMessage struct {
	ChatJID        string            `json:"chat_jid"`
	Content        string            `json:"content"`
	Attachments    []core.Attachment `json:"attachments,omitempty"`
	QuotedMsg      *QuotedInfo       `json:"quoted_msg,omitempty"`
	ChatwootMsgID  int               `json:"chatwoot_msg_id"`
	ChatwootConvID int               `json:"chatwoot_conv_id"`
}

// CWToWADeleteMessage - dados de deleção Chatwoot -> WhatsApp
type CWToWADeleteMessage struct {
	ChatwootMsgID int `json:"chatwoot_msg_id"`
}

// DLQMessage - mensagem na Dead Letter Queue
type DLQMessage struct {
	OriginalSubject string        `json:"original_subject"`
	OriginalMessage *QueueMessage `json:"original_message"`
	FailureReason   string        `json:"failure_reason"`
	FailedAt        time.Time     `json:"failed_at"`
}
