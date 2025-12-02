package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"zpwoot/internal/logger"
)

// Producer publica mensagens nos streams
type Producer struct {
	client *Client
}

// NewProducer cria um novo producer
func NewProducer(client *Client) *Producer {
	return &Producer{client: client}
}

// PublishWAToCW publica mensagem WhatsApp -> Chatwoot
func (p *Producer) PublishWAToCW(ctx context.Context, sessionID string, msgType MessageType, data interface{}) error {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	msg := &QueueMessage{
		ID:        uuid.NewString(),
		Type:      msgType,
		SessionID: sessionID,
		Timestamp: time.Now(),
		Retries:   0,
		Data:      dataBytes,
	}

	subject := p.client.Subject(StreamWAToCW, string(msgType))
	return p.publish(ctx, subject, msg)
}

// PublishCWToWA publica mensagem Chatwoot -> WhatsApp
func (p *Producer) PublishCWToWA(ctx context.Context, sessionID string, msgType MessageType, data interface{}) error {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	msg := &QueueMessage{
		ID:        uuid.NewString(),
		Type:      msgType,
		SessionID: sessionID,
		Timestamp: time.Now(),
		Retries:   0,
		Data:      dataBytes,
	}

	subject := p.client.Subject(StreamCWToWA, string(msgType))
	return p.publish(ctx, subject, msg)
}

// PublishToDLQ move mensagem para Dead Letter Queue
func (p *Producer) PublishToDLQ(ctx context.Context, originalSubject string, msg *QueueMessage, reason string) error {
	dlqMsg := &DLQMessage{
		OriginalSubject: originalSubject,
		OriginalMessage: msg,
		FailureReason:   reason,
		FailedAt:        time.Now(),
	}

	subject := p.client.Subject(StreamDLQ, string(msg.Type))
	
	data, err := json.Marshal(dlqMsg)
	if err != nil {
		return fmt.Errorf("failed to marshal DLQ message: %w", err)
	}

	_, err = p.client.JetStream().Publish(ctx, subject, data)
	if err != nil {
		return fmt.Errorf("failed to publish to DLQ: %w", err)
	}

	logger.Warn().
		Str("subject", subject).
		Str("msgId", msg.ID).
		Str("type", string(msg.Type)).
		Str("reason", reason).
		Msg("Message moved to DLQ")

	return nil
}

func (p *Producer) publish(ctx context.Context, subject string, msg *QueueMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	_, err = p.client.JetStream().Publish(ctx, subject, data)
	if err != nil {
		return fmt.Errorf("failed to publish to %s: %w", subject, err)
	}

	logger.Debug().
		Str("subject", subject).
		Str("msgId", msg.ID).
		Str("type", string(msg.Type)).
		Str("sessionId", msg.SessionID).
		Msg("Published message to queue")

	return nil
}

// IsConnected verifica se o producer está conectado
func (p *Producer) IsConnected() bool {
	return p.client != nil && p.client.IsConnected()
}
