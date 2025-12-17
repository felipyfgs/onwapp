package queue

import (
	"encoding/json"
	"time"

	"onwapp/internal/integrations/chatwoot/core"
)

type MessageType string

const (
	MsgTypeIncoming     MessageType = "incoming"
	MsgTypeOutgoingSent MessageType = "outgoing_sent"
	MsgTypeReceipt      MessageType = "receipt"
	MsgTypeReaction     MessageType = "reaction"
	MsgTypeDelete       MessageType = "delete"

	MsgTypeSendText  MessageType = "send_text"
	MsgTypeSendMedia MessageType = "send_media"
	MsgTypeDeleteWA  MessageType = "delete_wa"
)

type QueueMessage struct {
	ID        string          `json:"id"`
	Type      MessageType     `json:"type"`
	SessionID string          `json:"session_id"`
	Timestamp time.Time       `json:"timestamp"`
	Retries   int             `json:"retries"`
	Data      json.RawMessage `json:"data"`
}

type MediaInfo struct {
	IsMedia  bool   `json:"is_media"`
	MimeType string `json:"mime_type"`
	Filename string `json:"filename"`
	Caption  string `json:"caption,omitempty"`
}

type WAToCWMessage struct {
	MessageID     string          `json:"message_id"`
	SessionName   string          `json:"session_name"`
	ChatJID       string          `json:"chat_jid"`
	SenderJID     string          `json:"sender_jid"`
	PushName      string          `json:"push_name"`
	Content       string          `json:"content"`
	IsFromMe      bool            `json:"is_from_me"`
	IsGroup       bool            `json:"is_group"`
	ParticipantID string          `json:"participant_id,omitempty"`
	MediaInfo     *MediaInfo      `json:"media_info,omitempty"`
	RawEvent      []byte          `json:"raw_event"`
	FullEventJSON json.RawMessage `json:"full_event_json"`
}

type WAToCWReceiptMessage struct {
	MessageIDs  []string `json:"message_ids"`
	ChatJID     string   `json:"chat_jid"`
	ReceiptType string   `json:"receipt_type"`
}

type WAToCWReactionMessage struct {
	Emoji       string `json:"emoji"`
	TargetMsgID string `json:"target_msg_id"`
	ChatJID     string `json:"chat_jid"`
	SenderJID   string `json:"sender_jid"`
	IsFromMe    bool   `json:"is_from_me"`
}

type WAToCWDeleteMessage struct {
	DeletedMsgID string `json:"deleted_msg_id"`
}

type QuotedInfo struct {
	MsgID     string `json:"msg_id"`
	ChatJID   string `json:"chat_jid"`
	SenderJID string `json:"sender_jid"`
	Content   string `json:"content"`
	FromMe    bool   `json:"from_me"`
}

type CWToWAMessage struct {
	ChatJID        string            `json:"chat_jid"`
	Content        string            `json:"content"`
	Attachments    []core.Attachment `json:"attachments,omitempty"`
	QuotedMsg      *QuotedInfo       `json:"quoted_msg,omitempty"`
	ChatwootMsgID  int               `json:"chatwoot_msg_id"`
	ChatwootConvID int               `json:"chatwoot_conv_id"`
}

type CWToWADeleteMessage struct {
	ChatwootMsgID int `json:"chatwoot_msg_id"`
}

type DLQMessage struct {
	OriginalSubject string        `json:"original_subject"`
	OriginalMessage *QueueMessage `json:"original_message"`
	FailureReason   string        `json:"failure_reason"`
	FailedAt        time.Time     `json:"failed_at"`
}
